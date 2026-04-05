import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./Pages/Login.jsx";
import Signup from "./Pages/Signup.jsx";
import ForgotPassword from "./Pages/ForgotPassword.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext";
import PlanningQuotidien from "./Pages/PlanningQuotidien";
import RoleBaseRoutes from "./utils/RoleBaseRoutes.jsx";
import PrivateRoutes from "./utils/PrivateRoutes.jsx";
import AdminDashboard from "./Pages/admindashboard.jsx";
import Employees from "./Pages/Employees.jsx";
import Buses from "./Pages/Buses.jsx";
import Lignes from "./Pages/Lignes.jsx";
import Settings from "./Pages/Settings.jsx";
import Unauthorized from "./Pages/Unauthorized.jsx";

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/planning" element={<PlanningQuotidien />} />
        <Route
          path="/admin-dashboard"
          element={
            <PrivateRoutes>
              <RoleBaseRoutes requiredRole={["admin"]}>
                <AdminDashboard />
              </RoleBaseRoutes>
            </PrivateRoutes>
          }
        />
        <Route
          path="/employees"
          element={
            <PrivateRoutes>
              <RoleBaseRoutes requiredRole={["admin"]}>
                <Employees />
              </RoleBaseRoutes>
            </PrivateRoutes>
          }
        />
        <Route
          path="/buses"
          element={
            <PrivateRoutes>
              <RoleBaseRoutes requiredRole={["admin"]}>
                <Buses />
              </RoleBaseRoutes>
            </PrivateRoutes>
          }
        />
        <Route
          path="/lignes"
          element={
            <PrivateRoutes>
              <RoleBaseRoutes requiredRole={["admin"]}>
                <Lignes />
              </RoleBaseRoutes>
            </PrivateRoutes>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoutes>
              <RoleBaseRoutes requiredRole={["admin"]}>
                <Settings />
              </RoleBaseRoutes>
            </PrivateRoutes>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
