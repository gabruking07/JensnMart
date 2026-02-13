import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./VendorOrders.css";

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

  const getStatusClass = (status) => {
    switch (status) {
      case "Processing":
        return "status processing";
      case "Shipped":
        return "status shipped";
      case "Delivered":
        return "status delivered";
      case "Returned":
        return "status returned";
      case "Completed":
        return "status completed";
      case "Cancelled":
        return "status cancelled";
      case "Placed":
        return "status placed";
      default:
        return "status";
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
    <div className="vendor-orders-root">
      <Header title="My Orders" />

      <main className="vendor-orders-main">
        {orders.length === 0 ? (
          <p>No orders placed yet.</p>
        ) : (
          orders.map((order) => (
            <div className="admin-card order-card" key={order._id}>
              
              {/* HEADER */}
              <div className="order-header">
                <span>Order #{order._id.slice(-6)}</span>
                <span className={getStatusClass(order.status)}>
                  {order.status}
                </span>
              </div>

              {/* PRODUCTS */}
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

              {/* STATUS HISTORY SECTION */}
              {order.statusHistory && order.statusHistory.length > 0 && (
                <div className="status-history-box">
                  <h4>Status History</h4>

                  {order.statusHistory.map((history, index) => (
                    <div key={index} className="history-row">
                      <span>{history.status}</span>
                      <small>
                        {new Date(history.updatedAt).toLocaleString()}
                      </small>
                    </div>
                  ))}
                </div>
              )}

              {/* FOOTER */}
              <div className="order-footer">
                <span>Total: ₹{order.total}</span>
                <span>
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}

        <button
          className="btn-secondary"
          onClick={() => navigate("/vendor")}
        >
          Back to Shop
        </button>
      </main>

      <Footer />
    </div>
  );
}
