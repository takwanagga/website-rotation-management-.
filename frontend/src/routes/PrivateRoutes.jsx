import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingScreen from "../components/common/LoadingScreen.jsx";

/**
 * Redirige vers /login si aucun utilisateur authentifié (après bootstrap).
 */
export default function PrivateRoutes({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Vérification de la session…" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
