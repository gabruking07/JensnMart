import {
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function ReportsTab({ ctx }) {
  const {
    reportRange,
    setReportRange,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    analytics,
    salesChartData,
    orderStatusData,
    vendorData,
    topProductsData,
  } = ctx;

  return (
    <div className="reports-page">
      <div className="report-filters">
        <div className="range-tabs">
          {["today", "week", "month", "year"].map((r) => (
            <button
              key={r}
              className={`range-btn ${reportRange === r ? "active" : ""}`}
              onClick={() => setReportRange(r)}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
          <button
            className={`range-btn ${reportRange === "custom" ? "active" : ""}`}
            onClick={() => setReportRange("custom")}
          >
            Custom
          </button>
        </div>

        <h3>Showing: {reportRange.charAt(0).toUpperCase() + reportRange.slice(1)}</h3>

        {reportRange === "custom" && (
          <div className="custom-range">
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            <span>to</span>
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
          </div>
        )}
      </div>

      <div className="report-top-row">
        <div className="kpi-card"><p>Total Sales</p><h2>Rs {analytics.totalSales}</h2></div>
        <div className="kpi-card"><p>Orders</p><h2>{analytics.totalOrders}</h2></div>
        <div className="kpi-card"><p>Completed</p><h2>{analytics.completedCount}</h2></div>
        <div className="kpi-card"><p>Cancelled</p><h2>{analytics.cancelledCount}</h2></div>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h3>Sales Overview</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={salesChartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Order Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart width={350} height={260}>
              <Pie data={orderStatusData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={85}>
                {orderStatusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" align="center" iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Vendor Performance</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={vendorData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Top Products</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topProductsData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="qty" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
