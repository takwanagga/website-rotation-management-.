import React from "react";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "../components/AdminSidebar";

const Lignes = () => {
  const { user } = useAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-64 bg-gray-50 min-h-screen pt-16 md:pt-0">
        {/* Top Navbar */}
        <div className="bg-white shadow-sm p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Gestion des Lignes</h1>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="px-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none w-full md:w-auto"
            />
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap">
              + Ajouter
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-8">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Liste des Lignes</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-700">Code</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 hidden sm:table-cell">Nom</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 hidden md:table-cell">DÃ©part</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-700">ArrivÃ©e</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t hover:bg-gray-50">
                      <td className="px-3 md:px-6 py-4 text-gray-600 text-sm">Contenu Ã  venir</td>
                      <td className="px-3 md:px-6 py-4 text-gray-600 text-sm hidden sm:table-cell"></td>
                      <td className="px-3 md:px-6 py-4 text-gray-600 text-sm hidden md:table-cell"></td>
                      <td className="px-3 md:px-6 py-4 text-gray-600 text-sm"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Lignes;


