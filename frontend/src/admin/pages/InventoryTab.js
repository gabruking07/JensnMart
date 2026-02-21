import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import "../admin.css";

export default function InventoryTab() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const loadProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch {
      toast.error("Failed to load products");
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch {}
  };

  const loadSub = async () => {
    try {
      const res = await api.get("/subcategories");
      setSubcategories(res.data);
    } catch {}
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadSub();
  }, []);

  /* ================= DELETE ================= */
  const deleteProduct = async (id) => {
    if (!window.confirm("Delete product?")) return;

    try {
      await api.delete(`/products/${id}`);
      toast.success("Deleted");
      loadProducts();
    } catch {
      toast.error("Delete failed");
    }
  };

  /* ================= UPDATE PRICE ================= */
  const updatePrice = async (id, price) => {
    try {
      await api.put(`/admin/update-price/${id}`, { price });
      toast.success("Price updated");
      loadProducts();
    } catch {
      toast.error("Update failed");
    }
  };

  /* ================= UPDATE STOCK ================= */
  const updateStock = async (id, stock) => {
    try {
      await api.put(`/products/${id}`, { stock });
      toast.success("Stock updated");
      loadProducts();
    } catch {
      toast.error("Stock update failed");
    }
  };

  /* ================= UPDATE CATEGORY ================= */
  const updateCategory = async (id, category) => {
    try {
      await api.put(`/products/${id}`, { category });
      loadProducts();
    } catch {
      toast.error("Category update failed");
    }
  };

  const updateSub = async (id, subcategory) => {
    try {
      await api.put(`/products/${id}`, { subcategory });
      loadProducts();
    } catch {
      toast.error("Subcategory update failed");
    }
  };

  return (
    <div>
      <h1>Inventory</h1>

      <div className="inventory-grid">
        {products.map((p) => (
          <div key={p._id} className="product-card">
            <img
              src={`http://localhost:5000/uploads/${p.image}`}
              alt=""
            />

            <h3>{p.name}</h3>

            {/* PRICE */}
            <div className="field">
              <label>Price</label>
              <input
                defaultValue={p.price}
                onBlur={(e) =>
                  updatePrice(p._id, e.target.value)
                }
              />
            </div>

            {/* STOCK */}
            <div className="field">
              <label>Stock</label>
              <input
                defaultValue={p.stock}
                onBlur={(e) =>
                  updateStock(p._id, e.target.value)
                }
              />
            </div>

            {/* CATEGORY */}
            <div className="field">
              <label>Category</label>
              <select
                value={p.category?._id || ""}
                onChange={(e) =>
                  updateCategory(p._id, e.target.value)
                }
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* SUBCATEGORY */}
            <div className="field">
              <label>Sub</label>
              <select
                value={p.subcategory?._id || ""}
                onChange={(e) =>
                  updateSub(p._id, e.target.value)
                }
              >
                <option value="">None</option>
                {subcategories
                  .filter(
                    (s) =>
                      s.category?._id === p.category?._id
                  )
                  .map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>

            <button
              className="delete-btn"
              onClick={() => deleteProduct(p._id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}