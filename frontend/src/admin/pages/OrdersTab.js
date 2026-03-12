import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import OrderTimeline from "../../components/OrderTimeline";
import "../admin.css";

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [commission, setCommission] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [expandedOrders, setExpandedOrders] = useState({});

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

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
        !String(o.orderNumber || "").toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (vendorFilter !== "all" && o.vendor?._id !== vendorFilter) return false;
      return true;
    });
  }, [orders, statusFilter, search, vendorFilter]);

  // Pagination Math
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, search, vendorFilter, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const stats = useMemo(() => {
    return {
      placed: orders.filter((o) => o.status === "Placed").length,
      processing: orders.filter((o) => o.status === "Processing").length,
      shipped: orders.filter((o) => o.status === "Shipped").length,
      delivered: orders.filter((o) => o.status === "Delivered").length,
      returned: orders.filter((o) => o.status === "Returned").length,
      cancelled: orders.filter((o) => o.status === "Cancelled").length,
    };
  }, [orders]);

  const toggleOrderProducts = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  return (
    <div className="admin-container admin-panel-page">
      <section className="admin-page-hero">
        <div className="admin-page-hero-copy">
          <p className="admin-page-eyebrow">Order oversight</p>
          <h1>Track vendor orders and fulfillment from a unified admin command view.</h1>
          <p>
            Review live order volume, filter by vendor or status, and update
            fulfillment without losing the big-picture view.
          </p>
        </div>

        <div className="admin-page-hero-status">
          <span>Orders in view</span>
          <strong>{filtered.length}</strong>
          <p>{orders.length} total orders are loaded, with commission at Rs {commission}.</p>
        </div>
      </section>

      <div className="stats-row">
        {["Placed", "Processing", "Shipped", "Delivered", "Returned", "Cancelled"].map((s) => (
          <div className="stat-card" key={s}>
            <span>{s}</span>
            <h3>{stats[s.toLowerCase()]}</h3>
          </div>
        ))}
        <div className="stat-card highlight">
          <span>Commission</span>
          <h3>Rs {commission}</h3>
        </div>
      </div>

      <div className="filter-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="Placed">Placed</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
        </select>

        <input placeholder="Search Order #" value={search} onChange={(e) => setSearch(e.target.value)} />

        <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)}>
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

      <div className="orders-page-toolbar">
        <div className="orders-page-size">
          <label htmlFor="orders-page-size">Items per page</label>
          <select
            id="orders-page-size"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value={4}>4</option>
            <option value={6}>6</option>
            <option value={8}>8</option>
            <option value={12}>12</option>
          </select>
        </div>
      </div>

      <div className="orders-list">
        {paginatedOrders.map((o) => {
          const products = o.products || [];
          const hasMultipleProducts = products.length > 1;
          const isExpanded = Boolean(expandedOrders[o._id]);
          const visibleProducts =
            hasMultipleProducts && !isExpanded ? products.slice(0, 1) : products;

          return (
            <div key={o._id} className="order-card">
              <div className="order-main-content">
                <div className="order-header">
                  <h3>Order #{o.orderNumber}</h3>
                  <p className="vendor-email">{o.vendor?.email}</p>
                  <select
                    className="status-select-minimal"
                    value={o.status}
                    onChange={(e) => updateStatus(o._id, e.target.value)}
                  >
                    <option value="Placed">Placed</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>

                <div className="order-products">
                  {visibleProducts.map((p, i) => (
                    <div key={`${o._id}-${i}`} className="product-chip">
                      <img src={`http://localhost:5000/uploads/${p.image}`} alt="" />
                      <div className="product-info">
                        <span className="p-name">{p.name}</span>
                        <span className="p-details">Qty: {p.qty} | Rs {p.price}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {hasMultipleProducts && (
                  <button
                    type="button"
                    className="order-products-toggle"
                    onClick={() => toggleOrderProducts(o._id)}
                  >
                    {isExpanded ? "Show less products" : `Show all products (${products.length})`}
                  </button>
                )}

                <div className="order-footer">
                  <span className="label">TOTAL AMOUNT</span>
                  <span className="total-price">Total: Rs {o.total}</span>
                </div>
              </div>

              <div className="timeline-box-dark">
                <OrderTimeline status={o.status} />
                <div className="order-address-mini">Address: {o.deliveryAddress}</div>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="pagination-container">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="pag-btn"
          >
            Prev
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`page-num ${currentPage === i + 1 ? "active" : ""}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="pag-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
