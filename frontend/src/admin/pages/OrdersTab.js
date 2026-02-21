import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import "../admin.css";

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [commission, setCommission] = useState(0);

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("all");

  const loadOrders = async () => {
    try {
      const res = await api.get("/orders/admin");
      setOrders(res.data || []);
    } catch {
      toast.error("Failed to load orders");
    }
  };

  const loadCommission = async () => {
    try {
      const res = await api.get("/orders/commission");
      setCommission(res.data?.total || 0);
    } catch {}
  };

  useEffect(() => {
    loadOrders();
    loadCommission();
  }, []);

  /* ================= UPDATE STATUS ================= */
  const updateStatus = async (id, status) => {
    try {
      await api.put(`/orders/status/${id}`, { status });
      toast.success("Status updated");
      loadOrders();
      loadCommission();
    } catch {
      toast.error("Update failed");
    }
  };

  /* ================= FILTERS ================= */
  const vendors = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => {
      if (o.vendor?._id) map.set(o.vendor._id, o.vendor.email);
    });
    return Array.from(map.entries()).map(([id, email]) => ({ id, email }));
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;

      if (
        search &&
        !String(o.orderNumber || "")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
        return false;

      if (vendorFilter !== "all" && o.vendor?._id !== vendorFilter)
        return false;

      return true;
    });
  }, [orders, statusFilter, search, vendorFilter]);

  const stats = useMemo(() => {
    const processing = orders.filter((o) => o.status === "Placed").length;
    const completed = orders.filter((o) => o.status === "Completed").length;
    const cancelled = orders.filter((o) => o.status === "Cancelled").length;
    return { processing, completed, cancelled };
  }, [orders]);

  return (
    <div>
      <h1>Orders</h1>

      {/* SUMMARY */}
      <div className="stats-row">
        <div className="stat-card">
          <span>Processing</span>
          <h3>{stats.processing}</h3>
        </div>

        <div className="stat-card">
          <span>Completed</span>
          <h3>{stats.completed}</h3>
        </div>

        <div className="stat-card">
          <span>Cancelled</span>
          <h3>{stats.cancelled}</h3>
        </div>

        <div className="stat-card">
          <span>Commission</span>
          <h3>₹{commission}</h3>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="Placed">Processing</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <input
          placeholder="Search Order #"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={vendorFilter}
          onChange={(e) => setVendorFilter(e.target.value)}
        >
          <option value="all">All Vendors</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.email}
            </option>
          ))}
        </select>

        <button
          className="reset-btn"
          onClick={() => {
            setStatusFilter("all");
            setSearch("");
            setVendorFilter("all");
          }}
        >
          Reset
        </button>
      </div>

      {/* ORDERS LIST */}
      <div className="orders-list">
        {filtered.map((o) => (
          <div key={o._id} className="order-card">
            <div className="order-header">
              <span>Order #{o.orderNumber}</span>
              <span>{o.vendor?.email}</span>

              <select
                value={o.status}
                onChange={(e) =>
                  updateStatus(o._id, e.target.value)
                }
              >
                <option value="Placed">Processing</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* PRODUCTS */}
            <div className="order-products">
              {o.products?.map((p, i) => (
                <div key={i} className="order-item">
                  {p.image && (
                    <img
                      src={`http://localhost:5000/uploads/${p.image}`}
                      alt=""
                    />
                  )}

                  <div>
                    <strong>{p.name}</strong>
                    <div>
                      Qty: {p.qty} | ₹{p.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-footer">
              Total: ₹{o.total}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}