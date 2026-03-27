import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import "./VendorCart.css";
import Footer from "../../components/Footer";
import VendorLayout from "./VendorLayout";

export default function VendorCart() {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("Online");

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await api.get("/cart");
      setCartItems(res.data.items || []);
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      console.error("Fetch cart failed", err);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId) => {
    await api.delete(`/cart/remove/${productId}`);
    window.dispatchEvent(new Event("cart-updated"));
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
      window.dispatchEvent(new Event("cart-updated"));
    } catch {
      fetchCart();
    }
  };

  const total = cartItems.reduce((sum, item) => {
    if (!item.product) return sum;
    return sum + item.product.price * item.quantity;
  }, 0);
  const totalUnits = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const inStockItems = cartItems.filter((item) => Number(item.product?.stock || 0) > 0).length;

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
      toast.error("No saved address found.");
      navigate("/profile");
      return;
    }

    try {
      const res = await api.post("/orders/checkout", {
        address,
        paymentMethod
      });

      if (paymentMethod === "COD") {
        toast.success("Order placed with Cash on Delivery");
        fetchCart();
        window.dispatchEvent(new Event("cart-updated"));
        navigate("/vendor/orders");
        return;
      }

      const { order, razorpayOrder, razorpayKeyId } = res.data;
      if (!razorpayOrder || !razorpayKeyId) {
        toast.error("Razorpay is not configured on server.");
        return;
      }

      openRazorpay(razorpayOrder, order, razorpayKeyId);

    } catch (err) {
      console.log(err.response);
      toast.error(err.response?.data?.message || "Checkout failed");
    }
  };

  const openRazorpay = (razorpayOrder, order, razorpayKeyId) => {
    if (!window.Razorpay) {
      toast.error("Razorpay SDK failed to load. Please refresh and try again.");
      return;
    }

    const razorpayPublicKey = razorpayKeyId || process.env.REACT_APP_RAZORPAY_KEY_ID;
    if (!razorpayPublicKey) {
      toast.error("Razorpay key is missing. Contact support.");
      return;
    }

    const options = {
      key: razorpayPublicKey,
      amount: razorpayOrder.amount,
      currency: "INR",
      order_id: razorpayOrder.id,

      handler: async function (response) {
        try {
          await api.post("/payments/verify", {
            ...response,
            orderId: order._id,
            amount: order.total,
          });

          setCartItems([]);
          toast.success("Payment successful");
          await fetchCart();
          window.dispatchEvent(new Event("cart-updated"));
          navigate("/vendor/orders");

        } catch (err) {
          toast.error("Payment verification failed");
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
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
      <main className="vendor-main">
        <div className="cart-page-root">
          <section className="cart-hero">
            <div className="cart-hero-copy">
              <div className="cart-hero-content">
                <p className="cart-eyebrow">Purchase desk</p>
                <h2 className="page-title">Your Cart</h2>
                <p className="cart-hero-text">
                  Review selected products, fine-tune quantities and complete checkout with a cleaner buying flow.
                </p>
              </div>

              <div className="cart-hero-stats">
                <div className="cart-hero-stat">
                  <span>Items</span>
                  <strong>{cartItems.length}</strong>
                </div>
                <div className="cart-hero-stat">
                  <span>Units</span>
                  <strong>{totalUnits}</strong>
                </div>
                <div className="cart-hero-stat">
                  <span>Ready</span>
                  <strong>{inStockItems}</strong>
                </div>
              </div>
            </div>
          </section>

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
                  <div className="summary-chip-row">
                    <span className="summary-chip">{cartItems.length} products</span>
                    <span className="summary-chip">{totalUnits} units</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total</span>
                    <span>Rs {total}</span>
                  </div>

                  <div className="payment-method-box">
                    <p className="payment-method-title">Payment Method</p>
                    <label className="payment-method-option">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="Online"
                        checked={paymentMethod === "Online"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <span>Online (Razorpay)</span>
                    </label>

                    <label className="payment-method-option">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={paymentMethod === "COD"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <span>Cash on Delivery (COD)</span>
                    </label>
                  </div>

                  <button className="btn-checkout" onClick={placeOrder}>
                    {paymentMethod === "COD" ? "Place COD Order" : "Proceed to Checkout"}
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
