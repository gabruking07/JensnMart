import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import VendorLayout from "./VendorLayout";
import "./VendorTransactions.css";

export default function VendorTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const res = await api.get("/payments/vendor");
      setTransactions(res.data || []);
    } catch (err) {
      alert("Failed to load transactions");
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

  const filtered = transactions.filter((t) => {
    const orderNumber = String(t.order?.orderNumber || "");
    const paymentId = String(t.razorpayPaymentId || t.transactionId || "");

    const matchesSearch =
      !search ||
      orderNumber.includes(search) ||
      paymentId.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <VendorLayout>
      <Header title="Transactions" />

      <main className="vendor-main">
        <div className="vendor-transactions-root">
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

          <div className="vendor-transaction-table">
            <div className="table-head">
              <span>Order</span>
              <span>Amount</span>
              <span>Method</span>
              <span>Status</span>
              <span>Payment ID</span>
              <span>Date</span>
            </div>

            {filtered.length === 0 ? (
              <div className="table-empty">No transactions found.</div>
            ) : (
              filtered.map((t) => (
                <div className="table-row" key={t._id}>
                  <span>#{t.order?.orderNumber || "-"}</span>
                  <span>Rs {t.amount}</span>
                  <span>{t.method || "-"}</span>
                  <span className={`status ${String(t.status || "").toLowerCase()}`}>
                    {t.status}
                  </span>
                  <span>{t.razorpayPaymentId || t.transactionId || "-"}</span>
                  <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
          <Footer />
        </div>
      </main>
    </VendorLayout>
  );
}
