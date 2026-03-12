const router = require("express").Router();
const Product = require("../models/Product");
const optionalAuth = require("../middleware/optionalAuthMiddleware");

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const ROLE_CONFIG = {
  guest: {
    label: "guest visitor",
    intro:
      "Help guests only with login, registration, forgot password, and account-access questions.",
    allowed:
      "You can explain how admin or vendor login works, where to register, and how forgot password or account recovery works.",
    avoid:
      "Do not answer product-shopping questions for guests and do not claim the guest can access vendor-only or admin-only pages or actions.",
  },
  vendor: {
    label: "vendor",
    intro:
      "Help vendors shop the marketplace, compare products, find budget or premium options, and answer short questions about vendor shopping flows such as cart, checkout, and orders.",
    allowed:
      "You can suggest products, buying options, and vendor shopping guidance.",
    avoid:
      "Do not suggest admin-only inventory management or approvals.",
  },
  admin: {
    label: "admin or manager",
    intro:
      "Help admins and managers inspect catalog health, identify low-stock or best-selling products, compare pricing, and answer short questions about inventory-oriented workflows.",
    allowed:
      "You can discuss stock levels, pricing patterns, category gaps, and inventory actions.",
    avoid:
      "Do not suggest vendor-only buying flows like cart or checkout as the primary action.",
  },
};

const normalizeText = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value = "") => normalizeText(value).split(" ").filter(Boolean);

const normalizeHistory = (history = []) =>
  history
    .filter((entry) => entry && typeof entry.content === "string")
    .filter((entry) => entry.role === "user" || entry.role === "assistant")
    .slice(-8)
    .map((entry) => ({
      role: entry.role,
      content: entry.content.trim().slice(0, 1200),
    }))
    .filter((entry) => entry.content);

const buildCatalogContext = (products = []) =>
  products
    .slice(0, 40)
    .map((product) => {
      const category = product.category?.name || "Uncategorized";
      const subcategory = product.subcategory?.name || "General";
      return `- ${product.name} | Rs ${product.price} | stock ${product.stock} | sold ${product.sold || 0} | ${category} > ${subcategory}`;
    })
    .join("\n");

const getSuggestedProducts = (products = [], message = "", reply = "") => {
  const terms = new Set([...tokenize(message), ...tokenize(reply)]);
  if (!terms.size) return [];

  return products
    .map((product) => {
      const haystack = normalizeText(
        [product.name, product.category?.name, product.subcategory?.name].join(" ")
      );

      let score = 0;
      for (const term of terms) {
        if (haystack.includes(term)) score += term.length > 3 ? 2 : 1;
      }

      if (normalizeText(reply).includes(normalizeText(product.name))) {
        score += 5;
      }

      return { product, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || Number(b.product.stock || 0) - Number(a.product.stock || 0))
    .slice(0, 3)
    .map(({ product }) => ({
      id: String(product._id),
      name: product.name,
    }));
};

router.post("/chat", optionalAuth, async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();
    const history = normalizeHistory(req.body.history);
    const viewerRole = ["admin", "manager"].includes(req.user?.role)
      ? "admin"
      : req.user?.role === "vendor"
        ? "vendor"
        : "guest";
    const roleConfig = ROLE_CONFIG[viewerRole];

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        message: "AI chatbot is not configured. Add GEMINI_API_KEY to backend/.env.",
      });
    }

    const products = await Product.find({})
      .populate("category", "name")
      .populate("subcategory", "name")
      .sort({ createdAt: -1 })
      .limit(40)
      .lean();

    const catalogContext = buildCatalogContext(products);

    const conversationText = history
      .map((entry) => `${entry.role === "assistant" ? "Assistant" : "User"}: ${entry.content}`)
      .join("\n");

    const prompt = [
      "You are the JensnMart AI shopping assistant.",
      `Current user type: ${roleConfig.label}.`,
      roleConfig.intro,
      roleConfig.allowed,
      roleConfig.avoid,
      "Be concise, practical, and product-focused.",
      "If you do not know something, say so plainly.",
      "",
      `Current catalog snapshot:\n${catalogContext || "No products available."}`,
      "",
      conversationText ? `Conversation so far:\n${conversationText}\n` : "",
      `User request: ${message}`,
    ]
      .filter(Boolean)
      .join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 300,
        },
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini chat error:", errorText);
      let parsedMessage = "AI response failed";
      try {
        const parsed = JSON.parse(errorText);
        parsedMessage =
          parsed?.error?.message ||
          parsed?.message ||
          parsedMessage;
      } catch {
        if (errorText) {
          parsedMessage = errorText.slice(0, 240);
        }
      }

      return res.status(502).json({ message: parsedMessage });
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("")
      .trim();

    if (!reply) {
      return res.status(502).json({ message: "Empty AI response" });
    }

    const suggestedProducts =
      viewerRole === "guest" ? [] : getSuggestedProducts(products, message, reply);

    return res.json({ reply, suggestedProducts, viewerRole });
  } catch (err) {
    console.error("AI chat route error:", err);
    return res.status(500).json({ message: "AI chatbot failed" });
  }
});

module.exports = router;
