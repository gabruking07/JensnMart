import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.png";
import bg from "../assets/bg.png";
import "./ContactUs.css";

const contactHighlights = [
  {
    label: "Email Support",
    value: "support@jensnmart.com",
    note: "Replies within one business day"
  },
  {
    label: "Phone",
    value: "+91 98765 43210",
    note: "Mon to Sat, 9:00 AM to 7:00 PM"
  },
  {
    label: "Head Office",
    value: "MG Road, Bengaluru, Karnataka",
    note: "Vendor onboarding and operations desk"
  }
];

export default function ContactUs() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleChange = (field) => (event) => {
    setFormData((current) => ({
      ...current,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error("Please fill in your name, email, and message.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/contact", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim()
      });

      toast.success(res.data?.message || "Your message has been sent successfully.");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: ""
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send your message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page-root" style={{ backgroundImage: `url(${bg})` }}>
      <div className="contact-overlay">
        <Header title=" " />

        <main className="contact-shell">
          <section className="contact-hero-card">
            <div className="contact-hero-copy">
              <span className="contact-kicker">Contact JensnMart</span>
              <img src={logo} alt="JensnMart logo" className="contact-logo" />
              <h1>Let&apos;s help your team move faster.</h1>
              <p>
                Reach out for vendor onboarding, order support, account help, or partnership
                questions. We&apos;ll point you to the right person quickly.
              </p>

              <div className="contact-highlight-grid">
                {contactHighlights.map((item) => (
                  <article key={item.label} className="contact-highlight-card">
                    <p className="contact-highlight-label">{item.label}</p>
                    <h2>{item.value}</h2>
                    <span>{item.note}</span>
                  </article>
                ))}
              </div>
            </div>

            <form className="contact-form-card" onSubmit={handleSubmit}>
              <div className="contact-form-header">
                <h2>Send us a message</h2>
                <p>Tell us what you need and we&apos;ll follow up with the right next step.</p>
              </div>

              <label className="contact-field">
                <span>Your Name</span>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleChange("name")}
                  placeholder="Enter your full name"
                />
              </label>

              <label className="contact-field">
                <span>Email Address</span>
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleChange("email")}
                  placeholder="name@example.com"
                />
              </label>

              <label className="contact-field">
                <span>Subject</span>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={handleChange("subject")}
                  placeholder="Order issue, onboarding, partnership..."
                />
              </label>

              <label className="contact-field">
                <span>Message</span>
                <textarea
                  rows="6"
                  value={formData.message}
                  onChange={handleChange("message")}
                  placeholder="Share a few details so we can help faster."
                />
              </label>

              <div className="contact-form-actions">
                <button type="submit" className="contact-submit-btn" disabled={loading}>
                  {loading ? "Sending..." : "Send Message"}
                </button>
                <button
                  type="button"
                  className="contact-secondary-btn"
                  disabled={loading}
                  onClick={() => navigate("/")}
                >
                  Back to login
                </button>
              </div>
            </form>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
