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
      setNotifications(listRes.data || []);
      setUnreadCount(countRes.data?.count || 0);
    } catch (err) {
      console.error("Vendor notifications load failed", err);
    }
  };

  const markOneRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Vendor mark read failed", err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Vendor mark all read failed", err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const id = setInterval(loadNotifications, 20000);
    return () => clearInterval(id);
  }, []);

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
          onClick={() => navigate("/cart")}
          className={`side-link ${location.pathname === "/cart" ? "active" : ""}`}
        >
          Cart
        </button>

        <div className="vendor-notify-wrap">
          <button
            type="button"
            onClick={() => setNotifOpen((prev) => !prev)}
            className="side-link vendor-notify-btn"
          >
            <Bell size={16} />
            <span>Notifications</span>
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
