import { useMemo, useState } from "react";
import api from "../services/api";
import "./ChatbotWidget.css";

const INITIAL_MESSAGE = {
  role: "assistant",
  content: "Ask for best sellers, cheaper options, category help, or product comparisons across JensnMart.",
};

const QUICK_PROMPTS = [
  "Show best selling products",
  "Find cheap electronics",
  "Suggest products under Rs 1000",
];

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const requestHistory = useMemo(
    () =>
      messages
        .filter((message) => message !== INITIAL_MESSAGE)
        .slice(-6)
        .map((message) => ({
          role: message.role,
          content: message.content,
        })),
    [messages]
  );

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

  const onSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const applyPrompt = (prompt) => {
    setInput(prompt);
  };

  return (
    <div className={`chatbot-shell ${isOpen ? "open" : ""}`}>
      {isOpen && (
        <section className="chatbot-panel">
          <div className="chatbot-header">
            <div className="chatbot-header-copy">
              <p>AI Shopping Assistant</p>
              <h3>JensnMart Chat 🤖</h3>
              <span>Live product guidance</span>
            </div>
            <button type="button" onClick={() => setIsOpen(false)}>
              x
            </button>
          </div>

          <div className="chatbot-messages">
            <div className="chatbot-intro-card">
              <strong>Start with a quick prompt</strong>
              <div className="chatbot-prompt-grid">
                {QUICK_PROMPTS.map((prompt) => (
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
                {message.content}
                {message.role === "assistant" && Array.isArray(message.products) && message.products.length > 0 && (
                  <div className="chatbot-product-links">
                    {message.products.map((product) => (
                      <a
                        key={product.id}
                        className="chatbot-product-link"
                        href={`/vendor?search=${encodeURIComponent(product.name)}`}
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
              placeholder="Ask about products or categories"
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
        Jensn AI 🤖
      </button>
    </div>
  );
}
