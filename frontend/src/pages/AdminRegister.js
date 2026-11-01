/** Public admin register screen; supports an account or customer-facing flow before entering the protected application areas. */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./Login.css"; 

import logo from "../assets/logo.png";
import bg from "../assets/bg.png";

/** Renders the admin register interface and coordinates the state and actions for this screen or reusable component. */
export default function AdminRegister() {
  const [adminName, setAdminName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("manager");
  
  const navigate = useNavigate();

  /** Checks the email format before the form is submitted. */
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return regex.test(email);
  };

    /** Validates and submits the account registration form. */
    const handleRegister = async () => {
    if (!validateEmail(email)) {
      toast.error("Invalid email format");
      return;
    }

    if (phone.length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
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

      toast.success("Admin registered successfully");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="auth-page-root" style={{ backgroundImage: `url(${bg})` }}>
      <div className="auth-overlay">

        <div className="login-container">
          <div className="auth-card">
            <div className="auth-header">
              <img src={logo} alt="Logo" className="auth-logo" />
              <h2 className="card-title">Create Admin Account</h2>
              <p className="card-subtitle">Join the management team</p>
            </div>

            <div className="auth-form">
              <div className="form-group">
                <label className="input-label">Full Name</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Enter your name"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (!validateEmail(e.target.value)) {
                      setEmailError("Invalid email format");
                    } else {
                      setEmailError("");
                    }
                  }}
                />
                {emailError && <p className="error-text">{emailError}</p>}
              </div>

              <div className="form-group">
                <label className="input-label">Phone Number</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="10-digit number"
                  value={phone}
                  onChange={(e) => {
                    if (/^\d{0,10}$/.test(e.target.value)) {
                      setPhone(e.target.value);
                    }
                  }}
                />
              </div>

              <div className="form-group">
                <label className="input-label">Password</label>
                <input
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="input-label">Assign Role</label>
                <select 
                  className="auth-input" 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="manager">Manager (Standard)</option>
                  <option value="admin">Admin (Full Access)</option>
                </select>
              </div>

              <button className="btn-sign-in" onClick={handleRegister}>
                CREATE ACCOUNT
              </button>
            </div>

            <div className="auth-footer">
              <p className="footer-text">Already have an account?</p>
              <button className="btn-reg" onClick={() => navigate("/")}>
                Back to Login
              </button>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
