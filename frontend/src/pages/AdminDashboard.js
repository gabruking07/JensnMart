import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import jsPDF from "jspdf";
import toast from "react-hot-toast";

import "./AdminDashboard.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ConfirmModal from "../components/ConfirmModal";
import ProductsTab from "./adminDashboardTabs/ProductsTab";
import VendorsTab from "./adminDashboardTabs/VendorsTab";
import AdminsTab from "./adminDashboardTabs/AdminsTab";
import OrdersTab from "./adminDashboardTabs/OrdersTab";
import AddProductTab from "./adminDashboardTabs/AddProductTab";
import CategoriesTab from "./adminDashboardTabs/CategoriesTab";
import ReportsTab from "./adminDashboardTabs/ReportsTab";

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
  const [editNameId, setEditNameId] = useState(null);
  const [newName, setNewName] = useState("");
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
  const [subcategories, setSubcategories] = useState([]);
  const [subcategoryId, setSubcategoryId] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [editSubcategoryProductId, setEditSubcategoryProductId] = useState(null);
  const [newSubName, setNewSubName] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState("");

  //Orders
  const [orderSearch, setOrderSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  //Reports
  const [reportRange, setReportRange] = useState("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

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

  const updateProductName = async (id) => {
    const product = products.find(p => p._id === id);
    if (!product) return;

    const trimmedName = newName.trim();
    if (!trimmedName) {
      toast.error("Product name required");
      return;
    }

    if (trimmedName === product.name) {
      toast("Name unchanged", { icon: "i" });
      return;
    }

    try {
      const res = await api.put(`/products/${id}`, { name: trimmedName });
      const updatedProduct = res.data;

      setProducts(prev =>
        prev.map(p =>
          p._id === id
            ? (updatedProduct?._id ? updatedProduct : { ...p, name: trimmedName })
            : p
        )
      );

      toast.success("Product name updated");
      setEditNameId(null);
      setNewName("");
      fetchProducts(selectedCategory);
    } catch (err) {
      toast.error(err.response?.data?.message || "Name update failed");
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
        category: newCategoryId,
        subcategory: null
      });

      toast.success("Category updated");

      setProducts(prev =>
        prev.map(p =>
          p._id === productId
            ? { ...p, category: categoryObj, subcategory: null }
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

  const placedCount = filteredReportOrders.filter(o => o.status === "Placed").length;
  const completedCount = filteredReportOrders.filter(o => o.status === "Completed").length;
  const cancelledCount = filteredReportOrders.filter(o => o.status === "Cancelled").length;

  const orderStatusData = [
    { name: "Placed", value: placedCount, color: "#f59e0b" },
    { name: "Completed", value: completedCount, color: "#22c55e" },
    { name: "Cancelled", value: cancelledCount, color: "#ef4444" }
  ];

  const getSubcategoryColor = (key = "") => {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = (Math.abs(hash) + 120) % 360; // shift color
    return `hsl(${hue}, 80%, 92%)`;
  };

  const getSubcategoryTextColor = (key = "") => {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = (Math.abs(hash) + 120) % 360;
    return `hsl(${hue}, 60%, 35%)`;
  };

  const grouped = {};

  filteredReportOrders.forEach(o => {
    const d = new Date(o.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short"
    });

    if (!grouped[d]) grouped[d] = 0;
    grouped[d] += o.totalAmount;
  });

  const groupedSales = {};

  filteredReportOrders.forEach(o => {
    const d = new Date(o.createdAt);

    let key = "";

    if (reportRange === "today") {
      key = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    }

    else if (reportRange === "week") {
      key = d.toLocaleDateString("en-IN", { weekday: "short" });
      // Mon Tue Wed
    }

    else if (reportRange === "month") {
      key = d.getDate() + " " + d.toLocaleString("en-IN", { month: "short" });
      // 8 Feb
    }

    else if (reportRange === "year") {
      key = d.toLocaleString("en-IN", { month: "short" });
      // Jan Feb Mar
    }

    else {
      key = d.toLocaleDateString("en-IN");
    }

    if (!groupedSales[key]) groupedSales[key] = 0;
    groupedSales[key] += o.total;   // or totalAmount (your correct field)
  });

  const salesChartData = Object.keys(groupedSales).map(k => ({
    name: k,
    sales: groupedSales[k]
  }));

  const vendorMap = {};
  filteredReportOrders.forEach(o => {
    const v = o.vendor?.name || "Unknown";
    vendorMap[v] = (vendorMap[v] || 0) + o.total;
  });
  const vendorData = Object.keys(vendorMap).map(v => ({ name: v, sales: vendorMap[v] }));

  const productMap = {};
  filteredReportOrders.forEach(o => {
    o.products.forEach(p => {
      productMap[p.name] = (productMap[p.name] || 0) + p.qty;
    });
  });

  const topProductsData = Object.keys(productMap).map(p => ({
    name: p, qty: productMap[p]
  }));

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
    <div className="admin-dashboard-container" >
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
            <ProductsTab
              ctx={{
                selectedCategory,
                setSelectedCategory,
                categories,
                selectedSubcategory,
                setSelectedSubcategory,
                subcategories,
                searchTerm,
                setSearchTerm,
                filteredProducts,
                editCategoryProductId,
                setEditCategoryProductId,
                updateProductCategory,
                getCategoryColor,
                getCategoryTextColor,
                getCategoryName,
                editSubcategoryProductId,
                setEditSubcategoryProductId,
                updateProductSubcategory,
                getSubcategoryColor,
                getSubcategoryTextColor,
                editPriceId,
                newPrice,
                setNewPrice,
                updatePrice,
                setEditPriceId,
                editNameId,
                newName,
                setNewName,
                setEditNameId,
                updateProductName,
                editStockId,
                newStock,
                setNewStock,
                updateStockValue,
                setEditStockId,
                deleteProduct,
              }}
            />
          )}

          {/* ===================== VENDORS ===================== */}
          {activeTab === "vendors" && (
            <VendorsTab
              ctx={{
                vendorEmail,
                setVendorEmail,
                vendorPassword,
                setVendorPassword,
                createVendor,
                vendors,
                approveVendor,
                rejectVendor,
                vendorSearch,
                setVendorSearch,
                filteredVendors,
              }}
            />
          )}

          {/* ===================== ADMINS ===================== */}
          {activeTab === "admins" && (
            <AdminsTab
              ctx={{
                newAdminName,
                setNewAdminName,
                newAdminEmail,
                setNewAdminEmail,
                newAdminPhone,
                setNewAdminPhone,
                newAdminPassword,
                setNewAdminPassword,
                newAdminRole,
                setNewAdminRole,
                createAdmin,
                pendingAdmins,
                approveAdmin,
                removeAdmin,
                adminSearch,
                setAdminSearch,
                admins,
              }}
            />
          )}

          {/* ===================== ORDERS ===================== */}
          {activeTab === "orders" && (
            <OrdersTab
              ctx={{
                placedCount,
                completedCount,
                cancelledCount,
                commission,
                statusFilter,
                setStatusFilter,
                orderSearch,
                setOrderSearch,
                vendorFilter,
                setVendorFilter,
                vendors,
                startDate,
                setStartDate,
                endDate,
                setEndDate,
                filteredOrders,
                getStatusClass,
                requestStatusChange,
                downloadInvoice,
              }}
            />
          )}

          {/* ===================== ADD PRODUCT ===================== */}
          {activeTab === "add" && (
            <AddProductTab
              ctx={{
                pname,
                setPname,
                price,
                setPrice,
                stock,
                setStock,
                categoryId,
                setCategoryId,
                categories,
                subcategoryId,
                setSubcategoryId,
                subcategories,
                setImage,
                addProduct,
              }}
            />
          )}

          {/* ===================== CATEGORIES ===================== */}
          {activeTab === "categories" && (
            <CategoriesTab
              ctx={{
                categorySearch,
                setCategorySearch,
                newCategory,
                setNewCategory,
                addCategory,
                filteredCategories,
                collapsedCats,
                toggleCollapse,
                editCategoryId,
                editCategoryName,
                setEditCategoryName,
                updateCategory,
                setEditCategoryId,
                deleteCategory,
                subcategories,
                deleteSubcategory,
                parentCategoryId,
                setParentCategoryId,
                categories,
                newSubName,
                setNewSubName,
                addSubcategory,
              }}
            />
          )}

          {/* ===================== REPORTS ===================== */}
          {activeTab === "reports" && (
            <ReportsTab
              ctx={{
                reportRange,
                setReportRange,
                customStart,
                setCustomStart,
                customEnd,
                setCustomEnd,
                analytics,
                salesChartData,
                orderStatusData,
                vendorData,
                topProductsData,
              }}
            />
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
