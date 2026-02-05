import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import jsPDF from "jspdf";
import toast from "react-hot-toast";

import "./AdminDashboard.css";

import Header from "../components/Header";
import Footer from "../components/Footer";
import ConfirmModal from "../components/ConfirmModal";

export default function AdminDashboard({ darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  /* ===================== STATE ===================== */

  // Core data
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);

  // Admin specific
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [commission, setCommission] = useState(0);

  // UI state
  const [activeTab, setActiveTab] = useState("products");
  const [loading, setLoading] = useState(true);

  // Modals
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);

  // Vendor 
  const [vendorEmail, setVendorEmail] = useState("");
  const [vendorPassword, setVendorPassword] = useState("");
  const [newVendorEmail, setNewVendorEmail] = useState("");
  const [newVendorPassword, setNewVendorPassword] = useState("");
  const [editVendorId, setEditVendorId] = useState(null);
  const [editVendorEmail, setEditVendorEmail] = useState("");

  // Inventory edit
  const [editPriceId, setEditPriceId] = useState(null);
  const [newPrice, setNewPrice] = useState("");
  const [editStockId, setEditStockId] = useState(null);
  const [newStock, setNewStock] = useState("");
  const [editCategoryProductId, setEditCategoryProductId] = useState(null);

  // Add product
  const [pname, setPname] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState(0);
  const [image, setImage] = useState(null);
  const [categoryId, setCategoryId] = useState("");

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Category management
  const [newCategory, setNewCategory] = useState("");

  // Category edit
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");

  /* ===================== AUTH ===================== */
  useEffect(() => {
    if (!["admin", "manager"].includes(role)) {
      navigate("/");
      return;
    }
    loadAll();
  }, []);

  useEffect(() => {
    fetchProducts(selectedCategory);
  }, [selectedCategory]);

  /* ===================== LOAD ALL ===================== */
  const loadAll = async () => {
    try {
      const tasks = [fetchOrders(), fetchCategories(), fetchProducts()];

      if (role === "admin") {
        tasks.push(fetchVendors(), fetchCommission(), fetchPendingAdmins());
      }

      if (role === "manager") {
        tasks.push(fetchVendors());
      }

      await Promise.all(tasks);
    } finally {
      setLoading(false);
    }
  };

  /* ===================== API CALLS ===================== */

  const fetchVendors = async () => {
    const res = await api.get("/api/vendor/vendors");
    setVendors(res.data || []);
  };

  const fetchProducts = async (category = "") => {
    const res = await api.get("/products", {
      params: category ? { category } : {}
    });
    setProducts(res.data || []);
  };

  const fetchOrders = async () => {
    const res = await api.get("/orders/admin");
    setOrders(res.data || []);
  };

  const fetchCategories = async () => {
    const res = await api.get("/categories");
    setCategories(res.data || []);
  };

  const fetchPendingAdmins = async () => {
    const res = await api.get("/api/admin/pending-admins");
    setPendingAdmins(res.data || []);
  };

  const fetchCommission = async () => {
    const res = await api.get("/orders/commission");
    setCommission(res.data?.total || 0);
  };

  /* ===================== DERIVED ===================== */

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const completedOrders = orders.filter((o) => o.status === "Completed");

  const analytics = {
    totalOrders: orders.length,
    completedCount: completedOrders.length,
    cancelledCount: orders.filter((o) => o.status === "Cancelled").length,
    totalSales: completedOrders.reduce((sum, o) => sum + o.total, 0)
  };

  const categoryHasProducts = (categoryId) => {
    // Case 1: backend sends productCount
    const category = categories.find(c => c._id === categoryId);
    if (category?.productCount !== undefined) {
      return category.productCount > 0;
    }

    // Case 2: check in products list
    return products.some(p => p.category === categoryId);
  };

  /* ===================== ACTIONS ===================== */

  const createVendor = async () => {
    if (!vendorEmail || !vendorPassword) {
      toast.error("Enter email & password");
      return;
    }

    try {
      const res = await api.post("/api/admin/create-vendor", {
        email: vendorEmail,
        password: vendorPassword
      });

      toast.success("Vendor created");

      setVendors(prev => [...prev, res.data]); // optimistic update

      setVendorEmail("");
      setVendorPassword("");
    } catch (err) {
      console.log(err);
      toast.error(err.response?.data?.message || "Create failed");
    }
  };

  const addVendor = async () => {
    if (!newVendorEmail || !newVendorPassword) {
      toast.error("Enter email & password");
      return;
    }

    try {
      await api.post("/api/admin/create-vendor", {
        email: newVendorEmail,
        password: newVendorPassword
      });

      toast.success("Vendor created");
      setNewVendorEmail("");
      setNewVendorPassword("");
      fetchVendors();
    } catch (err) {
      toast.error(err.response?.data?.message || "Create failed");
    }
  };

  const updateVendor = async (id) => {
    try {
      await api.put(`/api/admin/vendor/${id}`, {
        email: editVendorEmail
      });

      toast.success("Vendor updated");
      setEditVendorId(null);
      fetchVendors();
    } catch {
      toast.error("Update failed");
    }
  };

  const approveUser = async (id) => {
    await api.put(`/api/admin/approve-admin/${id}`);
    fetchPendingAdmins();
  };

  const rejectUser = async (id) => {
    await api.delete(`/api/admin/reject-user/${id}`);
    fetchPendingAdmins();
  };

  const approveVendor = async (id) => {
    await api.put(`/admin/approve/${id}`);
    fetchVendors();
  };

  const rejectVendor = async (id) => {
    await api.delete(`/admin/reject-vendor/${id}`);
    fetchVendors();
  };

  const updatePrice = async () => {
    const product = products.find(p => p._id === editPriceId);
    if (!product) return;

    if (Number(newPrice) === product.price) {
      toast("Price unchanged", { icon: "ℹ️" });
      return;
    }

    try {
      await api.put(`/products/${editPriceId}`, {
        price: Number(newPrice)
      });

      setProducts(prev =>
        prev.map(p =>
          p._id === editPriceId
            ? { ...p, price: Number(newPrice) }
            : p
        )
      );

      toast.success("Price updated");

      setEditPriceId(null);
      setNewPrice("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Price update failed");
    }
  };

  const updateStockValue = async (id) => {
    const product = products.find(p => p._id === id);
    if (!product) return;

    if (Number(newStock) === product.stock) {
      toast("Stock unchanged", { icon: "ℹ️" });
      return;
    }

    try {
      await api.put(`/products/${id}`, {
        stock: Number(newStock)
      });

      setProducts(prev =>
        prev.map(p =>
          p._id === id
            ? { ...p, stock: Number(newStock) }
            : p
        )
      );

      toast.success("Stock updated");

      setEditStockId(null);
      setNewStock("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Stock update failed");
    }
  };

  const deleteProduct = (id) => {
    setConfirmAction(() => async () => {
      await api.delete(`/admin/product/${id}`);
      fetchProducts(selectedCategory);
      setShowConfirm(false);
    });
    setShowConfirm(true);
  };

  const requestStatusChange = (orderId, status) => {
    setConfirmAction(() => async () => {
      await api.put(`/orders/status/${orderId}`, { status });
      fetchOrders();
      setPendingStatusChange(null);
      setShowConfirm(false);
    });
    setPendingStatusChange({ orderId, status });
    setShowConfirm(true);
  };

  const downloadInvoice = (order) => {
    const doc = new jsPDF();
    doc.text("INVOICE", 14, 20);
    doc.text(`Order ID: ${order._id}`, 14, 30);
    let y = 50;
    order.products.forEach((p, i) => {
      doc.text(`${i + 1}. ${p.name} x ${p.qty} = ₹${p.price}`, 14, y);
      y += 8;
    });
    doc.text(`Total: ₹${order.total}`, 14, y + 10);
    doc.save(`invoice-${order._id}.pdf`);
  };

  const addProduct = async () => {
    const formData = new FormData();
    formData.append("name", pname);
    formData.append("price", price);
    formData.append("stock", stock);
    formData.append("category", categoryId);
    formData.append("image", image);

    await api.post("/products", formData);
    setPname("");
    setPrice("");
    setStock(0);
    setImage(null);
    setCategoryId("");
    fetchProducts();
    setActiveTab("products");
  };

  const getCategoryName = (product) => {
    if (!product.category) return "Uncategorized";

    if (typeof product.category === "object") {
      return product.category.name;
    }

    const found = categories.find(c => c._id === product.category);
    return found ? found.name : "Uncategorized";
  };

  const addCategory = async () => {
    if (!newCategory.trim()) {
      toast.error("Category name required");
      return;
    }

    try {
      await api.post("/categories", { name: newCategory });
      toast.success("Category Added");
      setNewCategory("");
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add category");
    }
  };

  const deleteCategory = (id) => {
    setConfirmAction(() => async () => {
      try {
        await api.delete(`/categories/${id}`);
        toast.success("Category deleted");
        fetchCategories();
      } catch {
        toast.error("Delete Failed");
      } finally {
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const updateCategory = async (id) => {
    const oldCategories = [...categories];

    setCategories((prev) =>
      prev.map((c) =>
        c._id === id ? { ...c, name: editCategoryName } : c
      )
    );

    setEditCategoryId(null);

    try {
      await api.put(`/categories/${id}`, {
        name: editCategoryName
      });
      toast.success("Category Updated");
    } catch {
      setCategories(oldCategories);
      toast.error("Update Failed");
    }
  };

  const updateProductCategory = async (productId, newCategoryId) => {
    const categoryObj = categories.find(c => c._id === newCategoryId);

    try {
      await api.put(`/products/${productId}`, {
        category: newCategoryId
      });

      toast.success("Category updated");

      setProducts(prev =>
        prev.map(p =>
          p._id === productId
            ? { ...p, category: categoryObj }
            : p
        )
      );

      setEditCategoryProductId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const getCategoryColor = (key = "") => {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 85%)`;
  };

  const getCategoryTextColor = (name = "") => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, 30%)`;
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const getStatusClass = (status) =>
    `status-badge status-${status.toLowerCase()}`;

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  /* ===================== UI ===================== */

  return (
    <div className={`admin-dashboard-container ${darkMode ? "dark-mode" : ""}`}>
      {/* ===================== SIDEBAR ===================== */}
      <aside className="admin-sidebar">
        <h3>Admin Panel</h3>

        <button onClick={() => setActiveTab("products")}>📦 Inventory</button>
        <button onClick={() => setActiveTab("vendors")}>🏪 Vendors</button>
        {role === "admin" && (
          <button onClick={() => setActiveTab("Admins")}> Admins</button>
        )}
        <button onClick={() => setActiveTab("orders")}>🧾 Orders</button>
        <button onClick={() => setActiveTab("add")}>➕ Add Product</button>
        <button onClick={() => setActiveTab("categories")}>🏷 Categories</button>
        <button onClick={() => setActiveTab("reports")}>📊 Reports</button>

        <button className="logout-btn-sidebar" onClick={logout}>
          🚪 Logout
        </button>
      </aside>

      {/* ===================== MAIN ===================== */}
      <main className="admin-main">
        <Header title="Admin Dashboard" darkMode={darkMode} setDarkMode={setDarkMode} />

        <div className="content-padding">
          {/* ===================== INVENTORY ===================== */}
          {activeTab === "products" && (
            <>
              {/* FILTER BAR */}
              <div className="filter-header">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* PRODUCT GRID */}
              <div className="product-grid">
                {filteredProducts.map((p) => (
                  <div className="glass-card" key={p._id}>
                    <img
                      src={`http://localhost:5000/uploads/${p.image}`}
                      alt={p.name}
                    />

                    <h5 className="product-name">{p.name}</h5>

                    {/* CATEGORY */}
                    {editCategoryProductId === p._id ? (
                      <select
                        className="category-select"
                        value={
                          typeof p.category === "object"
                            ? p.category._id
                            : p.category || ""
                        }
                        autoFocus
                        onChange={(e) => {
                          updateProductCategory(p._id, e.target.value);
                        }}
                        onBlur={() => setEditCategoryProductId(null)}
                      >
                        <option value="">Select category</option>
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className="category-pill"
                        style={{
                          backgroundColor: getCategoryColor(
                            typeof p.category === "object" ? p.category._id : p.category
                          ),
                          color: getCategoryTextColor(
                            typeof p.category === "object" ? p.category._id : p.category
                          ),
                          cursor: "pointer"
                        }}
                        onClick={() => setEditCategoryProductId(p._id)}
                      >
                        {getCategoryName(p)}
                      </span>
                    )}

                    {/* PRICE EDIT */}
                    {editPriceId === p._id ? (
                      <div className="inline-edit">
                        <input
                          type="number"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                        />
                        <button onClick={updatePrice}
                          disabled={Number(newPrice) === p.price}
                        >Save</button>
                        <button
                          onClick={() => {
                            setEditPriceId(null);
                            setNewPrice("");
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="row-between">
                        <span className="value-text">₹{p.price}</span>
                        <button
                          className="edit-icon"

                          onClick={() => {
                            setEditPriceId(p._id);
                            setNewPrice(p.price);
                          }}
                          title="Edit price"
                        >
                          ✏️
                        </button>
                      </div>
                    )}

                    {/* STOCK EDIT */}
                    {editStockId === p._id ? (
                      <div className="inline-edit">
                        <input
                          type="number"
                          value={newStock}
                          onChange={(e) => setNewStock(e.target.value)}
                        />
                        <button
                          onClick={() => updateStockValue(p._id)}
                          disabled={Number(newStock) === p.stock}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditStockId(null);
                            setNewStock("");
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="row-between">
                        <span className="value-text">Stock: {p.stock}</span>
                        <button
                          className="edit-icon"
                          onClick={() => {
                            setEditStockId(p._id);
                            setNewStock(p.stock);
                          }}
                          title="Edit stock"
                        >
                          ✏️
                        </button>
                      </div>
                    )}

                    {/* DELETE */}
                    <button
                      className="delete-btn"
                      onClick={() => deleteProduct(p._id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ===================== VENDORS TAB ===================== */}
          {activeTab === "vendors" && (
            <div className="form-container">
              <h3>Create Vendor</h3>

              <input
                placeholder="Vendor Email"
                value={vendorEmail}
                onChange={(e) => setVendorEmail(e.target.value)}
              />

              <input
                placeholder="Password"
                value={vendorPassword}
                onChange={(e) => setVendorPassword(e.target.value)}
              />

              <button onClick={createVendor}>Create Vendor</button>

              <h3 style={{ marginTop: 30 }}>All Vendors</h3>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {vendors.map(v => (
                    <tr key={v._id}>
                      <td>{v.email}</td>
                      <td>{v.approved ? "Active" : "Pending"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ===================== ADMINS APPROVALS ===================== */}
          {activeTab === "admin" && role === "admin" && (
            <div className="vendor-list">

              {/* ADMIN / MANAGER APPROVALS */}
              {pendingAdmins.length > 0 && (
                <>
                  <h3>Pending Admin / Manager Approvals</h3>

                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingAdmins.map(user => (
                        <tr key={user._id}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{user.role}</td>
                          <td>
                            <button onClick={() => approveUser(user._id)}>Approve</button>
                            <button onClick={() => rejectUser(user._id)}>Reject</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}

          {/* ===================== ORDERS ===================== */}
          {activeTab === "orders" && (
            <div className="orders-container">
              {orders.map((o) => (
                <div key={o._id} className="admin-card order-card-wide">

                  {/* HEADER */}
                  <div className="order-header">
                    <span className="order-id">Order :#{o._id.slice(-6)}</span>

                    <span className={getStatusClass(o.status)}>
                      {o.status}
                    </span>

                    <div className="order-actions">
                      <select
                        value={o.status}
                        onChange={(e) =>
                          requestStatusChange(o._id, e.target.value)
                        }
                      >
                        <option value="Placed">Placed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select><br /> <br />
                    </div>
                  </div>

                  {/* BODY */}
                  <div className="order-body">
                    {o.products.map((p, i) => (
                      <div key={i} className="order-item-row">
                        <img
                          src={
                            p.image
                              ? `http://localhost:5000/uploads/${p.image}`
                              : "https://via.placeholder.com/50"
                          }
                          alt=""
                        />
                        <div>
                          <h6>{p.name}</h6>
                          <p>Qty: {p.qty} | ₹{p.price}</p>
                        </div>
                      </div>
                    ))}

                    <div className="order-footer">
                      <p>Vendor: {o.vendor?.email}</p>
                      <p>Order ID:#{o._id}</p>
                      <p>Total: ₹{o.total}</p>
                      <button onClick={() => downloadInvoice(o)}>
                        Invoice PDF
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

          {/* ===================== ADD PRODUCT ===================== */}
          {activeTab === "add" && (
            <div className="form-container">
              <h3>Add Product</h3>
              <input placeholder="Name" value={pname} onChange={(e) => setPname(e.target.value)} />
              <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
              <input type="number" placeholder="Stock" value={stock} onChange={(e) => setStock(+e.target.value)} />
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              <input type="file" onChange={(e) => setImage(e.target.files[0])} />
              <button onClick={addProduct}>Publish</button>
            </div>
          )}

          {/* ===================== CATEGORIES ===================== */}
          {activeTab === "categories" && (
            <div className="form-container">
              <h3>Categories</h3>

              {/* ADD CATEGORY */}
              <input
                placeholder="New category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <button onClick={addCategory}>Add Category</button>

              {/* CATEGORY LIST */}
              {categories.map((c) => {
                const hasProducts = categoryHasProducts(c._id);

                return (
                  <div key={c._id} className="category-row">

                    {/* Enter and Escape button works */}
                    {editCategoryId === c._id ? (
                      <input
                        className="category-edit-input"
                        value={editCategoryName}
                        autoFocus
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editCategoryName.trim() !== c.name) {
                            updateCategory(c._id);
                          }
                          if (e.key === "Escape") {
                            setEditCategoryId(null);
                            setEditCategoryName("");
                          }
                        }}
                      />
                    ) : (
                      <span className="category-name">{c.name}</span>
                    )}

                    {/* ACTIONS */}
                    <div className="category-actions">

                      {editCategoryId === c._id ? (
                        <>
                          <button
                            className="btn-save-sm"
                            disabled={editCategoryName.trim() === c.name}
                            onClick={() => updateCategory(c._id)}
                          >
                            Save
                          </button>
                          <button
                            className="btn-cancel-sm"
                            onClick={() => setEditCategoryId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn-icon-sm"
                            title="Edit category"
                            onClick={() => {
                              setEditCategoryId(c._id);
                              setEditCategoryName(c.name);
                            }}
                          >
                            ✏️
                          </button>

                          <button
                            className="category-delete-btn"
                            disabled={hasProducts}
                            title={hasProducts ? "Category has products" : "Delete"}
                            onClick={() => deleteCategory(c._id)}
                          >
                            Delete
                          </button>
                        </>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ===================== REPORTS ===================== */}
          {activeTab === "reports" && (
            <>
              <section className="stats-grid">
                <div className="stat-card"><h4>Total Vendors</h4><p>{vendors.length}</p></div>
                <div className="stat-card"><h4>Total Orders</h4><p>{analytics.totalOrders}</p></div>
                <div className="stat-card"><h4>Completed Orders</h4><p>{analytics.completedCount}</p></div>
                <div className="stat-card"><h4>Cancelled Orders</h4><p>{analytics.cancelledCount}</p></div>
                {role === "admin" && (
                  <div className="stat-card highlight-card">
                    <h4>Commission</h4>
                    <p>₹{commission.toFixed(2)}</p>
                  </div>
                )}
              </section>

              <div className="report-summary-card">
                <h3>Total Sales</h3>
                <p>₹{analytics.totalSales}</p>
              </div>
            </>
          )}
        </div>

        <Footer />
      </main>

      <ConfirmModal
        show={showConfirm}
        title="Confirm Action"
        message={
          pendingStatusChange
            ? `Update order to ${pendingStatusChange.status}?`
            : "Are you sure?"
        }
        onCancel={() => setShowConfirm(false)}
        onConfirm={confirmAction}
      />
    </div>
  );
}

//Add sub category
//Admin can CRUD Admins and Vendor