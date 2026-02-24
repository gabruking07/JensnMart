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
  Legend
} from "recharts";
import "../admin.css";

const COLORS = ["#6366f1", "#22c55e", "#ef4444"];

function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay(); // 0-6
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // ISO week start (Mon)
  const res = new Date(date.setDate(diff));
  res.setHours(0, 0, 0, 0);
  return res;
}
function endOfWeek(d) {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(s.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}
function startOfMonth(d) {
  const res = new Date(d.getFullYear(), d.getMonth(), 1);
  res.setHours(0, 0, 0, 0);
  return res;
}
function endOfMonth(d) {
  const res = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  res.setHours(23, 59, 59, 999);
  return res;
}
function startOfYear(d) {
  const res = new Date(d.getFullYear(), 0, 1);
  res.setHours(0, 0, 0, 0);
  return res;
}
function endOfYear(d) {
  const res = new Date(d.getFullYear(), 11, 31);
  res.setHours(23, 59, 59, 999);
  return res;
}

export default function ReportsTab() {
  const [orders, setOrders] = useState([]);
  const [rangeType, setRangeType] = useState("month"); // week | month | year | custom
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

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

  // ----------- Compute active range -----------
  const now = new Date();
  const { start, end } = useMemo(() => {
    if (rangeType === "week") {
      return { start: startOfWeek(now), end: endOfWeek(now) };
    }
    if (rangeType === "month") {
      return { start: startOfMonth(now), end: endOfMonth(now) };
    }
    if (rangeType === "year") {
      return { start: startOfYear(now), end: endOfYear(now) };
    }
    if (rangeType === "custom" && customStart && customEnd) {
      const s = new Date(customStart);
      const e = new Date(customEnd);
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    // default month
    return { start: startOfMonth(now), end: endOfMonth(now) };
  }, [rangeType, customStart, customEnd]);

  // ----------- Filtered orders -----------
  const filtered = useMemo(() => {
    return orders.filter(o => {
      const t = new Date(o.createdAt).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
  }, [orders, start, end]);

  // ----------- KPIs -----------
  const totalRevenue = useMemo(
    () => filtered.reduce((sum, o) => sum + (o.total || 0), 0),
    [filtered]
  );
  const totalOrders = filtered.length;
  const totalCommission = useMemo(
    () => filtered.reduce((sum, o) => sum + (o.adminCommission || 0), 0),
    [filtered]
  );

  // ----------- Status donut -----------
  const statusData = useMemo(() => {
    const placed = filtered.filter(o => o.status === "Placed").length;
    const completed = filtered.filter(o => o.status === "Completed").length;
    const cancelled = filtered.filter(o => o.status === "Cancelled").length;
    return [
      { name: "Processing", value: placed },
      { name: "Completed", value: completed },
      { name: "Cancelled", value: cancelled }
    ];
  }, [filtered]);

  // ----------- Revenue by day (or month if year view) -----------
  const revenueData = useMemo(() => {
    const map = {};
    filtered.forEach(o => {
      const d = new Date(o.createdAt);
      const key =
        rangeType === "year"
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
          : d.toLocaleDateString();
      map[key] = (map[key] || 0) + (o.total || 0);
    });
    return Object.entries(map).map(([date, total]) => ({ date, total }));
  }, [filtered, rangeType]);

  // ----------- Top 5 vendors -----------
  const topVendors = useMemo(() => {
    const map = {};
    filtered.forEach(o => {
      const name = o.vendor?.email || o.vendor?.name || "Unknown";
      map[name] = (map[name] || 0) + (o.total || 0);
    });
    return Object.entries(map)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filtered]);

  // ----------- Top 5 products -----------
  const topProducts = useMemo(() => {
    const map = {};
    filtered.forEach(o => {
      (o.products || []).forEach(p => {
        const key = p.productId || p.name;
        const label = p.name;
        map[key] = map[key] || { name: label, qty: 0, revenue: 0 };
        map[key].qty += p.qty || 0;
        map[key].revenue += (p.price || 0) * (p.qty || 0);
      });
    });
    return Object.values(map)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [filtered]);

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1>Reports & Analytics</h1>

        {/* FILTER BAR */}
        <div className="filters">
          <div className="pill-group">
            {["week", "month", "year", "custom"].map(t => (
              <button
                key={t}
                className={`pill ${rangeType === t ? "active" : ""}`}
                onClick={() => setRangeType(t)}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {rangeType === "custom" && (
            <div className="custom-range">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
              />
              <span>to</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="reports-stats">
        <div className="report-card">
          <span>Revenue</span>
          <h2>₹{totalRevenue}</h2>
        </div>
        <div className="report-card">
          <span>Orders</span>
          <h2>{totalOrders}</h2>
        </div>
        <div className="report-card">
          <span>Commission</span>
          <h2>₹{totalCommission}</h2>
        </div>
      </div>

      {/* CHARTS */}
      <div className="charts-row">
        <div className="chart-card">
          <h3>Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#6366f1"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Order Status</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                outerRadius={110}
                label
              >
                {statusData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* LISTS */}
      <div className="lists-row">
        <div className="list-card">
          <h3>Top 5 Vendors</h3>
          {topVendors.map((v, i) => (
            <div key={i} className="list-row">
              <span>{v.name}</span>
              <strong>₹{v.total}</strong>
            </div>
          ))}
          {topVendors.length === 0 && <p className="muted">No data</p>}
        </div>

        <div className="list-card">
          <h3>Top 5 Products</h3>
          {topProducts.map((p, i) => (
            <div key={i} className="list-row">
              <span>{p.name}</span>
              <strong>{p.qty} pcs</strong>
            </div>
          ))}
          {topProducts.length === 0 && <p className="muted">No data</p>}
        </div>
      </div>
    </div>
  );
}