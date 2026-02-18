import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Cart.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import VendorLayout from "../vendor/pages/VendorLayout";

export default function Cart() {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newAddress, setNewAddress] = useState({
    label: "",
    line1: "",
    city: "",
    pincode: ""
  });

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

  /* ================= LOAD ADDRESSES ================= */
  const loadAddresses = async () => {
    try {
      const res = await api.get("/vendor/addresses");
      const data = res.data || [];

      setAddresses(data);

      const defaultAddr = data.find(a => a.isDefault);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr);
      }
    } catch (err) {
      console.log("Address load error", err);
    }
  };

  /* ================= REMOVE ITEM ================= */
  const removeItem = async (productId) => {
    await api.delete(`/cart/remove/${productId}`);
    fetchCart();
  };

  /* ================= UPDATE QTY ================= */
  const updateQty = async (productId, qty) => {
  const item = cartItems.find(i => i.product._id === productId);
  if (!item) return;

  if (qty < 1) return;
  if (qty > item.product.stock) return;

  setCartItems(prev =>
    prev.map(i =>
      i.product._id === productId
        ? { ...i, quantity: qty }
        : i
    )
  );
  try {
    await api.put(`/cart/update/${productId}`, { quantity: qty });
  } catch {
    fetchCart();
  }
};

  /* ================= TOTAL ================= */
  const total = cartItems.reduce((sum, item) => {
    if (!item.product) return sum;
    return sum + item.product.price * item.quantity;
  }, 0);

  const placeOrder = async () => {
    await loadAddresses();
    setShowAddressModal(true);
  };

  const confirmOrder = async () => {
    if (!selectedAddress) {
      alert("Select address");
      return;
    }

    await api.post("/orders/checkout", {
      address: selectedAddress
    });

    alert("Order placed");
    setShowAddressModal(false);
    fetchCart();
  };

  const addAddress = async () => {
    await api.post("/vendor/addresses", newAddress);
    setNewAddress({ label: "", line1: "", city: "", pincode: "" });
    loadAddresses();
  };

  const deleteAddress = async (index) => {
    await api.delete(`/vendor/addresses/${index}`);
    loadAddresses();
  };

  const formatAddress = (a) =>
    `${a.line1}, ${a.city} - ${a.pincode}`;

  const updateAddress = async () => {
    await api.put(`/vendor/addresses/${editingIndex}`, newAddress);

    setEditingIndex(null);
    setNewAddress({
      label: "",
      line1: "",
      city: "",
      pincode: ""
    });

    loadAddresses();
  };

  if (loading)
    return <div className="loader-container"><div className="loader"></div></div>;

  return (
    <VendorLayout>
      <Header title="Cart" />

      <main className="vendor-main">
        <div className="cart-page-root">

          <h2 className="page-title">Your Cart ({cartItems.length} items)</h2>

          {cartItems.length === 0 ? (
            <div className="empty-cart-state">
              <div className="empty-icon">🛒</div>
              <h3>Your cart is empty</h3>
              <button className="btn-primary" onClick={() => navigate("/vendor")}>
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="cart-grid">
              <div className="cart-items-list">
                {cartItems.filter(i => i.product).map((item) => (
                  <div className="admin-card cart-item-card" key={item.product._id}>
                    <img
                      src={`http://localhost:5000/uploads/${item.product.image}`}
                      alt=""
                      className="cart-item-img"
                    />

                    <div className="cart-item-info">
                      <h4>{item.product.name}</h4>
                      <div className="cart-item-details">
                        <span className="unit-price">₹{item.product.price}</span>

                          <button
                            className="qty-btn"
                            onClick={() => updateQty(item.product._id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            −
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
                        ₹{item.product.price * item.quantity}
                      </p>
                      <button className="btn-remove" onClick={() => removeItem(item.product._id)}>
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
                    <span>₹{total}</span>
                  </div>

                  <button className="btn-checkout" onClick={placeOrder}>
                    Proceed to Checkout
                  </button>
                </div>
              </aside>
            </div>
          )}

          {/* ================= ADDRESS MODAL ================= */}
          {showAddressModal && (
            <div className="address-modal">
              <div className="address-box pro-checkout">
                <div className="pro-left">
                  <h3>Select Delivery Address</h3>

                  <div className="address-list">
                    {addresses.map((a, i) => (
                      <div
                        key={i}
                        className={`address-card ${selectedAddress === formatAddress(a) ? "selected" : ""}`}
                        onClick={() => setSelectedAddress(formatAddress(a))}
                      >
                        <input
                          type="radio"
                          checked={selectedAddress === formatAddress(a)}
                          onChange={() => setSelectedAddress(formatAddress(a))}
                        />

                        <div>
                          <strong>{a.label}</strong>
                          <p>{formatAddress(a)}</p>

                          <div className="address-actions-row">
                            <button
                              className="btn-edit-address"
                              onClick={() => {
                                setEditingIndex(i);
                                setNewAddress({
                                  label: a.label || "",
                                  line1: a.line1 || "",
                                  city: a.city || "",
                                  pincode: a.pincode || ""
                                });
                              }}
                            >
                              Edit
                            </button>

                            <button
                              className="btn-delete-address"
                              onClick={() => deleteAddress(i)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="add-address-section">
                    <h4>Add New Address</h4>

                    <input
                      placeholder="Label (Home / Shop)"
                      value={newAddress.label}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, label: e.target.value })
                      }
                    />
                    <input
                      placeholder="Address line"
                      value={newAddress.line1}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, line1: e.target.value })
                      }
                    />
                    <input
                      placeholder="City"
                      value={newAddress.city}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, city: e.target.value })
                      }
                    />
                    <input
                      placeholder="Pincode"
                      value={newAddress.pincode}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, pincode: e.target.value })
                      }
                    />

                    <button
                      className="btn-save-address"
                      onClick={editingIndex !== null ? updateAddress : addAddress}
                    >
                      {editingIndex !== null ? "Update Address" : "Save Address"}
                    </button>
                  </div>
                </div>

                <div className="pro-right">
                  <h3>Order Summary</h3>

                  <div className="summary-row">
                    <span>Items</span>
                    <span>{cartItems.length}</span>
                  </div>

                  <div className="summary-row">
                    <span>Total</span>
                    <strong>₹{total}</strong>
                  </div>

                  <button className="btn-checkout" onClick={confirmOrder}>
                    Confirm Order
                  </button>

                  <button
                    className="btn-cancel"
                    onClick={() => setShowAddressModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <Footer />
        </div>
      </main>
    </VendorLayout>
  );
}