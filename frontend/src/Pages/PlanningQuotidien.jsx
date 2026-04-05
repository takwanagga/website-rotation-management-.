import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { useAuth } from "../context/AuthContext";
import { Edit2, Trash2, Plus, X, Search, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import api from "../api/axios";

// Time slots for the day
const HEURES = ["08:00-10:00", "10:00-12:00", "12:00-14:00", "14:00-16:00", "16:00-18:00", "18:00-20:00"];

const LIGNES = ["LIGNE 102", "LIGNE 205", "LIGNE 310", "LIGNE 412"];

const BUS_DISPONIBLES = [
  { id: "123 TUN 456", type: "Standard" },
  { id: "456 TUN 789", type: "Standard" },
];

const CHAUFFEURS = [{ name: "Ahmed Ben Salah", role: "Chauffeur" }];
const CONTROLEURS = [{ name: "Sami Trabelsi", role: "Contrôleur" }];

export default function PlanningQuotidien() {
  const { user } = useAuth();
  const [dragging, setDragging] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [plannings, setPlannings] = useState([]);
  const [lignes, setLignes] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState({});
  const [statusFilter, setStatusFilter] = useState("draft");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlanning, setEditingPlanning] = useState(null);
  const [errors, setErrors] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);

  const handleDragStart = (e, item) => {
    setDragging(item);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDrop = (e, heure, ligne) => {
    e.preventDefault();
    if (!dragging) return;
    const key = `${heure}__${ligne}`;
    setAssignments((prev) => ({ ...prev, [key]: dragging }));
    setDragging(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleRemove = (key) => {
        setAssignments((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
  };

  const handleAI = () => {
    setAiLoading(true);
    setAiDone(false);
    setTimeout(() => {
      const autoAssign = {};
      HEURES.forEach((h, hi) => {
        LIGNES.forEach((l, li) => {
          const key = `${h}__${l}`;
          if (!assignments[key]) {
            const busIdx = (hi + li) % BUS_DISPONIBLES.length;
            const driverIdx = (hi + li) % CHAUFFEURS.length;
            autoAssign[key] = {
              bus: BUS_DISPONIBLES[busIdx],
              driver: CHAUFFEURS[driverIdx],
            };
          }
        });
      });
      setAssignments((prev) => ({ ...prev, ...autoAssign }));
      setAiLoading(false);
      setAiDone(true);
    }, 1800);
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-64 bg-gray-50 min-h-screen pt-16 md:pt-0">
        {/* Top Navbar */}
        <div className="bg-white shadow-sm p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Planning Quotidien</h1>
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
              {(([user?.prenom, user?.nom].filter(Boolean).join(" ") || user?.email || "A").charAt(0)).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <p className="text-gray-600 text-sm md:text-base mb-6">Gérez les affectations par glisser-déposer.</p>

          {/* AI Banner */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-lg p-4 md:p-6 mb-8 border border-indigo-200">
            <div className="flex items-start md:items-center gap-4 mb-4 md:mb-0 flex-1">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center text-white text-xl flex-shrink-0">
                ✦
              </div>
              <div>
                <div className="font-bold text-indigo-900 text-sm md:text-base">Optimisation Intelligente</div>
                <div className="text-indigo-600 text-xs md:text-sm mt-1">Laissez Gemini suggérer le meilleur équilibre pour vos équipes.</div>
              </div>
            </div>
            <button
              onClick={handleAI}
              disabled={aiLoading}
              className={`px-4 md:px-6 py-2 rounded-lg font-bold text-white text-sm whitespace-nowrap transition ${
                aiLoading 
                  ? 'bg-indigo-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600'
              }`}
            >
              {aiLoading ? "⏳ Optimisation..." : aiDone ? "✅ Optimisé !" : "Lancer l'IA"}
            </button>
          </div>

          {/* Grid + Sidebar panel */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Draggable Panel */}
            <div className="w-full lg:w-56 flex-shrink-0 bg-white rounded-lg border border-gray-200 p-4 shadow-sm overflow-y-auto max-h-96 lg:max-h-full">
              <div className="text-xs font-bold text-gray-500 tracking-widest mb-3">BUS DISPONIBLES</div>
              {BUS_DISPONIBLES.map((b) => (
                  <div
                  key={b.id}
                    draggable
                  onDragStart={(e) => handleDragStart(e, { type: "bus", ...b })}
                  className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 mb-2 cursor-grab bg-gray-50 hover:shadow-sm transition hover:border-indigo-300"
                  >
                  <div className="text-indigo-600 flex-shrink-0">🚌</div>
                    <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{b.id}</div>
                    <div className="text-xs text-gray-500 font-semibold">{b.type}</div>
                  </div>
                </div>
              ))}

              <div className="text-xs font-bold text-gray-500 tracking-widest mt-6 mb-3">CHAUFFEURS</div>
              {CHAUFFEURS.map((c) => (
                  <div
                  key={c.name}
                    draggable
                  onDragStart={(e) => handleDragStart(e, { type: "driver", ...c })}
                  className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 mb-2 cursor-grab bg-green-50 hover:shadow-sm transition hover:border-green-300"
                  >
                  <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">👤</div>
                    <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{c.name}</div>
                    <div className="text-xs text-gray-500 font-semibold">{c.role}</div>
                  </div>
                </div>
              ))}

              <div className="text-xs font-bold text-gray-500 tracking-widest mt-6 mb-3">CONTRÔLEURS</div>
              {CONTROLEURS.map((c) => (
                  <div
                  key={c.name}
                    draggable
                  onDragStart={(e) => handleDragStart(e, { type: "controller", ...c })}
                  className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 mb-2 cursor-grab bg-amber-50 hover:shadow-sm transition hover:border-amber-300"
                  >
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">👤</div>
                    <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{c.name}</div>
                    <div className="text-xs text-gray-500 font-semibold">{c.role}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Schedule Grid */}
            <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-x-auto shadow-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 md:px-4 py-3 text-left text-xs font-bold text-gray-500 tracking-wide w-24 md:w-32">HEURE</th>
                    {LIGNES.map((l) => (
                      <th key={l} className="px-2 md:px-3 py-3 text-left text-xs font-bold text-gray-500 tracking-wide border-l border-gray-200 min-w-28">{l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HEURES.map((heure, hi) => (
                    <tr key={heure} className="border-b border-gray-200">
                      <td className="px-3 md:px-4 py-3 font-semibold text-sm text-gray-700 align-top">{heure}</td>
                      {LIGNES.map((ligne) => {
                        const key = `${heure}__${ligne}`;
                          const assignment = assignments[key];
                          return (
                            <td
                            key={ligne}
                              onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, heure, ligne)}
                            className={`px-2 md:px-3 py-2 border-l border-gray-200 min-h-20 align-top transition-colors ${dragging ? 'bg-blue-50' : 'bg-white'}`}
                            >
                              {assignment ? (
                              <div className={`rounded-lg p-2 text-xs font-semibold flex items-center justify-between gap-1 ${
                                assignment.type === "bus"
                                  ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                                  : assignment.type === "driver"
                                  ? 'bg-green-100 text-green-900 border border-green-200'
                                  : 'bg-amber-100 text-amber-900 border border-amber-200'
                              }`}>
                                <span className="truncate">{assignment.id || assignment.name}</span>
                                <button
                                  onClick={() => handleRemove(key)}
                                  className="opacity-60 hover:opacity-100 flex-shrink-0 font-bold"
                                  title="Supprimer"
                                >×</button>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400 font-medium text-center pt-8">VIDE</div>
                              )}
                            </td>
                          );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
