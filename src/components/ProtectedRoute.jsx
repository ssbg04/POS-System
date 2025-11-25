// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

export const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user } = useAuthContext();

    if (!user) return <Navigate to="/login" />;
    if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" />;

    return children;
};

export default ProtectedRoute;
