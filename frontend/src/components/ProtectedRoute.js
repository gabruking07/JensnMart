import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  // Not logged in
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Role-based protection
  if (role) {
    // If multiple roles allowed
    if (Array.isArray(role) && !role.includes(userRole)) {
      return <Navigate to="/" replace />;
    }

    // If single role allowed
    if (typeof role === "string" && role !== userRole) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}