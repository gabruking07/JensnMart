import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./Login.css";

import logo from "../assets/logo.png";
import bg from "../assets/bg.png";

export default function VendorRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    password: "",
    phone: ""
  });

  const handleRegister = async () => {
    try {
      await api.post("/vendor/register", formData);
      navigate("/login");
    } catch (err) {
      alert("Registration failed");
    }
  };

  return (
    <div className="auth-page-root" style={{ backgroundImage: `url(${bg})` }}>
      <div className="auth-overlay">
        <Header title="Vendor Registration" />

        <div className="login-container">
          <div className="auth-card">
            <div className="auth-header">
              <img src={logo} alt="Logo" className="auth-logo" />
              <h2 className="card-title">Partner With Us</h2>
              <p className="card-subtitle">Grow your business with JensnMart</p>
            </div>

            <div className="auth-form">
              <div className="form-group">
                <label className="input-label">Name</label>
                <input 
                  type="text" 
                  className="auth-input" 
                  placeholder="Enter your name" 
                  onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="input-label">Email Address</label>
                <input 
                  type="email" 
                  className="auth-input" 
                  placeholder="vendor@gmail.com" 
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="input-label">Password</label>
                <input 
                  type="password" 
                  className="auth-input" 
                  placeholder="••••••" 
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <button className="btn-sign-in" onClick={handleRegister}>
                REGISTER NOW
              </button>
            </div>

            <div className="auth-footer">
              <p className="footer-text">Already have a vendor account?</p>
              <button className="btn-reg" onClick={() => navigate("/login")}>
                Login Here
              </button>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}