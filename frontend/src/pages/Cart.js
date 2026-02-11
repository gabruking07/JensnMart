import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Cart.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await api.get("/cart");
      setCartItems(res.data.items || []);
    } catch (err) {
      console.error("Fetch cart failed", err);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId) => {
    try {
      await api.delete(`/cart/remove/${productId}`);
      fetchCart();
    } catch (err) {
      alert("Failed to remove item");
    }
  };

  const total = cartItems.reduce((sum, item) => {
    if (!item.product) return sum; // 🔑 guard
    return sum + item.product.price * item.quantity;
  }, 0);

  const placeOrder = async () => {
    if (cartItems.length === 0) return;
    try {
      await api.post("/orders/checkout");
      alert("Order placed successfully! 🎉");
      fetchCart();
      navigate("/vendor");
    } catch (err) {
      alert(err.response?.data?.message || "Checkout failed");
    }
  };

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  return (
    <div className = "cart-page-root">
      <Header title="Shopping Cart" />

      <main className="cart-main-content">
        <h2 className="page-title">Your Cart ({cartItems.length} items)</h2>

        {cartItems.length === 0 ? (
          <div className="empty-cart-state">
            <div className="empty-icon">🛒</div>
            <h3>Your cart is empty</h3>
            <p>Looks like you haven't added anything to your cart yet.</p>
            <button className="btn-primary" onClick={() => navigate("/vendor")}>Start Shopping</button>
          </div>
        ) : (
          <div className="cart-grid">
            {/* Left Side: Items List */}
            <div className="cart-items-list">
              {cartItems
                .filter(item => item.product) // 🔑 skip null products
                .map((item) => (
                  <div className="admin-card cart-item-card" key={item.product._id}>
                    <img
                      src={`http://localhost:5000/uploads/${item.product.image}`}
                      alt={item.product.name}
                      className="cart-item-img"
                    />

                    <div className="cart-item-info">
                      <h4>{item.product.name}</h4>
                      <p className="vendor-name">Sold by: {item.product.vendorName || "Verified Vendor"}</p>
                      <div className="cart-item-details">
                        <span className="unit-price">₹{item.product.price}</span>
                        <span className="qty-tag">Qty: {item.quantity}</span>
                      </div>
                    </div>

                    <div className="cart-item-actions">
                      <p className="subtotal-price">₹{item.product.price * item.quantity}</p>
                      <button className="btn-remove" onClick={() => removeItem(item.product._id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Right Side: Summary Card */}
            <aside className="cart-summary-sidebar">
              <div className="admin-card summary-card">
                <h3>Order Summary</h3>
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{total}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span className="free-text">FREE</span>
                </div>
                <div className="summary-row">
                  <span>Tax (GST)</span>
                  <span>₹0.00</span>
                </div>
                <hr className="summary-divider" />
                <div className="summary-row total">
                  <span>Total Amount</span>
                  <span>₹{total}</span>
                </div>

                <button
                  className="btn-checkout"
                  onClick={placeOrder}
                  disabled={cartItems.length === 0}
                >
                  Proceed to Checkout
                </button>

                <p className="secure-text">🔒 Secure SSL Encrypted Checkout</p>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}