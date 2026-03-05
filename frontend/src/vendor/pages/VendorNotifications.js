import { useEffect, useState } from "react";
import api from "../../services/api";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import VendorLayout from "./VendorLayout";
import "./VendorNotifications.css";

export default function VendorNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyAll, setBusyAll] = useState(false);

  const loadNotifications = async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        api.get("/notifications?limit=50"),
        api.get("/notifications/unread-count"),
      ]);

      setNotifications(listRes.data || []);
      setUnreadCount(countRes.data?.count || 0);
    } catch (err) {
      console.error("Vendor notifications fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markOneRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Vendor mark one read failed", err);
    }
  };

  const markAllRead = async () => {
    setBusyAll(true);
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Vendor mark all read failed", err);
    } finally {
      setBusyAll(false);
    }
  };

  return (
    <VendorLayout>
      <Header title="Notifications" />
      <main className="vendor-main">
        <div className="vendor-notifications-root">
          <div className="vendor-notifications-top">
            <div className="vendor-notifications-unread">
              {unreadCount} unread
            </div>
            <button
              type="button"
              onClick={markAllRead}
              disabled={busyAll || unreadCount === 0}
              className="vendor-notifications-mark-all"
            >
              {busyAll ? "Please wait..." : "Mark all read"}
            </button>
          </div>

          {loading ? (
            <div className="vendor-notifications-empty">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="vendor-notifications-empty">No notifications yet.</div>
          ) : (
            <div className="vendor-notifications-list">
              {notifications.map((n) => (
                <div
                  key={n._id}
                  className={`vendor-notification-card ${n.isRead ? "read" : "unread"}`}
                >
                  <div>
                    <h4>{n.title}</h4>
                    <p>{n.message}</p>
                    <small>{new Date(n.createdAt).toLocaleString()}</small>
                  </div>
                  {!n.isRead && (
                    <button type="button" onClick={() => markOneRead(n._id)}>
                      Mark read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          <Footer />
        </div>
      </main>
    </VendorLayout>
  );
}