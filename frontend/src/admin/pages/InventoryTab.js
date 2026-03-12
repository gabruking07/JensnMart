import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import "../admin.css";
import { confirmToast } from "../../utils/confirmToast";

export default function InventoryTab() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: "", price: "", stock: "" });

  const formatDisplayName = (value) => {
    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized) return "-";
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

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
    const linkedSearch = String(searchParams.get("search") || "").trim();
    if (linkedSearch) {
      setSearchTerm(linkedSearch);
    }
  }, [searchParams]);

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadSub();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, searchTerm, sortBy, selectedCategory]);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  let filteredProducts = products.filter((product) => {
    const categoryMatch = !selectedCategory || product.category?._id === selectedCategory;
    if (!categoryMatch) return false;
    if (!normalizedSearch) return true;

    return [
      product.name,
      product.category?.name,
      product.subcategory?.name,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });

  if (sortBy === "priceHigh") {
    filteredProducts.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  }

  if (sortBy === "priceLow") {
    filteredProducts.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  }

  if (sortBy === "new") {
    filteredProducts.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  if (sortBy === "bestsell") {
    filteredProducts.sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0));
  }

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const visibleProducts = filteredProducts.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /* ================= DELETE ================= */
  const deleteProduct = async (id) => {
    const confirmed = await confirmToast({
      title: "Delete product?",
      message: "This product will be removed from inventory.",
      confirmLabel: "Delete"
    });
    if (!confirmed) return;

    try {
      await api.delete(`/products/${id}`);
      toast.success("Deleted");
      loadProducts();
    } catch {
      toast.error("Delete failed");
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

  const startEdit = (product) => {
    setEditingId(product._id);
    setDraft({
      name: product.name || "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? ""),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({ name: "", price: "", stock: "" });
  };

  const saveEdit = async (id) => {
    const trimmedName = String(draft.name || "").trim();
    const price = Number(draft.price);
    const stock = Number(draft.stock);

    if (!trimmedName) {
      toast.error("Product name cannot be empty");
      return;
    }

    if (Number.isNaN(price) || price < 0) {
      toast.error("Price must be a valid number");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      toast.error("Stock must be a valid whole number");
      return;
    }

    try {
      await api.put(`/products/${id}`, {
        name: trimmedName,
        price,
        stock,
      });
      toast.success("Product updated");
      cancelEdit();
      loadProducts();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
    }
  };

  return (
    <div className="admin-inventory">
      <section className="vendor-storefront-strip">
        <div className="vendor-storefront-bar">
          <div className="vendor-storefront-brand">JensnMart</div>
          <div className="vendor-storefront-search">
            <input
              type="search"
              placeholder="Search for Grocery, Stores, Vegetable or Meat"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="vendor-dashboard-tools">
            <div className="filter-item vendor-dashboard-sort-card">
              <label>Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="">Default</option>
                <option value="bestsell">Most Sold</option>
                <option value="priceHigh">Price High to Low</option>
                <option value="priceLow">Price Low to High</option>
                <option value="new">New Arrivals</option>
              </select>
            </div>

            <div className="filter-item filter-item-search ai-chat-search-card">
              <div className="ai-chat-search-header">
                <span className="ai-chat-search-badge">AI Search</span>
                <label htmlFor="admin-ai-search">Ask inventory assistant</label>
              </div>
              <div className="ai-chat-input-row">
                <input
                  id="admin-ai-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ask AI to find products for inventory"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="vendor-storefront-categories">
          <div className="vendor-storefront-chip-row">
            <button
              type="button"
              className={`vendor-storefront-chip ${selectedCategory === "" ? "active" : ""}`}
              onClick={() => setSelectedCategory("")}
            >
              All
            </button>

            {categories.map((category) => (
              <button
                key={category._id}
                type="button"
                className={`vendor-storefront-chip ${selectedCategory === category._id ? "active" : ""}`}
                onClick={() => setSelectedCategory(category._id)}
              >
                {formatDisplayName(category.name)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="inventory-toolbar">
        <p className="inventory-count">
          Showing {filteredProducts.length === 0 ? 0 : startIndex + 1}-
          {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
        </p>
        <div className="inventory-toolbar-controls">
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
      </div>

      <div className="inventory-grid">
        {visibleProducts.map((p) => {
          const isEditing = editingId === p._id;
          const stockState = p.stock === 0 ? "out" : p.stock < 6 ? "low" : "ok";
          const stockLabel = p.stock === 0 ? "Out of stock" : p.stock < 6 ? "Low stock" : "In stock";

          return (
            <div key={p._id} className="product-card premium-product-card">
              <div className="product-media-wrap">
                <img
                  src={`http://localhost:5000/uploads/${p.image}`}
                  alt={p.name}
                />
                <span className={`stock-pill ${stockState}`}>{stockLabel}</span>
              </div>

              <div className="field">
                <label>Name</label>
                {isEditing ? (
                  <input
                    value={draft.name}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                ) : (
                  <p className="field-value">{p.name}</p>
                )}
              </div>

              <div className="field">
                <label>Price</label>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    value={draft.price}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, price: e.target.value }))
                    }
                  />
                ) : (
                  <p className="field-value">Rs {Number(p.price || 0).toLocaleString()}</p>
                )}
              </div>

              <div className="field">
                <label>Stock</label>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={draft.stock}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, stock: e.target.value }))
                    }
                  />
                ) : (
                  <p className="field-value">{p.stock}</p>
                )}
              </div>

              <div className="field">
                <label>Category</label>
                {isEditing ? (
                  <select
                    value={p.category?._id || ""}
                    onChange={(e) =>
                      updateCategory(p._id, e.target.value)
                    }
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {formatDisplayName(c.name)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="field-value">
                    {formatDisplayName(p.category?.name)}
                  </p>
                )}
              </div>

              <div className="field">
                <label>Sub Category</label>
                {isEditing ? (
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
                          {formatDisplayName(s.name)}
                        </option>
                      ))}
                  </select>
                ) : (
                  <p className="field-value">
                    {p.subcategory?.name
                      ? formatDisplayName(p.subcategory.name)
                      : "None"}
                  </p>
                )}
              </div>

              <div className="actions inventory-actions">
                {isEditing ? (
                  <button
                    className="edit-btn"
                    onClick={() => saveEdit(p._id)}
                  >
                    Save
                  </button>
                ) : (
                  <button
                    className="edit-btn"
                    onClick={() => startEdit(p)}
                  >
                    Edit
                  </button>
                )}
                <button
                  className="delete-btn"
                  onClick={() => deleteProduct(p._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <p className="inventory-empty-state">No products match your search.</p>
      )}

      {filteredProducts.length > 0 && (
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
