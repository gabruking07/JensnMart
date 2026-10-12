<<<<<<< HEAD
/** Reusable chatbot widget UI component; packages interface behavior used by one or more application screens. */

=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bot } from "lucide-react";
import api from "../services/api";
import "./ChatbotWidget.css";

const ROLE_CONTENT = {
  guest: {
    title: "JensnMart Guest Chat",
    eyebrow: "Guest Assistant",
    subtitle: "Login and registration help",
    toggle: "JensnMart AI ",
    placeholder: "Ask about login, register, or forgot password",
    intro:
      "Ask about login, registration, forgot password, or account access before you sign in.",
    prompts: [
      "How do I register as vendor",
      "How do I login as admin",
      "I forgot my password",
    ],
  },
  vendor: {
    title: "JensnMart Vendor Chat",
    eyebrow: "Vendor Assistant",
    subtitle: "Shopping help for vendors",
    toggle: "JensnMart AI",
    placeholder: "Ask what to buy or compare",
    intro:
      "Ask for best sellers, cheaper options, category help, or product comparisons across JensnMart.",
    prompts: [
      "Show best selling products",
      "Find cheap electronics",
      "Suggest products under Rs 1000",
    ],
  },
  admin: {
    title: "JensnMart Admin Chat",
    eyebrow: "Admin Assistant",
    subtitle: "Catalog and inventory guidance",
    toggle: "JensnMart AI",
    placeholder: "Ask about stock, pricing, or catalog trends",
    intro:
      "Ask about low stock items, best sellers, pricing patterns, or category coverage in the catalog.",
    prompts: [
      "Show low stock products",
      "Which products sell best",
      "Find expensive items in catalog",
    ],
  },
};

<<<<<<< HEAD
/** Splits assistant text into plain and bold segments so messages render with basic Markdown emphasis. */
const renderMessageContent = (content) => {
  const parts = String(content || "").split(/(\*\*.*?\*\*)/g);
  /** Normalizes assistant text for readable sentence-style display. */
=======
const renderMessageContent = (content) => {
  const parts = String(content || "").split(/(\*\*.*?\*\*)/g);
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
  const formatSentenceCase = (value) => {
    const text = String(value || "");
    if (!text.trim()) return text;

    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  return parts.map((part, index) => {
    const boldMatch = part.match(/^\*\*(.+)\*\*$/);

    if (boldMatch) {
      return <strong key={index}>{formatSentenceCase(boldMatch[1])}</strong>;
    }

    return formatSentenceCase(part);
  });
};

<<<<<<< HEAD
/** Renders the chatbot widget interface and coordinates the state and actions for this screen or reusable component. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
export default function ChatbotWidget() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState("guest");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const content = ROLE_CONTENT[role];

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");

    if (!token) {
      setRole("guest");
      return;
    }

    if (storedRole === "vendor") {
      setRole("vendor");
      return;
    }

    if (storedRole === "admin" || storedRole === "manager") {
      setRole("admin");
      return;
    }

    setRole("guest");
  }, [location.pathname]);

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: content.intro,
      },
    ]);
    setInput("");
  }, [content.intro]);

  const requestHistory = useMemo(
    () =>
      messages.slice(1).slice(-6).map((message) => ({
        role: message.role,
        content: message.content,
      })),
    [messages]
  );

<<<<<<< HEAD
  /** Builds the correct product link for a catalog item in the chatbot response. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
  const getProductHref = (productName) => {
    const search = encodeURIComponent(productName);

    if (role === "admin") {
      return `/admin/inventory?search=${search}`;
    }

    if (role === "vendor") {
      return `/vendor?search=${search}`;
    }

    return "/";
  };

<<<<<<< HEAD
  /** Sends the current chat prompt to the assistant API and appends its reply to the conversation. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/ai/chat", {
        message: trimmed,
        history: requestHistory,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.data?.reply || "I could not generate a reply right now.",
          products: res.data?.suggestedProducts || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err.response?.data?.message ||
            "Chatbot is unavailable right now. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  /** Handles form submission and prevents the browser default while the component processes the input. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
  const onSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

<<<<<<< HEAD
  /** Copies a suggested chat prompt into the input and submits it through the normal chat flow. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
  const applyPrompt = (prompt) => {
    setInput(prompt);
  };

  return (
    <div className={`chatbot-shell ${isOpen ? "open" : ""}`}>
      {isOpen && (
        <section className="chatbot-panel">
          <div className="chatbot-header">
            <div className="chatbot-header-copy">
              <p>{content.eyebrow}</p>
              <h3 className="chatbot-title">
                <span>{content.title}</span>
                <Bot size={18} aria-hidden="true" />
              </h3>
              <span>{content.subtitle}</span>
            </div>
            <button type="button" onClick={() => setIsOpen(false)}>
              x
            </button>
          </div>

          <div className="chatbot-messages">
            <div className="chatbot-intro-card">
              <strong>Start with a quick prompt</strong>
              <div className="chatbot-prompt-grid">
                {content.prompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="chatbot-prompt-chip"
                    onClick={() => applyPrompt(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`chatbot-message ${message.role}`}
              >
                {renderMessageContent(message.content)}
                {role !== "guest" &&
                  message.role === "assistant" &&
                  Array.isArray(message.products) &&
                  message.products.length > 0 && (
                    <div className="chatbot-product-links">
                      {message.products.map((product) => (
                        <a
                          key={product.id}
                          className="chatbot-product-link"
                          href={getProductHref(product.name)}
                        >
                          {product.name}
                        </a>
                      ))}
                    </div>
                  )}
              </div>
            ))}
            {loading && <div className="chatbot-message assistant">Thinking...</div>}
          </div>

          <form className="chatbot-form" onSubmit={onSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={content.placeholder}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="chatbot-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span>{content.toggle}</span>
        <Bot size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
