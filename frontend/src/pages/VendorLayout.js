import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

export default function VendorLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="vendor-layout">

      {/* SIDEBAR */}
      <aside className="vendor-sidebar">
        <div className="vendor-logo">
          <img src={logo} alt="logo" />
        </div>

        <button
          onClick={() => navigate("/vendor")}
          className={`side-link ${location.pathname === "/vendor" ? "active" : ""}`}
        >
          📦 Inventory
        </button>

        <button
          onClick={() => navigate("/vendor/orders")}
          className={`side-link ${location.pathname === "/vendor/orders" ? "active" : ""}`}
        >
          🧾 Orders
        </button>

        <button
          onClick={() => navigate("/vendor/profile")}
          className={`side-link ${location.pathname === "/vendor/profile" ? "active" : ""}`}
        >
          👤 Profile
        </button>

        <button
          onClick={() => navigate("/cart")}
          className={`side-link ${location.pathname === "/cart" ? "active" : ""}`}
        >
          🛒 Cart
        </button>

        <button onClick={logout} className="side-link logout">
          🚪 Logout
        </button>
      </aside>

      <div className="vendor-content">
        {children}
      </div>

    </div>
  );
}