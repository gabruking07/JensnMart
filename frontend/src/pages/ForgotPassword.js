import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.png";
import bg from "../assets/bg.png";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialRole = searchParams.get("role") === "vendor" ? "vendor" : "admin";

  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);

  const basePath = useMemo(() => (role === "admin" ? "/admin" : "/vendor"), [role]);
  const otpVerified = Boolean(resetToken);

  const sendOtp = async () => {
    if (!email.trim()) {
      return alert("Please enter your registered email");
    }

    try {
      setLoading(true);
      const res = await api.post(`${basePath}/forgot-password/request-otp`, {
        email: email.trim().toLowerCase()
      });
      alert(res.data?.message || "OTP has been sentt");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!email.trim() || !otp.trim()) {
      return alert("Please enter email and OTP");
    }

    try {
      setLoading(true);
      const res = await api.post(`${basePath}/forgot-password/verify-otp`, {
        email: email.trim().toLowerCase(),
        otp: otp.trim()
      });
      setResetToken(res.data.resetToken);
      alert("OTP verified. You can set a new password now.");
    } catch (err) {
      alert(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!otpVerified) {
      return alert("Please verify OTP first");
    }
    if (newPassword.length < 6) {
      return alert("Password must be at least 6 characters");
    }
    if (newPassword !== confirmPassword) {
      return alert("Passwords do not match");
    }

    try {
      setLoading(true);
      await api.post(`${basePath}/forgot-password/reset`, {
        email: email.trim().toLowerCase(),
        newPassword,
        resetToken
      });
      alert("Password updated successfully");
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const onRoleChange = (nextRole) => {
    setRole(nextRole);
    setOtp("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="auth-page-root" style={{ backgroundImage: `url(${bg})` }}>
      <div className="auth-overlay">
        <Header title=" " />

        <div className="login-container">
          <div className="auth-card forgot-card">
            <img src={logo} alt="Logo" className="auth-logo" />
            <h2 className="card-title">Forgot Password</h2>
            <p className="card-subtitle">Verify OTP and reset your password</p>

            <label className="input-label">Account Type</label>
            <div className="role-buttons">
              <button
                type="button"
                className={role === "admin" ? "active" : ""}
                onClick={() => onRoleChange("admin")}
              >
                Admin / Manager
              </button>
              <button
                type="button"
                className={role === "vendor" ? "active" : ""}
                onClick={() => onRoleChange("vendor")}
              >
                Vendor
              </button>
            </div>

            <div className="form-group">
              <label className="input-label">Registered Email</label>
              <input
                type="email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
              />
            </div>

            <button type="button" className="btn-sign-in" disabled={loading} onClick={sendOtp}>
              Send OTP
            </button>

            <div className="form-group">
              <label className="input-label">OTP</label>
              <input
                type="text"
                className="auth-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6 digit OTP"
                maxLength={6}
              />
            </div>

            <button type="button" className="btn-sign-in secondary-btn" disabled={loading} onClick={verifyOtp}>
              Verify OTP
            </button>

            <div className="form-group">
              <label className="input-label">New Password</label>
              <input
                type="password"
                className="auth-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                disabled={!otpVerified}
              />
            </div>

            <div className="form-group">
              <label className="input-label">Confirm Password</label>
              <input
                type="password"
                className="auth-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                disabled={!otpVerified}
              />
            </div>

            <button type="button" className="btn-sign-in" disabled={loading || !otpVerified} onClick={resetPassword}>
              Update Password
            </button>

            <button type="button" className="forgot-back-link" onClick={() => navigate("/")}>
              Back to login
            </button>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
