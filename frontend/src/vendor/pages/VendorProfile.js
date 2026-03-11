import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import Footer from "../../components/Footer";
import "./VendorProfile.css";
import VendorLayout from "./VendorLayout";

export default function VendorProfile() {
  const [vendor, setVendor] = useState(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [pincodeError, setPincodeError] = useState("");
  const [country, setCountry] = useState("India");
  const [profileImage, setProfileImage] = useState(null);

  const fileInputRef = useRef(null);
  const uploadsBaseUrl = `${api.defaults.baseURL.replace(/\/api\/?$/, "")}/uploads`;

  useEffect(() => {
    loadProfile();
  }, []);

  const getProfileImageUrl = (filename) => {
    if (!filename) return "";
    if (filename.startsWith("http")) return filename;
    return `${uploadsBaseUrl}/${filename}`;
  };

  const loadProfile = async () => {
    try {
      const res = await api.get("/vendor/profile");
      const v = res.data;
      const fallbackAddress =
        v.addresses?.find((a) => a?.isDefault) ||
        v.addresses?.[0] ||
        {};

      setVendor(v);
      setName(v.name || "");
      setPhone(v.phone || "");

      setAddressLine1(v.address?.line1 || v.addressLine1 || fallbackAddress.line1 || "");
      setAddressLine2(v.address?.line2 || v.addressLine2 || "");
      setCity(v.address?.city || v.city || fallbackAddress.city || "");
      setState(v.address?.state || v.state || fallbackAddress.state || "");
      setPincode(v.address?.pincode || v.pincode || fallbackAddress.pincode || "");
      setCountry(v.address?.country || v.country || "India");
    } catch (err) {
      console.error("Vendor profile load failed", err);
    }
  };

  const updateProfile = async () => {
    setIsUpdating(true);
    try {
      if (phone && !/^\d{10}$/.test(phone)) {
        alert("Phone must be 10 digits");
        setIsUpdating(false);
        return;
      }

      if (pincode && !/^\d{6}$/.test(pincode.trim())) {
        alert("Pincode must be 6 digits");
        setPincodeError("Pincode must be 6 digits");
        setIsUpdating(false);
        return;
      }

      const formData = new FormData();
      formData.append("name", name);
      formData.append("password", password);
      formData.append("phone", phone);
      formData.append("addressLine1", addressLine1);
      formData.append("addressLine2", addressLine2);
      formData.append("city", city);
      formData.append("state", state);
      formData.append("pincode", pincode);
      formData.append("country", country);

      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      await api.put("/vendor/profile", formData);

      alert("Profile updated");
      setPassword("");
      setProfileImage(null);
      loadProfile();
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePincodeChange = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setPincode(digits);

    if (!digits || /^\d{6}$/.test(digits)) {
      setPincodeError("");
      return;
    }

    setPincodeError("Pincode must be 6 digits");
  };

  const onProfileImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("profileImage", file);
      await api.put("/vendor/profile", formData);
      await loadProfile();
    } catch (err) {
      alert("Image upload failed");
    }
  };

  if (!vendor) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <VendorLayout>
      <main className="vendor-main">
        <div className="profile-page-root">
          <section className="profile-hero">
              <div className="profile-hero-copy">
                <p className="profile-eyebrow">Vendor identity</p>
                <h1>
                  Manage your storefront profile
                  <br />
                  with a cleaner control panel.
                </h1>
                <p className="profile-hero-text">
                  Keep your contact details, delivery address, and account credentials up to date so
                  orders and payments stay aligned.
                </p>
              </div>

            <div className="profile-hero-status">
              <span>Account status</span>
              <strong>{vendor.approved ? "Verified" : "Pending"}</strong>
              <p>
                {vendor.approved
                  ? "Your vendor account is active and verified."
                  : "Your account is awaiting approval review."}
              </p>
            </div>
          </section>

          <div className="profile-grid">
            <section className="profile-sidebar">
              <div className="admin-card user-info-card">
                <div className="profile-avatar-wrap">
                  {vendor?.profileImage ? (
                    <img
                      src={getProfileImageUrl(vendor.profileImage)}
                      className="profile-avatar-image"
                      alt={vendor.name}
                    />
                  ) : (
                    <div className="profile-avatar">
                      {(vendor?.name || "V").charAt(0).toUpperCase()}
                    </div>
                  )}

                  <button
                    type="button"
                    className="camera-upload-btn"
                    onClick={() => fileInputRef.current.click()}
                  >
                    Upload
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={onProfileImageChange}
                  />
                </div>

                <h2>{vendor.name}</h2>
                <p className="profile-email">{vendor.email}</p>

                <div className="profile-quick-stats">
                  <div className="profile-stat-box">
                    <span>Phone</span>
                    <strong>{vendor.phone || "Not set"}</strong>
                  </div>
                  <div className="profile-stat-box">
                    <span>Country</span>
                    <strong>{country || "India"}</strong>
                  </div>
                </div>

                <div className={`status-pill ${vendor.approved ? "status-approved" : "status-pending"}`}>
                  {vendor.approved ? "Verified Vendor" : "Pending Verification"}
                </div>
              </div>
            </section>

            <section className="profile-main">
              <div className="admin-card edit-profile-card">
                <h3>Edit Profile</h3>

                <div className="profile-form">
                  <div className="form-group">
                    <label>Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input value={vendor.email} disabled />
                  </div>

                  <div className="form-group">
                    <label>Phone</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label>Address Line 1</label>
                    <input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label>Address Line 2</label>
                    <input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
                  </div>

                  <div className="form-row">
                    <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                    <input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
                  </div>

                  <div className="form-row">
                    <input
                      value={pincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      placeholder="Pincode"
                      inputMode="numeric"
                      maxLength={6}
                    />
                    <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" />
                  </div>

                  {pincodeError && (
                    <p className="error-text">{pincodeError}</p>
                  )}

                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank to keep"
                    />
                  </div>

                  <button
                    className="btn-save-profile"
                    onClick={updateProfile}
                    disabled={isUpdating || !!pincodeError}
                  >
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </section>
          </div>

          <Footer />
        </div>
      </main>
    </VendorLayout>
  );
}
