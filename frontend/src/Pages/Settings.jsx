import React from "react";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "../components/AdminSidebar";

const Settings = () => {
  const { user } = useAuth();

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-64 bg-gray-50 min-h-screen pt-16 md:pt-0">
        {/* Top Navbar */}
        <div className="bg-white shadow-sm p-4 md:p-6 flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Paramètres</h1>
        </div>

        {/* Content */}
        <div className="p-4 md:p-8">
          <div className="bg-white rounded-lg shadow p-4 md:p-6 max-w-2xl">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Paramètres Système</h2>
            <div className="space-y-4">
              <div className="pb-4 border-b">
                <label className="text-sm font-semibold text-gray-700">Nom de l'application</label>
                <input type="text" value="TransRoute" className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg text-sm md:text-base" />
              </div>
              <div className="pb-4 border-b">
                <label className="text-sm font-semibold text-gray-700">Email de support</label>
                <input type="email" placeholder="support@transroute.com" className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg text-sm md:text-base" />
                    </div>
              <button className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm md:text-base">
                Enregistrer
                    </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
