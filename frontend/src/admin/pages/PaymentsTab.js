/** Administrator payments tab screen; loads and updates the corresponding marketplace records through the shared API client. */

import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import "../admin.css";

/** Renders the payments tab interface and coordinates the state and actions for this screen or reusable component. */
export default function PaymentsTab() {
  const [payments, setPayments] = useState([]);
  const [notifyingId, setNotifyingId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

    /** Fetches payment records for the administrator table. */
    const loadPayments = async () => {
    try {
      const { data } = await api.get("/payments");
      setPayments(data);
    } catch {
      toast.error("Failed to load payments");
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const totalRevenue = useMemo(() => {
    return payments
      .filter((p) => p.status === "Paid")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payments]);

  const pendingAmount = useMemo(() => {
    return payments
      .filter((p) => p.status === "Pending")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payments]);

  const filteredPayments = payments
    .filter((p) => {
      const matchesSearch = (p.vendor?.email || "")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const orderNumberDiff =
        Number(b.order?.orderNumber || 0) - Number(a.order?.orderNumber || 0);
      if (orderNumberDiff !== 0) return orderNumberDiff;

      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pagedPayments = filteredPayments.slice(start, start + pageSize);

    /** Sends a status change to the backend and refreshes the affected record list. */
    const updateStatus = async (id, status) => {
    try {
      await api.put(`/payments/${id}`, { status });
      toast.success("Payment updated");
      loadPayments();
    } catch {
      toast.error("Update failed");
    }
  };

    /** Asks the backend to notify a vendor about a pending payment. */
    const notifyVendorForPending = async (payment) => {
    try {
      setNotifyingId(payment._id);
      const { data } = await api.post(`/payments/${payment._id}/notify-vendor`);
      toast.success(data?.message || "Vendor notified");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to notify vendor");
    } finally {
      setNotifyingId("");
    }
  };

  return (
    <div className="payments-container admin-panel-page">
      <section className="admin-page-hero">
        <div className="admin-page-hero-copy">
          <p className="admin-page-eyebrow">Payment control</p>
          <h1>Review transaction flow with the same hero-led layout as the rest of admin.</h1>
          <p>
            Monitor settlement progress, filter vendor payouts, and update payment status from one
            cleaner screen.
          </p>
        </div>

        <div className="admin-page-hero-status">
          <span>Filtered payments</span>
          <strong>{filteredPayments.length}</strong>
          <p>Rs {totalRevenue} has cleared, while Rs {pendingAmount} is still pending.</p>
        </div>
      </section>

      <div className="summary-cards">
        <div className="card revenue">
          <h3>Total Revenue</h3>
          <p>Rs {totalRevenue}</p>
        </div>

        <div className="card pending">
          <h3>Pending Payments</h3>
          <p>Rs {pendingAmount}</p>
        </div>

        <div className="card total">
          <h3>Total Transactions</h3>
          <p>{payments.length}</p>
        </div>
      </div>

      <div className="payments-topbar">
        <div className="payments-search-filters">
          <input
            placeholder="Search by vendor email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input payment-search-input"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="payment-sort-select"
            aria-label="Filter transactions by status"
          >
            <option value="all">All status</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        <div className="payments-page-size top-right">
          <label htmlFor="payments-page-size-top" className="payments-page-size-text">
            Rows per page
          </label>
          <select
            id="payments-page-size-top"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={6}>6</option>
            <option value={12}>12</option>
            <option value={18}>18</option>
            <option value={24}>24</option>
          </select>
        </div>
      </div>

      <div className="table payments-table">
        <div className="table-head payments-table-head">
          <span>Order</span>
          <span>Vendor</span>
          <span>Amount</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {pagedPayments.map((p) => (
          <div key={p._id} className="table-row payments-table-row">
            <span className="payment-col-order">{p.order?.orderNumber || "-"}</span>
            <span className="payment-col-vendor">{p.vendor?.email || "-"}</span>
            <span className="payment-col-amount">Rs {p.amount}</span>

            <span className={`status ${String(p.status || "").toLowerCase()}`}>
              {p.status}
            </span>

            <div className="payment-actions-stack">
              <select
                value={p.status}
                onChange={(e) => updateStatus(p._id, e.target.value)}
                className="payment-action-select"
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Failed">Failed</option>
              </select>

              {p.status === "Pending" ? (
                <button
                  type="button"
                  className="payment-notify-btn"
                  onClick={() => notifyVendorForPending(p)}
                  disabled={notifyingId === p._id}
                >
                  {notifyingId === p._id ? "Sending..." : "Notify Vendor"}
                </button>
              ) : (
                <span className="payment-notify-muted">No reminder needed</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="payments-pagination">
        <div className="payments-page-nav">
          <button
            type="button"
            className="payments-nav-btn"
            disabled={safePage === 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              className={`payments-nav-btn ${safePage === p ? "active" : ""}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            className="payments-nav-btn"
            disabled={safePage === totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
