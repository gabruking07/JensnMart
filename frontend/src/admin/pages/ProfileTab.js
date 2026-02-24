
import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import "../admin.css";

export default function ProfileTab() {

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    password: ""
  });

  const [showPass, setShowPass] = useState(false);

  const loadProfile = async () => {
    try {
      const res = await api.get("/admin/profile");

      setForm({
        name: res.data.name || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        role: res.data.role || "",
        password: ""
      });
    } catch {
      toast.error("Failed to load profile");
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  /* ================= PHONE VALIDATION ================= */
  const rawPhone = form.phone.replace(/\s/g, "");
  const isPhoneValid = /^[6-9]\d{9}$/.test(rawPhone);

  const phoneError =
    rawPhone.length === 0
      ? ""
      : !isPhoneValid
        ? "Enter valid 10-digit Indian mobile number"
        : "";

  /* ================= UPDATE ================= */
  const update = async () => {
    const rawPhone = form.phone.replace(/\s/g, "");

    if (!/^[6-9]\d{9}$/.test(rawPhone)) {
      toast.error("Invalid phone number");
      return;
    }

    try {
      await api.put("/admin/profile", {
        name: form.name,
        phone: rawPhone,
        password: form.password
      });

      toast.success("Profile updated");
      setForm({ ...form, password: "" });
    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <div className="profile-wrapper">
      <div className="profile-card-premium">
        <div className="profile-header">
          <div className="avatar-circle">
            {form.name.charAt(0).toUpperCase()}
          </div>

          <div>
            <h2>{form.name}</h2>
            <div className={`role-chip ${form.role}`}>
              {form.role.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="profile-form-grid">
          <div className="field">
            <label>Full Name</label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
          </div>

          <div className="field">
            <label>Email</label>
            <input value={form.email} disabled />
          </div>

          <div className="field">
            <label>Phone</label>
            <input
              placeholder="Enter 10 digit phone"
              value={form.phone}
              maxLength={11}
              onChange={(e) => {
                let digits = e.target.value.replace(/\D/g, "").slice(0, 10);

                if (digits.length > 5) {
                  digits = digits.slice(0, 5) + " " + digits.slice(5);
                }

                setForm({ ...form, phone: digits });
              }}
            />

            {phoneError && (
              <span className="error-text">{phoneError}</span>
            )}
          </div>

          <div className="password-wrap">
            <input
              type={showPass ? "text" : "password"}
              placeholder="Leave empty to keep same"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />
          </div>
        </div>

        <button
          className="save-btn-premium"
          onClick={update}
          disabled={!isPhoneValid}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}