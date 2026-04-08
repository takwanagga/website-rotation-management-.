import { useState, useEffect, useCallback, useMemo } from "react";
import AdminSidebar from "../components/AdminSidebar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { employeeService } from "../services/employeeService.js";
import { busService } from "../services/busService.js";
import { ligneService } from "../services/ligneService.js";
import { addPlanning, updatePlanning, deletePlanning, publishPlanningById } from "../lib/api.js";

// Time slots for the day
const HEURES = ["05:00-07:00", "07:00-09:00", "09:00-11:00", "11:00-13:00", "13:00-15:00", "15:00-17:00", "17:00-19:00", "19:00-21:00"];

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

  // Data from database
  const [lignes, setLignes] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [receveurs, setReceveurs] = useState([]);
  const [buses, setBuses] = useState([]);

  const calendarDays = useMemo(() => getCalendarDays(selectedDate), [selectedDate]);

  // Fetch data from database
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
      
      // Filter active employees by role
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

  // Check for conflicts - employee in two places at same time
  const checkConflicts = useCallback((newAssignments) => {
    const newConflicts = [];
    const employeeAssignments = {};

    // Group assignments by employee and date
    Object.entries(newAssignments).forEach(([key, assignment]) => {
      const [dateKey, heure, ligneId] = key.split("__");
      if (!employeeAssignments[assignment.employeeId]) {
        employeeAssignments[assignment.employeeId] = [];
      }
      employeeAssignments[assignment.employeeId].push({ dateKey, heure, ligneId, assignment });
    });

    // Check for conflicts
    Object.entries(employeeAssignments).forEach(([employeeId, employeeSlots]) => {
      // Group by date
      const byDate = {};
      employeeSlots.forEach(slot => {
        if (!byDate[slot.dateKey]) byDate[slot.dateKey] = [];
        byDate[slot.dateKey].push(slot);
      });

      // Check each date for time overlaps
      Object.entries(byDate).forEach(([dateKey, slots]) => {
        for (let i = 0; i < slots.length; i++) {
          for (let j = i + 1; j < slots.length; j++) {
            if (slots[i].heure === slots[j].heure) {
              newConflicts.push({
                employeeId,
                dateKey,
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
      toast.error(`${dragging.nom} est déjà assigné(e) à cette heure sur une autre ligne`);
      setDragging(null);
      return;
    }

    const newAssignments = { 
      ...assignments, 
      [key]: { 
        ...dragging, 
        type: roleType,
        employeeId: dragging._id,
      } 
    };
    
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
      toast.error(`Le bus ${dragging.immatriculation} est déjà assigné à cette heure sur une autre ligne`);
      setDragging(null);
      return;
    }

    const newAssignments = { 
      ...assignments, 
      [key]: { 
        ...dragging, 
        type: "bus",
        busId: dragging._id,
      } 
    };
    
    setAssignments(newAssignments);
    setDragging(null);
    toast.success(`Bus ${dragging.immatriculation} assigné`);
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

          // Auto-assign bus if not already assigned
          if (!assignments[busKey] && buses.length > 0) {
            const busIdx = (hi + li) % buses.length;
            const candidateBus = buses[busIdx];
            const combined = { ...assignments, ...autoAssign };
            const busAllowed = validateConflict({
              assignments: combined,
              dateKey,
              heure: h,
              ligneId: ligne._id,
              item: { ...candidateBus, type: "bus" },
              currentKey: busKey,
            });
            if (busAllowed) {
              autoAssign[busKey] = {
                ...candidateBus,
                type: "bus",
                busId: candidateBus._id,
              };
            }
          }

          // Auto-assign driver if not already assigned
          if (!assignments[driverKey] && chauffeurs.length > 0) {
            const driverIdx = (hi + li) % chauffeurs.length;
            // Check if driver is already assigned at this time
            const combined = { ...assignments, ...autoAssign };
            const isDriverBusy = Object.entries(combined).some(([k, v]) => {
              const [d, hour] = k.split("__");
              return d === dateKey && hour === h && v.employeeId === chauffeurs[driverIdx]._id;
            });
            if (!isDriverBusy) {
              autoAssign[driverKey] = { 
                ...chauffeurs[driverIdx], 
                type: "driver",
                employeeId: chauffeurs[driverIdx]._id,
              };
            }
          }

          // Auto-assign receveur if not already assigned
          if (!assignments[receveurKey] && receveurs.length > 0) {
            const receveurIdx = (hi + li) % receveurs.length;
            // Check if receveur is already assigned at this time
            const combined = { ...assignments, ...autoAssign };
            const isReceveurBusy = Object.entries(combined).some(([k, v]) => {
              const [d, hour] = k.split("__");
              return d === dateKey && hour === h && v.employeeId === receveurs[receveurIdx]._id;
            });
            if (!isReceveurBusy) {
              autoAssign[receveurKey] = { 
                ...receveurs[receveurIdx], 
                type: "receveur",
                employeeId: receveurs[receveurIdx]._id,
              };
            }
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

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setSelectedDate(today);
  };

  const handleDateChange = (e) => {
    if (e.target.value) {
      const parsedDate = new Date(e.target.value);
      parsedDate.setHours(0, 0, 0, 0);
      setSelectedDate(parsedDate);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true);
      const nextPlanningMap = { ...savedPlanningMap };

      for (const id of deletedPlanningIds) {
        await deletePlanning(id);
      }

      for (const [key, assignment] of Object.entries(assignments)) {
        if (assignment.type === "bus") continue;
        const [dateKey, heure, ligneId] = key.split("__");
        const busKey = `${dateKey}__${heure}__${ligneId}__bus`;
        const busAssignment = assignments[busKey];
        if (!busAssignment?.busId) {
          continue;
        }
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
      toast.error(error?.response?.data?.message || "Erreur lors de l'enregistrement du brouillon");
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
      if (ids.length === 0) {
        toast.error("Aucun planning sauvegardé à publier pour cette date");
        return;
      }
      await Promise.all(ids.map((id) => publishPlanningById(id, true)));
      toast.success("Planning publié avec succès");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Erreur lors de la publication");
    } finally {
      setPublishing(false);
    }
  };

  // Get assignment for a specific slot
  const getSlotAssignments = (date, heure, ligne) => {
    const dateKey = formatDateKey(date);
    const assignments_list = [];
    
    Object.entries(assignments).forEach(([key, value]) => {
      const parts = key.split("__");
      if (parts[0] === dateKey && parts[1] === heure && parts[2] === ligne._id) {
        assignments_list.push({ key, value });
      }
    });
    
    return assignments_list;
  };

  if (loading) {
    return (
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 md:ml-64 bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des données...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-64 bg-gray-50 min-h-screen pt-16 md:pt-0">
        <Toaster position="top-right" />

        {/* Top Navbar */}
        <div className="bg-white shadow-sm p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Planning Quotidien</h1>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <button onClick={goToPreviousDay} className="p-2 hover:bg-gray-100 rounded-lg" title="Jour Précédent">
                <ChevronLeft size={20} />
              </button>
              <input
                type="date"
                value={formatDateKey(selectedDate)}
                onChange={handleDateChange}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={goToToday} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Aujourd'hui
              </button>
              <button onClick={goToNextDay} className="p-2 hover:bg-gray-100 rounded-lg" title="Jour Suivant">
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              {(([user?.prenom, user?.nom].filter(Boolean).join(" ") || user?.email || "A").charAt(0)).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <p className="text-gray-600 text-sm md:text-base mb-6">Gérez les affectations par glisser-déposer. Les conflits sont détectés automatiquement.</p>

          {/* Conflicts Banner */}
          {conflicts.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">Conflits détectés ({conflicts.length})</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    {conflicts.map((conflict, idx) => (
                      <li key={idx}>{conflict.message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* AI Banner */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-lg p-4 md:p-6 mb-8 border border-indigo-200">
            <div className="flex items-start md:items-center gap-4 mb-4 md:mb-0 flex-1">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center text-white text-xl flex-shrink-0">
                ✦
              </div>
              <div>
                <div className="font-bold text-indigo-900 text-sm md:text-base">Optimisation Intelligente</div>
                <div className="text-indigo-600 text-xs md:text-sm mt-1">Laissez l'IA suggérer le meilleur équilibre pour vos équipes.</div>
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

          {/* Day calendar */}
          <div className="mb-6 bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto">
              {calendarDays.map((date) => {
                const selected = isSameDate(date, selectedDate);
                return (
                  <button
                    key={formatDateKey(date)}
                    onClick={() => setSelectedDate(date)}
                    className={`min-w-24 px-3 py-2 rounded-lg border text-center transition ${
                      selected
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                    title={date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                  >
                    <div className="text-xs uppercase tracking-wide">
                      {date.toLocaleDateString("fr-FR", { weekday: "short" })}
                    </div>
                    <div className="text-sm font-semibold">
                      {date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid + Sidebar panel */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Draggable Panel */}
            <div className="w-full lg:w-56 flex-shrink-0 bg-white rounded-lg border border-gray-200 p-4 shadow-sm overflow-y-auto max-h-96 lg:max-h-full">
              <div className="text-xs font-bold text-gray-500 tracking-widest mb-3">BUS ({buses.length})</div>
              {buses.length === 0 && (
                <div className="text-xs text-gray-400 mb-3">Aucun bus disponible</div>
              )}
              {buses.map((b) => (
                <div
                  key={b._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, { type: "bus", ...b })}
                  className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 mb-2 cursor-grab bg-gray-50 hover:shadow-sm transition hover:border-indigo-300"
                >
                  <div className="text-indigo-600 flex-shrink-0">🚌</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{b.matricule}</div>
                    <div className="text-xs text-gray-500 font-semibold">{b.type}</div>
                  </div>
                </div>
              ))}

              <div className="text-xs font-bold text-gray-500 tracking-widest mt-6 mb-3">CHAUFFEURS ({chauffeurs.length})</div>
              {chauffeurs.length === 0 && (
                <div className="text-xs text-gray-400 mb-3">Aucun chauffeur actif</div>
              )}
              {chauffeurs.map((c) => (
                <div
                  key={c._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, { type: "driver", ...c })}
                  className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 mb-2 cursor-grab bg-green-50 hover:shadow-sm transition hover:border-green-300"
                >
                  <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">👤</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{c.nom} {c.prenom}</div>
                    <div className="text-xs text-gray-500 font-semibold">Chauffeur</div>
                  </div>
                </div>
              ))}

              <div className="text-xs font-bold text-gray-500 tracking-widest mt-6 mb-3">RECEVEURS ({receveurs.length})</div>
              {receveurs.length === 0 && (
                <div className="text-xs text-gray-400 mb-3">Aucun receveur actif</div>
              )}
              {receveurs.map((r) => (
                <div
                  key={r._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, { type: "receveur", ...r })}
                  className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 mb-2 cursor-grab bg-amber-50 hover:shadow-sm transition hover:border-amber-300"
                >
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">👤</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{r.nom} {r.prenom}</div>
                    <div className="text-xs text-gray-500 font-semibold">Receveur</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Schedule Grid for Selected Date */}
            <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-x-auto shadow-sm">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-800">
                  Planning du {selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                </h3>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 md:px-4 py-3 text-left text-xs font-bold text-gray-500 tracking-wide w-24 md:w-32">HEURE</th>
                    {lignes.length === 0 ? (
                      <th className="px-2 md:px-3 py-3 text-left text-xs font-bold text-gray-500">Aucune ligne disponible</th>
                    ) : (
                      lignes.map((l) => (
                        <th key={l._id} className="px-2 md:px-3 py-3 text-left text-xs font-bold text-gray-500 tracking-wide border-l border-gray-200 min-w-32">
                          {l.code}
                          <div className="text-xs font-normal text-gray-400">{l.nom}</div>
                        </th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody>
                  {HEURES.map((heure) => (
                    <tr key={heure} className="border-b border-gray-200">
                      <td className="px-3 md:px-4 py-3 font-semibold text-sm text-gray-700 align-top">{heure}</td>
                      {lignes.length === 0 ? (
                        <td className="px-2 md:px-3 py-3 text-gray-400 text-sm">Ajoutez des lignes pour commencer</td>
                      ) : (
                        lignes.map((ligne) => {
                          const slotAssignments = getSlotAssignments(selectedDate, heure, ligne);
                          const hasConflict = slotAssignments.some(({ key }) => {
                            return conflicts.some(c => {
                              const [conflictDate, conflictHeure] = [c.dateKey, c.heure];
                              const [keyDate, keyHeure] = key.split("__");
                              return conflictDate === keyDate && conflictHeure === keyHeure;
                            });
                          });
                          
                          return (
                            <td
                              key={ligne._id}
                              onDragOver={handleDragOver}
                              onDrop={(e) => {
                                if (dragging?.type === "bus") {
                                  handleBusDrop(e, heure, ligne, selectedDate);
                                } else {
                                  handleDrop(e, heure, ligne, selectedDate);
                                }
                              }}
                              className={`px-2 md:px-3 py-2 border-l border-gray-200 min-h-24 align-top transition-colors ${
                                dragging ? 'bg-blue-50' : hasConflict ? 'bg-red-50' : 'bg-white'
                              }`}
                            >
                              {slotAssignments.length === 0 ? (
                                <div className="text-xs text-gray-400 font-medium text-center pt-8">VIDE</div>
                              ) : (
                                <div className="space-y-1">
                                  {slotAssignments.map(({ key, value: assignment }) => (
                                    <div 
                                      key={key} 
                                      className={`rounded-lg p-2 text-xs font-semibold flex items-center justify-between gap-1 ${
                                        assignment.type === "bus"
                                          ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                                          : assignment.type === "driver"
                                          ? 'bg-green-100 text-green-900 border border-green-200'
                                          : assignment.type === "receveur"
                                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                          : 'bg-blue-100 text-blue-900 border border-blue-200'
                                      }`}
                                    >
                                      <span className="truncate">
                                        {assignment.type === "bus" ? (assignment.matricule || assignment.immatriculation) : `${assignment.nom} ${assignment.prenom}`}
                                      </span>
                                      <button
                                        onClick={() => handleRemove(key)}
                                        className="opacity-60 hover:opacity-100 flex-shrink-0 font-bold"
                                        title="Supprimer"
                                      >×</button>
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

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={savingDraft}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {savingDraft ? "Enregistrement..." : "Enregistrer brouillon"}
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing || savingDraft}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
            >
              {publishing ? "Publication..." : "Publier"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
