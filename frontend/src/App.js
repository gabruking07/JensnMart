import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Login from "./pages/Login";
import Products from "./pages/Products";
import Cart from "./pages/Cart";
import AdminRegister from "./pages/AdminRegister";
import VendorRegister from "./pages/VendorRegister";
import ForgotPassword from "./pages/ForgotPassword";

import VendorDashboard from "./vendor/pages/VendorDashboard";
import VendorProfile from "./vendor/pages/VendorProfile";
import VendorOrders from "./vendor/pages/VendorOrders";
import VendorTransactions from "./vendor/pages/VendorTransactions";

import ProtectedRoute from "./components/ProtectedRoute";

import AdminLayout from "./admin/AdminLayout";
import ProfileTab from "./admin/pages/ProfileTab";
import InventoryTab from "./admin/pages/InventoryTab";
import VendorsTab from "./admin/pages/VendorsTab";
import AdminsTab from "./admin/pages/AdminsTab";
import OrdersTab from "./admin/pages/OrdersTab";
import PaymentsTab from "./admin/pages/PaymentsTab";
import AddProductTab from "./admin/pages/AddProductTab";
import CategoryTab from "./admin/pages/CategoryTab";
import ReportsTab from "./admin/pages/ReportsTab";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />

      <Routes>
        {/* ADMIN PANEL */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role={["admin", "manager"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="inventory" replace />} />
          <Route path="profile" element={<ProfileTab />} />
          <Route path="inventory" element={<InventoryTab />} />
          <Route path="vendors" element={<VendorsTab />} />
          <Route path="admins" element={<AdminsTab />} />
          <Route path="orders" element={<OrdersTab />} />
          <Route path="payments" element={<PaymentsTab />} />
          <Route path="add-product" element={<AddProductTab />} />
          <Route path="categories" element={<CategoryTab />} />
          <Route path="reports" element={<ReportsTab />} />
        </Route>

        {/* VENDOR */}
        <Route
          path="/vendor/orders"
          element={
            <ProtectedRoute role="vendor">
              <VendorOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vendor/transactions"
          element={
            <ProtectedRoute role="vendor">
              <VendorTransactions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vendor/profile"
          element={
            <VendorProfile />
          }
        />

        <Route
          path="/vendor"
          element={
            <ProtectedRoute role="vendor">
              <VendorDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/cart" element={<Cart />} />
        <Route path="/" element={<Login />} />
        <Route path="/admin-register" element={<AdminRegister />} />
        <Route path="/vendor-register" element={<VendorRegister />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/products" element={<Products />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
