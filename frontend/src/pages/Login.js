import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./Login.css";

export default function Login({ darkMode, setDarkMode }) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin"); // admin | vendor (manager logs in as admin)

  const navigate = useNavigate();

  // ✅ Email validation
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return regex.test(email);
  };

  // ✅ LOGIN HANDLER (FIXED)
 const login = async () => {
  if (!validateEmail(email)) {
    setEmailError("Please enter a valid email address");
    return;
  }

  try {
    const url = role === "admin" ? "/admin/login" : "/vendor/login";
    const res = await api.post(url, { email, password });

    const userRole = res.data.role || role;

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("role", res.data.role);
    localStorage.setItem("approved", res.data.approved ?? "true");

    if (userRole === "admin" || userRole === "manager") {
      navigate("/admin");
    } else if (userRole === "vendor") {
      navigate("/vendor");
    } else {
      navigate("/");
    }

  } catch (err) {
    alert(err.response?.data?.message || "Login failed");
  }
};

  return (
    <div className={`auth-page-root ${darkMode ? "dark-mode" : ""}`}>
      <Header
        title="Portal Access"
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <div className="login-container">
        <div className="auth-card login-card">
          <div className="auth-header">
            <h2>Welcome Back</h2>
            <p>Please enter your credentials to continue</p>
          </div>

          {/* Role Selector */}
          <div className="role-selector-container">
            <label>Login As:</label>
            <div className="role-buttons">
              <button
                type="button"
                className={role === "admin" ? "active" : ""}
                onClick={() => setRole("admin")}
              >
                Admin / Manager
              </button>

              <button
                type="button"
                className={role === "vendor" ? "active" : ""}
                onClick={() => setRole("vendor")}
              >
                Vendor
              </button>
            </div>
          </div>

          <div className="auth-form">
            {/* Email */}
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="admin@company.com"
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
              {emailError && <p className="error-text">{emailError}</p>}
            </div>

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

            <button className="btn-auth-primary" onClick={login}>
              Sign In
            </button>
          </div>

          <div className="auth-footer-links">
            <p>Don't have an account?</p>
            <div className="register-options">
              <button onClick={() => navigate("/admin-register")}>
                Register Admin / Manager
              </button>
              <span className="divider">|</span>
              <button onClick={() => navigate("/vendor-register")}>
                Register Vendor
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}