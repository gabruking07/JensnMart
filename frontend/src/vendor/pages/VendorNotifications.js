<<<<<<< HEAD
/** Vendor notifications screen; presents the vendor workflow and uses the shared API client for persisted data. */

=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
import { useEffect, useState } from "react";
import api from "../../services/api";
import Footer from "../../components/Footer";
import VendorLayout from "./VendorLayout";
import "./VendorNotifications.css";

<<<<<<< HEAD
/** Renders the vendor notifications interface and coordinates the state and actions for this screen or reusable component. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
export default function VendorNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyAll, setBusyAll] = useState(false);

<<<<<<< HEAD
    /** Loads notification rows and unread totals for the signed-in user. */
    const loadNotifications = async () => {
=======
  const loadNotifications = async () => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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

<<<<<<< HEAD
    /** Marks one notification read on the server and updates its local read state. */
    const markOneRead = async (id) => {
=======
  const markOneRead = async (id) => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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

<<<<<<< HEAD
    /** Marks all current-user notifications read and updates the list. */
    const markAllRead = async () => {
=======
  const markAllRead = async () => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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
      <main className="vendor-main">
        <div className="vendor-notifications-root">
          <section className="vendor-notifications-hero">
            <div className="vendor-notifications-copy">
              <p className="vendor-notifications-eyebrow">Alerts and updates</p>
              <h1>Keep track of orders, payments and platform activity.</h1>
              <p className="vendor-notifications-subtext">
                Review unread updates, clear your queue, and stay on top of changes that affect your vendor workflow.
              </p>
            </div>

            <div className="vendor-notifications-summary">
              <span>Notification status</span>
              <strong>{unreadCount > 0 ? "Active" : "Clear"}</strong>
              <p>
                {unreadCount > 0
                  ? `${unreadCount} unread updates need your attention right now.`
                  : "Your notification queue is clear for now."}
              </p>

              <div className="vendor-notifications-stats-grid">
                <div className="vendor-notifications-stat">
                  <span>Unread</span>
                  <strong>{unreadCount}</strong>
                </div>
                <div className="vendor-notifications-stat">
                  <span>Total</span>
                  <strong>{notifications.length}</strong>
                </div>
              </div>
            </div>
          </section>

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
                  {n.meta?.productImage && (
                    <div className="vendor-notification-thumb">
                      <img
                        src={`http://localhost:5000/uploads/${n.meta.productImage}`}
                        alt={n.meta?.productName || n.title}
                      />
                    </div>
                  )}
                  <div className="vendor-notification-content">
                    <span className="vendor-notification-tag">
                      {n.type || "system"}
                    </span>
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
