import { useEffect, useState } from "react";
import api from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";

import "./VendorProfile.css";

export default function VendorProfile({ darkMode, setDarkMode }) {
  const [vendor, setVendor] = useState(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [Phone, setPhone] = useState("");
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get("/vendor/profile");
      setVendor(res.data);
      setName(res.data.name);
      setPhone(res.data.phone);
    } catch (err) {
      console.error("Failed to load profile", err);
    }
  };

  const updateProfile = async () => {
    setIsUpdating(true);
    try {
      await api.put("/vendor/profile", { name, password });
      alert("Profile updated successfully! ✨");
      setPassword("");
      loadProfile();
    } catch (err) {
      alert("Update failed. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!vendor) return <div className="loader-container"><div className="loader"></div></div>;

  return (
    <div className={`profile-page-root ${darkMode ? "dark-mode" : ""}`}>
      <Header title="Account Settings" darkMode={darkMode} setDarkMode={setDarkMode} />

      <main className="profile-content">
        <div className="profile-grid">
          
          {/* Left Side: Summary Card */}
          <section className="profile-sidebar">
            <div className="admin-card user-info-card">
              <div className="profile-avatar">
                {name.charAt(0).toUpperCase()}
              </div>
              <h2>{vendor.name}</h2>
              <p className="profile-email">{vendor.email}</p>
              
              <div className={`status-pill ${vendor.approved ? "status-approved" : "status-pending"}`}>
                {vendor.approved ? "Verified Vendor" : "Pending Verification"}
              </div>
              
              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-label">Role</span>
                  <span className="stat-value">Vendor</span>
                </div>
              </div>
            </div>
          </section>

          {/* Right Side: Edit Form */}
          <section className="profile-main">
            <div className="admin-card edit-profile-card">
              <h3>Edit Profile</h3>
              <p className="section-desc">Update your public name or change your security credentials.</p>
              
              <div className="profile-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="form-group">
                  <label>Email Address (Read-only)</label>
                  <input
                    type="email"
                    value={vendor.email}
                    disabled
                    className="disabled-input"
                  />
                </div>

                <div className="form-group">
                  <label>Phone No.</label>
                  <input
                    type="text"
                    placeholder="Enter your Phone Number"
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                  />
                  <small className="input-hint">Ensure your password is at least 8 characters long.</small>
                </div>

                <button 
                  className="btn-save-profile" 
                  onClick={updateProfile}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}