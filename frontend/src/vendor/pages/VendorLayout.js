import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LogOut,
  Receipt,
  ShoppingCart,
  UserCircle,
  Wallet,
} from "lucide-react";
import logo from "../../assets/logo.png";
import api from "../../services/api";
import "./VendorLayout.css";

export default function VendorLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [cartItemCount, setCartItemCount] = useState(0);

  const cartLabel = cartCount > 0
    ? `Cart (${cartCount} ${cartCount === 1 ? "unit" : "units"})`
    : "Cart";
  const menu = [
    { name: "Inventory", path: "/vendor", icon: LayoutGrid },
    { name: "Orders", path: "/vendor/orders", icon: Receipt },
    { name: "Transactions", path: "/vendor/transactions", icon: Wallet },
    { name: "Profile", path: "/vendor/profile", icon: UserCircle },
    { name: "Notifications", path: "/vendor/notifications", icon: Bell, badge: unreadCount },
    { name: cartLabel, path: "/cart", icon: ShoppingCart, badge: cartCount > 0 ? cartItemCount : 0 },
  ];

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const loadNotifications = async () => {
    try {
      const countRes = await api.get("/notifications/unread-count");
      setUnreadCount(countRes.data?.count || 0);
    } catch (err) {
      console.error("Vendor notifications load failed", err);
    }
  };

  const loadCartCount = async () => {
    try {
      const res = await api.get("/cart");
      const items = res.data?.items || [];
      setCartItemCount(items.length);
      const totalUnits = items.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      );
      setCartCount(totalUnits);
    } catch (err) {
      setCartCount(0);
      setCartItemCount(0);
    }
  };

  useEffect(() => {
    loadNotifications();
    loadCartCount();
    const id = setInterval(loadNotifications, 20000);
    const cartIntervalId = setInterval(loadCartCount, 20000);

    const onFocus = () => {
      loadNotifications();
      loadCartCount();
    };

    const onCartUpdated = () => {
      loadCartCount();
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("cart-updated", onCartUpdated);

    return () => {
      clearInterval(id);
      clearInterval(cartIntervalId);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("cart-updated", onCartUpdated);
    };
  }, []);

  useEffect(() => {
    loadCartCount();
  }, [location.pathname]);

  return (
    <div className="vendor-layout">
      <aside className={`vendor-sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="vendor-sidebar-header">
          <div className="vendor-logo">
            <img src={logo} alt="logo" />
          </div>

          <button
            type="button"
            className="vendor-collapse-btn"
            onClick={() => setCollapsed((value) => !value)}
            aria-label="Toggle vendor sidebar"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="vendor-menu">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`side-link ${active ? "active" : ""}`}
              >
                <Icon size={18} />
                <span className="vendor-link-label">{item.name}</span>
                {item.badge > 0 && (
                  <span className="vendor-route-badge">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
                <span className="vendor-active-rail" />
              </button>
            );
          })}
        </nav>

        <button onClick={logout} className="side-link logout">
          <LogOut size={18} />
          <span className="vendor-link-label">Logout</span>
        </button>
      </aside>

      <div className="vendor-content">{children}</div>
    </div>
  );
}
