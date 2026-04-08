import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
    UserCircle,
    Package,
    PlusCircle,
    FolderTree,
    ShoppingCart,
    CreditCard,
    Bell,
    MessageSquareText,
    Store,
    Users,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    LogOut
} from "lucide-react";
import logo from "../assets/logo.png";
import "./AdminLayout.css";

export default function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

    const role = localStorage.getItem("role");

    const menu = [
        {
            name: "Reports",
            path: "/admin/reports",
            icon: BarChart3,
            roles: ["admin", "manager"]
        },
        {
            name: "Inventory",
            path: "/admin/inventory",
            icon: Package,
            roles: ["admin", "manager"]
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
            icon: ShoppingCart,
            roles: ["admin", "manager"]
        },
        {
            name: "Payments",
            path: "/admin/payments",
            icon: CreditCard,
            roles: ["admin"] // ADMIN ONLY
        },
        {
            name: "Notifications",
            path: "/admin/notifications",
            icon: Bell,
            roles: ["admin", "manager"]
        },
        {
            name: "Contact Messages",
            path: "/admin/contact-messages",
            icon: MessageSquareText,
            roles: ["admin", "manager"]
        },
        {
            name: "Profile",
            path: "/admin/profile",
            icon: UserCircle,
            roles: ["admin", "manager"]
        },
    ];

    const logout = () => {
        localStorage.clear();
        navigate("/");
    };

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
