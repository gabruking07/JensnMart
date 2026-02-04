import { useEffect, useState } from "react";
import api from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./Products.css";

export default function Products({ darkMode, setDarkMode }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId) => {
    try {
      await api.post("/cart/add", { productId, quantity: 1 });
      alert("Added to cart! 🛒");
    } catch (err) {
      alert("Could not add to cart. Are you logged in?");
    }
  };

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  return (
    <div className={`products-page-root ${darkMode ? "dark-mode" : ""}`}>
      <Header title="Marketplace" darkMode={darkMode} setDarkMode={setDarkMode} />

      <main className="products-main">
        <div className="products-header-row">
          <div>
            <h2>Explore Products</h2>
            <p className="text-muted">Find the best deals from our verified vendors</p>
          </div>
          <div className="products-filter">
            <span>{products.length} Items Found</span>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="empty-state">
            <p>No products available right now. Check back later!</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((p) => (
              <div className="admin-card product-display-card" key={p._id}>
                <div className="product-img-wrapper">
                  <img
                    src={`http://localhost:5000/uploads/${p.image}`}
                    alt={p.name}
                    loading="lazy"
                  />
                  {p.stock < 5 && p.stock > 0 && (
                    <span className="badge warning">Low Stock</span>
                  )}
                  {p.stock === 0 && <span className="badge danger">Out of Stock</span>}
                </div>

                <div className="product-info">
                  <div className="category-tag">General</div>
                  <h4>{p.name}</h4>
                  
                  <div className="price-container">
                    <span className="current-price">₹{p.price.toLocaleString()}</span>
                  </div>

                  <button 
                    className="btn-add-cart"
                    disabled={p.stock === 0}
                    onClick={() => addToCart(p._id)}
                  >
                    {p.stock === 0 ? "Unavailable" : "Add to Cart"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}