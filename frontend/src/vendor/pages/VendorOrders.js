/** Vendor orders screen; presents the vendor workflow and uses the shared API client for persisted data. */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../services/api";
import toast from "react-hot-toast";
import Footer from "../../components/Footer";
import OrderTimeline from "../../components/OrderTimeline";
import "./VendorOrders.css";
import VendorLayout from "./VendorLayout";

/** Formats a numeric amount as Indian rupees for consistent display in the user interface. */
const formatCurrency = (amount) => `Rs ${Number(amount || 0).toLocaleString("en-IN")}`;

/** Renders the vendor orders interface and coordinates the state and actions for this screen or reusable component. */
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
  const [downloadingOrderId, setDownloadingOrderId] = useState("");
  const selectedOrderNumber = searchParams.get("order") || "";

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (selectedOrderNumber) {
      setSearchId(selectedOrderNumber);
    }
  }, [selectedOrderNumber]);

    /** Loads the signed-in vendor orders for the order history screen. */
    const fetchOrders = async () => {
    try {
      const res = await api.get("/orders/vendor/orders");
      setOrders(res.data || []);
    } catch (err) {
      toast.error("Failed to load orders");
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

      const orderNumberDiff = Number(b.orderNumber || 0) - Number(a.orderNumber || 0);
      if (orderNumberDiff !== 0) return orderNumberDiff;

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

    /** Exports the selected order details as a downloadable receipt. */
    const downloadReceipt = (order) => {
    try {
      setDownloadingOrderId(order._id);

      const products = Array.isArray(order.products) ? order.products : [];
      const paymentMethod = order.paymentMethod || order.payment?.method || "Online";
      const vendorName = order.vendor?.name || "Not available";
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
        ? new Date(order.createdAt).toLocaleString("en-IN")
        : "Not available";

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(8, 46, 79);
      doc.rect(0, 0, pageWidth, 30, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("JensnMart Receipt", 14, 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `Generated on ${new Date().toLocaleString("en-IN")}`,
        pageWidth - 14,
        18,
        { align: "right" }
      );

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Order Details", 14, 44);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Order No: #${order.orderNumber || "N/A"}`, 14, 52);
      doc.text(`Name: ${vendorName}`, 14, 58);
      doc.text(`Created At: ${orderDate}`, 14, 64);
      doc.text(`Status: ${order.status || "Not available"}`, 14, 70);
      doc.text(`Payment Method: ${paymentMethod}`, 110, 52);
      doc.text(`Payment Status: ${transactionStatus}`, 110, 58);
      doc.text(`Transaction ID: ${transactionId}`, 110, 64);

      autoTable(doc, {
        startY: 82,
        head: [["Product", "Qty", "Unit Price", "Line Total"]],
        body: products.map((product) => [
          product.name || "Unnamed product",
          String(product.qty || 0),
          formatCurrency(product.price),
          formatCurrency(Number(product.price || 0) * Number(product.qty || 0)),
        ]),
        styles: {
          fontSize: 10,
          cellPadding: 4,
          textColor: [15, 23, 42],
        },
        headStyles: {
          fillColor: [8, 46, 79],
          textColor: [255, 255, 255],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { left: 14, right: 14 },
      });

      const finalY = doc.lastAutoTable?.finalY || 82;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`Total: ${formatCurrency(order.total)}`, pageWidth - 14, finalY + 14, {
        align: "right",
      });

      doc.save(`jensnmart-receipt-order-${order.orderNumber || order._id || "download"}.pdf`);
      toast.success(`Receipt downloaded for order #${order.orderNumber}`);
    } catch (error) {
      console.error("Vendor receipt download failed:", error);
      toast.error("Failed to download receipt");
    } finally {
      setDownloadingOrderId("");
    }
  };

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
                        <button
                          type="button"
                          className="order-receipt-btn"
                          onClick={() => downloadReceipt(order)}
                          disabled={downloadingOrderId === order._id}
                        >
                          {downloadingOrderId === order._id
                            ? "Preparing Receipt..."
                            : "Download Receipt"}
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
