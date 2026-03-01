import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import "../admin.css";

export default function PaymentsTab() {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");

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

  /* ================= SUMMARY CALCULATION ================= */

  const totalRevenue = useMemo(() => {
    return payments
      .filter(p => p.status === "Paid")
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const pendingAmount = useMemo(() => {
    return payments
      .filter(p => p.status === "Pending")
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const filteredPayments = payments.filter((p) =>
    (p.vendor?.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/payments/${id}`, { status });
      toast.success("Payment updated");
      loadPayments();
    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <div className="payments-container">
      <h1>Payment Management</h1>

      {/* SUMMARY CARDS */}
      <div className="summary-cards">
        <div className="card revenue">
          <h3>Total Revenue</h3>
          <p>₹{totalRevenue}</p>
        </div>

        <div className="card pending">
          <h3>Pending Payments</h3>
          <p>₹{pendingAmount}</p>
        </div>

        <div className="card total">
          <h3>Total Transactions</h3>
          <p>{payments.length}</p>
        </div>
      </div>

      {/* SEARCH */}
      <input
        placeholder="Search by vendor email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-input"
      />

      {/* TABLE */}
      <div className="table">
        <div className="table-head">
          <span>Order</span>
          <span>Vendor</span>
          <span>Amount</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {filteredPayments.map((p) => (
          <div key={p._id} className="table-row">
            <span>{p.order?.orderNumber}</span>
            <span>{p.vendor?.email}</span>
            <span>₹{p.amount}</span>

            <span className={`status ${p.status.toLowerCase()}`}>
              {p.status}
            </span>

            <select
              value={p.status}
              onChange={(e) => updateStatus(p._id, e.target.value)}
            >
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
