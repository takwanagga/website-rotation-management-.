import { useState, useEffect, useCallback, useMemo } from "react";
import AdminSidebar from "../components/AdminSidebar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { ChevronLeft, ChevronRight, AlertCircle, Bell, FileText } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { employeeService } from "../services/employeeService.js";
import { busService } from "../services/busService.js";
import { ligneService } from "../services/ligneService.js";
import {
  addPlanning,
  updatePlanning,
  deletePlanning,
  publishPlanningById,
} from "../lib/api.js";

const HEURES = [
  "06:00-08:00",
  "08:00-10:00",
  "10:00-12:00",
  "12:00-14:00",
  "14:00-16:00",
  "16:00-18:00",
  "18:00-20:00",
  "20:00-22:00",
];

function getCalendarDays(centerDate) {
  const dates = [];
  const center = new Date(centerDate);
  center.setHours(0, 0, 0, 0);
  for (let i = -7; i <= 7; i++) {
    const date = new Date(center);
    date.setDate(center.getDate() + i);
    dates.push(date);
  }
  return dates;
}

function formatDateKey(date) {
  return date.toISOString().split("T")[0];
}

function isSameDate(d1, d2) {
  return formatDateKey(d1) === formatDateKey(d2);
}

function parseHeureRange(heureRange) {
  const [start, end] = heureRange.split("-");
  return { heuredebut: start, heurefin: end };
}

function validateConflict({ assignments, dateKey, heure, ligneId, item, currentKey }) {
  const duplicate = Object.entries(assignments).find(([key, value]) => {
    if (key === currentKey) return false;
    const [d, h, l] = key.split("__");
    if (d !== dateKey || h !== heure || l === ligneId) return false;
    if (item.type === "bus") return value.busId === item._id;
    return value.employeeId === item._id;
  });
  return !duplicate;
}

export default function PlanningQuotidien() {
  const { user } = useAuth();
  const [dragging, setDragging] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [assignments, setAssignments] = useState({});
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savedPlanningMap, setSavedPlanningMap] = useState({});
  const [deletedPlanningIds, setDeletedPlanningIds] = useState([]);

  const [lignes, setLignes] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [receveurs, setReceveurs] = useState([]);
  const [buses, setBuses] = useState([]);

  const calendarDays = useMemo(() => getCalendarDays(selectedDate), [selectedDate]);

  const displayName =
    [user?.prenom, user?.nom].filter(Boolean).join(" ").trim() ||
    user?.email ||
    "Administrateur";
  const initial = (displayName.charAt(0) || "A").toUpperCase();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [lignesData, employesData, busesData] = await Promise.all([
        ligneService.list(),
        employeeService.list(),
        busService.list(),
      ]);
      setLignes(lignesData);
      setBuses(busesData.filter((b) => b.status === "disponible"));
      const activeEmployes = employesData.filter((e) => e.statut === "actif");
      setChauffeurs(activeEmployes.filter((e) => e.role === "chauffeur"));
      setReceveurs(activeEmployes.filter((e) => e.role === "receveur"));
    } catch {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const checkConflicts = useCallback((newAssignments) => {
    const newConflicts = [];
    const employeeAssignments = {};
    Object.entries(newAssignments).forEach(([key, assignment]) => {
      const [dateKey, heure, ligneId] = key.split("__");
      if (!employeeAssignments[assignment.employeeId]) {
        employeeAssignments[assignment.employeeId] = [];
      }
      employeeAssignments[assignment.employeeId].push({ dateKey, heure, ligneId, assignment });
    });
    Object.entries(employeeAssignments).forEach(([, employeeSlots]) => {
      const byDate = {};
      employeeSlots.forEach((slot) => {
        if (!byDate[slot.dateKey]) byDate[slot.dateKey] = [];
        byDate[slot.dateKey].push(slot);
      });
      Object.entries(byDate).forEach(([, slots]) => {
        for (let i = 0; i < slots.length; i++) {
          for (let j = i + 1; j < slots.length; j++) {
            if (slots[i].heure === slots[j].heure) {
              newConflicts.push({
                dateKey: slots[i].dateKey,
                heure: slots[i].heure,
                lignes: [slots[i].ligneId, slots[j].ligneId],
                message: `Conflit: employé assigné à deux lignes en même temps (${slots[i].heure})`,
              });
            }
          }
        }
      });
    });
    setConflicts(newConflicts);
    return newConflicts.length === 0;
  }, []);

  const handleDragStart = (e, item) => {
    setDragging(item);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDrop = (e, heure, ligne, date) => {
    e.preventDefault();
    if (!dragging) return;
    const dateKey = formatDateKey(date);
    const roleType = dragging.role === "chauffeur" ? "driver" : "receveur";
    const key = `${dateKey}__${heure}__${ligne._id}__${roleType}`;
    if (!validateConflict({ assignments, dateKey, heure, ligneId: ligne._id, item: dragging, currentKey: key })) {
      toast.error(`${dragging.nom} est déjà assigné(e) à cette heure`);
      setDragging(null);
      return;
    }
    const newAssignments = { ...assignments, [key]: { ...dragging, type: roleType, employeeId: dragging._id } };
    setAssignments(newAssignments);
    checkConflicts(newAssignments);
    setDragging(null);
    toast.success(`${dragging.nom} assigné(e)`);
  };

  const handleBusDrop = (e, heure, ligne, date) => {
    e.preventDefault();
    if (!dragging || dragging.type !== "bus") return;
    const dateKey = formatDateKey(date);
    const key = `${dateKey}__${heure}__${ligne._id}__bus`;
    if (!validateConflict({ assignments, dateKey, heure, ligneId: ligne._id, item: dragging, currentKey: key })) {
      toast.error(`Le bus ${dragging.immatriculation} est déjà assigné`);
      setDragging(null);
      return;
    }
    const newAssignments = { ...assignments, [key]: { ...dragging, type: "bus", busId: dragging._id } };
    setAssignments(newAssignments);
    setDragging(null);
    toast.success(`Bus assigné`);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleRemove = (key) => {
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[key];
      checkConflicts(next);
      return next;
    });
    setSavedPlanningMap((prev) => {
      const next = { ...prev };
      if (next[key]) {
        setDeletedPlanningIds((ids) => [...ids, next[key]]);
        delete next[key];
      }
      return next;
    });
  };

  const handleAI = () => {
    setAiLoading(true);
    setAiDone(false);
    setTimeout(() => {
      const autoAssign = {};
      const dateKey = formatDateKey(selectedDate);
      HEURES.forEach((h, hi) => {
        lignes.forEach((ligne, li) => {
          const busKey = `${dateKey}__${h}__${ligne._id}__bus`;
          const driverKey = `${dateKey}__${h}__${ligne._id}__driver`;
          const receveurKey = `${dateKey}__${h}__${ligne._id}__receveur`;
          if (!assignments[busKey] && buses.length > 0) {
            const candidateBus = buses[(hi + li) % buses.length];
            const combined = { ...assignments, ...autoAssign };
            if (validateConflict({ assignments: combined, dateKey, heure: h, ligneId: ligne._id, item: { ...candidateBus, type: "bus" }, currentKey: busKey })) {
              autoAssign[busKey] = { ...candidateBus, type: "bus", busId: candidateBus._id };
            }
          }
          if (!assignments[driverKey] && chauffeurs.length > 0) {
            const driver = chauffeurs[(hi + li) % chauffeurs.length];
            const combined = { ...assignments, ...autoAssign };
            const busy = Object.entries(combined).some(([k, v]) => { const [d, hour] = k.split("__"); return d === dateKey && hour === h && v.employeeId === driver._id; });
            if (!busy) autoAssign[driverKey] = { ...driver, type: "driver", employeeId: driver._id };
          }
          if (!assignments[receveurKey] && receveurs.length > 0) {
            const rec = receveurs[(hi + li) % receveurs.length];
            const combined = { ...assignments, ...autoAssign };
            const busy = Object.entries(combined).some(([k, v]) => { const [d, hour] = k.split("__"); return d === dateKey && hour === h && v.employeeId === rec._id; });
            if (!busy) autoAssign[receveurKey] = { ...rec, type: "receveur", employeeId: rec._id };
          }
        });
      });
      const newAssignments = { ...assignments, ...autoAssign };
      setAssignments(newAssignments);
      checkConflicts(newAssignments);
      setAiLoading(false);
      setAiDone(true);
      toast.success("Planning optimisé avec succès");
    }, 1800);
  };

  const getSlotAssignments = (date, heure, ligne) => {
    const dateKey = formatDateKey(date);
    return Object.entries(assignments)
      .filter(([key]) => {
        const parts = key.split("__");
        return parts[0] === dateKey && parts[1] === heure && parts[2] === ligne._id;
      })
      .map(([key, value]) => ({ key, value }));
  };

  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true);
      const nextPlanningMap = { ...savedPlanningMap };
      for (const id of deletedPlanningIds) await deletePlanning(id);
      for (const [key, assignment] of Object.entries(assignments)) {
        if (assignment.type === "bus") continue;
        const [dateKey, heure, ligneId] = key.split("__");
        const busKey = `${dateKey}__${heure}__${ligneId}__bus`;
        const busAssignment = assignments[busKey];
        if (!busAssignment?.busId) continue;
        const { heuredebut, heurefin } = parseHeureRange(heure);
        const payload = { date: dateKey, heuredebut, heurefin, ligne: ligneId, bus: busAssignment.busId, employe: assignment.employeeId };
        if (nextPlanningMap[key]) {
          const response = await updatePlanning(nextPlanningMap[key], payload);
          nextPlanningMap[key] = response.data?._id || nextPlanningMap[key];
        } else {
          const response = await addPlanning(payload);
          nextPlanningMap[key] = response.data?._id;
        }
      }
      setSavedPlanningMap(nextPlanningMap);
      setDeletedPlanningIds([]);
      toast.success("Brouillon enregistré avec succès");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      const selectedDateKey = formatDateKey(selectedDate);
      const ids = Object.entries(savedPlanningMap)
        .filter(([key]) => key.startsWith(`${selectedDateKey}__`))
        .map(([, id]) => id)
        .filter(Boolean);
      if (ids.length === 0) { toast.error("Aucun planning sauvegardé à publier"); return; }
      await Promise.all(ids.map((id) => publishPlanningById(id, true)));
      toast.success("Planning publié avec succès");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Erreur lors de la publication");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 md:ml-64 bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500 text-sm">Chargement des données...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <AdminSidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen pt-16 md:pt-0">
        <Toaster position="top-right" />

        {/* Top navbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-10">
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
              </svg>
              <input
                type="search"
                placeholder="Rechercher..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={savingDraft}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 disabled:opacity-60 transition"
            >
              <FileText size={16} />
              {savingDraft ? "Enregistrement..." : "Exporter PDF"}
            </button>

            <button className="relative p-2 rounded-xl hover:bg-gray-100 transition">
              <Bell size={18} className="text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {initial}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 leading-none">{displayName}</p>
                <p className="text-xs text-gray-400 mt-0.5">TransRoute TN</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          {/* Conflicts */}
          {conflicts.length > 0 && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-semibold text-red-700 mb-1">
                  {conflicts.length} conflit(s) détecté(s)
                </p>
                {conflicts.map((c, i) => (
                  <p key={i} className="text-xs text-red-600">{c.message}</p>
                ))}
              </div>
            </div>
          )}

          {/* AI Banner */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-lg flex-shrink-0">
                ✦
              </div>
              <div>
                <p className="font-semibold text-indigo-900 text-sm">Optimisation Intelligente</p>
                <p className="text-indigo-500 text-xs mt-0.5">
                  Laissez l'IA suggérer le meilleur équilibre pour vos équipes.
                </p>
              </div>
            </div>
            <button
              onClick={handleAI}
              disabled={aiLoading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-bold rounded-xl transition whitespace-nowrap shadow-sm"
            >
              {aiLoading ? "⏳ Optimisation..." : aiDone ? "✅ Optimisé !" : "Lancer l'IA"}
            </button>
          </div>

          {/* Date navigator */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 mb-5 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); }} className="p-1.5 rounded-lg hover:bg-gray-100 flex-shrink-0">
                <ChevronLeft size={18} />
              </button>
              {calendarDays.map((date) => {
                const sel = isSameDate(date, selectedDate);
                return (
                  <button
                    key={formatDateKey(date)}
                    onClick={() => setSelectedDate(date)}
                    className={`min-w-[52px] px-2 py-2 rounded-lg text-center transition flex-shrink-0 ${sel ? "bg-indigo-600 text-white" : "hover:bg-gray-50 text-gray-600"}`}
                  >
                    <div className="text-xs uppercase">{date.toLocaleDateString("fr-FR", { weekday: "short" })}</div>
                    <div className="text-xs font-bold mt-0.5">{date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}</div>
                  </button>
                );
              })}
              <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); }} className="p-1.5 rounded-lg hover:bg-gray-100 flex-shrink-0">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Main content: sidebar + grid */}
          <div className="flex gap-5 items-start">
            {/* Draggable panel */}
            <div className="w-56 flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-y-auto max-h-[70vh] p-4 space-y-5">
                {/* Buses */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="3" width="15" height="13" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 8h4l3 5v3h-7V8z" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bus Disponibles</span>
                  </div>
                  {buses.length === 0 && <p className="text-xs text-gray-400">Aucun bus disponible</p>}
                  {buses.map((b) => (
                    <div
                      key={b._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, { type: "bus", ...b })}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-indigo-100 bg-indigo-50 mb-1.5 cursor-grab hover:shadow-sm hover:border-indigo-300 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="3" width="15" height="13" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8h4l3 5v3h-7V8z" />
                        <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                      </svg>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-indigo-900 truncate">{b.matricule}</div>
                        <div className="text-xs text-indigo-400">Bus</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chauffeurs */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chauffeurs</span>
                  </div>
                  {chauffeurs.length === 0 && <p className="text-xs text-gray-400">Aucun chauffeur actif</p>}
                  {chauffeurs.map((c) => (
                    <div
                      key={c._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, { type: "driver", ...c })}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-emerald-100 bg-emerald-50 mb-1.5 cursor-grab hover:shadow-sm hover:border-emerald-300 transition"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 text-xs font-bold flex-shrink-0">
                        {c.nom?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-emerald-900 truncate">{c.nom} {c.prenom}</div>
                        <div className="text-xs text-emerald-400">Driver</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Receveurs */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contrôleurs</span>
                  </div>
                  {receveurs.length === 0 && <p className="text-xs text-gray-400">Aucun receveur actif</p>}
                  {receveurs.map((r) => (
                    <div
                      key={r._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, { type: "receveur", ...r })}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-amber-100 bg-amber-50 mb-1.5 cursor-grab hover:shadow-sm hover:border-amber-300 transition"
                    >
                      <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 text-xs font-bold flex-shrink-0">
                        {r.nom?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-amber-900 truncate">{r.nom} {r.prenom}</div>
                        <div className="text-xs text-amber-400">Conductor</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Planning grid */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-28">
                        Heure
                      </th>
                      {lignes.length === 0 ? (
                        <th className="px-4 py-3 text-xs text-gray-400 font-normal">Aucune ligne disponible</th>
                      ) : (
                        lignes.map((l) => (
                          <th key={l._id} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-l border-gray-100 min-w-[140px]">
                            {l.libelle}
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {HEURES.map((heure) => (
                      <tr key={heure} className="border-b border-gray-100 last:border-0">
                        <td className="px-4 py-3 text-xs font-bold text-gray-600 whitespace-nowrap align-top">
                          {heure}
                        </td>
                        {lignes.length === 0 ? (
                          <td className="px-4 py-3 text-xs text-gray-300 text-center">—</td>
                        ) : (
                          lignes.map((ligne) => {
                            const slotAssignments = getSlotAssignments(selectedDate, heure, ligne);
                            const hasConflict = slotAssignments.some(({ key }) =>
                              conflicts.some((c) => {
                                const [d, h] = key.split("__");
                                return c.dateKey === d && c.heure === h;
                              })
                            );
                            return (
                              <td
                                key={ligne._id}
                                onDragOver={handleDragOver}
                                onDrop={(e) => {
                                  if (dragging?.type === "bus") handleBusDrop(e, heure, ligne, selectedDate);
                                  else handleDrop(e, heure, ligne, selectedDate);
                                }}
                                className={`px-3 py-2 border-l border-gray-100 min-h-[72px] align-top transition-colors ${
                                  dragging ? "bg-indigo-50/50" : hasConflict ? "bg-red-50" : ""
                                }`}
                              >
                                {slotAssignments.length === 0 ? (
                                  <span className="text-xs text-gray-300 font-medium">Vide</span>
                                ) : (
                                  <div className="space-y-1">
                                    {slotAssignments.map(({ key, value: assignment }) => (
                                      <div
                                        key={key}
                                        className={`flex items-center justify-between gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                                          assignment.type === "bus"
                                            ? "bg-indigo-100 text-indigo-800"
                                            : assignment.type === "driver"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-amber-100 text-amber-800"
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="text-xs">
                                            {assignment.type === "bus" ? "🚌" : "👤"}
                                          </span>
                                          <span className="truncate">
                                            {assignment.type === "bus"
                                              ? assignment.matricule || assignment.immatriculation
                                              : `${assignment.nom} ${assignment.prenom?.charAt(0)}.`}
                                          </span>
                                        </div>
                                        <button
                                          onClick={() => handleRemove(key)}
                                          className="opacity-50 hover:opacity-100 flex-shrink-0 font-bold text-sm leading-none"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            );
                          })
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={savingDraft}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition shadow-sm"
            >
              {savingDraft ? "Enregistrement..." : "Enregistrer brouillon"}
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing || savingDraft}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition shadow-sm"
            >
              {publishing ? "Publication..." : "Publier"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}