import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import jsPDF from "jspdf";
import toast from "react-hot-toast";

import "./AdminDashboard.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ConfirmModal from "../components/ConfirmModal";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  /* ===================== STATE ===================== */
  // Core data
  const [admins, setAdmins] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);

  // Admin specific
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [commission, setCommission] = useState(0);
  const token = localStorage.getItem("token");

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
  const [vendorSearch, setVendorSearch] = useState("");

  //Admin
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminRole, setNewAdminRole] = useState("manager");
  const [adminSearch, setAdminSearch] = useState("");

  // Inventory edit
  const [editPriceId, setEditPriceId] = useState(null);
  const [newPrice, setNewPrice] = useState("");
  const [editStockId, setEditStockId] = useState(null);
  const [newStock, setNewStock] = useState("");
  const [editCategoryProductId, setEditCategoryProductId] = useState(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [collapsedCats, setCollapsedCats] = useState({});

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
    if (activeTab !== "reports") return;

    const interval = setInterval(() => {
      fetchOrders();
      fetchVendors();
      fetchProducts();
    }, 10000); // refresh every 10s

    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    fetch("/api/admin/orders", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setOrders(data));
  }, []);

  useEffect(() => {
    fetchProducts(selectedCategory);
  }, [selectedCategory]);

  /* ===================== LOAD ALL jhvgujvhg ===================== */
  const loadAll = async () => {
    try {
      const tasks = [
        fetchOrders(),
        fetchCategories(),
        fetchProducts(),
        fetchSubcategories(),
        fetchPendingAdmins()
      ];

      if (role === "admin") {
        tasks.push(
          fetchVendors(),
          fetchCommission(),
          fetchPendingAdmins(),
          fetchAdmins()
        );
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

  const getTabTitle = (tab) => {
    switch (tab) {
      case "products":
        return "Inventory";
      case "vendors":
        return "Vendors";
      case "orders":
        return "Orders";
      case "add":
        return "Add Product";
      case "categories":
        return "Categories";
      case "reports":
        return "Reports";
      case "admins":
        return "Admins";
      default:
        return "Admin Dashboard";
    }
  };

  const fetchVendors = async () => {
    const res = await api.get("/admin/vendors");
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

  const fetchSubcategories = async () => {
    try {
      const res = await api.get("/subcategories");
      setSubcategories(res.data || []);
    } catch (err) {
      console.error("Subcategory fetch error:", err.response?.data || err);
    }
  };

  const fetchCommission = async () => {
    const res = await api.get("/orders/commission");
    setCommission(res.data?.total || 0);
  };

  /* ===================== DERIVED ===================== */

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const toggleCollapse = (id) => {
    setCollapsedCats(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchSub =
      !selectedSubcategory ||
      p.subcategory?._id === selectedSubcategory;

    return matchSearch && matchSub;
  });

  const now = new Date();

  const filteredReportOrders = orders.filter(o => {
    const d = new Date(o.createdAt);

    if (reportRange === "today") {
      return d.toDateString() === now.toDateString();
    }

    if (reportRange === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo;
    }

    if (reportRange === "month") {
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      return d >= monthAgo;
    }

    if (reportRange === "year") {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(now.getFullYear() - 1);
      return d >= yearAgo;
    }

    if (reportRange === "custom" && customStart && customEnd) {
      return d >= new Date(customStart) && d <= new Date(customEnd);
    }

    return true;
  });

  const completedOrders = filteredReportOrders.filter(
    o => o.status === "Completed"
  );

  const analytics = {
    totalOrders: filteredReportOrders.length,
    completedCount: completedOrders.length,
    cancelledCount: filteredReportOrders.filter(o => o.status === "Cancelled").length,
    totalSales: completedOrders.reduce((sum, o) => sum + o.total, 0)
  };

  /* ===================== ACTIONS ===================== */
  const fetchAdmins = async () => {
    try {
      const res = await api.get("/admin/all-admins");
      setAdmins(res.data || []);
    } catch (err) {
      console.log("Fetch admins error", err.response?.data);
    }
  };

  const fetchPendingAdmins = async () => {
    try {
      const res = await api.get("/admin/pending-admins");
      setPendingAdmins(res.data || []);
    } catch (err) {
      console.error("Pending admin fetch error", err);
    }
  };

  useEffect(() => {
    if (activeTab === "admins") {
      fetchAdmins();
      fetchPendingAdmins();
    }
  }, [activeTab]);

  const approveAdmin = async (id) => {
    await api.put(`/admin/approve-admin/${id}`);
    fetchAdmins();
    fetchPendingAdmins();
  };

  const removeAdmin = async (id) => {
    await api.delete(`/admin/remove-admin/${id}`);
    fetchAdmins();
    fetchPendingAdmins();
  };

  const filteredAdmins = admins.filter(a =>
    a.email.toLowerCase().includes(adminSearch.toLowerCase())
  );

  const createVendor = async () => {
    if (!vendorEmail || !vendorPassword) {
      alert("Enter email & password");
      return;
    }

    try {
      await api.post("/admin/create-vendor", {
        email: vendorEmail,
        password: vendorPassword,
      });

      setVendorEmail("");
      setVendorPassword("");
      fetchVendors();
    } catch (err) {
      console.error(err);
      alert("Vendor not created");
    }
  };

  const approveVendor = async (id) => {
    await api.put(`/admin/approve/${id}`);
    fetchVendors();
  };

  const filteredVendors = vendors
    .filter(v => v.approved)
    .filter(v =>
      v.email.toLowerCase().includes(vendorSearch.toLowerCase())
    );

  const rejectVendor = async (id) => {
    if (!window.confirm("Remove this vendor?")) return;

    await api.delete(`/admin/reject-vendor/${id}`);
    fetchVendors();
  };

  const createAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword || !newAdminPhone) {
      toast.error("All fields required");
      return;
    }

    if (!/^\d{10}$/.test(newAdminPhone)) {
      toast.error("Phone must be 10 digits");
      return;
    }

    if (newAdminPassword.length < 6) {
      toast.error("Password must be at least 6 chars");
      return;
    }

    try {
      await api.post("/admin/create-admin", {
        name: newAdminName,
        email: newAdminEmail,
        password: newAdminPassword,
        role: newAdminRole,
        phone: newAdminPhone
      });

      toast.success("Admin created (pending)");
      fetchAdmins();
      setNewAdminEmail("");
      setNewAdminPassword("");
      fetchPendingAdmins();

    } catch (err) {
      console.log(err.response?.data);
      toast.error("Create failed");
    }
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

  const filteredOrders = orders.filter(o => {

    if (statusFilter !== "all" && o.status !== statusFilter) {
      return false;
    }

    if (orderSearch && !String(o.orderNumber).includes(orderSearch)) {
      return false;
    }

    if (vendorFilter && o.vendor?._id !== vendorFilter) {
      return false;
    }

    if (startDate && new Date(o.createdAt) < new Date(startDate)) {
      return false;
    }

    if (endDate && new Date(o.createdAt) > new Date(endDate)) {
      return false;
    }

    return true;
  });

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
    formData.append("subcategory", subcategoryId);
    formData.append("image", image);

    await api.post("/products", formData);
    setPname("");
    setPrice("");
    setStock(0);
    setImage(null);
    setCategoryId("");
    setSubcategoryId("");
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

  const addSubcategory = async () => {
    if (!newSubName || !parentCategoryId) {
      toast.error("Select category & name");
      return;
    }

    try {
      await api.post("/subcategories", {
        name: newSubName,
        category: parentCategoryId
      });

      toast.success("Subcategory added");
      setNewSubName("");
      fetchSubcategories();

    } catch {
      toast.error("Failed");
    }
  };

  const deleteSubcategory = async (id) => {
    try {
      await api.delete(`/subcategories/${id}`);
      toast.success("Deleted");
      fetchSubcategories();
    } catch {
      toast.error("Delete failed");
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

  const updateProductSubcategory = async (productId, newSubId) => {
    const subObj = subcategories.find(s => s._id === newSubId);

    try {
      await api.put(`/products/${productId}`, {
        subcategory: newSubId
      });

      toast.success("Subcategory updated");

      setProducts(prev =>
        prev.map(p =>
          p._id === productId
            ? { ...p, subcategory: subObj }
            : p
        )
      );

      setEditSubcategoryProductId(null);
    } catch (err) {
      toast.error("Update failed");
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
      < aside className="admin-sidebar" >
        <h3>Admin Panel</h3>

        <button onClick={() => setActiveTab("products")}>📦 Inventory</button>
        <button onClick={() => setActiveTab("vendors")}>🏪 Vendors</button>
        {role === "admin" && (
          <button onClick={() => setActiveTab("admins")}>⚙️ Admins</button>
        )}
        <button onClick={() => setActiveTab("orders")}>🧾 Orders</button>
        <button onClick={() => setActiveTab("add")}>➕ Add Product</button>
        <button onClick={() => setActiveTab("categories")}>🏷️ Categories</button>
        <button onClick={() => setActiveTab("reports")}>📊 Reports</button>

        <button className="logout-btn-sidebar" onClick={logout}>
          🚪 Logout
        </button>
      </aside >

      {/* ===================== MAIN ===================== */}
      < main className="admin-main" >
        <Header title={getTabTitle(activeTab)} />

        <div className="content-padding">
          {/* ===================== INVENTORY ===================== */}
          {activeTab === "products" && (
            <>
              {/* FILTER BAR */}
              <div className="filter-header">

                {/* For Category */}
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
                    {/* ================= CATEGORY + SUBCATEGORY PREMIUM ================= */}

                    <div className="category-block">

                      {/* ---------- CATEGORY ---------- */}
                      {editCategoryProductId === p._id ? (
                        <select
                          className="category-select"
                          value={
                            typeof p.category === "object"
                              ? p.category?._id
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
                          className="category-pill premium"
                          style={{
                            backgroundColor: getCategoryColor(
                              typeof p.category === "object" ? p.category?._id : p.category
                            ),
                            color: getCategoryTextColor(
                              typeof p.category === "object" ? p.category?._id : p.category
                            )
                          }}
                          onClick={() => setEditCategoryProductId(p._id)}
                        >
                          {getCategoryName(p)}
                        </span>
                      )}

                      {/* ---------- SUBCATEGORY ---------- */}
                      {editSubcategoryProductId === p._id ? (
                        <select
                          className="subcategory-select"
                          value={
                            typeof p.subcategory === "object"
                              ? p.subcategory?._id
                              : p.subcategory || ""
                          }
                          autoFocus
                          onChange={(e) => {
                            updateProductSubcategory(p._id, e.target.value);
                          }}
                          onBlur={() => setEditSubcategoryProductId(null)}
                        >
                          <option value="">Select subcategory</option>

                          {subcategories
                            .filter((s) =>
                              (typeof p.category === "object"
                                ? p.category?._id
                                : p.category) ===
                              (typeof s.category === "object"
                                ? s.category?._id
                                : s.category)
                            )
                            .map((s) => (
                              <option key={s._id} value={s._id}>
                                {s.name}
                              </option>
                            ))}
                        </select>
                      ) : (
                        <span
                          className="subcategory-pill premium"
                          onClick={() => setEditSubcategoryProductId(p._id)}
                          style={{
                            backgroundColor: getSubcategoryColor(
                              typeof p.subcategory === "object"
                                ? p.subcategory?._id
                                : p.subcategory || "none"
                            ),
                            color: getSubcategoryTextColor(
                              typeof p.subcategory === "object"
                                ? p.subcategory?._id
                                : p.subcategory || "none"
                            )
                          }}
                        >
                          {p.subcategory?.name || "No Subcategory"}
                        </span>
                      )}
                    </div>

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

          {/* ===================== VENDORS ===================== */}
          {activeTab === "vendors" && (
            <div className="vendors-layout">

              <div className="vendors-create">
                <h2>Create Vendor</h2>

                <input
                  className="input-modern"
                  placeholder="Vendor Email"
                  value={vendorEmail}
                  onChange={(e) => setVendorEmail(e.target.value)}
                />

                <input
                  className="input-modern"
                  placeholder="Password"
                  value={vendorPassword}
                  onChange={(e) => setVendorPassword(e.target.value)}
                />

                <button className="btn-primary" onClick={createVendor}>
                  Create Vendor
                </button>
              </div>

              <div className="vendors-approvals">
                <h2>Pending Approvals</h2>

                {vendors.filter(v => !v.approved).length === 0 && (
                  <p>No pending vendors</p>
                )}

                {vendors
                  .filter(v => !v.approved)
                  .map(v => (
                    <div key={v._id} className="vendor-row">

                      <div className="vendor-left">
                        <div className="vendor-avatar">
                          {v.email.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <div className="vendor-email">{v.email}</div>
                          <div className="vendor-status pending">
                            Pending
                          </div>
                        </div>
                      </div>

                      <div className="vendor-actions">
                        <button
                          className="btn-approve"
                          onClick={() => approveVendor(v._id)}
                        >
                          Approve
                        </button>

                        <button
                          className="btn-remove"
                          onClick={() => rejectVendor(v._id)}
                        >
                          Reject
                        </button>
                      </div>

                    </div>
                  ))}
              </div>

              <div className="vendors-all">
                <div className="vendors-header">
                  <h2>All Vendors</h2>

                  <input
                    className="vendor-search"
                    placeholder="Search vendors..."
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                  />
                </div>

                <div className="vendors-table-wrapper">
                  <table className="vendors-table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredVendors.map(v => (
                        <tr key={v._id}>
                          <td>{v.email}</td>

                          <td>
                            <span className={v.approved ? "status-active" : "status-pending"}>
                              {v.approved ? "Active" : "Pending"}
                            </span>
                          </td>

                          <td>
                            {new Date(v.createdAt || Date.now()).toLocaleDateString()}
                          </td>

                          <td>
                            {!v.approved && (
                              <button
                                className="btn-approve"
                                onClick={() => approveVendor(v._id)}
                              >
                                Approve
                              </button>
                            )}

                            <button
                              className="btn-remove"
                              onClick={() => rejectVendor(v._id)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {/* VENDOR APPROVALS */}
              <h3 style={{ marginTop: 30 }}>Vendor Approvals</h3>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map(v => (
                    <tr key={v._id}>
                      <td>{v.email}</td>
                      <td>{v.approved ? "Active" : "Pending"}</td>
                      <td>
                        {!v.approved && (
                          <button onClick={() => approveVendor(v._id)}>Approve</button>
                        )}
                        <button onClick={() => rejectVendor(v._id)}>Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          )}


          {/* ===================== ORDERS ===================== */}
          {activeTab === "orders" && (
            <div className="orders-container">
              {orders.map((o) => (
                <div key={o._id} className="admin-card order-card-wide">

                  {/* HEADER */}
                  <div className="order-header">
                    <span className="order-id">Order :#{o.orderNumber}</span>

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
                      <p>Order ID:#{o.orderNumber}</p>
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
              <select
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
              >
                <option value="">Select Subcategory</option>
                {subcategories
                  .filter(sc => sc.category._id === categoryId)
                  .map(sc => (
                    <option key={sc._id} value={sc._id}>
                      {sc.name}
                    </option>
                  ))}
              </select>
              <input type="file" onChange={(e) => setImage(e.target.files[0])} />
              <button onClick={addProduct}>Publish</button>
            </div>
          )}

          {/* ===================== CATEGORIES ===================== */}
          {activeTab === "categories" && (
            <div className="cat-wrapper">

              <div className="cat-card">
                <div className="cat-card-header">
                  <h2>Categories</h2>
                </div>

                <input
                  className="cat-search"
                  placeholder="Search categories..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                />

                <div className="cat-create-row">
                  <input
                    placeholder="New category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                  <button className="btn-add" onClick={addCategory}>
                    Add
                  </button>
                </div>

                <div className="cat-list">
                  {filteredCategories.map((c) => (
                    <div key={c._id} className="cat-item">

                      <div className="cat-title-row">

                        <div className="cat-left-title">
                          <span
                            className="collapse-icon"
                            onClick={() => toggleCollapse(c._id)}
                          >
                            {collapsedCats[c._id] ? "▶" : "▼"}
                          </span>

                          {editCategoryId === c._id ? (
                            <input
                              className="cat-inline-input"
                              value={editCategoryName}
                              onChange={(e) => setEditCategoryName(e.target.value)}
                              onBlur={() => updateCategory(c._id)}
                            />
                          ) : (
                            <span
                              className="cat-name"
                              onClick={() => {
                                setEditCategoryId(c._id);
                                setEditCategoryName(c.name);
                              }}
                            >
                              {c.name}
                            </span>
                          )}
                        </div>

                        <button
                          className="cat-delete-btn"
                          onClick={() => deleteCategory(c._id)}
                        >
                          🗑
                        </button>
                      </div>

                      {/* SUBCATS */}
                      {!collapsedCats[c._id] && (
                        <div className="subcat-wrap">
                          {subcategories
                            .filter(sc => sc.category._id === c._id)
                            .map(sc => (
                              <div key={sc._id} className="sub-chip">
                                {sc.name}
                                <span onClick={() => deleteSubcategory(sc._id)}>×</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="cat-card">
                <div className="cat-card-header">
                  <h2>Add Subcategory</h2>
                </div>

                <select
                  className="input-modern"
                  value={parentCategoryId}
                  onChange={(e) => setParentCategoryId(e.target.value)}
                >
                  <option value="">Select category</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>

                <input
                  className="input-modern"
                  placeholder="Subcategory name"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                />

                <button className="btn-add full" onClick={addSubcategory}>
                  Create
                </button>
              </div>
            </div>
          )}

          {/* ===================== REPORTS ===================== */}
          {activeTab === "reports" && (
            <div className="reports-page">

              {/* FILTERS */}
              <div className="report-filters">
                <div className="range-tabs">
                  {["today", "week", "month", "year"].map(r => (
                    <button
                      key={r}
                      className={`range-btn ${reportRange === r ? "active" : ""}`}
                      onClick={() => setReportRange(r)}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}

                  <button
                    className={`range-btn ${reportRange === "custom" ? "active" : ""}`}
                    onClick={() => setReportRange("custom")}
                  >
                    Custom
                  </button>
                </div>

                <h3>
                  Showing: {reportRange.charAt(0).toUpperCase() + reportRange.slice(1)}
                </h3>

                {reportRange === "custom" && (
                  <div className="custom-range">
                    <input
                      type="date"
                      value={customStart}
                      onChange={e => setCustomStart(e.target.value)}
                    />
                    <span>to</span>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={e => setCustomEnd(e.target.value)}
                    />
                  </div>
                )}
              </div>

        <Footer />
      </main >

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
    </div >
  );
}