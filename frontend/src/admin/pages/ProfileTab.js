import { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck, User, Mail, Phone, Lock, Eye, EyeOff, Save, Loader2, ShieldCheck
} from "lucide-react";
import "../admin.css";

export default function ProfileTab() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", role: "", password: ""
  });

  const [status, setStatus] = useState({ loading: true, updating: false });
  const [showPass, setShowPass] = useState(false);

  // Memoized loader to prevent unnecessary re-renders
  const loadProfile = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/profile");
      // Format phone for the input if it comes from DB as 10 digits
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
      setStatus(s => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  /* ================= VALIDATION LOGIC ================= */
  const rawPhone = form.phone.replace(/\s/g, "");
  const isPhoneValid = /^[6-9]\d{9}$/.test(rawPhone);
  const isFormValid = isPhoneValid && form.name.trim().length > 2;

  /* ================= ACTION HANDLERS ================= */
  const handleUpdate = async () => {
    if (!isFormValid) return;

    setStatus(s => ({ ...s, updating: true }));
    try {
      await api.put("/admin/profile", {
        name: form.name.trim(),
        phone: rawPhone,
        password: form.password || undefined // Don't send empty string
      });

      toast.success("Profile synchronized successfully");
      setForm(prev => ({ ...prev, password: "" }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setStatus(s => ({ ...s, updating: false }));
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
      className="profile-container"
    >
      <div className="profile-card-premium">
        {/* Header Section */}
        <div className="profile-header">
          <div className="avatar-wrapper">
            <div className="avatar-inner">
              {form.name.charAt(0).toUpperCase()}
            </div>
            <div className="status-indicator active"></div>
          </div>

          <div className="header-info">
            <h1>{form.name}</h1>
            <div className={`role-chip ${form.role.toLowerCase()}`}>
              {form.role.toLowerCase() === "admin" ? (
                <ShieldCheck size={13} strokeWidth={3} />
              ) : (
                <UserCheck size={13} strokeWidth={3} />
              )}
              <span>{form.role.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="profile-divider" />
        <div className="profile-grid">
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
                placeholder="••••••••"
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
          className={`save-btn-premium ${status.updating ? 'loading' : ''}`}
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
    </motion.div>
  );
}