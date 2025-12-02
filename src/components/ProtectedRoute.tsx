import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/auth";

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user } = useAuth();

  // 1. Not logged in? Go to login.
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // 2. Wrong role? Go to unauthorized.
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 3. All good? Render the page.
  return <Outlet />;
};

export default ProtectedRoute;
