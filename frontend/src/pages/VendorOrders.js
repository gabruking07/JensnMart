import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./VendorOrders.css";
import VendorLayout from "./VendorLayout";

export default function VendorOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="loader-container"><div className="loader"></div></div>;
  }

  return (
    <VendorLayout>
      <header title="My Orders">
        <main className="vendor-main">
          <div className="vendor-orders-root">
            <Header title="My Orders" />

            {orders.length === 0 ? (
              <p>No orders placed yet.</p>
            ) : (
              orders.map((order) => (
                <div className="admin-card order-card" key={order._id}>
                  <div className="order-header">
                    <span>Order #{order._id.slice(-6)}</span>
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