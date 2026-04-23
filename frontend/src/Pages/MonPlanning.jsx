import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { listPlanningByEmployee, getEmployeeWorkHours } from "../lib/api.js";
import NotificationBell from "../components/NotificationBell.jsx";
import http from "../services/httpClient.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  CalendarDays, Clock, Bus, User, MapPin, LogOut,
  Bell, BarChart3, History, UserCircle, Sun, Moon,
  FileText, ChevronDown, Filter,
} from "lucide-react";

// ── Date helpers ──────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}
function formatDateShort(dateStr) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}
function isToday(dateStr) {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return dateStr === `${y}-${m}-${d}`;
}
function isFuture(dateStr) {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return dateStr > `${y}-${m}-${d}`;
}
function isPast(dateStr) {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return dateStr < `${y}-${m}-${d}`;
}
function getDefaultStartDate() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}
function getDefaultEndDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}

const TABS = [
  { key: "planning", label: "Mon Planning", icon: CalendarDays },
  { key: "profile", label: "Mon Profil", icon: UserCircle },
  { key: "hours", label: "Mes Heures", icon: BarChart3 },
  { key: "history", label: "Historique", icon: History },
  { key: "notifications", label: "Notifications", icon: Bell },
];

export default function EmployeePortal() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("planning");

  // ── Planning state ──
  const [plannings, setPlannings] = useState([]);
  const [planningLoading, setPlanningLoading] = useState(true);
  const [planFilter, setPlanFilter] = useState("upcoming");

  // ── Hours state ──
  const [hoursData, setHoursData] = useState(null);
  const [hoursLoading, setHoursLoading] = useState(false);
  const [hoursStart, setHoursStart] = useState(getDefaultStartDate());
  const [hoursEnd, setHoursEnd] = useState(getDefaultEndDate());

  // ── Notifications state ──
  const [notifications, setNotifications] = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(false);

  const roleLabel = user?.role === "chauffeur" ? "Chauffeur" : "Receveur";
  const roleColor = user?.role === "chauffeur" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700";

  // ── Fetch plannings ──
  useEffect(() => {
    if (!user?._id) return;
    setPlanningLoading(true);
    listPlanningByEmployee(user._id)
      .then((res) => setPlannings(res.data))
      .catch(() => {})
      .finally(() => setPlanningLoading(false));
  }, [user]);

  // ── Fetch hours ──
  const fetchHours = useCallback(async () => {
    if (!user?._id) return;
    setHoursLoading(true);
    try {
      const res = await getEmployeeWorkHours(user._id, hoursStart, hoursEnd);
      setHoursData(res.data);
    } catch {
      // silent
    } finally {
      setHoursLoading(false);
    }
  }, [user, hoursStart, hoursEnd]);

  useEffect(() => {
    if (activeTab === "hours") fetchHours();
  }, [activeTab, fetchHours]);

  // ── Fetch notifications ──
  const fetchNotifications = useCallback(async () => {
    if (!user?._id) return;
    setNotifsLoading(true);
    try {
      const { data } = await http.get(`/notification/destinataire/${user._id}`);
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // silent
    } finally {
      setNotifsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "notifications") fetchNotifications();
  }, [activeTab, fetchNotifications]);

  const markNotifRead = async (id) => {
    try {
      await http.post(`/notification/vue/${id}`, { vue: true });
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, vue: true } : n));
    } catch {}
  };

  // ── Planning grouping ──
  const grouped = plannings.reduce((acc, p) => {
    const dateKey = p.date.split("T")[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(p);
    return acc;
  }, {});

  const filteredEntries = Object.entries(grouped)
    .filter(([dateKey]) => {
      if (planFilter === "today") return isToday(dateKey);
      if (planFilter === "upcoming") return isToday(dateKey) || isFuture(dateKey);
      if (planFilter === "past") return isPast(dateKey);
      return true;
    })
    .sort(([a], [b]) => (planFilter === "past" ? b.localeCompare(a) : a.localeCompare(b)));

  // ── Today's slots ──
  const todayKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  })();
  const todaySlots = grouped[todayKey] || [];

  // ── Print hours PDF ──
  const printHoursPDF = () => {
    if (!hoursData) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Heures de travail — ${user?.nom} ${user?.prenom}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Période: ${hoursStart} au ${hoursEnd}`, 14, 23);
    doc.text(`Total: ${hoursData.totalHours}h (Jour: ${hoursData.totalDayHours}h / Nuit: ${hoursData.totalNightHours}h)`, 14, 29);

    const head = [["Date", "Jour (h)", "Nuit (h)", "Total (h)", "Détails"]];
    const body = hoursData.dailyBreakdown.map((d) => [
      formatDateShort(d.date),
      `${d.dayHours}h`,
      `${d.nightHours}h`,
      `${d.totalHours}h`,
      d.slots.map(s => `${s.heuredebut}-${s.heurefin} ${s.ligne}`).join(", "),
    ]);

    autoTable(doc, {
      head, body, startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] },
    });
    doc.save(`heures-${user?.nom}-${hoursStart}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Navbar ── */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">🚌</span>
            </div>
            <h1 className="text-lg font-bold text-gray-800">TransRoute</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleColor}`}>
              {roleLabel}
            </span>
            <NotificationBell />
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                {(user?.prenom?.charAt(0) || "?").toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 leading-none">
                  {user?.prenom} {user?.nom}
                </p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
              title="Déconnexion"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Tab bar ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition whitespace-nowrap ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                  {tab.key === "notifications" && notifications.filter(n => !n.vue).length > 0 && (
                    <span className="ml-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {notifications.filter(n => !n.vue).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* ════════════════════════════════════════════════════════════════════
            TAB: PLANNING
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "planning" && (
          <div>
            {/* Today's hero */}
            {todaySlots.length > 0 && (
              <div className="mb-6 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays size={20} className="text-indigo-200" />
                  <h2 className="text-lg font-bold">Aujourd'hui</h2>
                  <span className="ml-auto text-xs bg-white/20 px-3 py-1 rounded-full font-semibold">
                    {todaySlots.length} créneau{todaySlots.length > 1 ? "x" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {todaySlots.sort((a, b) => a.heuredebut.localeCompare(b.heuredebut)).map((p) => (
                    <div key={p._id} className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={14} className="text-indigo-200" />
                        <span className="font-bold text-sm">{p.heuredebut} – {p.heurefin}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin size={12} className="text-indigo-200" />
                        <span className="text-sm font-medium">{p.ligne?.libelle || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bus size={12} className="text-indigo-200" />
                        <span className="text-sm">{p.bus?.matricule || "—"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex gap-2 mb-6 bg-white rounded-xl p-1 border border-gray-100 shadow-sm w-fit">
              {[
                { key: "upcoming", label: "À venir" },
                { key: "today", label: "Aujourd'hui" },
                { key: "past", label: "Passés" },
                { key: "all", label: "Tous" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setPlanFilter(tab.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    planFilter === tab.key
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Planning list */}
            {planningLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Chargement…</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <CalendarDays size={48} className="text-gray-200 mx-auto mb-4" />
                <p className="font-semibold text-gray-600">Aucun planning disponible</p>
                <p className="text-sm text-gray-400 mt-1">Aucun créneau pour cette période.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEntries.map(([dateKey, items]) => {
                  const todayDate = isToday(dateKey);
                  const past = isPast(dateKey);
                  return (
                    <div key={dateKey} className={`rounded-2xl border overflow-hidden shadow-sm ${
                      todayDate ? "border-indigo-200" : past ? "border-gray-100 opacity-75" : "border-gray-100"
                    }`}>
                      <div className={`px-5 py-3 flex items-center gap-3 ${
                        todayDate ? "bg-indigo-600 text-white" : "bg-white border-b border-gray-100"
                      }`}>
                        <CalendarDays size={16} className={todayDate ? "text-indigo-200" : "text-indigo-500"} />
                        <span className={`font-semibold capitalize text-sm ${todayDate ? "text-white" : "text-gray-800"}`}>
                          {formatDate(dateKey)}
                        </span>
                        {todayDate && <span className="ml-auto text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">Aujourd'hui</span>}
                        {past && <span className="ml-auto text-xs text-gray-400 font-medium">Terminé</span>}
                      </div>
                      <div className="bg-white divide-y divide-gray-50">
                        {items.sort((a, b) => a.heuredebut.localeCompare(b.heuredebut)).map((p) => {
                          const isReceveur = p.receveur?._id === user?._id || p.receveur === user?._id;
                          const myRole = isReceveur ? "Receveur" : "Chauffeur";
                          const myColor = isReceveur ? "amber" : "emerald";
                          return (
                            <div key={p._id} className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 ${past ? "opacity-60" : ""}`}>
                              <div className="flex items-center gap-2 min-w-[130px]">
                                <Clock size={14} className="text-indigo-400 flex-shrink-0" />
                                <span className="text-sm font-bold text-gray-800">{p.heuredebut} – {p.heurefin}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-700 truncate">{p.ligne?.libelle || "—"}</p>
                                  {p.ligne?.debutDeLigne && p.ligne?.finDeLigne && (
                                    <p className="text-xs text-gray-400 truncate">{p.ligne.debutDeLigne} → {p.ligne.finDeLigne}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Bus size={14} className="text-indigo-400 flex-shrink-0" />
                                <span className="text-sm text-gray-600 font-medium">{p.bus?.matricule || "—"}</span>
                              </div>
                              <span className={`text-xs font-bold px-3 py-1 rounded-full bg-${myColor}-100 text-${myColor}-700 flex-shrink-0`}>
                                {myRole}
                              </span>
                              <div className="flex items-center gap-2 min-w-0">
                                <User size={14} className="text-gray-400 flex-shrink-0" />
                                <div className="text-xs text-gray-500">
                                  {isReceveur
                                    ? p.employe
                                      ? <span>Chauffeur : <span className="font-semibold">{p.employe.nom} {p.employe.prenom}</span></span>
                                      : "—"
                                    : p.receveur
                                    ? <span>Receveur : <span className="font-semibold">{p.receveur.nom} {p.receveur.prenom}</span></span>
                                    : "—"}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: PROFILE
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "profile" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Profile header */}
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-8 text-center">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3">
                  {(user?.prenom?.charAt(0) || "?").toUpperCase()}
                </div>
                <h2 className="text-xl font-bold text-white">{user?.prenom} {user?.nom}</h2>
                <span className={`inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full ${roleColor}`}>
                  {roleLabel}
                </span>
              </div>

              {/* Profile info */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Email", value: user?.email },
                    { label: "Mécano", value: user?.mecano },
                    { label: "Téléphone", value: user?.telephone || "—" },
                    { label: "Localisation", value: user?.localisation || "—" },
                    { label: "Âge", value: user?.age ? `${user.age} ans` : "—" },
                    { label: "Statut", value: user?.statut || "actif" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                      <p className="text-sm font-semibold text-gray-800">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: HOURS
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "hours" && (
          <div>
            {/* Date range + print */}
            <div className="flex flex-wrap items-end gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Du</label>
                <input
                  type="date"
                  value={hoursStart}
                  onChange={(e) => setHoursStart(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Au</label>
                <input
                  type="date"
                  value={hoursEnd}
                  onChange={(e) => setHoursEnd(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </div>
              <button
                onClick={fetchHours}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition"
              >
                Actualiser
              </button>
              <button
                onClick={printHoursPDF}
                disabled={!hoursData}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                <FileText size={16} />
                Imprimer PDF
              </button>
            </div>

            {hoursLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
              </div>
            ) : !hoursData ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <BarChart3 size={48} className="text-gray-200 mx-auto mb-4" />
                <p className="text-sm text-gray-400">Aucune donnée disponible</p>
              </div>
            ) : (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                    <p className="text-3xl font-bold text-gray-900">{hoursData.totalHours}h</p>
                    <p className="text-sm text-gray-500 mt-1">Total Heures</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Sun size={18} className="text-amber-500" />
                      <p className="text-3xl font-bold text-amber-600">{hoursData.totalDayHours}h</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Heures Jour (5h-20h)</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Moon size={18} className="text-indigo-500" />
                      <p className="text-3xl font-bold text-indigo-600">{hoursData.totalNightHours}h</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Heures Nuit (20h-5h)</p>
                  </div>
                </div>

                {/* Daily breakdown */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-sm font-bold text-gray-700">Détail par jour</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Date</th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                            <span className="inline-flex items-center gap-1"><Sun size={12} /> Jour</span>
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                            <span className="inline-flex items-center gap-1"><Moon size={12} /> Nuit</span>
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Total</th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Créneaux</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hoursData.dailyBreakdown.map((day) => (
                          <tr key={day.date} className="border-b border-gray-50 hover:bg-gray-50 transition">
                            <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                              {formatDate(day.date)}
                              {isToday(day.date) && <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">Aujourd'hui</span>}
                            </td>
                            <td className="text-center px-4 py-3 font-semibold text-amber-600">{day.dayHours}h</td>
                            <td className="text-center px-4 py-3 font-semibold text-indigo-600">{day.nightHours}h</td>
                            <td className="text-center px-4 py-3 font-bold text-gray-900">{day.totalHours}h</td>
                            <td className="px-4 py-3 text-xs text-gray-500">
                              {day.slots.map((s, i) => (
                                <span key={i} className="inline-block mr-2 mb-1 px-2 py-0.5 bg-gray-100 rounded-full">
                                  {s.heuredebut}-{s.heurefin} • {s.ligne}
                                </span>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: HISTORY
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "history" && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Historique des Plannings</h2>
            {planningLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : (
              (() => {
                const pastEntries = Object.entries(grouped)
                  .filter(([dateKey]) => isPast(dateKey))
                  .sort(([a], [b]) => b.localeCompare(a));

                return pastEntries.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <History size={48} className="text-gray-200 mx-auto mb-4" />
                    <p className="font-semibold text-gray-600">Aucun historique</p>
                    <p className="text-sm text-gray-400 mt-1">Vos plannings passés s'afficheront ici.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pastEntries.map(([dateKey, items]) => (
                      <div key={dateKey} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                          <CalendarDays size={14} className="text-gray-400" />
                          <span className="text-sm font-semibold text-gray-700 capitalize">{formatDate(dateKey)}</span>
                          <span className="ml-auto text-xs text-gray-400">{items.length} créneau{items.length > 1 ? "x" : ""}</span>
                        </div>
                        <div className="divide-y divide-gray-50">
                          {items.sort((a, b) => a.heuredebut.localeCompare(b.heuredebut)).map((p) => (
                            <div key={p._id} className="px-5 py-3 flex items-center gap-4 text-sm opacity-80">
                              <span className="font-bold text-gray-600 min-w-[100px]">{p.heuredebut} – {p.heurefin}</span>
                              <span className="text-gray-500">{p.ligne?.libelle || "—"}</span>
                              <span className="text-gray-400">{p.bus?.matricule || "—"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: NOTIFICATIONS
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "notifications" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
              <span className="text-sm text-gray-400">{notifications.length} notification(s)</span>
            </div>

            {notifsLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <Bell size={48} className="text-gray-200 mx-auto mb-4" />
                <p className="font-semibold text-gray-600">Aucune notification</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notif) => {
                  const isUnread = !notif.vue;
                  const icon = notif.type?.includes("planning") ? "📅"
                    : notif.type?.includes("modification") ? "✏️" : "🔔";

                  const timeStr = (() => {
                    const d = new Date(notif.temps || notif.createdAt);
                    const now = new Date();
                    const diffMin = Math.floor((now - d) / 60000);
                    if (diffMin < 1) return "À l'instant";
                    if (diffMin < 60) return `Il y a ${diffMin} min`;
                    const diffH = Math.floor(diffMin / 60);
                    if (diffH < 24) return `Il y a ${diffH}h`;
                    return d.toLocaleDateString("fr-FR");
                  })();

                  return (
                    <div
                      key={notif._id}
                      className={`flex items-start gap-4 p-4 rounded-xl border transition ${
                        isUnread
                          ? "bg-indigo-50/50 border-indigo-100"
                          : "bg-white border-gray-100"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-lg flex-shrink-0">
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${isUnread ? "font-semibold text-gray-800" : "text-gray-600"}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{timeStr}</p>
                      </div>
                      {isUnread && (
                        <button
                          onClick={() => markNotifRead(notif._id)}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition whitespace-nowrap"
                        >
                          Marquer lu
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}