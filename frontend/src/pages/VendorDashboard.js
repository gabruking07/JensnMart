import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./VendorDashboard.css";
import VendorLayout from "./VendorLayout";

export default function VendorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [selectedCategory, setSelectedCategory] = useState("");
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
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

  useEffect(() => {
    if (!selectedCategory) {
      setSubcategories([]);
      setSelectedSubcategory("");
      return;
    }

    const fetchSub = async () => {
      try {
        const res = await api.get(`/subcategories/${selectedCategory}/subcategories`)
        setSubcategories(res.data || []);
        setSelectedSubcategory("");
      } catch (err) {
        console.error("Subcategory fetch failed");
      }
    };

    fetchSub();
  }, [selectedCategory]);

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

    const matchSubcategory =
      !selectedSubcategory || p.subcategory?._id === selectedSubcategory;

    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchPrice =
      p.price >= priceRange[0] &&
      p.price <= priceRange[1];

    return matchCategory && matchSubcategory && matchSearch && matchPrice;
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
    <VendorLayout>
      <Header title="Inventory" />
      <main className="vendor-main">
        <div className="vendor-layout">
          <div className="vendor-content">
            {!approved && (
              <div className="status-banner warning">
                Pending approval — cart disabled
              </div>
            )}

            {/* FILTER BAR */}
            <div className="filter-row-container">

              {/* CATEGORY */}
              <div className="filter-item">
                <label>Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* SUBCATEGORY */}
              <div className="filter-item">
                <label>Sub Category</label>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  disabled={!selectedCategory}
                >
                  <option value="">All</option>
                  {subcategories.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* SEARCH */}
              <div className="filter-item">
                <label>Search</label>
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/*  Price Range Slider */}
              <div className="filter-item">
                <label className="filter-label">Price Range</label>
                <div className="price-pill-row">
                  <span className="price-val">₹{priceRange[0].toLocaleString()}</span>

                  <div className="slider-track-box">
                    {/* <input
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
                  /> */}
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
                <p style={{ fontSize: '18px', marginTop: '16px', opacity: 1 }}>
                  Max available: ₹{realMax.toLocaleString()}
                </p>
              </div>
            </div>

            {/* PRODUCTS */}
            <div className="vendor-product-grid">
              {filteredProducts.map(p => (
                <div className="vendor-product-card" key={p._id}>
                  <div className="v-card-img">
                    <img src={`http://localhost:5000/uploads/${p.image}`} alt={p.name} />
                    <span className="stock-label">{p.stock} in stock</span>
                  </div>

                  <div className="v-card-body">
                    <h4>{p.name}</h4>
                    <p>₹{p.price}</p>

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
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Footer />
          </div>
        </div>
      </main>
    </VendorLayout>
  );
}