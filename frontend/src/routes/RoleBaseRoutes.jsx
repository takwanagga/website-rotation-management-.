import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingScreen from "../components/common/LoadingScreen.jsx";

/**
 * @param {string|string[]} allowedRoles - Rôle(s) autorisé(s), ex. "admin" ou ["admin", "super"]
 */
export default function RoleBaseRoutes({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  const roles = [allowedRoles].flat().filter(Boolean);

  if (loading) {
    return <LoadingScreen message="Vérification des droits…" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
