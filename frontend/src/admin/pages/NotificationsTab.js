import { useEffect, useState } from "react";
import api from "../../services/api";
import "./NotificationsTab.css";

export default function NotificationsTab() {
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
      console.error("Failed to load notifications", err);
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
      console.error("Failed to mark notification", err);
    }
  };

  const markAllRead = async () => {
    setBusyAll(true);
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications", err);
    } finally {
      setBusyAll(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-notifications-root">
        <div className="admin-notifications-loading">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="admin-notifications-root admin-panel-page">
      <section className="admin-page-hero">
        <div className="admin-page-hero-copy">
          <p className="admin-page-eyebrow">Alert center</p>
          <h1>Handle operational notifications from the same page shell as the rest of admin.</h1>
          <p>
            Review unread updates, clear your queue, and keep day-to-day admin actions moving from
            one dedicated inbox.
          </p>
        </div>

        <div className="admin-page-hero-status">
          <span>Unread items</span>
          <strong>{unreadCount}</strong>
          <p>{notifications.length} notifications are currently loaded in the admin inbox.</p>
        </div>
      </section>

      <div className="admin-notifications-header">
        <div className="admin-notifications-actions">
          <span className="admin-notifications-count">
            {unreadCount} unread
          </span>
          <button
            type="button"
            onClick={markAllRead}
            disabled={busyAll || unreadCount === 0}
            className="admin-notifications-mark-all"
          >
            {busyAll ? "Please wait..." : "Mark all read"}
          </button>
        </div>
      </div>

      <div className="admin-notifications-list">
        {notifications.length === 0 ? (
          <p className="admin-notifications-empty">No notifications yet.</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`admin-notification-card ${n.isRead ? "read" : "unread"}`}
            >
              <div className="admin-notification-main">
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
          ))
        )}
      </div>
    </div>
  );
}
