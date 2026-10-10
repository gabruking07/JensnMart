/** Administrator reports tab screen; loads and updates the corresponding marketplace records through the shared API client. */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  Boxes,
  Coins,
  PackageSearch,
  Package,
  ShieldPlus,
  ShoppingBag,
  Users
} from "lucide-react";

import api from "../../services/api";
import "../admin.css";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6"];
const REVENUE_STATUSES = new Set(["Delivered", "Completed"]);
const PENDING_TRANSACTION_STATUSES = new Set(["Placed", "Processing", "Shipped"]);

const BAR_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ffe731"
];

/** Renders the reports tab interface and coordinates the state and actions for this screen or reusable component. */
export default function ReportsTab() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [ordersRes, productsRes, categoriesRes] = await Promise.all([
          api.get("/orders/admin"),
          api.get("/products"),
          api.get("/categories")
        ]);

        setOrders(ordersRes.data || []);
        setProducts(productsRes.data || []);
        setCategories(categoriesRes.data || []);
      } catch (error) {
        toast.error("Failed to load reports");
      }
    })();
  }, []);

  const totalCustomers = useMemo(() => {
    const ids = new Set(
      orders
        .map((order) => order.vendor?._id || order.vendor?.email)
        .filter(Boolean)
    );

    return ids.size;
  }, [orders]);

  const totalOrdersPlaced = orders.length;

  const statsCards = [
    {
      title: "Total Categories",
      value: categories.length,
      icon: Boxes,
      accentClass: "green"
    },
    {
      title: "Total Products",
      value: products.length,
      icon: Package,
      accentClass: "blue"
    },
    {
      title: "Total Customers",
      value: totalCustomers,
      icon: Users,
      accentClass: "yellow"
    },
    {
      title: "Total Orders",
      value: totalOrdersPlaced,
      icon: ShoppingBag,
      accentClass: "cyan"
    }
  ];

  const shortcutCards = [
    {
      title: "Add Category",
      path: "/admin/categories",
      icon: Boxes,
      accentClass: "green"
    },
    {
      title: "Add Product",
      path: "/admin/add-product",
      icon: Package,
      accentClass: "blue"
    },
    {
      title: "Add Customers",
      path: "/admin/admins",
      icon: ShieldPlus,
      accentClass: "yellow"
    },
    {
      title: "Orders",
      path: "/admin/orders",
      icon: ShoppingBag,
      accentClass: "cyan"
    }
  ];

  const statusData = useMemo(() => {
    const placed = orders.filter((order) => order.status === "Placed").length;
    const processing = orders.filter((order) => order.status === "Processing").length;
    const shipped = orders.filter((order) => order.status === "Shipped").length;
    const delivered = orders.filter((order) => order.status === "Delivered").length;

    return [
      { name: "Placed", value: placed },
      { name: "Processing", value: processing },
      { name: "Shipped", value: shipped },
      { name: "Delivered", value: delivered }
    ];
  }, [orders]);

  const revenueData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const totalsByMonth = Array.from({ length: 12 }, (_, index) => ({
      date: monthLabels[index],
      total: 0
    }));

    orders.forEach((order) => {
      if (!REVENUE_STATUSES.has(order.status)) {
        return;
      }

      const date = new Date(order.createdAt);
      if (date.getFullYear() !== year) {
        return;
      }

      totalsByMonth[date.getMonth()].total += Number(order.total || 0);
    });

    return totalsByMonth;
  }, [orders]);

  const topProducts = useMemo(() => {
    const productsMap = {};

    orders.forEach((order) => {
      (order.products || []).forEach((product) => {
        const key = product.productId?._id || product.name;

        if (!productsMap[key]) {
          productsMap[key] = {
            name: product.name,
            qty: 0,
            image: product.image,
            category: product.productId?.category || "General"
          };
        }

        productsMap[key].qty += Number(product.qty || 0);
      });
    });

    return Object.values(productsMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [orders]);

  const thisMonthSales = useMemo(() => {
    const now = new Date();

    return orders
      .filter((order) => {
        if (!REVENUE_STATUSES.has(order.status)) {
          return false;
        }

        const date = new Date(order.createdAt);
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
  }, [orders]);

  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, order) => {
      if (!REVENUE_STATUSES.has(order.status)) {
        return sum;
      }

      return sum + Number(order.total || 0);
    }, 0);
  }, [orders]);

  const totalStatusOrders = useMemo(() => {
    return statusData.reduce((sum, entry) => sum + Number(entry.value || 0), 0);
  }, [statusData]);

  const pendingTransactions = useMemo(() => {
    return orders.filter((order) => PENDING_TRANSACTION_STATUSES.has(order.status)).length;
  }, [orders]);

  const topProduct = topProducts[0]?.name || "-";

  const topVendors = useMemo(() => {
    const vendorsMap = {};

    orders.forEach((order) => {
      const key = order.vendor?._id || order.vendor?.email || "unknown";
      const label = order.vendor?.email || "Unknown vendor";

      if (!vendorsMap[key]) {
        vendorsMap[key] = { name: label, orders: 0 };
      }

      vendorsMap[key].orders += 1;
    });

    return Object.values(vendorsMap)
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5);
  }, [orders]);

  const maxVendorOrders = topVendors[0]?.orders || 1;

  return (
    <div className="reports-page admin-panel-page">
      <section className="admin-page-hero reports-page-hero">
        <div className="admin-page-hero-copy">
          <p className="admin-page-eyebrow">Reporting hub</p>
          <h1>Track orders, products, customers, and sales in one place.</h1>
          <p>
            A quick overview of your admin performance and order activity.
          </p>
        </div>

        <Link to="/admin/payments" className="reports-hero-revenue-card">
          <span className="reports-hero-revenue-label">Total Revenue</span>
          <strong>Rs {totalRevenue.toLocaleString()}</strong>
          <div className="reports-hero-revenue-stats">
            <div>
              <span>Total Transaction</span>
              <b>{totalOrdersPlaced}</b>
            </div>
            <div>
              <span>Pending Transaction</span>
              <b>{pendingTransactions}</b>
            </div>
          </div>
          <div className="reports-hero-revenue-icon">
            <Coins size={26} strokeWidth={2} />
          </div>
        </Link>
      </section>

      <div className="reports-stat-grid">
        {statsCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.title}
              className={`reports-stat-card ${card.accentClass}`}
            >
              <div className="reports-stat-copy">
                <span>{card.title}</span>
                <strong>{card.value}</strong>
              </div>

              <div className="reports-stat-icon">
                <Icon size={24} strokeWidth={2.1} />
              </div>
            </article>
          );
        })}
      </div>

      <div className="reports-action-grid">
        {shortcutCards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.title}
              to={card.path}
              className={`reports-action-card ${card.accentClass}`}
            >
              <span>{card.title}</span>
              <div className="reports-action-icon">
                <Icon size={22} strokeWidth={2} />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="charts-row">
        <div className="chart-card reports-sales-card">
          <div className="reports-dark-card-head">
            <div className="card-title">Order Overview</div>

            <Link to="/admin/orders" className="reports-dark-card-btn">
              View All
            </Link>
          </div>

          <div className="reports-chart-shell">
            <div className="reports-sales-legend">
              <span className="reports-sales-legend-dot" />
              <span>Sales</span>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData} margin={{ top: 28, right: 8, left: -20, bottom: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  contentStyle={{
                    borderRadius: "10px",
                    border: "none",
                    background: "#232327",
                    color: "#ffffff",
                    boxShadow: "0 18px 36px rgba(0, 0, 0, 0.25)"
                  }}
                  formatter={(value) => [`Rs ${Number(value).toLocaleString()}`, "Sales"]}
                />
                <Bar
                  dataKey="total"
                  fill="url(#reportsSalesGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={64}
                >
                  <LabelList
                    dataKey="total"
                    position="top"
                    offset={8}
                    formatter={(value) =>
                      Number(value) > 0 ? `Rs ${Number(value).toLocaleString()}` : ""
                    }
                    style={{ fill: "#6d28d9", fontSize: 12, fontWeight: 700 }}
                  />
                </Bar>
                <defs>
                  <linearGradient id="reportsSalesGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#9f5cff" />
                    <stop offset="100%" stopColor="#6d28d9" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card reports-status-card">
          <div className="card-title">Order Status</div>

          <div className="reports-chart-shell reports-status-chart-shell">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  stroke="none"
                >
                  <LabelList
                    dataKey="value"
                    position="outside"
                    offset={15}
                    style={{ fill: "#4b5563", fontSize: "14px", fontWeight: "bold" }}
                  />
                  {statusData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="reports-status-center-label" aria-hidden="true">
              <strong>{totalStatusOrders}</strong>
              <span>Orders</span>
            </div>
          </div>

          <div className="reports-status-legend">
            {statusData.map((entry, index) => (
              <div key={entry.name} className="reports-status-legend-item">
                <span
                  className="reports-status-legend-dot"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bottom-row">
          <div className="card table-card">
            <h3>Top Products</h3>
            <p className="sub">Products having most sales</p>

            <table className="products-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Total Sold</th>
                </tr>
              </thead>

              <tbody>
                {topProducts.map((product, index) => (
                  <tr key={`${product.name}-${index}`}>
                    <td>
                      <img
                        src={`http://localhost:5000/uploads/${product.image}`}
                        alt=""
                      />
                    </td>
                    <td>{product.name}</td>
                    <td>{product.category?.name || product.category || "-"}</td>
                    <td className="bold">{product.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card summary-card">
            <h3>Summary</h3>
            <p className="sub">Summary of key metrics for the current month</p>

            <div className="summary-item">
              <span className="icon green">
                <Coins size={18} strokeWidth={2} />
              </span>
              <div>
                <b>Total Sales this Month</b>
                <p>Rs {thisMonthSales.toLocaleString()}</p>
              </div>
            </div>

            <div className="summary-item">
              <span className="icon blue">
                <ShoppingBag size={18} strokeWidth={2} />
              </span>
              <div>
                <b>Total Orders Placed</b>
                <p>{totalOrdersPlaced} orders</p>
              </div>
            </div>

            <div className="summary-item">
              <span className="icon orange">
                <PackageSearch size={18} strokeWidth={2} />
              </span>
              <div>
                <b>Top Selling Product</b>
                <p>{topProduct}</p>
              </div>
            </div>

            <div className="summary-item">
              <span className="icon purple">
                <Users size={18} strokeWidth={2} />
              </span>
              <div>
                <b>Total Customers</b>
                <p>{totalCustomers}</p>
              </div>
            </div>
          </div>

          <div className="card recent-card">
            <h3>Top Customers by Orders</h3>

            {topVendors.length === 0 ? (
              <p className="sub">No customer order data yet.</p>
            ) : (
              topVendors.map((vendor, index) => (
                <div key={`${vendor.name}-${index}`} className="recent-row vendor-rank-row">
                  <div className="vendor-rank-left">
                    <span className="rank-badge">{index + 1}</span>
                    <div className="vendor-meta">
                      <b>{vendor.name}</b>
                      <p>{vendor.orders} orders</p>
                      <div className="vendor-progress">
                        <span
                          className="vendor-progress-fill"
                          style={{ width: `${Math.max(8, (vendor.orders / maxVendorOrders) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <span className="status delivered revenue-chip">
                    {vendor.orders} orders
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
