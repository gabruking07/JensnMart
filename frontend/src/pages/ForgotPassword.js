/** Public forgot password screen; supports an account or customer-facing flow before entering the protected application areas. */

import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.png";
import bg from "../assets/bg.png";
import "./ForgotPassword.css";

/** Renders the forgot password interface and coordinates the state and actions for this screen or reusable component. */
export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialRole = searchParams.get("role") === "vendor" ? "vendor" : "admin";

  const [role, setRole] = useState(initialRole);
  const [contactType, setContactType] = useState("email");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);

  const basePath = useMemo(() => (role === "admin" ? "/admin" : "/vendor"), [role]);
  const otpVerified = Boolean(resetToken);

    /** Requests a password-recovery code for the selected account role. */
    const sendOtp = async () => {
    const normalizedIdentifier =
      contactType === "phone" ? identifier.replace(/\D/g, "") : identifier.trim().toLowerCase();

    if (!normalizedIdentifier) {
      return toast.error(
        contactType === "phone"
          ? "Please enter your registered mobile number"
          : "Please enter your registered email"
      );
    }

    if (contactType === "phone" && !/^\d{10}$/.test(normalizedIdentifier)) {
      return toast.error("Phone must be exactly 10 digits");
    }

    try {
      setLoading(true);
      const res = await api.post(`${basePath}/forgot-password/request-otp`, {
        contactType,
        identifier: normalizedIdentifier
      });
      toast.success(res.data?.message || "OTP has been sent");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  /** Checks the recovery code with the backend before enabling password reset. */
  const verifyOtp = async () => {
    const normalizedIdentifier =
      contactType === "phone" ? identifier.replace(/\D/g, "") : identifier.trim().toLowerCase();

    if (!normalizedIdentifier || !otp.trim()) {
      return toast.error(
        contactType === "phone" ? "Please enter mobile number and OTP" : "Please enter email and OTP"
      );
    }

    try {
      setLoading(true);
      const res = await api.post(`${basePath}/forgot-password/verify-otp`, {
        contactType,
        identifier: normalizedIdentifier,
        otp: otp.trim()
      });
      setResetToken(res.data.resetToken);
      toast.success("OTP verified. You can set a new password now.");
    } catch (err) {
      toast.error(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

    /** Sends the new password after OTP verification and completes account recovery. */
    const resetPassword = async () => {
    if (!otpVerified) {
      return toast.error("Please verify OTP first");
    }
    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      setLoading(true);
      const normalizedIdentifier =
        contactType === "phone" ? identifier.replace(/\D/g, "") : identifier.trim().toLowerCase();
      await api.post(`${basePath}/forgot-password/reset`, {
        contactType,
        identifier: normalizedIdentifier,
        newPassword,
        resetToken
      });
      toast.success("Password updated successfully");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

    /** Resets role-specific recovery state when the user switches account type. */
    const onRoleChange = (nextRole) => {
    setRole(nextRole);
    setContactType("email");
    setIdentifier("");
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

            <div className="form-group">
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
            </div>

            <div className="form-group">
              <label className="input-label">OTP Via</label>
              <div className="role-buttons">
                <button
                  type="button"
                  className={contactType === "email" ? "active" : ""}
                  onClick={() => {
                    setContactType("email");
                    setIdentifier("");
                    setOtp("");
                    setResetToken("");
                  }}
                >
                  Gmail
                </button>
                <button
                  type="button"
                  className={contactType === "phone" ? "active" : ""}
                  onClick={() => {
                    setContactType("phone");
                    setIdentifier("");
                    setOtp("");
                    setResetToken("");
                  }}
                >
                  Mobile
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="input-label">
                {contactType === "phone" ? "Registered Mobile Number" : "Registered Email"}
              </label>
              <input
                type={contactType === "phone" ? "tel" : "email"}
                className="auth-input"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  contactType === "phone"
                    ? "Enter your registered mobile number"
                    : "Enter your registered email"
                }
                maxLength={contactType === "phone" ? 10 : undefined}
              />
            </div>

            <div className="forgot-action-row">
              <button type="button" className="btn-sign-in" disabled={loading} onClick={sendOtp}>
                Send OTP
              </button>
            </div>

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

            <div className="forgot-action-row">
              <button type="button" className="btn-sign-in secondary-btn" disabled={loading} onClick={verifyOtp}>
                Verify OTP
              </button>
            </div>

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

            <div className="forgot-action-row forgot-action-row-last">
              <button type="button" className="btn-sign-in" disabled={loading || !otpVerified} onClick={resetPassword}>
                Update Password
              </button>
            </div>

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
