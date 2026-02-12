import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./VendorDashboard.css";

export default function VendorDashboard() {
  const navigate = useNavigate();
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    api.get("/vendor/profile").then(res => {
      setApproved(res.data.approved);
    });
  }, []);

  const [products, setProducts] = useState([]);
  const [cartQty, setCartQty] = useState({});
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [maxPrice, setMaxPrice] = useState(0);
  const [priceRange, setPriceRange] = useState(0);
  const [minPrice, setMinPrice] = useState(0);
  const [realMax, setRealMax] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "vendor") {
      navigate("/");
      return;
    }

    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      const data = res.data || [];

      setProducts(data);

      if (data.length > 0) {
        const prices = data.map(p => p.price);
        const actualMax = Math.max(...prices);
        const roundedMax = Math.ceil(actualMax / 100) * 100;
        setRealMax(actualMax);
        setMaxPrice(roundedMax);
        setPriceRange([0, roundedMax]);
      }
    } catch (err) {
      console.error("Product fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const res = await api.get("/categories");
    setCategories(res.data || []);
  };

  const filteredProducts = products.filter((p) => {
    const matchCategory =
      !selectedCategory || p.category?._id === selectedCategory;

    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchPrice =
      p.price >= priceRange[0] &&
      p.price <= priceRange[1];
    return matchCategory && matchSearch && matchPrice;
  });


  const increaseQty = (id) => {
    setCartQty((prev) => ({ ...prev, [id]: (prev[id] || 1) + 1 }));
  };

  const decreaseQty = (id) => {
    setCartQty((prev) => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) - 1) }));
  };

  const addToCart = async (productId) => {
    try {
      const qty = cartQty[productId] || 1;
      await api.post("/cart/add", { productId, quantity: qty });
      alert("Added to cart successfully!");
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || "Add to cart failed");
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  return (
    <div className="vendor-root" >
      <Header title="Vendor Portal" />

      {!approved && (
        <div className="status-banner warning">
          <p>⚠️ Your account is currently <strong>Pending Approval</strong>. You can browse products but cannot add to cart yet.</p>
        </div>
      )}

      <main className="vendor-main">
        <header className="vendor-content-header">
          <div className="welcome-text">
            <h2>Welcome, Partner</h2>
            <p>Browse the warehouse and restock your inventory</p>
          </div>
          <div className="vendor-actions">
            <button
              className="btn-secondary"
              onClick={() => navigate("/vendor/orders")}
            >
              My Orders
            </button>
            <button className="btn-secondary" onClick={() => navigate("/vendor/profile")}>My Profile</button>
            <Link to="/cart" className="cart-shortcut">
              <span className="cart-icon">🛒</span>
              <span>View Cart</span>
            </Link>
          </div>
        </header>

        {/* Single Row Filter Bar */}
        <div className="filter-row-container">

          {/* 1. Category Dropdown */}
          <div className="filter-item">
            <label className="filter-label">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* 2. Search Input */}
          <div className="filter-item search-grow">
            <label className="filter-label">Search Products</label>
            <input
              type="text"
              placeholder="Type to search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
            />
          </div>

          {/* 3. Price Range Slider */}
          <div className="filter-item">
            <label className="filter-label">Price Range</label>
            <div className="price-pill-row">
              <span className="price-val">₹{priceRange[0].toLocaleString()}</span>

              <div className="slider-track-box">
                <input
                  type="range"
                  min={minPrice}
                  max={maxPrice}
                  step="100"
                  value={priceRange[0]}
                  style={{ zIndex: priceRange[0] > maxPrice / 2 ? 5 : 4 }}
                  onChange={(e) => {
                    const value = Math.min(Number(e.target.value), priceRange[1] - 100);
                    setPriceRange([value, priceRange[1]]);
                  }}
                  className="dual-range-input"
                />
                <input
                  type="range"
                  min={minPrice}
                  max={maxPrice}
                  step="100"
                  value={priceRange[1]}
                  style={{ zIndex: priceRange[1] < maxPrice / 2 ? 5 : 4 }}
                  onChange={(e) => {
                    const value = Math.max(Number(e.target.value), priceRange[0] + 100);
                    setPriceRange([priceRange[0], value]);
                  }}
                  className="dual-range-input"
                />
              </div>

              <span className="price-val">₹{priceRange[1].toLocaleString()}</span>
            </div>
            <p style={{ fontSize: '10px', marginTop: '15px', opacity: 0.6 }}>
              Max available: ₹{realMax.toLocaleString()}
            </p>
          </div>
        </div>
        {products.length === 0 ? (
          <div className="empty-state">
            <p>No inventory available currently.</p>
          </div>
        ) : (
          <div className="vendor-product-grid">
            {filteredProducts.map((p) => (
              <div className="admin-card vendor-product-card" key={p._id}>
                <div className="v-card-img">
                  <img src={`http://localhost:5000/uploads/${p.image}`} alt={p.name} />
                  <span className={`stock-label ${p.stock > 0 ? 'in' : 'out'}`}>
                    {p.stock > 0 ? `${p.stock} in stock` : 'Out of Stock'}
                  </span>
                </div>

                <div className="v-card-body">
                  <h4>{p.name}</h4>
                  <p className="product-category">
                    Category: <strong>{p.category?.name || "N/A"}</strong>
                  </p>
                  <p className="v-price">₹{p.price}</p>
                  {p.stock > 0 ? (
                    <div className="v-purchase-zone">
                      <div className="v-qty-selector">
                        <button onClick={() => decreaseQty(p._id)}>-</button>
                        <span>{cartQty[p._id] || 1}</span>
                        <button onClick={() => increaseQty(p._id)}>+</button>
                      </div>

                      <button
                        className="v-add-btn"
                        disabled={!approved}
                        onClick={() => addToCart(p._id)}
                      >
                        {approved ? "Add to Cart" : "Pending"}
                      </button>
                    </div>
                  ) : (
                    <button className="v-add-btn disabled" disabled>Restocking Soon</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="vendor-footer-actions">
          <button className="logout-btn-outline" onClick={logout}>Sign Out</button>
        </div>
      </main>
      <Footer />
    </div>
  );
}