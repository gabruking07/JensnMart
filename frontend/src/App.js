import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

import Login from "./pages/Login";
import Products from "./pages/Products";
import Cart from "./pages/Cart";
import AdminDashboard from "./admin/pages/AdminDashboard";
import VendorDashboard from "./vendor/pages/VendorDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRegister from "./pages/AdminRegister";
import VendorRegister from "./pages/VendorRegister";
import VendorProfile from "./vendor/pages/VendorProfile";
import VendorOrders from "./vendor/pages/VendorOrders";

function App() {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontSize: "14px",
          },
        }}
      />

      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedRoute role={["admin", "manager"]}>
              <AdminDashboard
                darkMode={darkMode}
                setDarkMode={setDarkMode}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vendor/orders"
          element={
            <ProtectedRoute role="vendor">
              <VendorOrders
                darkMode={darkMode}
                setDarkMode={setDarkMode}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vendor/profile"
          element={
            <VendorProfile
              darkMode={darkMode}
              setDarkMode={setDarkMode}
            />
          }
        />

        <Route
          path="/vendor"
          element={
            <ProtectedRoute role="vendor">
              <VendorDashboard
                darkMode={darkMode}
                setDarkMode={setDarkMode}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cart"
          element={
            <ProtectedRoute role="vendor">
              <Cart
                darkMode={darkMode}
                setDarkMode={setDarkMode}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <Login
              darkMode={darkMode}
              setDarkMode={setDarkMode}
            />
          }
        />

        <Route
          path="/admin-register"
          element={
            <AdminRegister
              darkMode={darkMode}
              setDarkMode={setDarkMode}
            />
          }
        />

        <Route
          path="/vendor-register"
          element={
            <VendorRegister
              darkMode={darkMode}
              setDarkMode={setDarkMode}
            />
          }
        />

        <Route
          path="/products"
          element={
            <Products
              darkMode={darkMode}
              setDarkMode={setDarkMode}
            />
          }
        />

        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;