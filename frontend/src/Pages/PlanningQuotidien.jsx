import { useState, useEffect, useCallback, useMemo } from "react";
import AdminSidebar from "../components/AdminSidebar.jsx";
import NotificationBell from "../components/NotificationBell.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
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

// ── Conflict check ────────────────────────────────────────────────────────────
function validateConflict({ assignments, dateKey, heure, ligneId, item, currentKey }) {
  const duplicate = Object.entries(assignments).find(([key, value]) => {
    if (key === currentKey) return false;
    const parts = key.split("__");
    const [d, h, l] = parts;
    if (d !== dateKey || h !== heure || l === ligneId) return false;
    if (item.type === "bus") return value.busId === item._id;
    return value.employeeId === item._id;
  });
  return !duplicate;
}

// ── Cell completeness ─────────────────────────────────────────────────────────
function getCellStatus(assignments, dateKey, heure, ligne) {
  const hasBus      = !!assignments[`${dateKey}__${heure}__${ligne._id}__bus`];
  const hasDriver   = !!assignments[`${dateKey}__${heure}__${ligne._id}__driver`];
  const hasReceveur = !!assignments[`${dateKey}__${heure}__${ligne._id}__receveur`];
  const count = [hasBus, hasDriver, hasReceveur].filter(Boolean).length;
  if (count === 0) return "empty";
  if (count === 3) return "complete";
  return "incomplete";
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PlanningQuotidien() {
  const { user } = useAuth();

  const [dragging, setDragging]             = useState(null);
  const [selectedDate, setSelectedDate]     = useState(() => new Date());
  const [assignments, setAssignments]       = useState({});
  const [conflicts, setConflicts]           = useState([]);
  const [loading, setLoading]               = useState(true);
  const [aiLoading, setAiLoading]           = useState(false);
  const [aiDone, setAiDone]                 = useState(false);
  const [savingDraft, setSavingDraft]       = useState(false);
  const [publishing, setPublishing]         = useState(false);
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

      const activeLignes   = lignesData.filter((l) => (l.status || l.statut || "actif") === "actif");
      const activeBuses    = busesData.filter((b) => (b.status || b.statut || "actif") === "actif");
      const activeEmployes = employesData.filter((e) => (e.statut || "actif") === "actif");

      setLignes(activeLignes);
      setBuses(activeBuses);
      setChauffeurs(activeEmployes.filter((e) => e.role === "chauffeur"));
      setReceveurs(activeEmployes.filter((e) => e.role === "receveur"));
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "";
      toast.error(msg || "Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Fetch plannings when date changes ───────────────────────────────────────
  useEffect(() => {
    const fetchPlannings = async () => {
      try {
        const start = new Date(selectedDate);
        start.setDate(start.getDate() - 7);
        const end = new Date(selectedDate);
        end.setDate(end.getDate() + 7);

        const { data } = await listPlanningByDateRange(
          formatDateKey(start),
          formatDateKey(end)
        );

        const newAssignments = {};
        const savedMap = {};

        data.forEach((p) => {
          const dateKey = p.date.split("T")[0];
          const heure   = `${p.heuredebut}-${p.heurefin}`;
          const ligneId = p.ligne?._id;
          if (!ligneId) return;

          const slotKey = `${dateKey}__${heure}__${ligneId}`;

          // ── Bus ──
          if (p.bus) {
            newAssignments[`${slotKey}__bus`] = {
              ...p.bus,
              type: "bus",
              busId: p.bus._id,
              matricule: p.bus.matricule,
            };
            savedMap[`${slotKey}__bus`] = p._id;
          }

          // ── Chauffeur (employe) ──
          if (p.employe) {
            newAssignments[`${slotKey}__driver`] = {
              ...p.employe,
              type: "driver",
              employeeId: p.employe._id,
            };
            savedMap[`${slotKey}__driver`] = p._id;
          }

          // ── Receveur ──  ← was missing!
          if (p.receveur) {
            newAssignments[`${slotKey}__receveur`] = {
              ...p.receveur,
              type: "receveur",
              employeeId: p.receveur._id,
            };
            savedMap[`${slotKey}__receveur`] = p._id;
          }
        });

        setAssignments(newAssignments);
        setSavedPlanningMap((prev) => ({ ...prev, ...savedMap }));
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
                message: `Conflit: employé assigné à deux lignes sur le créneau ${daySlots[i].heure}`,
              });
            }
          }
        }
      });
    });

    setConflicts(newConflicts);
    return newConflicts.length === 0;
  }, []);

  // ── Incomplete stats ────────────────────────────────────────────────────────
  const incompleteCellCount = useMemo(() => {
    const dateKey = formatDateKey(selectedDate);
    let count = 0;
    for (const heure of HEURES)
      for (const ligne of lignes)
        if (getCellStatus(assignments, dateKey, heure, ligne) === "incomplete") count++;
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
      const newAssignments = { ...assignments, [key]: { ...dragging, type: "bus", busId: dragging._id } };
      setAssignments(newAssignments);
      checkConflicts(newAssignments);
      setDragging(null);
      toast.success(`Bus ${dragging.matricule} assigné`);
      return;
    }

    if (!validateConflict({ assignments, dateKey, heure, ligneId: ligne._id, item: dragging, currentKey: key })) {
      toast.error(`${dragging.nom} est déjà assigné(e) à ce créneau`);
      setDragging(null);
      return;
    }
    const newAssignments = { ...assignments, [key]: { ...dragging, type: roleType, employeeId: dragging._id } };
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

  // ── AI ──────────────────────────────────────────────────────────────────────
  const handleAI = async () => {
    setAiLoading(true);
    setAiDone(false);
    try {
      const dateKey = formatDateKey(selectedDate);
      const { data } = await axiosInstance.post("/ai/generate-planning", { date: dateKey, saveToDb: false });
      const { assignments: aiAssignments, stats } = data;

      setAssignments((prev) => {
        const merged = { ...prev };
        Object.entries(aiAssignments).forEach(([key, val]) => {
          if (!merged[key]) merged[key] = val;
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
      toast.error(err?.response?.data?.message || "Erreur lors de l'optimisation IA");
    } finally {
      setAiLoading(false);
    }
  };

  // ── Save Draft — FIXED: groups by slot and includes receveur ────────────────
  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true);
      const nextPlanningMap = { ...savedPlanningMap };

      // 1. Delete removed plannings
      for (const id of deletedPlanningIds) {
        try { await deletePlanning(id); } catch (e) { console.warn("Delete failed:", e.message); }
      }

      // 2. Group assignments by (dateKey, heure, ligneId) → one Planning doc per slot
      const slotMap = {};
      for (const [key, assignment] of Object.entries(assignments)) {
        const parts = key.split("__");
        if (parts.length < 4) continue;
        const [dateKey, heure, ligneId, type] = parts;
        const slotKey = `${dateKey}__${heure}__${ligneId}`;
        if (!slotMap[slotKey]) slotMap[slotKey] = { dateKey, heure, ligneId };
        if (type === "bus")      slotMap[slotKey].bus      = assignment;
        else if (type === "driver")   slotMap[slotKey].driver   = assignment;
        else if (type === "receveur") slotMap[slotKey].receveur = assignment;
      }

      // 3. Save / update each complete slot
      for (const [slotKey, slot] of Object.entries(slotMap)) {
        const { dateKey, heure, ligneId, bus, driver, receveur } = slot;

        // Only save slots that are fully assigned (bus + chauffeur + receveur)
        if (!bus?.busId || !driver?.employeeId || !receveur?.employeeId) continue;

        const { heuredebut, heurefin } = parseHeureRange(heure);
        const payload = {
          date:      dateKey,
          heuredebut,
          heurefin,
          ligne:     ligneId,
          bus:       bus.busId,
          employe:   driver.employeeId,
          receveur:  receveur.employeeId,   // ← was missing in original code!
        };

        try {
          const existingId = nextPlanningMap[`${slotKey}__driver`];
          let id;

          if (existingId) {
            const resp = await updatePlanning(existingId, payload);
            id = resp.data?._id || existingId;
          } else {
            const resp = await addPlanning(payload);
            id = resp.data?._id;
          }

          if (id) {
            // Map all three sub-keys to the same DB document id
            nextPlanningMap[`${slotKey}__bus`]      = id;
            nextPlanningMap[`${slotKey}__driver`]   = id;
            nextPlanningMap[`${slotKey}__receveur`] = id;
          }
        } catch (err) {
          const msg = err?.response?.data?.message || "Erreur d'enregistrement";
          toast.error(`Slot ${heure} — ${msg}`);
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

    const ids = [
      ...new Set(
        Object.entries(savedPlanningMap)
          .filter(([key]) => key.startsWith(`${selectedDateKey}__`))
          .map(([, id]) => id)
          .filter(Boolean)
      ),
    ];

    if (ids.length === 0) {
      toast.error("Enregistrez d'abord le brouillon avant de publier");
      return;
    }

    try {
      setPublishing(true);
      await Promise.all(ids.map((id) => publishPlanningById(id, true)));

      // Notify all assigned employees
      const employeeIds = new Set();
      Object.entries(assignments).forEach(([key, val]) => {
        if (key.startsWith(selectedDateKey) && val.employeeId) {
          employeeIds.add(val.employeeId);
        }
      });

      const dateStr = selectedDate.toLocaleDateString("fr-FR", {
        weekday: "long", day: "numeric", month: "long",
      });

      if (employeeIds.size > 0) {
        await notificationService.sendToMany(
          `📅 Votre planning du ${dateStr} a été publié. Connectez-vous pour le consulter.`,
          "planning_publie",
          [...employeeIds]
        );
      }

      toast.success(`Planning publié — ${employeeIds.size} employé(s) notifié(s) ✅`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Erreur lors de la publication");
    } finally {
      setPublishing(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
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
            <button
              onClick={() => exportPlanningPDF(selectedDate, lignes, assignments, HEURES)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition"
            >
              <FileText size={16} />
              Exporter PDF
            </button>

            {/* ← Real NotificationBell (admin's own notifications) */}
            <NotificationBell />

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

          {/* ── Incomplete warning ── */}
          {incompleteCellCount > 0 && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-amber-500 flex-shrink-0" size={18} />
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">{incompleteCellCount} créneau(x) incomplet(s)</span>
                  {" "}— chaque créneau doit avoir 1 chauffeur + 1 receveur + 1 bus.
                </p>
              </div>
              <button
                onClick={() => setShowIncompleteOnly((v) => !v)}
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
              <button
                onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 flex-shrink-0"
              >
                <ChevronLeft size={18} />
              </button>

              {calendarDays.map((date) => {
                const sel     = isSameDate(date, selectedDate);
                const isToday = isSameDate(date, new Date());
                return (
                  <button
                    key={formatDateKey(date)}
                    onClick={() => setSelectedDate(date)}
                    className={`min-w-[56px] px-2 py-2 rounded-lg text-center transition flex-shrink-0 relative ${
                      sel
                        ? "bg-indigo-600 text-white shadow-md"
                        : "hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    <div className="text-xs uppercase">
                      {date.toLocaleDateString("fr-FR", { weekday: "short" })}
                    </div>
                    <div className="text-sm font-bold mt-0.5">
                      {date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                    </div>
                    {/* Today indicator */}
                    {isToday && !sel && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-500 rounded-full" />
                    )}
                    {isToday && sel && (
                      <div className="text-[9px] text-indigo-200 font-semibold mt-0.5">Aujourd'hui</div>
                    )}
                  </button>
                );
              })}

              <button
                onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 flex-shrink-0"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* ── Selected date display ── */}
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              Planning du{" "}
              <span className="text-indigo-600">
                {selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
              {isSameDate(selectedDate, new Date()) && (
                <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold align-middle">
                  Aujourd'hui
                </span>
              )}
            </h2>
          </div>

          {/* ── Main layout: sidebar + grid ── */}
          <div className="flex gap-5 items-start">
            {/* ── Resource panel ── */}
            <div className="w-56 flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ressources</p>
                <p className="text-xs text-gray-400 mt-0.5">Glisser vers un créneau</p>
              </div>
              <div className="overflow-y-auto max-h-[65vh] p-4 space-y-5">

                {/* Buses */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">🚌 Bus</span>
                    <span className="ml-auto text-xs text-gray-400">{buses.length}</span>
                  </div>
                  {buses.length === 0 && <p className="text-xs text-gray-400">Aucun bus actif</p>}
                  {buses.map((b) => (
                    <div
                      key={b._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, { ...b, type: "bus" })}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-indigo-100 bg-indigo-50 mb-1.5 cursor-grab hover:shadow-sm hover:border-indigo-300 transition"
                    >
                      <div className="min-w-0">
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
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">🧑‍✈️ Chauffeurs</span>
                    <span className="ml-auto text-xs text-gray-400">{chauffeurs.length}</span>
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
                        <div className="text-xs text-emerald-400">{c.age ? `${c.age} ans` : "Chauffeur"}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Receveurs */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">🎫 Receveurs</span>
                    <span className="ml-auto text-xs text-gray-400">{receveurs.length}</span>
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
                        <div className="text-xs text-amber-400">{r.age ? `${r.age} ans` : "Receveur"}</div>
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
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-28 sticky left-0 bg-gray-50 z-10">
                        Heure
                      </th>
                      {lignes.length === 0 ? (
                        <th className="px-4 py-3 text-xs text-gray-400 font-normal">
                          Aucune ligne disponible
                        </th>
                      ) : (
                        lignes.map((l) => (
                          <th key={l._id} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-l border-gray-100 min-w-[180px]">
                            {l.libelle}
                            {l.distance ? <span className="ml-1 text-gray-400 font-normal normal-case">({l.distance} km)</span> : null}
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {HEURES.map((heure) => (
                      <tr key={heure} className="border-b border-gray-100 last:border-0">
                        <td className="px-4 py-3 text-xs font-bold text-gray-600 whitespace-nowrap align-top sticky left-0 bg-white z-10 border-r border-gray-100">
                          {heure}
                          {parseInt(heure.split(":")[0]) >= 18 && <span className="ml-1">🌙</span>}
                        </td>
                        {lignes.length === 0 ? (
                          <td className="px-4 py-3 text-xs text-gray-300 text-center">—</td>
                        ) : (
                          lignes.map((ligne) => {
                            const slotAssignments = getSlotAssignments(selectedDate, heure, ligne);
                            const cellStatus      = getCellStatus(assignments, dateKey, heure, ligne);

                            if (showIncompleteOnly && cellStatus !== "incomplete")
                              return <td key={ligne._id} className="px-3 py-2 border-l border-gray-100 bg-gray-50/30 align-top" />;

                            const hasConflict = slotAssignments.some(({ key }) =>
                              conflicts.some((c) => {
                                const [d, h] = key.split("__");
                                return c.dateKey === d && c.heure === h;
                              })
                            );

                            let cellBg = "";
                            if (dragging) cellBg = "bg-blue-50/40 ring-1 ring-inset ring-blue-100";
                            else if (hasConflict) cellBg = "bg-red-50";
                            else if (cellStatus === "complete") cellBg = "bg-emerald-50/50";
                            else if (cellStatus === "incomplete") cellBg = "bg-amber-50/60";

                            return (
                              <td
                                key={ligne._id}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, heure, ligne, selectedDate)}
                                className={`px-3 py-2 border-l border-gray-100 min-h-[80px] align-top transition-colors relative ${cellBg}`}
                              >
                                {/* Status badge */}
                                {cellStatus === "complete" && (
                                  <CheckCircle2 size={12} className="absolute top-1.5 right-1.5 text-emerald-500" />
                                )}
                                {cellStatus === "incomplete" && (
                                  <AlertTriangle size={12} className="absolute top-1.5 right-1.5 text-amber-500" title="Incomplet" />
                                )}

                                {slotAssignments.length === 0 ? (
                                  <span className="text-xs text-gray-300 font-medium">Vide</span>
                                ) : (
                                  <div className="space-y-1">
                                    {slotAssignments.map(({ key, value: assignment }) => {
                                      const label =
                                        assignment.type === "bus"
                                          ? assignment.matricule || assignment.immatriculation || "Bus"
                                          : `${assignment.nom ?? ""} ${(assignment.prenom ?? "").charAt(0)}.`;

                                      const colorClass =
                                        assignment.type === "bus"
                                          ? "bg-indigo-100 text-indigo-800"
                                          : assignment.type === "driver"
                                          ? "bg-emerald-100 text-emerald-800"
                                          : "bg-amber-100 text-amber-800";

                                      const icon =
                                        assignment.type === "bus" ? "🚌"
                                        : assignment.type === "driver" ? "🧑‍✈️"
                                        : "🎫";

                                      return (
                                        <div
                                          key={key}
                                          className={`flex items-center justify-between gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${colorClass}`}
                                        >
                                          <div className="flex items-center gap-1 min-w-0">
                                            <span>{icon}</span>
                                            <span className="truncate">{label}</span>
                                          </div>
                                          <button
                                            onClick={() => handleRemove(key)}
                                            className="opacity-50 hover:opacity-100 flex-shrink-0 font-bold leading-none ml-1"
                                            title="Retirer"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      );
                                    })}

                                    {cellStatus === "incomplete" && (
                                      <div className="text-[10px] text-amber-600 italic pt-0.5">
                                        {!assignments[`${dateKey}__${heure}__${ligne._id}__bus`] && "🚌 bus manquant  "}
                                        {!assignments[`${dateKey}__${heure}__${ligne._id}__driver`] && "🧑‍✈️ chauffeur manquant  "}
                                        {!assignments[`${dateKey}__${heure}__${ligne._id}__receveur`] && "🎫 receveur manquant"}
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
              disabled={savingDraft || publishing}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition shadow-sm"
            >
              {savingDraft ? "Enregistrement…" : "💾 Enregistrer brouillon"}
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing || savingDraft}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition shadow-sm"
            >
              {publishing ? "Publication…" : "📤 Publier & notifier"}
            </button>

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

          {/* ── Legend ── */}
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" /><span>Complet</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /><span>Incomplet</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-100 border border-red-300" /><span>Conflit</span></div>
            <div className="flex items-center gap-1.5"><span className="text-gray-400">ℹ️</span><span>Chaque créneau doit avoir 1 bus + 1 chauffeur + 1 receveur pour être sauvegardé</span></div>
          </div>
        </main>
      </div>
    </div>
  );
}