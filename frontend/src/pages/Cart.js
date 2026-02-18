import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Cart.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import VendorLayout from "./VendorLayout";

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
    await api.delete(`/cart/remove/${productId}`);
    fetchCart();
  };

  const updateQty = async (productId, qty) => {
    const item = cartItems.find((i) => i.product._id === productId);
    if (!item) return;
    if (qty < 1) return;
    if (qty > item.product.stock) return;

    setCartItems((prev) =>
      prev.map((i) =>
        i.product._id === productId ? { ...i, quantity: qty } : i
      )
    );

    try {
      await api.put(`/cart/update/${productId}`, { quantity: qty });
    } catch {
      fetchCart();
    }
  };

  const total = cartItems.reduce((sum, item) => {
    if (!item.product) return sum;
    return sum + item.product.price * item.quantity;
  }, 0);

  const getCheckoutAddress = async () => {
    try {
      const res = await api.get("/vendor/addresses");
      const addresses = res.data || [];
      const preferred = addresses.find((a) => a.isDefault) || addresses[0];
      if (preferred) return preferred;
    } catch (err) {
      console.log("Address book read failed", err);
    }

    try {
      const profileRes = await api.get("/vendor/profile");
      const p = profileRes.data || {};
      const profileAddress = p.address || {
        line1: p.addressLine1 || "",
        line2: p.addressLine2 || "",
        city: p.city || "",
        state: p.state || "",
        pincode: p.pincode || "",
        country: p.country || "",
      };

      const hasAddress = Object.values(profileAddress).some(Boolean);
      if (hasAddress) return profileAddress;
    } catch (err) {
      console.log("Profile address read failed", err);
    }

    return null;
  };

  const placeOrder = async () => {
    if (!cartItems.length) return;

    const address = await getCheckoutAddress();
    if (!address) {
      alert("No saved address found. Please add address in profile first.");
      navigate("/profile");
      return;
    }

    try {
      await api.post("/orders/checkout", { address });
      alert("Order placed");
      fetchCart();
    } catch (err) {
      alert(err.response?.data?.message || "Checkout failed");
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
      <Header title="Cart" />

      <main className="vendor-main">
        <div className="cart-page-root">
          <h2 className="page-title">Your Cart ({cartItems.length} items)</h2>

          {cartItems.length === 0 ? (
            <div className="empty-cart-state">
              <div className="empty-icon">Cart</div>
              <h3>Your cart is empty</h3>
              <button className="btn-primary" onClick={() => navigate("/vendor")}>
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="cart-grid">
              <div className="cart-items-list">
                {cartItems
                  .filter((i) => i.product)
                  .map((item) => (
                    <div className="admin-card cart-item-card" key={item.product._id}>
                      <img
                        src={`http://localhost:5000/uploads/${item.product.image}`}
                        alt=""
                        className="cart-item-img"
                      />

                      <div className="cart-item-info">
                        <h4>{item.product.name}</h4>
                        <div className="cart-item-details">
                          <span className="unit-price">Rs {item.product.price}</span>

                          <button
                            className="qty-btn"
                            onClick={() => updateQty(item.product._id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>

                          <input
                            type="number"
                            className="qty-input"
                            value={item.quantity}
                            min="1"
                            max={item.product.stock}
                            onChange={(e) => {
                              let val = Number(e.target.value);
                              if (isNaN(val)) return;
                              if (val < 1) val = 1;
                              if (val > item.product.stock) val = item.product.stock;
                              updateQty(item.product._id, val);
                            }}
                          />

                          <button
                            className="qty-btn"
                            onClick={() => updateQty(item.product._id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="cart-item-actions">
                        <p className="subtotal-price">
                          Rs {item.product.price * item.quantity}
                        </p>
                        <button
                          className="btn-remove"
                          onClick={() => removeItem(item.product._id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              <aside className="cart-summary-sidebar">
                <div className="admin-card summary-card">
                  <h3>Order Summary</h3>
                  <div className="summary-row total">
                    <span>Total</span>
                    <span>Rs {total}</span>
                  </div>

                  <button className="btn-checkout" onClick={placeOrder}>
                    Proceed to Checkout
                  </button>
                </div>
              </aside>
            </div>
          )}

          <Footer />
        </div>
      </main>
    </VendorLayout>
  );
}
