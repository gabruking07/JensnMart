import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./AdminRegister.css";

export default function AdminRegister({ darkMode, setDarkMode }) {
  const [adminName, setAdminName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const [password, setPassword] = useState("");
  const [role, setRole] = useState("manager");
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return regex.test(email);
  };

  const handleRegister = async () => {
    if (!validateEmail(email)) {
      alert("Invalid email format");
      return;
    }

    if (phone.length !== 10) {
      alert("Phone number must be exactly 10 digits");
      return;
    }

    try {
      await api.post("/admin/register", {
        name: adminName,
        email,
        password,
        phone,
        role,
      });

      alert("Admin registered successfully");
      navigate("/admin-login");
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className={`auth-page-root ${darkMode ? "dark-mode" : ""}`}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Create Admin Account</h2>
            <p>Join the management team</p>
          </div>

          <div className="auth-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="name@company.com"
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
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  placeholder="10-digit number"
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

            <div className="form-group">
              <label>Assign Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="manager">Manager (Standard Access)</option>
                <option value="admin">Admin (Full Access)</option>
              </select>
            </div>

            <button className="btn-auth-primary" onClick={handleRegister}>
              Create Account
            </button>

            <button className="btn-auth-secondary" onClick={() => navigate("/")}>
              Already have an account? Login
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}