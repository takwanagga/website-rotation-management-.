import { Navigate, Route, Routes } from "react-router-dom";
import Login from "../Pages/Login.jsx";
import EmployeLogin from "../Pages/EmployeLogin.jsx";
import ForgotPassword from "../Pages/ForgotPassword.jsx";
import ResetPassword from "../Pages/ResetPassword.jsx";
import PlanningQuotidien from "../Pages/PlanningQuotidien.jsx";
import AdminDashboard from "../Pages/admindashboard.jsx";
import Employees from "../Pages/Employees.jsx";
import Buses from "../Pages/Buses.jsx";
import Lignes from "../Pages/Lignes.jsx";
import Settings from "../Pages/Settings.jsx";
import AdminProfile from "../Pages/AdminProfile.jsx";
import Unauthorized from "../Pages/Unauthorized.jsx";
import PrivateRoutes from "./PrivateRoutes.jsx";
import RoleBaseRoutes from "./RoleBaseRoutes.jsx";
import MonPlanning from "../Pages/MonPlanning.jsx";
function AdminLayout({ children }) {
  return (
    <PrivateRoutes>
      <RoleBaseRoutes allowedRoles={["admin"]}>{children}</RoleBaseRoutes>
    </PrivateRoutes>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin-dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/employe-login" element={<EmployeLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/planning" element={<PlanningQuotidien />} />
      <Route
        path="/admin-dashboard"
        element={
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        }
      />
      <Route
        path="/employees"
        element={
          <AdminLayout>
            <Employees />
          </AdminLayout>
        }
      />
      <Route
        path="/buses"
        element={
          <AdminLayout>
            <Buses />
          </AdminLayout>
        }
      />
      <Route
        path="/lignes"
        element={
          <AdminLayout>
            <Lignes />
          </AdminLayout>
        }
      />
      <Route
        path="/admin-profile"
        element={
          <AdminLayout>
            <AdminProfile />
          </AdminLayout>
        }
      />
      <Route
        path="/settings"
        element={
          <AdminLayout>
            <Settings />
          </AdminLayout>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
      <Route
  path="/mon-planning"
  element={
    <PrivateRoutes>
      <RoleBaseRoutes allowedRoles={["chauffeur", "receveur"]}>
        <MonPlanning />
      </RoleBaseRoutes>
    </PrivateRoutes>
  }
/>
    </Routes>
  );
}
