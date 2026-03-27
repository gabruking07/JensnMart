import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./Login.css";

import logo from "../assets/logo.png";
import bg from "../assets/bg.png";

export default function VendorRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India"
  });

  const handleRegister = async () => {
    try {
      if (!formData.name || !formData.email || !formData.password || !formData.phone) {
        toast.error("Fill all required fields");
        return;
      }

      if (!/^\d{10}$/.test(formData.phone)) {
        toast.error("Phone number must be exactly 10 digits");
        return;
      }

      if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
        toast.error("Pincode must be exactly 6 digits");
        return;
      }

      await api.post("/vendor/register", formData);

      toast.success("Registered. Wait for admin approval");
      navigate("/vendor-login");

    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="auth-page-root" style={{ backgroundImage: `url(${bg})` }}>
      <div className="auth-overlay">

        <div className="login-container">
          <div className="auth-card">

            <div className="auth-header">
              <img src={logo} alt="Logo" className="auth-logo" />
              <h2 className="card-title">Partner With Us</h2>
            </div>

            <div className="auth-form">

              {/* NAME */}
              <div className="form-group">
                <label>Name</label>
                <input
                  className="auth-input"
                  placeholder="Business name"
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              {/* EMAIL */}
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="auth-input"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              {/* PASSWORD */}
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  className="auth-input"
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
{/* XVF */}
              {/* PHONE */}
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  className="auth-input"
                  placeholder="10 digit"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="\d{10}"
                  onChange={(e) => {
                    if (/^\d{0,10}$/.test(e.target.value)) {
                      setFormData({...formData, phone: e.target.value});
                    }
                  }}
                />
              </div>

              {/* ADDRESS */}
              <div className="form-group">
                <label>Address Line 1</label>
                <input
                  className="auth-input"
                  onChange={(e) => setFormData({...formData, addressLine1: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Address Line 2</label>
                <input
                  className="auth-input"
                  onChange={(e) => setFormData({...formData, addressLine2: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>City</label>
                <input
                  className="auth-input"
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>State</label>
                <input
                  className="auth-input"
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Pincode</label>
                <input
                  type="tel"
                  className="auth-input"
                  placeholder="6 digit"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="\d{6}"
                  value={formData.pincode}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setFormData({...formData, pincode: digitsOnly});
                  }}
                />
              </div>

              <div className="form-group">
                <label>Country</label>
                <input
                  className="auth-input"
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                />
              </div>

              <button className="btn-sign-in" onClick={handleRegister}>
                REGISTER NOW
              </button>

            </div>

            <div className="auth-footer">
              <p>Already have account?</p>
              <button className="btn-reg" onClick={() => navigate("/vendor-login")}>
                Login
              </button>
            </div>

          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
