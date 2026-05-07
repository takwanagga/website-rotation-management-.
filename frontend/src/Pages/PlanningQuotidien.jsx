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
  Calendar,
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
  "00:00-02:00",
  "02:00-04:00",
  "04:00-06:00",
];

const JOURS_SEMAINE_FULL = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const MOIS_FULL = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

// ── Date helpers ──────────────────────────────────────────────────────────────
function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDate(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
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
  const [selectedDate, setSelectedDate]     = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });
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


  const [showDatePicker, setShowDatePicker] = useState(false);

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

          if (p.bus) {
            newAssignments[`${slotKey}__bus`] = {
              ...p.bus, type: "bus", busId: p.bus._id, matricule: p.bus.matricule,
            };
            savedMap[`${slotKey}__bus`] = p._id;
          }
          if (p.employe) {
            newAssignments[`${slotKey}__driver`] = {
              ...p.employe, type: "driver", employeeId: p.employe._id,
            };
            savedMap[`${slotKey}__driver`] = p._id;
          }
          if (p.receveur) {
            newAssignments[`${slotKey}__receveur`] = {
              ...p.receveur, type: "receveur", employeeId: p.receveur._id,
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

  // ── Save draft ──────────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true);
      const nextPlanningMap = { ...savedPlanningMap };

      for (const id of deletedPlanningIds) {
        try { await deletePlanning(id); } catch (e) { console.warn("Delete failed:", e.message); }
      }

      const slotMap = {};
      for (const [key, assignment] of Object.entries(assignments)) {
        const parts = key.split("__");
        if (parts.length < 4) continue;
        const [dateKey, heure, ligneId, type] = parts;
        const slotKey = `${dateKey}__${heure}__${ligneId}`;
        if (!slotMap[slotKey]) slotMap[slotKey] = { dateKey, heure, ligneId };
        if (type === "bus")           slotMap[slotKey].bus      = assignment;
        else if (type === "driver")   slotMap[slotKey].driver   = assignment;
        else if (type === "receveur") slotMap[slotKey].receveur = assignment;
      }

      for (const [slotKey, slot] of Object.entries(slotMap)) {
        const { dateKey, heure, ligneId, bus, driver, receveur } = slot;
        if (!bus?.busId || !driver?.employeeId || !receveur?.employeeId) continue;

        const { heuredebut, heurefin } = parseHeureRange(heure);
        const payload = {
          date: dateKey, heuredebut, heurefin,
          ligne: ligneId, bus: bus.busId,
          employe: driver.employeeId, receveur: receveur.employeeId,
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
            nextPlanningMap[`${slotKey}__bus`]      = id;
            nextPlanningMap[`${slotKey}__driver`]   = id;
            nextPlanningMap[`${slotKey}__receveur`] = id;
          }
        } catch (err) {
          toast.error(`Slot ${heure} — ${err?.response?.data?.message || "Erreur d'enregistrement"}`);
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
      const employeeIds = new Set();
      Object.entries(assignments).forEach(([key, val]) => {
        if (key.startsWith(selectedDateKey) && val.employeeId) employeeIds.add(val.employeeId);
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

  // ── Date navigation ─────────────────────────────────────────────────────────
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const handleDateInputChange = (e) => {
    const d = new Date(e.target.value + "T00:00:00");
    if (!isNaN(d.getTime())) {
      setSelectedDate(d);
      setShowDatePicker(false);
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <AdminSidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen pt-16 md:pt-0">
        <Toaster position="top-right" />

        {/* ── Top Navbar ── */}
        <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-10">
          <div className="flex-1 max-w-sm hidden sm:block">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
              </svg>
              <input type="search" placeholder="Rechercher…" className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => exportPlanningPDF(selectedDate, lignes, assignments, HEURES)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition"
            >
              <FileText size={14} />
              <span className="hidden sm:inline">Exporter PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
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

        <main className="flex-1 p-3 sm:p-4 md:p-6">
          {/* ── Conflict alerts ── */}
          {conflicts.length > 0 && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-semibold text-red-700 mb-1">{conflicts.length} conflit(s) détecté(s)</p>
                {conflicts.map((c, i) => <p key={i} className="text-xs text-red-600">{c.message}</p>)}
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
              <button onClick={() => setShowIncompleteOnly((v) => !v)} className="text-xs font-medium text-amber-700 underline whitespace-nowrap">
                {showIncompleteOnly ? "Tout afficher" : "Filtrer"}
              </button>
            </div>
          )}

          {/* ── AI Banner ── */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-base sm:text-lg flex-shrink-0">✦</div>
              <div>
                <p className="font-semibold text-indigo-900 text-xs sm:text-sm">Optimisation Intelligente</p>
                <p className="text-indigo-500 text-[10px] sm:text-xs mt-0.5">Algorithme tenant compte de l'âge, des distances et des statuts bus.</p>
              </div>
            </div>
            <button
              onClick={handleAI}
              disabled={aiLoading}
              className="w-full sm:w-auto px-4 sm:px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs sm:text-sm font-bold rounded-xl transition whitespace-nowrap shadow-sm text-center"
            >
              {aiLoading ? "⏳ Optimisation…" : aiDone ? "✅ Optimisé !" : "Lancer l'IA"}
            </button>
          </div>

          {/* ── Compact Date Picker ── */}
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
            <button onClick={handlePrevDay} className="p-2 sm:p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 active:scale-95 transition shadow-sm" title="Jour précédent">
              <ChevronLeft size={16} className="text-gray-600 sm:w-[18px] sm:h-[18px]" />
            </button>
            <div className="relative flex-1 sm:flex-none">
              <button
                onClick={() => setShowDatePicker((v) => !v)}
                className="w-full sm:w-auto flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 transition shadow-sm"
              >
                <Calendar size={16} className="text-indigo-600 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-gray-800 truncate">
                    {JOURS_SEMAINE_FULL[selectedDate.getDay()]} {selectedDate.getDate()} {MOIS_FULL[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                  </div>
                  {isSameDate(selectedDate, today) && (
                    <div className="text-[10px] text-indigo-600 font-semibold">Aujourd'hui</div>
                  )}
                </div>
              </button>
              {showDatePicker && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
                  <input
                    type="date"
                    value={formatDateKey(selectedDate)}
                    onChange={handleDateInputChange}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    autoFocus
                  />
                </div>
              )}
            </div>
            <button onClick={handleNextDay} className="p-2 sm:p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 active:scale-95 transition shadow-sm" title="Jour suivant">
              <ChevronRight size={16} className="text-gray-600 sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>

          {/* ── Resources (horizontal) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-5">
            {/* Buses */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">🚌 Bus</span>
                <span className="text-xs text-gray-400">{buses.length}</span>
              </div>
              <div className="p-3 overflow-y-auto max-h-[180px] space-y-1.5">
                {buses.length === 0 && <p className="text-xs text-gray-400">Aucun bus actif</p>}
                {buses.map((b) => (
                  <div key={b._id} draggable onDragStart={(e) => handleDragStart(e, { ...b, type: "bus" })}
                    className="flex items-center gap-2 p-2 rounded-lg border border-indigo-100 bg-indigo-50 cursor-grab hover:shadow-sm hover:border-indigo-300 transition">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-indigo-900 truncate">{b.matricule || b.immatriculation || "—"}</div>
                      <div className="text-[10px] text-indigo-400 truncate">{b.model || "Bus"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Chauffeurs */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">🧑‍✈️ Chauffeurs</span>
                <span className="text-xs text-gray-400">{chauffeurs.length}</span>
              </div>
              <div className="p-3 overflow-y-auto max-h-[180px] space-y-1.5">
                {chauffeurs.length === 0 && <p className="text-xs text-gray-400">Aucun chauffeur actif</p>}
                {chauffeurs.map((c) => (
                  <div key={c._id} draggable onDragStart={(e) => handleDragStart(e, { ...c, type: "driver" })}
                    className="flex items-center gap-2 p-2 rounded-lg border border-emerald-100 bg-emerald-50 cursor-grab hover:shadow-sm hover:border-emerald-300 transition">
                    <div className="w-5 h-5 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 text-[10px] font-bold flex-shrink-0">{c.nom?.charAt(0)}</div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-emerald-900 truncate">{c.nom} {c.prenom}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Receveurs */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">🎫 Receveurs</span>
                <span className="text-xs text-gray-400">{receveurs.length}</span>
              </div>
              <div className="p-3 overflow-y-auto max-h-[180px] space-y-1.5">
                {receveurs.length === 0 && <p className="text-xs text-gray-400">Aucun receveur actif</p>}
                {receveurs.map((r) => (
                  <div key={r._id} draggable onDragStart={(e) => handleDragStart(e, { ...r, type: "receveur" })}
                    className="flex items-center gap-2 p-2 rounded-lg border border-amber-100 bg-amber-50 cursor-grab hover:shadow-sm hover:border-amber-300 transition">
                    <div className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 text-[10px] font-bold flex-shrink-0">{r.nom?.charAt(0)}</div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-amber-900 truncate">{r.nom} {r.prenom}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>


          {/* ── Planning grid (transposed: lignes=rows, heures=columns) ── */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" style={{ touchAction: 'pan-x pan-y' }}>
            <div className="overflow-x-auto scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-36 sticky left-0 bg-gray-50 z-10">Ligne</th>
                    {HEURES.map((h) => (
                      <th key={h} className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-l border-gray-100 min-w-[140px] whitespace-nowrap">
                        {h}
                        {(parseInt(h.split(":")[0]) >= 22 || parseInt(h.split(":")[0]) < 6) && <span className="ml-1">🌙</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lignes.length === 0 ? (
                    <tr><td colSpan={HEURES.length + 1} className="px-4 py-6 text-center text-xs text-gray-400">Aucune ligne disponible</td></tr>
                  ) : (
                    lignes.map((ligne) => (
                      <tr key={ligne._id} className="border-b border-gray-100 last:border-0">
                        <td className="px-4 py-3 text-xs font-bold text-gray-700 whitespace-nowrap align-top sticky left-0 bg-white z-10 border-r border-gray-100">
                          {ligne.libelle}
                          {ligne.distance ? <span className="block text-[10px] text-gray-400 font-normal">{ligne.distance} km</span> : null}
                        </td>
                        {HEURES.map((heure) => {
                          const slotAssignments = getSlotAssignments(selectedDate, heure, ligne);
                          const cellStatus = getCellStatus(assignments, dateKey, heure, ligne);
                          if (showIncompleteOnly && cellStatus !== "incomplete")
                            return <td key={heure} className="px-2 py-2 border-l border-gray-100 bg-gray-50/30 align-top" />;
                          const hasConflict = slotAssignments.some(({ key }) =>
                            conflicts.some((c) => { const [d, h] = key.split("__"); return c.dateKey === d && c.heure === h; })
                          );
                          let cellBg = "";
                          if (dragging) cellBg = "bg-blue-50/40 ring-1 ring-inset ring-blue-100";
                          else if (hasConflict) cellBg = "bg-red-50";
                          else if (cellStatus === "complete") cellBg = "bg-emerald-50/50";
                          else if (cellStatus === "incomplete") cellBg = "bg-amber-50/60";
                          return (
                            <td key={heure} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, heure, ligne, selectedDate)}
                              className={`px-2 py-2 border-l border-gray-100 min-w-[120px] sm:min-w-[140px] align-top transition-all duration-150 relative ${cellBg} ${dragging ? 'hover:ring-2 hover:ring-inset hover:ring-indigo-300 hover:bg-indigo-50/60 hover:scale-[1.02]' : ''}`}>
                              {cellStatus === "complete" && <CheckCircle2 size={11} className="absolute top-1 right-1 text-emerald-500" />}
                              {cellStatus === "incomplete" && <AlertTriangle size={11} className="absolute top-1 right-1 text-amber-500" />}
                              {slotAssignments.length === 0 ? (
                                <span className="text-[10px] text-gray-300">Vide</span>
                              ) : (
                                <div className="space-y-0.5">
                                  {slotAssignments.map(({ key, value: a }) => {
                                    const label = a.type === "bus" ? (a.matricule || a.immatriculation || "Bus") : `${a.nom ?? ""} ${(a.prenom ?? "").charAt(0)}.`;
                                    const cc = a.type === "bus" ? "bg-indigo-100 text-indigo-800" : a.type === "driver" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800";
                                    const icon = a.type === "bus" ? "🚌" : a.type === "driver" ? "🧑‍✈️" : "🎫";
                                    return (
                                      <div key={key} className={`flex items-center justify-between gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${cc}`}>
                                        <div className="flex items-center gap-0.5 min-w-0"><span>{icon}</span><span className="truncate">{label}</span></div>
                                        <button onClick={() => handleRemove(key)} className="opacity-50 hover:opacity-100 flex-shrink-0 font-bold leading-none" title="Retirer">×</button>
                                      </div>
                                    );
                                  })}
                                  {cellStatus === "incomplete" && (
                                    <div className="text-[9px] text-amber-600 italic">
                                      {!assignments[`${dateKey}__${heure}__${ligne._id}__bus`] && "🚌 "}
                                      {!assignments[`${dateKey}__${heure}__${ligne._id}__driver`] && "🧑‍✈️ "}
                                      {!assignments[`${dateKey}__${heure}__${ligne._id}__receveur`] && "🎫"}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>


          {/* ── Action buttons ── */}
          <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="flex gap-2 sm:gap-3">
              <button onClick={handleSaveDraft} disabled={savingDraft || publishing}
                className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-sm active:scale-95">
                {savingDraft ? "Enregistrement…" : "💾 Enregistrer brouillon"}
              </button>
              <button onClick={handlePublish} disabled={publishing || savingDraft}
                className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-sm active:scale-95">
                {publishing ? "Publication…" : "📤 Publier & notifier"}
              </button>
            </div>
            <div className="sm:ml-auto flex items-center justify-center sm:justify-end gap-2 text-xs text-gray-500">
              {incompleteCellCount > 0 ? (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full font-semibold">
                  <AlertTriangle size={12} />{incompleteCellCount} incomplet(s)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full font-semibold">
                  <CheckCircle2 size={12} />Tous les créneaux sont complets
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