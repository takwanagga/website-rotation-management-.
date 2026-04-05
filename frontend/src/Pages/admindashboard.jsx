import React from "react";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "../components/AdminSidebar";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const displayName =
    [user?.prenom, user?.nom].filter(Boolean).join(" ").trim() ||
    user?.email ||
    "Administrateur";
  const initial = (displayName.charAt(0) || "A").toUpperCase();

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-64 bg-gray-50 min-h-screen pt-16 md:pt-0">
        <div className="bg-white shadow-sm p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Tableau de Bord</h1>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Rechercher..."
              className="px-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none w-full md:w-auto"
            />
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap">
              Exporter PDF
            </button>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              {initial}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-4 md:p-6">
              <h3 className="text-gray-500 text-xs md:text-sm font-semibold mb-2">Total Employés</h3>
              <p className="text-2xl md:text-3xl font-bold text-gray-800">24</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 md:p-6">
              <h3 className="text-gray-500 text-xs md:text-sm font-semibold mb-2">Bus Actifs</h3>
              <p className="text-2xl md:text-3xl font-bold text-blue-600">12</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 md:p-6">
              <h3 className="text-gray-500 text-xs md:text-sm font-semibold mb-2">Lignes</h3>
              <p className="text-2xl md:text-3xl font-bold text-green-600">8</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
              Bienvenue, {displayName} !
            </h2>
            <p className="text-gray-600 text-sm md:text-base">
              Vous êtes connecté en tant qu&apos;administrateur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

