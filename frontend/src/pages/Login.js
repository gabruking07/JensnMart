import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./Login.css";

import logo from "../assets/logo.png";
import bg from "../assets/bg.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return regex.test(email);
  };

  const login = async () => {
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      const url = role === "admin" ? "/admin/login" : "/vendor/login";
      const res = await api.post(url, { email, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("approved", res.data.approved);
      
      if (res.data.role === "admin" || res.data.role === "manager") {
        navigate("/admin");
      } else {
        navigate("/vendor");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-root" style={{ backgroundImage: `url(${bg})` }}>
      <div className="auth-overlay">
        <Header title=" " />

        <div className="login-container">
          <div className="auth-card">
            <div className="auth-header">
              <img src={logo} alt="Logo" className="auth-logo" />
              <h2 className="card-title">Welcome Back</h2>
              <p className="card-subtitle">Please enter your credentials to continue</p>
            </div>

            <div className="form-content">
              <label className="input-label">Login As:</label>
              <div className="role-buttons">
                <button
                  className={role === "admin" ? "active" : ""}
                  onClick={() => setRole("admin")}
                >
                  Admin / Manager
                </button>
                <button
                  className={role === "vendor" ? "active" : ""}
                  onClick={() => setRole("vendor")}
                >
                  Vendor
                </button>
              </div>

              <div className="form-group">
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="admin@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {emailError && <p className="error-text">{emailError}</p>}
              </div>

              <div className="form-group">
                <label className="input-label">Password</label>
                <input
                  type="password"
                  className="auth-input"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button className="btn-sign-in" onClick={login} disabled={loading}>
                {loading ? "Signing in..." : "SIGN IN"}
              </button>

              <button
                type="button"
                className="forgot-password-link"
                onClick={() => navigate(`/forgot-password?role=${role}`)}
              >
                Forgot Password?
              </button>
            </div>

            <div className="auth-footer">
              <p className="footer-text">Don't have an account?</p>
              <div className="reg-button-group">
                <button className="btn-reg" onClick={() => navigate("/admin-register")}>
                  Admin Reg.
                </button>
                <button className="btn-reg" onClick={() => navigate("/vendor-register")}>
                  Vendor Reg.
                </button>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
