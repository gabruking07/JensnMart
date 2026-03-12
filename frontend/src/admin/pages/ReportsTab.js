import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  LabelList
} from "recharts";

import "../admin.css";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6"];

const BAR_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ffe731"
];

export default function ReportsTab() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/orders/admin");
        setOrders(res.data || []);
      } catch {
        toast.error("Failed to load reports");
      }
    })();
  }, []);

  /* ---------------- KPI ---------------- */

  const startOfDay = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };

  const todayRevenue = useMemo(() => {
    const today = startOfDay(new Date());

    return orders
      .filter(o => startOfDay(o.createdAt).getTime() === today.getTime())
      .reduce((s, o) => s + (o.total || 0), 0);
  }, [orders]);

  const yesterdayRevenue = useMemo(() => {
    const y = startOfDay(new Date());
    y.setDate(y.getDate() - 1);

    return orders
      .filter(o => startOfDay(o.createdAt).getTime() === y.getTime())
      .reduce((s, o) => s + (o.total || 0), 0);
  }, [orders]);

  const change = yesterdayRevenue === 0
    ? 0
    : (((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(1);

  const totalRevenueAllTime = useMemo(() => {
    return orders.reduce((s, o) => s + (o.total || 0), 0);
  }, [orders]);

  const totalVendors = useMemo(() => {
    const set = new Set(
      orders.map(o => o.vendor?._id || o.vendor?.email)
    );
    return set.size;
  }, [orders]);

  /* ---------------- PIE STATUS (4 ONLY) ---------------- */

  const statusData = useMemo(() => {
    const placed = orders.filter(o => o.status === "Placed").length;
    const processing = orders.filter(o => o.status === "Processing").length;
    const shipped = orders.filter(o => o.status === "Shipped").length;
    const delivered = orders.filter(o => o.status === "Delivered").length;

    return [
      { name: "Placed", value: placed },
      { name: "Processing", value: processing },
      { name: "Shipped", value: shipped },
      { name: "Delivered", value: delivered }
    ];
  }, [orders]);

  /* ---------------- LINE CHART ---------------- */

  const revenueData = useMemo(() => {
    const map = {};

    orders.forEach(o => {
      const d = new Date(o.createdAt);
      const key = d.toLocaleString("default", {
        month: "short",
        year: "numeric"
      });

      map[key] = (map[key] || 0) + (o.total || 0);
    });

    return Object.entries(map).map(([date, total]) => ({
      date,
      total
    }));
  }, [orders]);

  /* ---------------- TOP PRODUCTS ---------------- */

  const topProducts = useMemo(() => {
    const map = {};

    orders.forEach(o => {
      (o.products || []).forEach(p => {
        const key = p.productId?._id || p.name;

        if (!map[key]) {
          map[key] = {
            name: p.name,
            qty: 0,
            image: p.image,
            category: p.productId?.category || "General"
          };
        }

        map[key].qty += p.qty || 0;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [orders]);

  // ---------- THIS MONTH SALES ----------
  const thisMonthSales = useMemo(() => {
    const now = new Date();

    return orders
      .filter(o => {
        const d = new Date(o.createdAt);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders]);

  // ---------- TOTAL ORDERS ----------
  const totalOrdersPlaced = orders.length;

  // ---------- TOP SELLING PRODUCT ----------
  const topProduct = topProducts?.[0]?.name || "-";

  // ---------- TOP VENDORS BY REVENUE ----------
  const topVendors = useMemo(() => {
    const map = {};

    orders.forEach((o) => {
      const key = o.vendor?._id || o.vendor?.email || "unknown";
      const label = o.vendor?.email || "Unknown vendor";

      if (!map[key]) {
        map[key] = { name: label, revenue: 0, orders: 0 };
      }

      map[key].revenue += Number(o.total || 0);
      map[key].orders += 1;
    });

    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders]);

  const maxVendorRevenue = topVendors[0]?.revenue || 1;

  return (
    <div className="reports-page admin-panel-page">
      <section className="admin-page-hero">
        <div className="admin-page-hero-copy">
          <p className="admin-page-eyebrow">Reporting hub</p>
          <h1>See revenue, order trends, and vendor performance from a stronger analytics header.</h1>
          <p>
            This reporting view now opens with the same hero treatment as the other admin pages,
            while keeping the dashboards and charts below intact.
          </p>
        </div>

        <div className="admin-page-hero-status">
          <span>Total revenue</span>
          <strong>Rs {totalRevenueAllTime.toLocaleString()}</strong>
          <p>{totalOrdersPlaced} orders from {totalVendors} vendors are included in this report set.</p>
        </div>
      </section>

      {/* KPI */}
      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-title">Today's Revenue</div>
          <div className="kpi-value">₹ {todayRevenue.toLocaleString()}</div>
          <div className={`kpi-change ${change >= 0 ? "up" : "down"}`}>
            {change >= 0 ? "▲" : "▼"} {Math.abs(change)}% from yesterday
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Yesterday's Revenue</div>
          <div className="kpi-value">₹ {yesterdayRevenue.toLocaleString()}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Total Vendors</div>
          <div className="kpi-value">{totalVendors}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Revenue (Total)</div>
          <div className="kpi-value">
            ₹{totalRevenueAllTime.toLocaleString()}
          </div>
        </div>
      </div>

      {/* CHART ROW */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="card-title">Monthly Sales</div>

          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenueData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid stroke="#9d9d9d" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={true}
                tickLine={false}
                tick={{ fill: '#000000', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={true}
                tickLine={false}
                tick={{ fill: '#000000', fontSize: 12 }}
                tickFormatter={(value) => `₹${value >= 1000000 ? (value / 1000000).toFixed(1) + 'M' : value.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#10b981"
                strokeWidth={4}
                dot={{ r: 6, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="card-title">Order Status</div>

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
                {/* LabelList for Pie Chart */}
                <LabelList
                  dataKey="value"
                  position="outside"
                  offset={15}
                  style={{ fill: '#4b5563', fontSize: '14px', fontWeight: 'bold' }}
                />
                {statusData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="bottom" align="center" iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="card-title">Top Selling Products</div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              layout="vertical"
              data={topProducts}
              margin={{ top: 5, right: 40, left: 40, bottom: 5 }} // Increased right margin so numbers don't cut off
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 500 }}
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="qty" barSize={20} radius={[0, 10, 10, 0]}>
                {/* This displays the quantity number at the end of each bar */}
                <LabelList dataKey="qty" position="right" style={{ fill: '#4b5563', fontSize: 12, fontWeight: 'bold' }} />
                {topProducts.map((entry, index) => (
                  <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ================= BOTTOM ROW ================= */}
        <div className="bottom-row">

          {/* ---------- TOP PRODUCTS TABLE ---------- */}
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
                {topProducts.map((p, i) => (
                  <tr key={i}>
                    <td>
                      <img
                        src={`http://localhost:5000/uploads/${p.image}`}
                        alt=""
                      />
                    </td>

                    <td>{p.name}</td>
                    <td>{p.category?.name}</td>

                    <td className="bold">{p.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ---------- SUMMARY PANEL ---------- */}
          <div className="card summary-card">
            <h3>Summary</h3>
            <p className="sub">
              Summary of key metrics for the current month
            </p>

            {/* SALES */}
            <div className="summary-item">
              <span className="icon green">💰</span>
              <div>
                <b>Total Sales this Month</b>
                <p>₹{thisMonthSales.toLocaleString()}</p>
              </div>
            </div>

            {/* ORDERS */}
            <div className="summary-item">
              <span className="icon blue">📦</span>
              <div>
                <b>Total Orders Placed</b>
                <p>{totalOrdersPlaced} orders</p>
              </div>
            </div>

            {/* TOP PRODUCT */}
            <div className="summary-item">
              <span className="icon orange">🏆</span>
              <div>
                <b>Top Selling Product</b>
                <p>{topProduct}</p>
              </div>
            </div>

            {/* TOTAL VENDORS */}
            <div className="summary-item">
              <span className="icon purple">🏪</span>
              <div>
                <b>Total Vendors</b>
                <p>{totalVendors}</p>
              </div>
            </div>
          </div>

          <div className="card recent-card">
            <h3>Top Vendors by Revenue</h3>

            {topVendors.length === 0 ? (
              <p className="sub">No vendor sales data yet.</p>
            ) : (
              topVendors.map((v, idx) => (
                <div key={`${v.name}-${idx}`} className="recent-row vendor-rank-row">
                  <div className="vendor-rank-left">
                    <span className="rank-badge">{idx + 1}</span>
                    <div className="vendor-meta">
                      <b>{v.name}</b>
                      <p>{v.orders} orders</p>
                      <div className="vendor-progress">
                        <span
                          className="vendor-progress-fill"
                          style={{ width: `${Math.max(8, (v.revenue / maxVendorRevenue) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <span className="status delivered revenue-chip">
                    Rs {v.revenue.toLocaleString()}
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

