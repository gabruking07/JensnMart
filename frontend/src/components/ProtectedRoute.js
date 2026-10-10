/** Reusable protected route UI component; packages interface behavior used by one or more application screens. */

import { Navigate } from "react-router-dom";

/** Renders the protected route interface and coordinates the state and actions for this screen or reusable component. */
export default function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (role) {
    if (Array.isArray(role) && !role.includes(userRole)) {
      return <Navigate to="/" replace />;
    }

    if (typeof role === "string" && role !== userRole) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}