import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import logo from "../../assets/logo.png";
import api from "../../services/api";
import "./VendorLayout.css";

export default function VendorLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [cartItemCount, setCartItemCount] = useState(0);

  const cartLabel = cartCount > 0
    ? `Cart (${cartCount} ${cartCount === 1 ? "unit" : "units"})`
    : "Cart";

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const loadNotifications = async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        api.get("/notifications?limit=8"),
        api.get("/notifications/unread-count"),
      ]);
      setNotifications((listRes.data || []).filter((n) => !n.isRead));
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

  const markOneRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Vendor mark read failed", err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Vendor mark all read failed", err);
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
      <aside className="vendor-sidebar">
        <div className="vendor-logo">
          <img src={logo} alt="logo" />
        </div>

        <button
          onClick={() => navigate("/vendor")}
          className={`side-link ${location.pathname === "/vendor" ? "active" : ""}`}
        >
          Inventory
        </button>

        <button
          onClick={() => navigate("/vendor/orders")}
          className={`side-link ${location.pathname === "/vendor/orders" ? "active" : ""}`}
        >
          Orders
        </button>

        <button
          onClick={() => navigate("/vendor/transactions")}
          className={`side-link ${location.pathname === "/vendor/transactions" ? "active" : ""}`}
        >
          Transactions
        </button>

        <button
          onClick={() => navigate("/vendor/profile")}
          className={`side-link ${location.pathname === "/vendor/profile" ? "active" : ""}`}
        >
          Profile
        </button>

        <button
          onClick={() => navigate("/vendor/notifications")}
          className={`side-link ${location.pathname === "/vendor/notifications" ? "active" : ""}`}
        >
          Notifications
          {unreadCount > 0 && (
            <span className="vendor-route-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => navigate("/cart")}
          className={`side-link ${location.pathname === "/cart" ? "active" : ""}`}
        >
          {cartLabel}
          {cartCount > 0 && (
            <span className="vendor-route-badge">
              {cartItemCount > 99 ? "99+" : cartItemCount}
            </span>
          )}
        </button>

        <div className="vendor-notify-wrap">
          <button
            type="button"
            onClick={() => setNotifOpen((prev) => !prev)}
            className="side-link vendor-notify-btn"
          >
            <Bell size={16} />
            <span>Quick Alerts</span>
            {unreadCount > 0 && (
              <span className="vendor-notify-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="vendor-notify-panel">
              <div className="vendor-notify-head">
                <strong>Notifications</strong>
                <button type="button" onClick={markAllRead}>
                  Mark all read
                </button>
              </div>

              <div className="vendor-notify-list">
                {notifications.length === 0 ? (
                  <p className="vendor-notify-empty">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n._id}
                      type="button"
                      className={`vendor-notify-item ${n.isRead ? "read" : "unread"}`}
                      onClick={() => !n.isRead && markOneRead(n._id)}
                    >
                      <p className="vendor-notify-title">{n.title}</p>
                      <p className="vendor-notify-msg">{n.message}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button onClick={logout} className="side-link logout">
          Logout
        </button>
      </aside>

      <div className="vendor-content">{children}</div>
    </div>
  );
}
