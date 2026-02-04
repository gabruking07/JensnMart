import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./AdminRegister.css"; // Reuse the shared auth styles

export default function VendorRegister({ darkMode, setDarkMode }) {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // ✅ Email validation function
  const validateEmail = (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return regex.test(value);
  };

  // ✅ Submit handler with validation
  const handleRegister = async () => {
    if (!name || !email || !password || phone.length !== 10) {
      alert("All fields are required (phone must be 10 digits)");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    try {
      await api.post("/vendor/register", {
        name,
        email: email.toLowerCase(),
        password,
        phone,
      });

      alert("Registration successful! Please wait for admin approval.");
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Vendor registration failed");
    }
  };

  return (
    <div className={`auth-page-root ${darkMode ? "dark-mode" : ""}`}>
      <Header
        title="Vendor Onboarding"
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Partner with Us</h2>
            <p>Register your shop and start shopping</p>
          </div>

          <div className="auth-form">
            {/* Name */}
            <div className="form-group">
              <label>Full Name</label>
              <input
                placeholder="e.g. Reliance Mart"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="vendor@business.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (!validateEmail(e.target.value)) {
                    setEmailError("Please enter a valid email address");
                  } else {
                    setEmailError("");
                  }
                }}
                required
              />
              {emailError && (
                <p className="error-text">{emailError}</p>
              )}
            </div>

            <div className="form-row">
              {/* Password */}
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Phone */}
              <div className="form-group">
                <label>Contact Number</label>
                <input
                  placeholder="10-digit mobile"
                  value={phone}
                  onChange={(e) => {
                    if (/^\d{0,10}$/.test(e.target.value)) {
                      setPhone(e.target.value);
                    }
                  }}
                  required
                />
              </div>
            </div>

            <button className="btn-auth-primary" onClick={handleRegister}>
              Apply for Partnership
            </button>

            <button
              className="btn-auth-secondary"
              onClick={() => navigate("/")}
            >
              Already a partner? Login here
            </button>
          </div>

          <div className="approval-notice">
            <small>
              ℹ️ All applications are reviewed by our admin team within 24 hours.
            </small>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}