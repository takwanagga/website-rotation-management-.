import { useState, useEffect, useCallback, useMemo } from "react";
import AdminSidebar from "../components/AdminSidebar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Bell,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { employeeService } from "../services/employeeService.js";
import { busService } from "../services/busService.js";
import { notificationService } from "../services/notificationService.js";
import { ligneService } from "../services/ligneService.js";
import {
  addPlanning,
  updatePlanning,
  deletePlanning,
  publishPlanningById,
  listPlanningByDateRange,
} from "../lib/api.js";
import axiosInstance from "../api/axios.js";
import { exportPlanningPDF } from "../utils/exportPDF.js";

// ── Constants ─────────────────────────────────────────────────────────────────
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

// ── Date helpers ──────────────────────────────────────────────────────────────
function getCalendarDays(centerDate) {
  const dates = [];
  const center = new Date(centerDate);
  center.setHours(0, 0, 0, 0);
  for (let i = -7; i <= 7; i++) {
    const d = new Date(center);
    d.setDate(center.getDate() + i);
    dates.push(d);
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

// ── Conflict validation ───────────────────────────────────────────────────────
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

// ── Cell-completeness helper ──────────────────────────────────────────────────
/**
 * Returns: 'empty' | 'incomplete' | 'complete'
 * 'complete' means cell has all 3: bus + driver + receveur
 */
function getCellStatus(assignments, dateKey, heure, ligne) {
  const hasBus     = !!assignments[`${dateKey}__${heure}__${ligne._id}__bus`];
  const hasDriver  = !!assignments[`${dateKey}__${heure}__${ligne._id}__driver`];
  const hasReceveur= !!assignments[`${dateKey}__${heure}__${ligne._id}__receveur`];

  const count = [hasBus, hasDriver, hasReceveur].filter(Boolean).length;
  if (count === 0) return "empty";
  if (count === 3) return "complete";
  return "incomplete";
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PlanningQuotidien() {
  const { user } = useAuth();

  // State
  const [dragging, setDragging]= useState(null);
  const [selectedDate, setSelectedDate]= useState(() => new Date());
  const [assignments, setAssignments]= useState({});
  const [conflicts, setConflicts]= useState([]);
  const [loading, setLoading]= useState(true);
  const [aiLoading, setAiLoading]= useState(false);
  const [aiDone, setAiDone]= useState(false);
  const [savingDraft, setSavingDraft]= useState(false);
  const [publishing, setPublishing]= useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [savedPlanningMap, setSavedPlanningMap] = useState({});
  const [deletedPlanningIds, setDeletedPlanningIds] = useState([]);
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);


  const [lignes, setLignes]         = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [receveurs, setReceveurs]   = useState([]);
  const [buses, setBuses]           = useState([]);

  const calendarDays = useMemo(() => getCalendarDays(selectedDate), [selectedDate]);

  const displayName =
    [user?.prenom, user?.nom].filter(Boolean).join(" ").trim() ||
    user?.email ||
    "Administrateur";
  const initial = (displayName.charAt(0) || "A").toUpperCase();

  // ── Data fetching ───────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [lignesData, employesData, busesData] = await Promise.all([
        ligneService.list(),
        employeeService.list(),
        busService.list(),
      ]);

      const activeLignes = lignesData.filter((l) =>
        (l.status || l.statut || "actif") === "actif"
      );
      const activeBuses = busesData.filter((b) =>
        (b.status || b.statut || "actif") === "actif"
      );
      const activeEmployes = employesData.filter(
        (e) => (e.statut || "actif") === "actif"
      );

      setLignes(activeLignes);
      setBuses(activeBuses);
      setChauffeurs(activeEmployes.filter((e) => e.role === "chauffeur"));
      setReceveurs(activeEmployes.filter((e) => e.role === "receveur"));

      if (activeLignes.length === 0) toast.error("Aucune ligne disponible");
      if (activeBuses.length === 0) toast.error("Aucun bus disponible");
      if (activeEmployes.filter((e) => e.role === "chauffeur").length === 0)
        toast.error("Aucun chauffeur actif");
      if (activeEmployes.filter((e) => e.role === "receveur").length === 0)
        toast.error("Aucun receveur actif");
    } catch (err) {
      console.error("Erreur chargement données:", err);
      const msg = err.response?.data?.message || err.message || "";
      toast.error(msg || "Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch planning data when date changes
  useEffect(() => {
    const fetchPlannings = async () => {
      try {
        const start = new Date(selectedDate);
        start.setDate(start.getDate() - 7);
        const end = new Date(selectedDate);
        end.setDate(end.getDate() + 7);
        const { data } = await listPlanningByDateRange(formatDateKey(start), formatDateKey(end));
        
        const newAssignments = {};
        const savedMap = {};
        data.forEach(p => {
            const dateKey = p.date.split('T')[0];
            const heure = `${p.heuredebut}-${p.heurefin}`;
            if (p.bus) {
                newAssignments[`${dateKey}__${heure}__${p.ligne?._id}__bus`] = { ...p.bus, type: "bus", busId: p.bus._id, matricule: p.bus.matricule };
            }
            if (p.employe) {
                const roleType = p.employe.role === "chauffeur" ? "driver" : "receveur";
                newAssignments[`${dateKey}__${heure}__${p.ligne?._id}__${roleType}`] = { ...p.employe, type: roleType, employeeId: p.employe._id };
            }
            // Record saved IDs mapping
            const keyBase = `${dateKey}__${heure}__${p.ligne?._id}`;
            savedMap[`${keyBase}__bus`] = p._id;
            savedMap[`${keyBase}__driver`] = p._id;
            savedMap[`${keyBase}__receveur`] = p._id;
        });
        setAssignments(newAssignments);
        setSavedPlanningMap(prev => ({ ...prev, ...savedMap }));
      } catch (err) {
        console.error("Erreur chargement planning", err);
      }
    };
    fetchPlannings();
  }, [selectedDate]);

  // ── Conflict detection ──────────────────────────────────────────────────────
  const checkConflicts = useCallback((newAssignments) => {
    const newConflicts = [];
    const empSlots = {};

    Object.entries(newAssignments).forEach(([key, a]) => {
      if (!a.employeeId) return;
      const [dateKey, heure] = key.split("__");
      if (!empSlots[a.employeeId]) empSlots[a.employeeId] = [];
      empSlots[a.employeeId].push({ dateKey, heure });
    });

    Object.entries(empSlots).forEach(([, slots]) => {
      const byDate = {};
      slots.forEach((s) => {
        if (!byDate[s.dateKey]) byDate[s.dateKey] = [];
        byDate[s.dateKey].push(s);
      });
      Object.entries(byDate).forEach(([, daySlots]) => {
        for (let i = 0; i < daySlots.length; i++) {
          for (let j = i + 1; j < daySlots.length; j++) {
            if (daySlots[i].heure === daySlots[j].heure) {
              newConflicts.push({
                dateKey: daySlots[i].dateKey,
                heure: daySlots[i].heure,
                message: `Conflit: employé assigné à deux lignes au même créneau (${daySlots[i].heure})`,
              });
            }
          }
        }
      });
    });

    setConflicts(newConflicts);
    return newConflicts.length === 0;
  }, []);

  // ── Incomplete-cell stats ───────────────────────────────────────────────────
  const incompleteCellCount = useMemo(() => {
    const dateKey = formatDateKey(selectedDate);
    let count = 0;
    for (const heure of HEURES) {
      for (const ligne of lignes) {
        if (getCellStatus(assignments, dateKey, heure, ligne) === "incomplete") count++;
      }
    }
    return count;
  }, [assignments, selectedDate, lignes]);

  // ── Drag & Drop ─────────────────────────────────────────────────────────────
  const handleDragStart = (e, item) => {
    setDragging(item);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDrop = (e, heure, ligne, date) => {
    e.preventDefault();
    if (!dragging) return;
    const dateKey  = formatDateKey(date);
    const roleType = dragging.type === "bus"
      ? "bus"
      : dragging.role === "chauffeur" ? "driver" : "receveur";
    const key = `${dateKey}__${heure}__${ligne._id}__${roleType}`;

    if (dragging.type === "bus") {
      if (!validateConflict({ assignments, dateKey, heure, ligneId: ligne._id, item: dragging, currentKey: key })) {
        toast.error(`Le bus ${dragging.matricule} est déjà assigné à ce créneau`);
        setDragging(null);
        return;
      }
      const newAssignments = {
        ...assignments,
        [key]: { ...dragging, type: "bus", busId: dragging._id },
      };
      setAssignments(newAssignments);
      checkConflicts(newAssignments);
      setDragging(null);
      toast.success(`Bus ${dragging.matricule} assigné`);
      return;
    }

    // Employee drop
    if (!validateConflict({ assignments, dateKey, heure, ligneId: ligne._id, item: dragging, currentKey: key })) {
      toast.error(`${dragging.nom} est déjà assigné(e) à ce créneau`);
      setDragging(null);
      return;
    }
    const newAssignments = {
      ...assignments,
      [key]: { ...dragging, type: roleType, employeeId: dragging._id },
    };
    setAssignments(newAssignments);
    checkConflicts(newAssignments);
    setDragging(null);
    toast.success(`${dragging.nom} assigné(e)`);
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

  // ── Slot helpers ────────────────────────────────────────────────────────────
  const getSlotAssignments = (date, heure, ligne) => {
    const dateKey = formatDateKey(date);
    return Object.entries(assignments)
      .filter(([key]) => {
        const parts = key.split("__");
        return parts[0] === dateKey && parts[1] === heure && parts[2] === ligne._id;
      })
      .map(([key, value]) => ({ key, value }));
  };

  // ── AI: call backend ────────────────────────────────────────────────────────
  const handleAI = async () => {
    setAiLoading(true);
    setAiDone(false);
    try {
      const dateKey = formatDateKey(selectedDate);
      const { data } = await axiosInstance.post("/ai/generate-planning", {
        date: dateKey,
        saveToDb: false,
      });

      const { assignments: aiAssignments, stats } = data;

      // Merge AI assignments into existing (AI fills empty slots only)
      setAssignments((prev) => {
        const merged = { ...prev };
        Object.entries(aiAssignments).forEach(([key, val]) => {
          if (!merged[key]) merged[key] = val; // Don't overwrite manual assignments
        });
        checkConflicts(merged);
        return merged;
      });

      setAiDone(true);
      toast.success(
        `Planning optimisé : ${stats.assignedSlots}/${stats.totalSlots} créneaux (${stats.coveragePercent}%)`,
        { duration: 4000 }
      );
    } catch (err) {
      const msg = err?.response?.data?.message || "Erreur lors de l'optimisation IA";
      toast.error(msg);
    } finally {
      setAiLoading(false);
    }
  };

  // ── Save draft ──────────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true);
      const nextPlanningMap = { ...savedPlanningMap };
      for (const id of deletedPlanningIds) await deletePlanning(id);
      for (const [key, assignment] of Object.entries(assignments)) {
        if (assignment.type === "bus" || assignment.type === "receveur") continue;
        const [dateKey, heure, ligneId] = key.split("__");
        const busKey = `${dateKey}__${heure}__${ligneId}__bus`;
        const busAssignment = assignments[busKey];
        if (!busAssignment?.busId) continue;
        const { heuredebut, heurefin } = parseHeureRange(heure);
        const payload = {
          date: dateKey,
          heuredebut,
          heurefin,
          ligne: ligneId,
          bus: busAssignment.busId,
          employe: assignment.employeeId,
        };
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

  // ── Publish ─────────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    const selectedDateKey = formatDateKey(selectedDate);
    const ids = Object.entries(savedPlanningMap)
      .filter(([key]) => key.startsWith(`${selectedDateKey}__`))
      .map(([, id]) => id)
      .filter(Boolean);
    if (ids.length === 0) {
      toast.error("Aucun planning sauvegardé à publier");
      return;
    }
    try {
      setPublishing(true);
      await Promise.all(ids.map((id) => publishPlanningById(id, true)));
      toast.success("Planning publié avec succès");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Erreur lors de la publication");
    } finally {
      setPublishing(false);
    }
    const dateKey = formatDateKey(selectedDate);
  const employeeIds = new Set();
  Object.entries(assignments).forEach(([key, val]) => {
    if (key.startsWith(dateKey) && val.employeeId) {
      employeeIds.add(val.employeeId);
    }
  });
  
  const dateStr = selectedDate.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long"
  });
  
  await notificationService.sendToMany(
    `Votre planning du ${dateStr} a été publié. Consultez votre espace employé.`,
    "planning_publie",
    [...employeeIds]
  );
  
  toast.success("Planning publié et employés notifiés ✅");

  };

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 md:ml-64 bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Chargement des données…</p>
          </div>
        </div>
      </div>
    );
  }

  const dateKey = formatDateKey(selectedDate);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    
    <div className="flex bg-gray-50 min-h-screen">
      <AdminSidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen pt-16 md:pt-0">
        <Toaster position="top-right" />

        {/* ── Top Navbar ── */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-10">
          
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
              </svg>
              <input type="search" placeholder="Rechercher…" className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => exportPlanningPDF(selectedDate, lignes, assignments, HEURES)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition">
              <FileText size={16} />
              Exporter PDF
            </button>
            <button className="relative p-2 rounded-xl hover:bg-gray-100 transition">
              <Bell size={18} className="text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{initial}</div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 leading-none">{displayName}</p>
                <p className="text-xs text-gray-400 mt-0.5">TransRoute TN</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          {/* ── Conflict alerts ── */}
          {conflicts.length > 0 && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-semibold text-red-700 mb-1">{conflicts.length} conflit(s) détecté(s)</p>
                {conflicts.map((c, i) => (
                  <p key={i} className="text-xs text-red-600">{c.message}</p>
                ))}
              </div>
            </div>
          )}

          {/* ── Incomplete cell warning ── */}
          {incompleteCellCount > 0 && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-amber-500 flex-shrink-0" size={18} />
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">{incompleteCellCount} créneau(x) incomplet(s)</span>
                  {" "}— chaque créneau doit contenir 1 chauffeur + 1 receveur + 1 bus.
                </p>
              </div>
              <button
                onClick={() => setShowIncompleteOnly(v => !v)}
                className="text-xs font-medium text-amber-700 underline whitespace-nowrap"
              >
                {showIncompleteOnly ? "Tout afficher" : "Filtrer"}
              </button>
            </div>
          )}

          {/* ── AI Banner ── */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-lg flex-shrink-0">✦</div>
              <div>
                <p className="font-semibold text-indigo-900 text-sm">Optimisation Intelligente</p>
                <p className="text-indigo-500 text-xs mt-0.5">Algorithme tenant compte de l'âge, des distances et des statuts bus.</p>
              </div>
            </div>
            <button
              onClick={handleAI}
              disabled={aiLoading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-bold rounded-xl transition whitespace-nowrap shadow-sm"
            >
              {aiLoading ? "⏳ Optimisation…" : aiDone ? "✅ Optimisé !" : "Lancer l'IA"}
            </button>
          </div>

          {/* ── Date navigator ── */}
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

          {/* ── Main layout: sidebar + grid ── */}
          <div className="flex gap-5 items-start">
            {/* ── Draggable resource panel ── */}
            <div className="w-56 flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-y-auto max-h-[70vh] p-4 space-y-5">

                {/* Buses */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="3" width="15" height="13" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 8h4l3 5v3h-7V8z" />
                      <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bus Disponibles</span>
                  </div>
                  {buses.length === 0 && <p className="text-xs text-gray-400">Aucun bus disponible</p>}
                  {buses.map((b) => (
                    <div
                      key={b._id}
                      draggable
                      /* ─────────────────────────────────────────────────────────
                         BUG FIX: spread first, then override `type` so that
                         normalizeBus's  `type: bus.type ?? model`  (e.g. "Iveco")
                         doesn't shadow the drop-type sentinel "bus".
                      ───────────────────────────────────────────────────────── */
                      onDragStart={(e) => handleDragStart(e, { ...b, type: "bus" })}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-indigo-100 bg-indigo-50 mb-1.5 cursor-grab hover:shadow-sm hover:border-indigo-300 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="3" width="15" height="13" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8h4l3 5v3h-7V8z" />
                        <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                      </svg>
                      <div className="min-w-0">
                        {/* Show matricule — guaranteed defined after normalizeBus */}
                        <div className="text-xs font-bold text-indigo-900 truncate">
                          {b.matricule || b.immatriculation || "—"}
                        </div>
                        <div className="text-xs text-indigo-400 truncate">{b.model || "Bus"}</div>
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
                      onDragStart={(e) => handleDragStart(e, { ...c, type: "driver" })}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-emerald-100 bg-emerald-50 mb-1.5 cursor-grab hover:shadow-sm hover:border-emerald-300 transition"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 text-xs font-bold flex-shrink-0">
                        {c.nom?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-emerald-900 truncate">{c.nom} {c.prenom}</div>
                        <div className="text-xs text-emerald-400">Chauffeur{c.age ? ` · ${c.age} ans` : ""}</div>
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
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Receveurs</span>
                  </div>
                  {receveurs.length === 0 && <p className="text-xs text-gray-400">Aucun receveur actif</p>}
                  {receveurs.map((r) => (
                    <div
                      key={r._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, { ...r, type: "receveur" })}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-amber-100 bg-amber-50 mb-1.5 cursor-grab hover:shadow-sm hover:border-amber-300 transition"
                    >
                      <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 text-xs font-bold flex-shrink-0">
                        {r.nom?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-amber-900 truncate">{r.nom} {r.prenom}</div>
                        <div className="text-xs text-amber-400">Receveur{r.age ? ` · ${r.age} ans` : ""}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Planning grid ── */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-28">Heure</th>
                      {lignes.length === 0 ? (
                        <th className="px-4 py-3 text-xs text-gray-400 font-normal">Aucune ligne disponible</th>
                      ) : (
                        lignes.map((l) => (
                          <th key={l._id} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-l border-gray-100 min-w-[160px]">
                            {l.libelle}
                            {l.distance ? (
                              <span className="ml-1 text-gray-400 font-normal normal-case">({l.distance} km)</span>
                            ) : null}
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
                          {parseInt(heure.split(":")[0]) >= 18 && (
                            <span className="ml-1 text-xs text-indigo-400">🌙</span>
                          )}
                        </td>
                        {lignes.length === 0 ? (
                          <td className="px-4 py-3 text-xs text-gray-300 text-center">—</td>
                        ) : (
                          lignes.map((ligne) => {
                            const slotAssignments = getSlotAssignments(selectedDate, heure, ligne);
                            const cellStatus      = getCellStatus(assignments, dateKey, heure, ligne);

                            // Filter: hide complete cells when "show incomplete only" is on
                            if (showIncompleteOnly && cellStatus !== "incomplete") return (
                              <td key={ligne._id} className="px-3 py-2 border-l border-gray-100 min-h-[72px] bg-gray-50/30 align-top" />
                            );

                            const hasConflict = slotAssignments.some(({ key }) =>
                              conflicts.some((c) => {
                                const [d, h] = key.split("__");
                                return c.dateKey === d && c.heure === h;
                              })
                            );

                            // Cell background by status
                            let cellBg = "";
                            if (dragging) cellBg = "bg-indigo-50/60";
                            else if (hasConflict) cellBg = "bg-red-50";
                            else if (cellStatus === "complete") cellBg = "bg-emerald-50/40";
                            else if (cellStatus === "incomplete") cellBg = "bg-amber-50/60";

                            return (
                              <td
                                key={ligne._id}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, heure, ligne, selectedDate)}
                                className={`px-3 py-2 border-l border-gray-100 min-h-[72px] align-top transition-colors relative ${cellBg}`}
                              >
                                {/* Completeness indicator badge */}
                                {cellStatus === "complete" && (
                                  <CheckCircle2 size={12} className="absolute top-1.5 right-1.5 text-emerald-500" />
                                )}
                                {cellStatus === "incomplete" && (
                                  <AlertTriangle size={12} className="absolute top-1.5 right-1.5 text-amber-500" title="Créneau incomplet (bus + chauffeur + receveur requis)" />
                                )}

                                {slotAssignments.length === 0 ? (
                                  <span className="text-xs text-gray-300 font-medium">Vide</span>
                                ) : (
                                  <div className="space-y-1">
                                    {slotAssignments.map(({ key, value: assignment }) => {
                                      // ───────────────────────────────────────────
                                      // Display label: always use matricule for bus
                                      // ───────────────────────────────────────────
                                      const label = assignment.type === "bus"
                                        ? (assignment.matricule || assignment.immatriculation || "Bus")
                                        : `${assignment.nom ?? ""} ${(assignment.prenom ?? "").charAt(0)}.`;

                                      const colorClass = assignment.type === "bus"
                                        ? "bg-indigo-100 text-indigo-800"
                                        : assignment.type === "driver"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-amber-100 text-amber-800";

                                      const icon = assignment.type === "bus" ? "🚌"
                                        : assignment.type === "driver" ? "🧑‍✈️"
                                        : "🎫";

                                      return (
                                        <div
                                          key={key}
                                          className={`flex items-center justify-between gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${colorClass}`}
                                        >
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <span>{icon}</span>
                                            <span className="truncate">{label}</span>
                                          </div>
                                          <button
                                            onClick={() => handleRemove(key)}
                                            className="opacity-50 hover:opacity-100 flex-shrink-0 font-bold text-sm leading-none ml-1"
                                            title="Retirer"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      );
                                    })}

                                    {/* Prompt to complete incomplete cell */}
                                    {cellStatus === "incomplete" && (
                                      <div className="text-xs text-amber-600 font-medium pt-0.5 italic">
                                        {!assignments[`${dateKey}__${heure}__${ligne._id}__bus`] && "Ajouter un bus · "}
                                        {!assignments[`${dateKey}__${heure}__${ligne._id}__driver`] && "Ajouter chauffeur · "}
                                        {!assignments[`${dateKey}__${heure}__${ligne._id}__receveur`] && "Ajouter receveur"}
                                      </div>
                                    )}
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

          {/* ── Action buttons ── */}
          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <button
              onClick={handleSaveDraft}
              disabled={savingDraft}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition shadow-sm"
            >
              {savingDraft ? "Enregistrement…" : "Enregistrer brouillon"}
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing || savingDraft}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition shadow-sm"
            >
              {publishing ? "Publication…" : "Publier"}
            </button>

            {/* Summary pill */}
            <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
              {incompleteCellCount > 0 ? (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full font-semibold">
                  <AlertTriangle size={12} />
                  {incompleteCellCount} incomplet(s)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full font-semibold">
                  <CheckCircle2 size={12} />
                  Tous les créneaux sont complets
                </span>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}