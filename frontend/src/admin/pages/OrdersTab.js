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
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const formattedCommission = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(Number(commission || 0)),
    [commission]
  );
  const formatStatusLabel = (value) =>
    String(value || "")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .trim();

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const generateInvoice = (order) => {
    const invoiceId = `INV-${order?.orderNumber || order?._id?.slice(-6) || "NA"}`;
    const orderDate = order?.createdAt
      ? new Date(order.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";

    const products = Array.isArray(order?.products) ? order.products : [];
    const subtotal = products.reduce(
      (sum, item) => sum + Number(item?.qty || 0) * Number(item?.price || 0),
      0
    );
    const grandTotal = Number(order?.total ?? subtotal);

    const rows = products
      .map((item, idx) => {
        const qty = Number(item?.qty || 0);
        const unit = Number(item?.price || 0);
        const lineTotal = qty * unit;

        return `
          <tr>
            <td>${idx + 1}</td>
            <td>${escapeHtml(item?.name || "Item")}</td>
            <td>${qty}</td>
            <td>Rs ${unit.toFixed(2)}</td>
            <td>Rs ${lineTotal.toFixed(2)}</td>
          </tr>
        `;
      })
      .join("");

    const invoiceHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Invoice ${escapeHtml(invoiceId)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 28px; color: #0f172a; }
            .head { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 22px; }
            .brand h1 { margin: 0; font-size: 22px; }
            .brand p { margin: 4px 0 0; color: #475569; }
            .meta { text-align: right; }
            .meta p { margin: 3px 0; }
            .card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 16px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #e2e8f0; padding: 9px; text-align: left; font-size: 13px; }
            th { background: #f8fafc; }
            .total { margin-top: 14px; display: flex; justify-content: flex-end; }
            .total-box { min-width: 260px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; }
            .grand { font-weight: 700; font-size: 16px; border-top: 1px dashed #cbd5e1; padding-top: 8px; margin-top: 8px; }
            .note { margin-top: 18px; color: #475569; font-size: 12px; }
            @media print { body { margin: 14px; } }
          </style>
        </head>
        <body>
          <div class="head">
            <div class="brand">
              <h1>JensnMart Invoice</h1>
              <p>Admin generated order invoice</p>
            </div>
            <div class="meta">
              <p><strong>Invoice:</strong> ${escapeHtml(invoiceId)}</p>
              <p><strong>Order #:</strong> ${escapeHtml(order?.orderNumber || "N/A")}</p>
              <p><strong>Date:</strong> ${escapeHtml(orderDate)}</p>
              <p><strong>Status:</strong> ${escapeHtml(order?.status || "N/A")}</p>
            </div>
          </div>

          <div class="card grid">
            <div>
              <strong>Vendor</strong>
              <p>${escapeHtml(order?.vendor?.email || "N/A")}</p>
            </div>
            <div>
              <strong>Delivery Address</strong>
              <p>${escapeHtml(order?.deliveryAddress || "N/A")}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="5">No products found</td></tr>'}
            </tbody>
          </table>

          <div class="total">
            <div class="total-box">
              <div class="row"><span>Subtotal</span><span>Rs ${subtotal.toFixed(2)}</span></div>
              <div class="row grand"><span>Grand Total</span><span>Rs ${grandTotal.toFixed(2)}</span></div>
            </div>
          </div>

          <p class="note">Generated from Admin Orders panel on ${new Date().toLocaleString("en-IN")}.</p>
        </body>
      </html>
    `;

    const popup = window.open("", "_blank", "width=980,height=720");
    if (!popup) {
      toast.error("Popup blocked. Please allow popups to generate invoice.");
      return;
    }

    popup.document.open();
    popup.document.write(invoiceHtml);
    popup.document.close();
    popup.focus();
    setTimeout(() => {
      popup.print();
    }, 250);
  };

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
          <p>{orders.length} total orders are loaded, with commission at Rs {formattedCommission}.</p>
        </div>
      </section>

      <div className="stats-row">
        {["Placed", "Processing", "Shipped", "Delivered", "Returned", "Cancelled"].map((s) => (
          <div className={`stat-card stat-${s.toLowerCase()}`} key={s}>
            <span>{s}</span>
            <h3>{stats[s.toLowerCase()]}</h3>
          </div>
        ))}
        <div className="stat-card highlight">
          <span>Commission</span>
          <h3>Rs {formattedCommission}</h3>
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
          const statusLabel = formatStatusLabel(o.status);
          const hasMultipleProducts = products.length > 1;
          const isExpanded = Boolean(expandedOrders[o._id]);
          const visibleProducts =
            hasMultipleProducts && !isExpanded ? products.slice(0, 1) : products;

          return (
            <div
              key={o._id}
              className={`order-card order-${String(o.status || "unknown").toLowerCase()}`}
            >
              <div className="order-main-content">
                <div className="order-header">
                  <h3>
                    Order #{o.orderNumber}
                    <span className="order-id-pill">{statusLabel}</span>
                  </h3>
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
                  <div className="order-footer-actions">
                    <span className="total-price">Total: Rs {o.total}</span>
                    <button
                      type="button"
                      className="invoice-btn"
                      onClick={() => generateInvoice(o)}
                    >
                      Generate Invoice
                    </button>
                  </div>
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
