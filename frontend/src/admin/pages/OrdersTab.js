import { Fragment, useEffect, useMemo, useState } from "react";
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
    orders.forEach((order) => {
      if (order.vendor?._id) map.set(order.vendor._id, order.vendor.email);
    });
    return Array.from(map.entries()).map(([id, email]) => ({ id, email }));
  }, [orders]);

  const filtered = useMemo(() => {
    return orders
      .filter((order) => {
        if (statusFilter !== "all" && order.status !== statusFilter) return false;
        if (
          search &&
          !String(order.orderNumber || "").toLowerCase().includes(search.toLowerCase())
        ) {
          return false;
        }
        if (vendorFilter !== "all" && order.vendor?._id !== vendorFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const orderNumberDiff = Number(b.orderNumber || 0) - Number(a.orderNumber || 0);
        if (orderNumberDiff !== 0) return orderNumberDiff;

        const createdAtDiff =
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        if (createdAtDiff !== 0) return createdAtDiff;

        return String(b._id || "").localeCompare(String(a._id || ""));
      });
  }, [orders, statusFilter, search, vendorFilter]);

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
      placed: orders.filter((order) => order.status === "Placed").length,
      processing: orders.filter((order) => order.status === "Processing").length,
      shipped: orders.filter((order) => order.status === "Shipped").length,
      delivered: orders.filter((order) => order.status === "Delivered").length,
      returned: orders.filter((order) => order.status === "Returned").length,
      cancelled: orders.filter((order) => order.status === "Cancelled").length,
    };
  }, [orders]);

  const toggleOrderProducts = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const commissionRupees = Math.round(Number(commission || 0));

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
          <p>
            {orders.length} total orders are loaded, with commission at Rs{" "}
            {commissionRupees.toLocaleString()}.
          </p>
        </div>
      </section>

      <div className="stats-row">
        {["Placed", "Processing", "Shipped", "Delivered", "Returned", "Cancelled"].map((status) => (
          <div className="stat-card" key={status}>
            <span>{status}</span>
            <h3>{stats[status.toLowerCase()]}</h3>
          </div>
        ))}
        <div className="stat-card highlight">
          <span>Commission</span>
          <h3>Rs {commissionRupees.toLocaleString()}</h3>
        </div>
      </div>

      <div className="filter-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="Placed">Placed</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Returned">Returned</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <input
          placeholder="Search Order #"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)}>
          <option value="all">All Vendors</option>
          {vendors.map((vendor) => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.email}
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
      </div>

      <div className="orders-table-shell">
        <div className="orders-table-header">
          <p className="orders-table-title">Orders Table</p>
          <span className="orders-table-count">
            Showing {paginatedOrders.length} of {filtered.length} orders
          </span>
        </div>

        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Vendor</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Address</th>
                <th>More</th>
              </tr>
            </thead>
            <tbody>
        {paginatedOrders.map((order) => {
          const products = order.products || [];
          const isExpanded = Boolean(expandedOrders[order._id]);
          const firstProduct = products[0];
          const hasPendingPayment =
            order.paymentStatus === "Pending" || order.payment?.status === "Pending";
          const displayStatus = hasPendingPayment ? "Placed" : order.status;
          const vendorName =
            order.vendor?.name ||
            order.customerName ||
            order.shippingAddress?.name ||
            "Not available";
          const vendorEmail = order.vendor?.email || order.customerEmail || "Not available";
          const vendorPhone =
            order.vendor?.phone ||
            order.phone ||
            order.shippingAddress?.phone ||
            "Not available";
          const vendorCountry =
            order.vendor?.country ||
            order.country ||
            order.shippingAddress?.country ||
            "India";
          const paymentMethod = order.paymentMethod || order.payment?.method || "Online";
          const transactionId =
            order.razorpayPaymentId ||
            order.transactionId ||
            order.payment?.razorpayPaymentId ||
            order.payment?.transactionId ||
            "Not available";
          const transactionStatus =
            order.paymentStatus ||
            order.payment?.status ||
            (order.status === "Delivered" ? "Paid" : "Pending");
          const orderDate = order.createdAt
            ? new Date(order.createdAt).toLocaleString()
            : "Not available";
          const totalItems = products.reduce((sum, product) => sum + Number(product.qty || 0), 0);
          const subtotalAmount = products.reduce(
            (sum, product) => sum + Number(product.price || 0) * Number(product.qty || 0),
            0
          );

          return (
            <Fragment key={order._id}>
              <tr className="orders-table-row">
                <td>
                  <div className="orders-table-order-id">
                    <strong>#{order.orderNumber}</strong>
                    <span>{order._id?.slice(-8)}</span>
                  </div>
                </td>
                <td>
                  <div className="orders-table-vendor">
                    <strong>{order.vendor?.email || "-"}</strong>
                  </div>
                </td>
                <td>
                  {firstProduct ? (
                    <div className="orders-table-item">
                      <img src={`http://localhost:5000/uploads/${firstProduct.image}`} alt="" />
                      <div>
                        <strong>{firstProduct.name}</strong>
                        <span>
                          Qty {firstProduct.qty}
                          {products.length > 1 ? ` + ${products.length - 1} more item(s)` : ""}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="orders-table-muted">No products</span>
                  )}
                </td>
                <td>
                  <span className="orders-table-total">
                    Rs {Number(order.total || 0).toLocaleString()}
                  </span>
                </td>
                <td>
                  <select
                    className="orders-table-status"
                    value={displayStatus}
                    disabled={hasPendingPayment}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                  >
                    <option value="Placed">Placed</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Returned">Returned</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </td>
                <td>
                  <div className="orders-table-address">
                    {order.deliveryAddress || "-"}
                    {hasPendingPayment ? " (Payment pending: status locked)" : ""}
                  </div>
                </td>
                <td>
                  <button
                    type="button"
                    className="orders-table-expand"
                    onClick={() => toggleOrderProducts(order._id)}
                  >
                    {isExpanded ? "Hide" : "View"}
                  </button>
                </td>
              </tr>
              {isExpanded && (
                <tr className="orders-table-expanded-row">
                  <td colSpan={7}>
                    <div className="orders-table-expanded">
                      <div className="orders-table-products">
                        {products.map((product, index) => (
                          <div key={`${order._id}-${index}`} className="product-chip">
                            <img src={`http://localhost:5000/uploads/${product.image}`} alt="" />
                            <div className="product-info">
                              <span className="p-name">{product.name}</span>
                              <span className="p-details">Qty: {product.qty} | Rs {product.price}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="orders-table-side">
                        <div className="orders-detail-grid">
                          <div className="orders-detail-card">
                            <span className="orders-detail-kicker">Vendor Details</span>
                            <div className="orders-detail-list">
                              <div>
                                <label>Name</label>
                                <strong>{vendorName}</strong>
                              </div>
                              <div>
                                <label>Email</label>
                                <strong>{vendorEmail}</strong>
                              </div>
                              <div>
                                <label>Phone</label>
                                <strong>{vendorPhone}</strong>
                              </div>
                              <div>
                                <label>Country</label>
                                <strong>{vendorCountry}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="orders-detail-card">
                            <span className="orders-detail-kicker">Order Details</span>
                            <div className="orders-detail-list">
                              <div>
                                <label>Order No.</label>
                                <strong>#{order.orderNumber}</strong>
                              </div>
                              <div>
                                <label>Created At</label>
                                <strong>{orderDate}</strong>
                              </div>
                              <div>
                                <label>Total Items</label>
                                <strong>{totalItems}</strong>
                              </div>
                              <div>
                                <label>Subtotal</label>
                                <strong>Rs {subtotalAmount.toLocaleString()}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="orders-detail-card">
                            <span className="orders-detail-kicker">Transaction Details</span>
                            <div className="orders-detail-list">
                              <div>
                                <label>Method</label>
                                <strong>{paymentMethod}</strong>
                              </div>
                              <div>
                                <label>Transaction ID</label>
                                <strong>{transactionId}</strong>
                              </div>
                              <div>
                                <label>Payment Status</label>
                                <strong>{transactionStatus}</strong>
                              </div>
                              <div>
                                <label>Total Amount</label>
                                <strong>Rs {Number(order.total || 0).toLocaleString()}</strong>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="timeline-box-dark">
                          <OrderTimeline status={displayStatus} />
                          <div className="order-address-mini">Address: {order.deliveryAddress}</div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="pagination-container">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => page - 1)}
            className="pag-btn"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`page-num ${currentPage === index + 1 ? "active" : ""}`}
            >
              {index + 1}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((page) => page + 1)}
            className="pag-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
