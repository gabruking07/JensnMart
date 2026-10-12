<<<<<<< HEAD
/** Administrator inventory tab screen; loads and updates the corresponding marketplace records through the shared API client. */

=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import "../admin.css";
import { confirmToast } from "../../components/confirmToast";

<<<<<<< HEAD
/** Renders the inventory tab interface and coordinates the state and actions for this screen or reusable component. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
export default function InventoryTab() {
  const LOW_STOCK_THRESHOLD = 100;
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [selectedStockStatus, setSelectedStockStatus] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: "", price: "", stock: "", image: null });

<<<<<<< HEAD
  /** Cleans a product name for consistent display in the inventory table. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
  const formatDisplayName = (value) => {
    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized) return "-";
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

<<<<<<< HEAD
    /** Fetches catalog products and refreshes the screen's inventory data. */
    const loadProducts = async () => {
=======
  const loadProducts = async () => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch {
      toast.error("Failed to load products");
    }
  };

<<<<<<< HEAD
    /** Fetches categories used to populate the screen and its selection controls. */
    const loadCategories = async () => {
=======
  const loadCategories = async () => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch {}
  };

<<<<<<< HEAD
    /** Fetches subcategories used by the category or product form. */
    const loadSub = async () => {
=======
  const loadSub = async () => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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
  }, [itemsPerPage, searchTerm, sortBy, selectedCategory, selectedSubcategory, selectedStockStatus]);

  const visibleSubcategoryChips = selectedCategory
    ? subcategories.filter((subcategory) => subcategory.category?._id === selectedCategory)
    : [];

  const normalizedSearch = searchTerm.trim().toLowerCase();
  let filteredProducts = products.filter((product) => {
    const categoryMatch = !selectedCategory || product.category?._id === selectedCategory;
    const subcategoryMatch = !selectedSubcategory || product.subcategory?._id === selectedSubcategory;
    const quantity = Number(product.stock || 0);
    const stockStatus =
      quantity === 0 ? "out" : quantity < LOW_STOCK_THRESHOLD ? "low" : "ok";
    const stockStatusMatch = !selectedStockStatus || stockStatus === selectedStockStatus;
    if (!categoryMatch) return false;
    if (!subcategoryMatch) return false;
    if (!stockStatusMatch) return false;
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

  const stockSummary = filteredProducts.reduce(
    (summary, product) => {
      const quantity = Number(product.stock || 0);

      if (quantity === 0) {
        summary.out += 1;
      } else if (quantity < LOW_STOCK_THRESHOLD) {
        summary.low += 1;
      } else {
        summary.ok += 1;
      }

      return summary;
    },
    { ok: 0, low: 0, out: 0 }
  );

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
<<<<<<< HEAD
    /** Deletes the selected product and refreshes the inventory list. */
    const deleteProduct = async (id) => {
=======
  const deleteProduct = async (id) => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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
<<<<<<< HEAD
    /** Changes the selected product's category through the inventory API. */
    const updateCategory = async (id, category) => {
=======
  const updateCategory = async (id, category) => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
    try {
      await api.put(`/products/${id}`, { category });
      loadProducts();
    } catch {
      toast.error("Category update failed");
    }
  };

<<<<<<< HEAD
    /** Changes the selected product's subcategory through the inventory API. */
    const updateSub = async (id, subcategory) => {
=======
  const updateSub = async (id, subcategory) => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
    try {
      await api.put(`/products/${id}`, { subcategory });
      loadProducts();
    } catch {
      toast.error("Subcategory update failed");
    }
  };

<<<<<<< HEAD
    /** Copies the selected product fields into the inline inventory editor. */
    const startEdit = (product) => {
=======
  const startEdit = (product) => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
    setEditingId(product._id);
    setDraft({
      name: product.name || "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? ""),
      image: null,
    });
  };

<<<<<<< HEAD
    /** Discards the unsaved inventory edits and exits edit mode. */
    const cancelEdit = () => {
=======
  const cancelEdit = () => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
    setEditingId(null);
    setDraft({ name: "", price: "", stock: "", image: null });
  };

<<<<<<< HEAD
    /** Validates and saves the inventory row currently being edited. */
    const saveEdit = async (id) => {
=======
  const saveEdit = async (id) => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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
      const data = new FormData();
      data.append("name", trimmedName);
      data.append("price", String(price));
      data.append("stock", String(stock));

      if (draft.image) {
        data.append("image", draft.image);
      }

      await api.put(`/products/${id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Product updated");
      cancelEdit();
      loadProducts();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
    }
  };

<<<<<<< HEAD
    /** Switches the inventory list between all products and its stock filter. */
    const toggleStockFilter = (status) => {
=======
  const toggleStockFilter = (status) => {
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
    setSelectedStockStatus((currentStatus) => (currentStatus === status ? "" : status));
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
              <div className="inventory-select-wrap">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="">Default ⚙️</option>
                  <option value="bestsell">Most Sold 🔥</option>
                  <option value="priceHigh">Price High to Low 📈</option>
                  <option value="priceLow">Price Low to High 📉</option>
                  <option value="new">New Arrivals ✨</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="vendor-storefront-categories">
          <div className="vendor-storefront-chip-row">
            <button
              type="button"
              className={`vendor-storefront-chip ${selectedCategory === "" ? "active" : ""}`}
              onClick={() => {
                setSelectedCategory("");
                setSelectedSubcategory("");
              }}
            >
              All
            </button>

            {categories.map((category) => (
              <button
                key={category._id}
                type="button"
                className={`vendor-storefront-chip ${selectedCategory === category._id ? "active" : ""}`}
                onClick={() => {
                  setSelectedCategory(category._id);
                  setSelectedSubcategory("");
                }}
              >
                {formatDisplayName(category.name)}
              </button>
            ))}
          </div>
        </div>

        {selectedCategory && (
          <div className="vendor-storefront-categories">
            <div className="vendor-section-heading">
              <h2>Subcategories</h2>
              <p>Refine the selected category before editing or reviewing inventory.</p>
            </div>

            <div className="vendor-storefront-chip-row">
              <button
                type="button"
                className={`vendor-storefront-chip ${selectedSubcategory === "" ? "active" : ""}`}
                onClick={() => setSelectedSubcategory("")}
              >
                All
              </button>

              {visibleSubcategoryChips.map((subcategory) => (
                <button
                  key={subcategory._id}
                  type="button"
                  className={`vendor-storefront-chip ${selectedSubcategory === subcategory._id ? "active" : ""}`}
                  onClick={() => setSelectedSubcategory(subcategory._id)}
                >
                  {formatDisplayName(subcategory.name)}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="inventory-toolbar">
        <div className="inventory-toolbar-summary">
          <p className="inventory-count">
            Showing {filteredProducts.length === 0 ? 0 : startIndex + 1}-
            {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
          </p>

          <div className="inventory-stock-summary">
            <button
              type="button"
              className={`inventory-stock-card ok ${selectedStockStatus === "ok" ? "active" : ""}`}
              onClick={() => toggleStockFilter("ok")}
            >
              <span className="inventory-stock-card-label">In stock</span>
              <strong>{stockSummary.ok}</strong>
            </button>
            <button
              type="button"
              className={`inventory-stock-card low ${selectedStockStatus === "low" ? "active" : ""}`}
              onClick={() => toggleStockFilter("low")}
            >
              <span className="inventory-stock-card-label">Low stock</span>
              <strong>{stockSummary.low}</strong>
            </button>
            <button
              type="button"
              className={`inventory-stock-card out ${selectedStockStatus === "out" ? "active" : ""}`}
              onClick={() => toggleStockFilter("out")}
            >
              <span className="inventory-stock-card-label">Out of stock</span>
              <strong>{stockSummary.out}</strong>
            </button>
          </div>
        </div>

        <div className="inventory-toolbar-controls">
          <div className="inventory-page-size">
            <label htmlFor="inventory-page-size">Items per page</label>
            <select
              id="inventory-page-size"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={18}>18</option>
              <option value={24}>24</option>
            </select>
          </div>
        </div>
      </div>

      <div className="inventory-grid">
        {visibleProducts.map((p) => {
          const isEditing = editingId === p._id;
          const stockQuantity = Number(p.stock || 0);
          const stockState =
            stockQuantity === 0 ? "out" : stockQuantity < LOW_STOCK_THRESHOLD ? "low" : "ok";
          const stockLabel =
            stockQuantity === 0
              ? "Out of stock"
              : stockQuantity < LOW_STOCK_THRESHOLD
                ? "Low stock"
                : "In stock";

          return (
            <div key={p._id} className="product-card premium-product-card">
              <div className="product-media-wrap">
                <img
                  src={`/uploads/${p.image}`}
                  alt={p.name}
                />
                <span className={`stock-pill ${stockState}`}>{stockLabel}</span>
                {isEditing && (
                  <label className="product-image-edit-trigger">
                    <span>{draft.image ? "Image selected" : "Change image"}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          image: e.target.files?.[0] || null,
                        }))
                      }
                    />
                  </label>
                )}
              </div>

              <div className="product-card-topline">
                <div className="field product-name-field">
                  {isEditing ? (
                    <input
                      placeholder="Name"
                      value={draft.name}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  ) : (
                    <p className="field-value product-title">{p.name}</p>
                  )}
                </div>

                <div className="field product-price-field">
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      placeholder="Price"
                      value={draft.price}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, price: e.target.value }))
                      }
                    />
                  ) : (
                    <p className="field-value product-price">₹ {Number(p.price || 0).toLocaleString()}</p>
                  )}
                </div>
              </div>

              <div className="product-meta-grid">
                <div className="field meta-card">
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
                    <p className="field-value">
                      {stockQuantity} {stockQuantity === 1 ? "unit" : "units"}
                    </p>
                  )}
                </div>

                <div className="field meta-card">
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

                <div className="field meta-card meta-card-wide">
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
              </div>

              <div className="actions inventory-actions">
                {isEditing ? (
                  <>
                    <button
                      className="edit-btn"
                      onClick={() => saveEdit(p._id)}
                    >
                      Save
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </>
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
