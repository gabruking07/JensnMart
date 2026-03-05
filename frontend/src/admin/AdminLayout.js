import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
    UserCircle,
    Package,
    PlusCircle,
    FolderTree,
    Receipt,
    Store,
    Users,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    Bell,
    LogOut
} from "lucide-react";
import logo from "../assets/logo.png";
import api from "../services/api";
import "./AdminLayout.css";

export default function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const role = localStorage.getItem("role");

    const menu = [
        {
            name: "Profile",
            path: "/admin/profile",
            icon: UserCircle,
            roles: ["admin", "manager"]
        },
        {
            name: "Inventory",
            path: "/admin/inventory",
            icon: Package,
            roles: ["admin", "manager"]
        },
        {
            name: "Admins",
            path: "/admin/admins",
            icon: Users,
            roles: ["admin"] // ADMIN ONLY
        },
        {
            name: "Vendors",
            path: "/admin/vendors",
            icon: Store,
            roles: ["admin"] // ADMIN ONLY
        },
        {
            name: "Orders",
            path: "/admin/orders",
            icon: Receipt,
            roles: ["admin", "manager"]
        },
        {
            name: "Payments",
            path: "/admin/payments",
            icon: Receipt,
            roles: ["admin"]   // ADMIN ONLY
        },
        {
            name: "Add Product",
            path: "/admin/add-product",
            icon: PlusCircle,
            roles: ["admin", "manager"]
        },
        {
            name: "Categories",
            path: "/admin/categories",
            icon: FolderTree,
            roles: ["admin", "manager"]
        },
        {
            name: "Reports",
            path: "/admin/reports",
            icon: BarChart3,
            roles: ["admin", "manager"]
        }
    ];

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
            console.error("Load notifications failed", err);
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
            console.error("Mark read failed", err);
        }
    };

    const markAllRead = async () => {
        try {
            await api.put("/notifications/read-all");
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Mark all read failed", err);
        }
    };

    useEffect(() => {
        loadNotifications();
        const id = setInterval(loadNotifications, 20000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="admin-root">
            {/* SIDEBAR */}
            <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
                <div className="sidebar-header">
                    <div className="brand">
                        <img src={logo} alt="JensnMart" className="logo-img" />
                    </div>

                    <button
                        className="collapse-btn"
                        onClick={() => setCollapsed((v) => !v)}
                        aria-label="Toggle sidebar"
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                <nav className="menu">
                    {menu
                        .filter(item => item.roles.includes(role))
                        .map((m) => {
                            const Icon = m.icon;
                            const active = location.pathname === m.path;

                            return (
                                <Link
                                    key={m.path}
                                    to={m.path}
                                    className={`menu-item ${active ? "active" : ""}`}
                                >
                                    <Icon size={18} />
                                    <span className="label">{m.name}</span>
                                    <span className="active-rail" />
                                </Link>
                            );
                        })}
                </nav>

                <div className="sidebar-bottom">
                    <div className="notification-wrap">
                        <button
                            type="button"
                            className="notify-btn"
                            onClick={() => setNotifOpen((prev) => !prev)}
                        >
                            <Bell size={16} />
                            <span className="label">Notifications</span>
                            {unreadCount > 0 && (
                                <span className="notify-badge">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}
                        </button>

                        {notifOpen && (
                            <div className="notify-panel">
                                <div className="notify-head">
                                    <strong>Notifications</strong>
                                    <button type="button" onClick={markAllRead}>
                                        Mark all read
                                    </button>
                                </div>

                                <div className="notify-list">
                                    {notifications.length === 0 ? (
                                        <p className="notify-empty">No notifications</p>
                                    ) : (
                                        notifications.map((n) => (
                                            <button
                                                key={n._id}
                                                type="button"
                                                className={`notify-item ${n.isRead ? "read" : "unread"}`}
                                                onClick={() => !n.isRead && markOneRead(n._id)}
                                            >
                                                <p className="notify-title">{n.title}</p>
                                                <p className="notify-msg">{n.message}</p>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <button className="logout-btn" onClick={logout}>
                        <LogOut size={16} />
                        <span className="label">Logout</span>
                    </button>
                </div>
            </aside>

            {/* CONTENT */}
            <main className="content">
                <Outlet />
            </main>
        </div>
    );
}
