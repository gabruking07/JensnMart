import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./VendorProfile.css";
import VendorLayout from "./VendorLayout";

export default function VendorProfile({ darkMode, setDarkMode }) {
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

      setVendor(v);
      setName(v.name || "");
      setPhone(v.phone || "");

      setAddressLine1(v.address?.line1 || "");
      setAddressLine2(v.address?.line2 || "");
      setCity(v.address?.city || "");
      setState(v.address?.state || "");
      setPincode(v.address?.pincode || "");
      setCountry(v.address?.country || "India");


    } catch (err) {
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
      alert("Update failed");
    } finally {
      setIsUpdating(false);
    }
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

  const profileImageSrc = getProfileImageUrl(vendor?.profileImage);
  const avatarLabel = (name || vendor?.name || "V").charAt(0).toUpperCase();

  if (!vendor) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <VendorLayout>
      <Header title="Profile" />
      <main className="vendor-main">
        <div className="profile-page-root" >
            <div className="profile-grid">

              {/* LEFT */}
              <section className="profile-sidebar">
                <div className="admin-card user-info-card">

                  <div className="profile-avatar-wrap">
                    {vendor?.profileImage ? (
                      <img
                        src={getProfileImageUrl(vendor.profileImage)}
                        className="profile-avatar-image"
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
                      📷
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

                  <div className={`status-pill ${vendor.approved ? "status-approved" : "status-pending"}`}>
                    {vendor.approved ? "Verified Vendor" : "Pending Verification"}
                  </div>
                </div>
              </section>

              {/* RIGHT */}
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
                      <input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Pincode" />
                      <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" />
                    </div>

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
                      disabled={isUpdating}
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