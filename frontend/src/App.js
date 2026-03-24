import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Login from "./pages/Login";
import AdminRegister from "./pages/AdminRegister";
import VendorRegister from "./pages/VendorRegister";
import ForgotPassword from "./pages/ForgotPassword";

import VendorCart from "./vendor/pages/VendorCart";
import VendorDashboard from "./vendor/pages/VendorDashboard";
import VendorProfile from "./vendor/pages/VendorProfile";
import VendorOrders from "./vendor/pages/VendorOrders";
import VendorTransactions from "./vendor/pages/VendorTransactions";

import ProtectedRoute from "./components/ProtectedRoute";
import ChatbotWidget from "./components/ChatbotWidget";

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
import NotificationsTab from "./admin/pages/NotificationsTab";
import VendorNotifications from "./vendor/pages/VendorNotifications";

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "16px",
            padding: "14px 16px",
            fontSize: "14px",
            fontWeight: "700",
            border: "1px solid rgba(15, 23, 42, 0.08)",
            boxShadow: "0 18px 36px rgba(15, 23, 42, 0.16)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,248,240,0.96))",
            color: "#0f172a"
          },
          success: {
            iconTheme: {
              primary: "#16a34a",
              secondary: "#f0fdf4"
            },
            style: {
              border: "1px solid rgba(34, 197, 94, 0.22)",
              background:
                "radial-gradient(circle at top right, rgba(134, 239, 172, 0.18), transparent 42%), linear-gradient(180deg, rgba(255,255,255,0.98), rgba(240,253,244,0.96))"
            }
          },
          error: {
            iconTheme: {
              primary: "#dc2626",
              secondary: "#fef2f2"
            },
            style: {
              border: "1px solid rgba(248, 113, 113, 0.24)",
              background:
                "radial-gradient(circle at top right, rgba(252, 165, 165, 0.16), transparent 42%), linear-gradient(180deg, rgba(255,255,255,0.98), rgba(254,242,242,0.96))"
            }
          }
        }}
      />
      <ChatbotWidget />

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
          <Route path="notifications" element={<NotificationsTab />} />
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
          path="/vendor/notifications"
          element={
            <ProtectedRoute role="vendor">
              <VendorNotifications />
            </ProtectedRoute>
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

        <Route path="/cart" element={<VendorCart />} />
        <Route path="/" element={<Login />} />
        <Route path="/admin-register" element={<AdminRegister />} />
        <Route path="/vendor-register" element={<VendorRegister />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
