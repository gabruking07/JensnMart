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

  const [products, setProducts] = useState([]);
  const [cartQty, setCartQty] = useState({});
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingQty, setEditingQty] = useState(null);
  const [qtyValue, setQtyValue] = useState("");

  const [sortBy, setSortBy] = useState("");

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (!token || role !== "vendor") {
        navigate("/");
        return;
      }

      try {
        const profileRes = await api.get("/vendor/profile");
        setApproved(profileRes.data.approved);

        await fetchProducts();
        await fetchCategories();
      } catch (err) {
        console.error("Init error", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        const res = await api.get("/subcategories");
        setSubcategories(res.data || []);
      } catch (err) {
        console.error("Subcategory fetch failed");
      }
    };

    fetchSubcategories();
  }, []);

  const fetchProducts = async (sort = "") => {
    const res = await api.get(`/products?sort=${sort}`);
    setProducts(res.data || []);
  };

  const fetchCategories = async () => {
    const res = await api.get("/categories");
    setCategories(res.data || []);
  };

  let filteredProducts = products.filter((p) => {
    const matchCategory =
      !selectedCategory || p.category?._id === selectedCategory;

    const matchSubcategory =
      !selectedSubcategory || p.subcategory?._id === selectedSubcategory;

    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchCategory && matchSubcategory && matchSearch;
  });

  if (sortBy === "priceHigh") {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  if (sortBy === "priceLow") {
    filteredProducts.sort((a, b) => a.price - b.price);
  }

  if (sortBy === "new") {
    filteredProducts.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  if (sortBy === "bestsell") {
    filteredProducts.sort((a, b) => (b.sold || 0) - (a.sold || 0));
  }

  const saveQty = (productId, stock) => {
    let val = Number(qtyValue);

    if (isNaN(val) || val < 1) val = 1;
    if (val > stock) val = stock;

    setCartQty(prev => ({
      ...prev,
      [productId]: val
    }));

    setEditingQty(null);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    fetchProducts(value);
  };

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
                  {subcategories
                    .filter(s => !selectedCategory || s.category?._id === selectedCategory)
                    .map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                </select>
              </div>

              {/* SEARCH */}
              <div className="filter-item filter-item-search">
                <label>Search</label>
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>

              {/*  Price Range */}
              <div className="filter-item">
                <label>Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="">Default</option>
                  <option value="bestsell">🔥 Most Sold</option>
                  <option value="priceHigh">💰 Price High → Low</option>
                  <option value="priceLow">💰 Price Low → High</option>
                  <option value="new">🆕 New Arrivals</option>
                </select>
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
                        <button
                          onClick={() => decreaseQty(p._id)}
                          disabled={(cartQty[p._id] || 1) <= 1}
                        >
                          −
                        </button>

                        {editingQty === p._id ? (
                          <input
                            className="qty-input"
                            value={qtyValue}
                            autoFocus
                            onChange={(e) => setQtyValue(e.target.value)}
                            onBlur={() => saveQty(p._id, p.stock)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveQty(p._id, p.stock);
                              if (e.key === "Escape") setEditingQty(null);
                            }}
                          />
                        ) : (
                          <span
                            className="qty-number"
                            onClick={() => {
                              setEditingQty(p._id);
                              setQtyValue(cartQty[p._id] || 1);
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            {cartQty[p._id] || 1}
                          </span>
                        )}

                        <button
                          onClick={() => increaseQty(p._id)}
                          disabled={(cartQty[p._id] || 1) >= p.stock}
                        >
                          +
                        </button>
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