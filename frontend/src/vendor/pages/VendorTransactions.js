import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import Footer from "../../components/Footer";
import VendorLayout from "./VendorLayout";
import "./VendorTransactions.css";

export default function VendorTransactions() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const selectedOrderNumber = searchParams.get("order") || "";

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    if (selectedOrderNumber) {
      setSearch(selectedOrderNumber);
    }
  }, [selectedOrderNumber]);

  const loadTransactions = async () => {
    try {
      const res = await api.get("/payments/vendor");
      setTransactions(res.data || []);
    } catch (err) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const paidAmount = transactions
      .filter((t) => t.status === "Paid")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const pendingAmount = transactions
      .filter((t) => t.status === "Pending")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return {
      paidAmount,
      pendingAmount,
      total: transactions.length,
    };
  }, [transactions]);

  const filtered = transactions
    .filter((t) => {
      const orderNumber = String(t.order?.orderNumber || "");
      const paymentId = String(t.razorpayPaymentId || t.transactionId || "");

      const matchesSearch =
        !search ||
        orderNumber.includes(search) ||
        paymentId.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all" || t.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const orderNumberDiff =
        Number(b.order?.orderNumber || 0) - Number(a.order?.orderNumber || 0);
      if (orderNumberDiff !== 0) return orderNumberDiff;

      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filtered.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, itemsPerPage]);

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
      <main className="vendor-main">
        <div className="vendor-transactions-root">
          <section className="transactions-hero">
            <div className="transactions-hero-copy">
              <p className="transactions-eyebrow">Payment control</p>
              <h1>Monitor incoming payments and transaction flow in one place.</h1>
              <p className="transactions-hero-text">
                Track pending and paid activity, review payment references, and jump directly back to the related order.
              </p>
            </div>

            <div className="transactions-hero-status">
              <span>Payment status</span>
              <strong>{summary.pendingAmount > 0 ? "Attention" : "Healthy"}</strong>
              <p>
                {summary.pendingAmount > 0
                  ? `Rs ${summary.pendingAmount} is still pending settlement.`
                  : "No pending transaction balance right now."}
              </p>
            </div>
          </section>

          <div className="vendor-transaction-summary">
            <div className="summary-card paid">
              <h4>Paid Amount</h4>
              <p>Rs {summary.paidAmount}</p>
            </div>
            <div className="summary-card pending">
              <h4>Pending Amount</h4>
              <p>Rs {summary.pendingAmount}</p>
            </div>
            <div className="summary-card total">
              <h4>Total Transactions</h4>
              <p>{summary.total}</p>
            </div>
          </div>

          <div className="vendor-transaction-filters">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order no / payment id"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          {transactions.length > 0 && (
            <div className="transactions-pagination-toolbar">
              <p className="transactions-pagination-count">
                Showing {filtered.length === 0 ? 0 : startIndex + 1}-
                {Math.min(endIndex, filtered.length)} of {filtered.length} transactions
              </p>
              <div className="transactions-page-size">
                <label htmlFor="transactions-page-size">Items per page</label>
                <select
                  id="transactions-page-size"
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

          <div className="vendor-transaction-table">
            <div className="table-head">
              <span>Order</span>
              <span>Amount</span>
              <span>Method</span>
              <span>Status</span>
              <span>Payment ID</span>
              <span>Date</span>
              <span>Action</span>
            </div>

            {filtered.length === 0 ? (
              <div className="table-empty">No transactions found.</div>
            ) : (
              paginatedTransactions.map((t) => (
                <div
                  className={`table-row ${String(t.order?.orderNumber || "") === selectedOrderNumber ? "linked-transaction" : ""}`}
                  key={t._id}
                >
                  <span>#{t.order?.orderNumber || "-"}</span>
                  <span>Rs {t.amount}</span>
                  <span>{t.method || "-"}</span>
                  <span className={`status ${String(t.status || "").toLowerCase()}`}>
                    {t.status}
                  </span>
                  <span>{t.razorpayPaymentId || t.transactionId || "-"}</span>
                  <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  <button
                    type="button"
                    className="transaction-link-btn"
                    onClick={() => t.order?.orderNumber && navigate(`/vendor/orders?order=${t.order.orderNumber}`)}
                  >
                    View Order
                  </button>
                </div>
              ))
            )}
          </div>

          {filtered.length > 0 && (
            <div className="transactions-pagination">
              <button
                className="transactions-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`transactions-page-btn ${currentPage === page ? "active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                className="transactions-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Next
              </button>
            </div>
          )}
          <Footer />
        </div>
      </main>
    </VendorLayout>
  );
}
