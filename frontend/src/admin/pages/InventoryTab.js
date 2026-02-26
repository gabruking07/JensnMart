import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import "../admin.css";

export default function InventoryTab() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(products.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const visibleProducts = products.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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

  /* ================= UPDATE NAME ================= */
  const updateName = async (id, name) => {
    const trimmedName = String(name || "").trim();
    if (!trimmedName) {
      toast.error("Product name cannot be empty");
      loadProducts();
      return;
    }
    try {
      await api.put(`/admin/update-product-name/${id}`, { name: trimmedName });
      toast.success("Product name updated");
      loadProducts();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Name update failed");
      loadProducts();
    }
  };

  return (
    <div>
      <h1>Inventory</h1>
      <div className="inventory-toolbar">
        <p className="inventory-count">
          Showing {products.length === 0 ? 0 : startIndex + 1}-
          {Math.min(endIndex, products.length)} of {products.length} products
        </p>
        <div className="inventory-page-size">
          <label htmlFor="inventory-page-size">Items per page</label>
          <select
            id="inventory-page-size"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value={4}>4</option>
            <option value={8}>8</option>
            <option value={12}>12</option>
            <option value={16}>16</option>
          </select>
        </div>
      </div>

      <div className="inventory-grid">
        {visibleProducts.map((p) => (
          <div key={p._id} className="product-card">
            <img
              src={`http://localhost:5000/uploads/${p.image}`}
              alt=""
            />

            <div className="field">
              <label>Name</label>
              <input
                defaultValue={p.name}
                onBlur={(e) => updateName(p._id, e.target.value)}
              />
            </div>

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

      {products.length > 0 && (
        <div className="pagination-bar">
          <button
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`page-btn ${currentPage === page ? "active" : ""}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}

          <button
            className="page-btn"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
