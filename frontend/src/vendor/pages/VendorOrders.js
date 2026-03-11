import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import Footer from "../../components/Footer";
import OrderTimeline from "../../components/OrderTimeline";
import "./VendorOrders.css";
import VendorLayout from "./VendorLayout";

export default function VendorOrders() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchId, setSearchId] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const selectedOrderNumber = searchParams.get("order") || "";

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (selectedOrderNumber) {
      setSearchId(selectedOrderNumber);
    }
  }, [selectedOrderNumber]);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders/vendor/orders");
      setOrders(res.data || []);
    } catch (err) {
      alert("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders
    .filter((o) => {
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      const matchSearch = !searchId || String(o.orderNumber).includes(searchId);
      const matchDate = (() => {
        if (dateFilter === "all") return true;

        const today = new Date();
        const orderDate = new Date(o.createdAt);

        if (dateFilter === "today") {
          return orderDate.toDateString() === today.toDateString();
        }

        if (dateFilter === "week") {
          return today - orderDate < 7 * 24 * 60 * 60 * 1000;
        }

        if (dateFilter === "month") {
          return today - orderDate < 30 * 24 * 60 * 60 * 1000;
        }

        return true;
      })();

      return matchStatus && matchSearch && matchDate;
    })
    .sort((a, b) => {
      if (String(a.orderNumber) === searchId) return -1;
      if (String(b.orderNumber) === searchId) return 1;

      const aStarts = String(a.orderNumber).startsWith(searchId);
      const bStarts = String(b.orderNumber).startsWith(searchId);

      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      const createdAtDiff = new Date(b.createdAt) - new Date(a.createdAt);
      if (createdAtDiff !== 0) return createdAtDiff;

      return b.orderNumber - a.orderNumber;
    });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
  const orderSummary = {
    total: orders.length,
    placed: orders.filter((order) => order.status === "Placed").length,
    processing: orders.filter((order) => order.status === "Processing").length,
    delivered: orders.filter((order) => order.status === "Delivered").length,
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchId, dateFilter, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <VendorLayout>
      <header title="My Orders">
        <main className="vendor-main">
          <div className="vendor-orders-root">
            <section className="orders-hero">
              <div className="orders-hero-copy">
                <p className="orders-eyebrow">Order control</p>
                <h1>Track every order from placement to delivery.</h1>
                <p className="orders-hero-text">
                  Review current activity, search by order number, and move between orders and transactions from one cleaner workspace.
                </p>
              </div>

              <div className="orders-hero-status">
                <span>Current focus</span>
                <strong>{orderSummary.processing > 0 ? "Processing" : "Stable"}</strong>
                <p>
                  {orderSummary.processing > 0
                    ? `${orderSummary.processing} orders are currently in progress.`
                    : "No orders are currently waiting in processing."}
                </p>
              </div>
            </section>

            <div className="vendor-orders-summary">
              <div className="orders-summary-card total">
                <h4>Total Orders</h4>
                <p>{orderSummary.total}</p>
              </div>
              <div className="orders-summary-card placed">
                <h4>Placed</h4>
                <p>{orderSummary.placed}</p>
              </div>
              <div className="orders-summary-card processing">
                <h4>Processing</h4>
                <p>{orderSummary.processing}</p>
              </div>
              <div className="orders-summary-card delivered">
                <h4>Delivered</h4>
                <p>{orderSummary.delivered}</p>
              </div>
            </div>

            <div className="orders-filter-bar">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Placed">Placed</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
              </select>

              <input
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Search order number"
              />
            </div>

            {orders.length > 0 && (
              <div className="orders-pagination-toolbar">
                <p className="orders-pagination-count">
                  Showing {filteredOrders.length === 0 ? 0 : startIndex + 1}-
                  {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders
                </p>
                <div className="orders-page-size">
                  <label htmlFor="orders-page-size">Items per page</label>
                  <select
                    id="orders-page-size"
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  >
                    <option value={4}>4</option>
                    <option value={8}>8</option>
                    <option value={12}>12</option>
                    <option value={16}>16</option>
                  </select>
                </div>
              </div>
            )}

            {orders.length === 0 ? (
              <p>No orders placed yet.</p>
            ) : (
              paginatedOrders.map((order) => (
                <div
                  className={`order-card ${String(order.orderNumber) === selectedOrderNumber ? "linked-order" : ""}`}
                  key={order.orderNumber}
                >
                  <div className="order-content">
                    <div className="order-meta">
                      <div className="order-header">
                        <span>Order #{order.orderNumber}</span>
                        <span className={`status ${order.status.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="order-products">
                        {order.products.map((p, idx) => (
                          <div key={idx} className="order-product-row">
                            <img
                              src={`http://localhost:5000/uploads/${p.image}`}
                              alt={p.name}
                            />
                            <div>
                              <strong>{p.name}</strong>
                              <p>
                                Rs {p.price} x {p.qty}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="order-footer">
                        <span>Total: Rs {order.total}</span>
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>

                      <div className="order-links">
                        <button
                          type="button"
                          className="order-link-btn"
                          onClick={() => navigate(`/vendor/transactions?order=${order.orderNumber}`)}
                        >
                          View Transaction
                        </button>
                      </div>
                    </div>

                    <div className="order-tracking">
                      <OrderTimeline status={order.status} />
                    </div>
                  </div>
                </div>
              ))
            )}

            {filteredOrders.length > 0 && (
              <div className="orders-pagination">
                <button
                  className="orders-page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`orders-page-btn ${currentPage === page ? "active" : ""}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  className="orders-page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next
                </button>
              </div>
            )}

            <button className="btn-secondary" onClick={() => navigate("/vendor")}>
              Back to Shop
            </button>

            <Footer />
          </div>
        </main>
      </header>
    </VendorLayout>
  );
}
