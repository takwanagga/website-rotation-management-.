import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { listPlanningByEmployee } from "../lib/api.js";
import Navbar from "../components/Navbar.jsx";

export default function MonPlanning() {
  const { user } = useAuth();
  const [plannings, setPlannings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;
    listPlanningByEmployee(user._id)
      .then(res => setPlannings(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  // Group by date
  const grouped = plannings.reduce((acc, p) => {
    const dateKey = p.date.split("T")[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Mon Planning</h1>
        {loading ? (
          <p className="text-gray-500">Chargement...</p>
        ) : Object.keys(grouped).length === 0 ? (
          <p className="text-gray-500">Aucun planning publié pour le moment.</p>
        ) : (
          Object.entries(grouped).sort().map(([dateKey, items]) => (
            <div key={dateKey} className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
              <div className="bg-indigo-50 px-4 py-3 font-semibold text-indigo-800">
                {new Date(dateKey).toLocaleDateString("fr-FR", {
                  weekday: "long", day: "numeric", month: "long"
                })}
              </div>
              {items.map(p => (
                <div key={p._id} className="px-4 py-3 border-t border-gray-100 flex justify-between">
                  <span className="font-medium text-gray-700">
                    {p.heuredebut} – {p.heurefin}
                  </span>
                  <span className="text-gray-600">
                    Ligne: {p.ligne?.libelle ?? "—"}
                  </span>
                  <span className="text-gray-600">
                    Bus: {p.bus?.matricule ?? "—"}
                  </span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}