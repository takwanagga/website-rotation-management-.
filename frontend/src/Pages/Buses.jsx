import React from "react";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "../components/AdminSidebar";

const Buses = () => {
  const { user } = useAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="ml-64 flex-1 bg-gray-50 min-h-screen">
        {/* Top Navbar */}
        <div className="bg-white shadow-sm p-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Gestion des Bus</h1>
          <div className="flex items-center gap-4">
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="px-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none"
            />
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              + Ajouter
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Liste des Bus</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Numéro</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Immatriculation</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Capacité</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-600">Contenu à venir</td>
                      <td className="px-6 py-4 text-gray-600"></td>
                      <td className="px-6 py-4 text-gray-600"></td>
                      <td className="px-6 py-4 text-gray-600"></td>
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

export default Buses;
