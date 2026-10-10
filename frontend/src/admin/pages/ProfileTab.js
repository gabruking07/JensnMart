/** Administrator profile tab screen; loads and updates the corresponding marketplace records through the shared API client. */

import { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Save,
  Loader2,
  ShieldCheck,
  KeyRound
} from "lucide-react";
import "../admin.css";

/** Renders the profile tab interface and coordinates the state and actions for this screen or reusable component. */
export default function ProfileTab() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", role: "", password: ""
  });

  const [status, setStatus] = useState({ loading: true, updating: false });
  const [showPass, setShowPass] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/profile");
      const formattedPhone = data.phone
        ? data.phone.slice(0, 5) + " " + data.phone.slice(5)
        : "";

      setForm({
        name: data.name || "",
        email: data.email || "",
        phone: formattedPhone,
        role: data.role || "staff",
        password: ""
      });
    } catch (err) {
      toast.error("Could not sync profile data");
    } finally {
      setStatus((current) => ({ ...current, loading: false }));
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const rawPhone = form.phone.replace(/\s/g, "");
  const isPhoneValid = /^[6-9]\d{9}$/.test(rawPhone);
  const isFormValid = isPhoneValid && form.name.trim().length > 2;

  /** Handles the update user action and coordinates its UI or API response. */
  const handleUpdate = async () => {
    if (!isFormValid) return;

    setStatus((current) => ({ ...current, updating: true }));
    try {
      await api.put("/admin/profile", {
        name: form.name.trim(),
        phone: rawPhone,
        password: form.password || undefined
      });

      toast.success("Profile synchronized successfully");
      setForm((prev) => ({ ...prev, password: "" }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setStatus((current) => ({ ...current, updating: false }));
    }
  };

  if (status.loading) {
    return (
      <div className="flex-center h-64">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="profile-wrapper admin-profile-page"
    >
      <section className="admin-profile-hero">
        <div className="admin-profile-hero-copy">
          <p className="admin-profile-eyebrow">Account control</p>
          <h1>Keep your admin profile aligned with the rest of the workspace.</h1>
          <p className="admin-profile-hero-text">
            Update your contact details and password from the same structured panel used across the
            newer admin screens.
          </p>
        </div>

        <div className="admin-profile-hero-status">
          <span>Access level</span>
          <strong>{form.role ? form.role.toUpperCase() : "STAFF"}</strong>
          <p>
            {form.role?.toLowerCase() === "admin"
              ? "Full platform access is enabled for this account."
              : "Manager-level controls are active for daily operations."}
          </p>
        </div>
      </section>

      <section className="admin-profile-summary">
        <article className="admin-profile-summary-card">
          <span>Identity</span>
          <strong>{form.name || "Not set"}</strong>
          <small>primary account holder</small>
        </article>
        <article className="admin-profile-summary-card">
          <span>Contact</span>
          <strong>{form.phone || "Not added"}</strong>
          <small>notification fallback</small>
        </article>
      </section>

      <div className="admin-profile-layout">
        <aside className="admin-profile-sidebar">
          <div className="admin-profile-card admin-profile-identity">
            <div className="admin-profile-header">
              <div className="admin-profile-avatar">
                {form.name.charAt(0).toUpperCase()}
              </div>
              <div className="admin-profile-header-copy">
                <h2>{form.name || "Admin user"}</h2>
                <p>{form.email}</p>
              </div>
            </div>

            <div className={`admin-profile-role-chip ${form.role.toLowerCase()}`}>
              {form.role.toLowerCase() === "admin" ? (
                <ShieldCheck size={13} strokeWidth={3} />
              ) : (
                <UserCheck size={13} strokeWidth={3} />
              )}
              <span>{form.role.toUpperCase()}</span>
            </div>

            <div className="admin-profile-detail-list">
              <div className="admin-profile-detail-item">
                <Mail size={16} />
                <div>
                  <span>Email</span>
                  <strong>{form.email}</strong>
                </div>
              </div>
              <div className="admin-profile-detail-item">
                <Phone size={16} />
                <div>
                  <span>Phone</span>
                  <strong>{form.phone || "Not added"}</strong>
                </div>
              </div>
              <div className="admin-profile-detail-item">
                <KeyRound size={16} />
                <div>
                  <span>Password</span>
                  <strong>{form.password ? "Ready to save" : "No pending change"}</strong>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="admin-profile-main">
          <div className="admin-profile-card admin-profile-form-card">
            <div className="admin-profile-form-head">
              <div>
                <span className="admin-profile-section-kicker">Profile details</span>
                <h3>Edit account details</h3>
              </div>
              <p>These values are used across admin notifications, approvals, and account recovery.</p>
            </div>

            <div className="admin-profile-form-grid">
              <div className="input-group">
                <label><User size={16} /> Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="input-group readonly">
                <label><Mail size={16} /> Email Address</label>
                <input value={form.email} disabled />
              </div>

              <div className="input-group">
                <label><Phone size={16} /> Contact Number</label>
                <input
                  type="text"
                  placeholder="98765 43210"
                  value={form.phone}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    if (val.length > 5) val = val.slice(0, 5) + " " + val.slice(5);
                    setForm({ ...form, phone: val });
                  }}
                />
                <AnimatePresence>
                  {form.phone && !isPhoneValid && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="error-hint"
                    >
                      Invalid Indian mobile format
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <div className="input-group">
                <label><Lock size={16} /> Security</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="New password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <small className="field-help">Leave blank to keep current password</small>
              </div>
            </div>

            <button
              className={`save-btn-premium ${status.updating ? "loading" : ""}`}
              onClick={handleUpdate}
              disabled={!isFormValid || status.updating}
            >
              {status.updating ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <><Save size={20} /> Save Changes</>
              )}
            </button>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
