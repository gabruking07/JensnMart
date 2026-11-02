/** Express API endpoints for ai routes; handlers connect HTTP requests to authorization, database operations, and JSON responses. */

const router = require("express").Router();
const Product = require("../models/Product");
const optionalAuth = require("../middleware/optionalAuthMiddleware");

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_FALLBACK_MODEL = "gemini-3.6-flash";

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

/** Lowercases a search phrase, removes punctuation, and collapses spaces so matching is consistent. */
const normalizeText = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Splits normalized text into the individual search words used by fuzzy matching. */
const tokenize = (value = "") => normalizeText(value).split(" ").filter(Boolean);

const NON_PRODUCT_TERMS = new Set([
  "a", "an", "and", "are", "best", "best-selling", "below", "buy", "can", "cheap",
  "cheaper", "cheapest", "compare", "comparison", "do", "find", "for", "from", "help",
  "categories", "category", "high", "in", "low", "me", "most", "of", "option", "options",
  "or", "popular", "price", "prices", "product", "products", "rs", "rupee", "rupees", "seller",
  "sellers", "selling", "show", "sold", "suggest", "the", "to", "top", "under", "up", "within",
  "with", "what", "which",
]);

/** Cleans and limits chat history before it is sent to the AI service. */
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

/** Builds a compact product catalog context for the assistant to use when answering shopping questions. */
const buildCatalogContext = (products = []) =>
  products
    .slice(0, 60)
    .map((product) => {
      const category = product.category?.name || "Uncategorized";
      const subcategory = product.subcategory?.name || "General";
      return `- ${product.name} | Rs ${product.price} | stock ${product.stock} | sold ${product.sold || 0} | ${category} > ${subcategory}`;
    })
    .join("\n");

/** Finds catalog items related to the user's question so the assistant can suggest products. */
const getSuggestedProducts = (products = [], message = "") => {
  const queryTerms = tokenize(message).filter(
    (term) => !NON_PRODUCT_TERMS.has(term) && !/^\d+$/.test(term)
  );
  const budgetMatch = message.match(
    /\b(?:under|below|less than|up to|upto|within|max(?:imum)?)\s*(?:rs\.?|\u20b9)?\s*([\d,]+)/i
  );
  const maxPrice = budgetMatch ? Number(budgetMatch[1].replace(/,/g, "")) : null;
  const bestSellerIntent = /\b(best[ -]?sell(?:er|ers|ing)?|most sold|popular|top sellers?)\b/i.test(message);
  const lowPriceIntent = /\b(cheap|cheaper|cheapest|budget|affordable|low price)\b/i.test(message);

  return products
    .filter((product) => Number(product.stock || 0) > 0)
    .filter((product) => maxPrice === null || Number(product.price) <= maxPrice)
    .map((product) => {
      const nameTerms = tokenize(product.name);
      const categoryTerms = tokenize(product.category?.name);
      const subcategoryTerms = tokenize(product.subcategory?.name);
      const haystack = new Set([...nameTerms, ...categoryTerms, ...subcategoryTerms]);
      const matchedTerms = queryTerms.filter((term) => haystack.has(term));
      return { product, matchedTerms };
    })
    .filter(({ matchedTerms }) => queryTerms.length === 0 || matchedTerms.length > 0)
    .sort((a, b) => {
      if (bestSellerIntent) return Number(b.product.sold || 0) - Number(a.product.sold || 0);
      if (lowPriceIntent || maxPrice !== null) return Number(a.product.price || 0) - Number(b.product.price || 0);
      return b.matchedTerms.length - a.matchedTerms.length || Number(b.product.sold || 0) - Number(a.product.sold || 0);
    })
    .slice(0, 3)
    .map(({ product }) => ({
      id: String(product._id),
      name: product.name,
      price: Number(product.price || 0),
    }));
};

/** Gives a grounded short response when Gemini is temporarily unavailable. */
const buildCatalogFallbackReply = (message, suggestedProducts) => {
  if (!suggestedProducts.length) {
    return "I couldn't find matching in-stock products in the current catalog.";
  }

  if (/\b(best[ -]?sell(?:er|ers|ing)?|most sold|popular|top sellers?)\b/i.test(message)) {
    return "Here are the best-selling in-stock products based on catalog sales.";
  }

  if (/\b(under|below|less than|up to|upto|within|max(?:imum)?)\b/i.test(message)) {
    return "Here are in-stock options that fit your price limit.";
  }

  if (/\b(cheap|cheaper|cheapest|budget|affordable|low price)\b/i.test(message)) {
    return "Here are the lowest-priced in-stock options matching your request.";
  }

  return "Here are in-stock products matching your request.";
};

/** Provides basic guest account guidance when the Gemini key is not configured. */
const buildGuestFallbackReply = (message) => {
  const question = normalizeText(message);

  if (/forgot|reset|password/.test(question)) {
    return "On the login page, choose Forgot Password, select your account type, and request a reset code by email. Check that your email service is configured on the backend.";
  }
  if (/register|sign up|create account/.test(question)) {
    return "Choose Admin Reg. or Vendor Reg. from the login page and submit the registration form. New admin and vendor accounts need approval before they can sign in.";
  }
  if (/login|sign in|account|access/.test(question)) {
    return "Use the email and password for your approved admin, manager, or vendor account. If sign in fails, confirm the backend is connected to MongoDB and the account has been approved.";
  }

  return "I can help with login, account registration, and password recovery. Try asking how to register, sign in, or reset your password.";
};

/** Requests a response with a short deadline so the chat can retry or return an error promptly. */
const requestGemini = (model, prompt) =>
  fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 300,
        },
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

// POST /chat: Sends a chat question and catalog context to the configured assistant, then returns its reply.
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

    const products = await Product.find({})
      .populate("category", "name")
      .populate("subcategory", "name")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const suggestedProducts =
      viewerRole === "guest" ? [] : getSuggestedProducts(products, message);
    const sendCatalogFallback = () =>
      res.json({
        reply: buildCatalogFallbackReply(message, suggestedProducts),
        suggestedProducts,
        viewerRole,
      });

    if (!process.env.GEMINI_API_KEY) {
      if (viewerRole !== "guest") return sendCatalogFallback();
      return res.json({
        reply: buildGuestFallbackReply(message),
        suggestedProducts: [],
        viewerRole,
      });
    }

    const catalogContext = buildCatalogContext(products);
    const recommendationContext = suggestedProducts.length
      ? suggestedProducts
          .map((product) => `- ${product.name} | Rs ${product.price} | sold ${product.sold}`)
          .join("\n")
      : "No matching in-stock products were found.";

    const conversationText = history
      .map((entry) => `${entry.role === "assistant" ? "Assistant" : "User"}: ${entry.content}`)
      .join("\n");

    const prompt = [
      "You are the JensnMart AI shopping assistant.",
      `Current user type: ${roleConfig.label}.`,
      roleConfig.intro,
      roleConfig.allowed,
      roleConfig.avoid,
      "Answer in one or two concise sentences.",
      "Use only the supplied catalog data. Never invent product names, categories, prices, or stock.",
      "Only recommend products from the exact matching in-stock list below. If it says none were found, say that no matching in-stock products are available.",
      "",
      `Current catalog snapshot:\n${catalogContext || "No products available."}`,
      `Matching in-stock products for this request:\n${recommendationContext}`,
      "",
      conversationText ? `Conversation so far:\n${conversationText}\n` : "",
      `User request: ${message}`,
    ]
      .filter(Boolean)
      .join("\n");

    let response;
    try {
      response = await requestGemini(GEMINI_MODEL, prompt);
    } catch (error) {
      const timedOut = ["TimeoutError", "AbortError"].includes(error.name);
      if (timedOut && GEMINI_MODEL !== GEMINI_FALLBACK_MODEL) {
        console.warn(`Gemini ${GEMINI_MODEL} timed out; retrying with ${GEMINI_FALLBACK_MODEL}.`);
        try {
          response = await requestGemini(GEMINI_FALLBACK_MODEL, prompt);
        } catch (fallbackError) {
          console.error("Gemini fallback request failed:", fallbackError.message);
          return sendCatalogFallback();
        }
      } else {
        console.error("Gemini request failed:", error.message);
        return sendCatalogFallback();
      }
    }

    if ([429, 500, 502, 503, 504].includes(response.status) && GEMINI_MODEL !== GEMINI_FALLBACK_MODEL) {
      console.warn(`Gemini ${GEMINI_MODEL} returned ${response.status}; retrying with ${GEMINI_FALLBACK_MODEL}.`);
      await response.body?.cancel().catch(() => {});
      try {
        response = await requestGemini(GEMINI_FALLBACK_MODEL, prompt);
      } catch (fallbackError) {
        console.error("Gemini fallback request failed:", fallbackError.message);
        return sendCatalogFallback();
      }
    }

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

      if ([429, 500, 502, 503, 504].includes(response.status)) {
        return sendCatalogFallback();
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

    return res.json({ reply, suggestedProducts, viewerRole });
  } catch (err) {
    console.error("AI chat route error:", err);
    const databaseUnavailable =
      err.name?.startsWith("Mongo") ||
      err.name === "MongooseError" ||
      /buffering timed out/i.test(err.message || "");
    return res.status(databaseUnavailable ? 503 : 500).json({
      message: databaseUnavailable
        ? "The product catalog is temporarily unavailable. Check the MongoDB connection."
        : "The chat request failed. Check the backend terminal for details.",
    });
  }
});

module.exports = router;
