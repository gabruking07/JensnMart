import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "./VendorOrders.css";
import VendorLayout from "./VendorLayout";

export default function VendorOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchId, setSearchId] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    fetchOrders();
  }, []);

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
    .filter(o => {
      const matchStatus =
        statusFilter === "all" || o.status === statusFilter;

      const matchSearch =
        !searchId ||
        String(o.orderNumber).includes(searchId);

      const matchDate = (() => {
        if (dateFilter === "all") return true;

        const today = new Date();
        const orderDate = new Date(o.createdAt);

        if (dateFilter === "today")
          return orderDate.toDateString() === today.toDateString();

        if (dateFilter === "week")
          return today - orderDate < 7 * 24 * 60 * 60 * 1000;

        if (dateFilter === "month")
          return today - orderDate < 30 * 24 * 60 * 60 * 1000;

        return true;
      })();

      return matchStatus && matchSearch && matchDate;
    })
    .sort((a, b) => {
      // 🔥 show exact match first
      if (String(a.orderNumber) === searchId) return -1;
      if (String(b.orderNumber) === searchId) return 1;

      // 🔥 then numbers starting with search
      const aStarts = String(a.orderNumber).startsWith(searchId);
      const bStarts = String(b.orderNumber).startsWith(searchId);

      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      return a.orderNumber - b.orderNumber;
    });

  if (loading) {
    return <div className="loader-container"><div className="loader"></div></div>;
  }

  return (
    <VendorLayout>
      <header title="My Orders">
        <main className="vendor-main">
          <div className="vendor-orders-root">
            <Header title="My Orders" />
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
                <option value="Returned">Returned</option>
                <option value="Cancelled">Cancelled</option>
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

            {orders.length === 0 ? (
              <p>No orders placed yet.</p>
            ) : (
              filteredOrders.map
                ((order) => (
                  <div className="admin-card order-card" key={order.orderNumber}>
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
                            <p>₹{p.price} × {p.qty}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="order-footer">
                      <span>Total: ₹{order.total}</span>
                      <span>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
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