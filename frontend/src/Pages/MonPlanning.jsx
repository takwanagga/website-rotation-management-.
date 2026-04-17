import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { listPlanningByEmployee } from "../lib/api.js";
import Navbar from "../components/Navbar.jsx";
import NotificationBell from "../components/NotificationBell.jsx";
import { CalendarDays, Clock, Bus, User, MapPin } from "lucide-react";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function isToday(dateStr) {
  const today = new Date().toISOString().split("T")[0];
  return dateStr === today;
}

function isFuture(dateStr) {
  const today = new Date().toISOString().split("T")[0];
  return dateStr > today;
}

function isPast(dateStr) {
  const today = new Date().toISOString().split("T")[0];
  return dateStr < today;
}

export default function MonPlanning() {
  const { user } = useAuth();
  const [plannings, setPlannings] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("upcoming"); // upcoming | today | past | all

  useEffect(() => {
    if (!user?._id) return;
    listPlanningByEmployee(user._id)
      .then((res) => setPlannings(res.data))
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

  // Filter
  const filteredEntries = Object.entries(grouped)
    .filter(([dateKey]) => {
      if (filter === "today")    return isToday(dateKey);
      if (filter === "upcoming") return isToday(dateKey) || isFuture(dateKey);
      if (filter === "past")     return isPast(dateKey);
      return true;
    })
    .sort(([a], [b]) => (filter === "past" ? b.localeCompare(a) : a.localeCompare(b)));

  const roleLabel = user?.role === "chauffeur" ? "Chauffeur" : "Receveur";
  const roleColor = user?.role === "chauffeur" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar with notification bell */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
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
                {(user?.prenom?.charAt(0) || user?.email?.charAt(0) || "?").toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 leading-none">
                  {user?.prenom} {user?.nom}
                </p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Mon Planning</h2>
          <p className="text-gray-500 text-sm mt-1">
            Consultez vos créneaux de travail publiés par l'administration.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1 border border-gray-100 shadow-sm w-fit">
          {[
            { key: "upcoming", label: "À venir" },
            { key: "today",    label: "Aujourd'hui" },
            { key: "past",     label: "Passés" },
            { key: "all",      label: "Tous" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === tab.key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Chargement…</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <CalendarDays size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="font-semibold text-gray-600">Aucun planning disponible</p>
            <p className="text-sm text-gray-400 mt-1">
              {filter === "today"
                ? "Vous n'avez pas de créneau aujourd'hui."
                : "Aucun créneau pour cette période."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredEntries.map(([dateKey, items]) => {
              const today  = isToday(dateKey);
              const past   = isPast(dateKey);
              return (
                <div key={dateKey} className={`rounded-2xl border overflow-hidden shadow-sm ${
                  today ? "border-indigo-200" : past ? "border-gray-100 opacity-80" : "border-gray-100"
                }`}>
                  {/* Date header */}
                  <div className={`px-5 py-3 flex items-center gap-3 ${
                    today ? "bg-indigo-600 text-white" : "bg-white border-b border-gray-100"
                  }`}>
                    <CalendarDays size={16} className={today ? "text-indigo-200" : "text-indigo-500"} />
                    <span className={`font-semibold capitalize text-sm ${today ? "text-white" : "text-gray-800"}`}>
                      {formatDate(dateKey)}
                    </span>
                    {today && (
                      <span className="ml-auto text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">
                        Aujourd'hui
                      </span>
                    )}
                    {past && (
                      <span className="ml-auto text-xs text-gray-400 font-medium">Terminé</span>
                    )}
                  </div>

                  {/* Slots */}
                  <div className="bg-white divide-y divide-gray-50">
                    {items
                      .sort((a, b) => a.heuredebut.localeCompare(b.heuredebut))
                      .map((p) => {
                        const isReceveur = p.receveur?._id === user?._id || p.receveur === user?._id;
                        const myRole     = isReceveur ? "Receveur" : "Chauffeur";
                        const myColor    = isReceveur ? "amber" : "emerald";

                        return (
                          <div key={p._id} className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 ${past ? "opacity-60" : ""}`}>
                            {/* Time */}
                            <div className="flex items-center gap-2 min-w-[130px]">
                              <Clock size={14} className="text-indigo-400 flex-shrink-0" />
                              <span className="text-sm font-bold text-gray-800">
                                {p.heuredebut} – {p.heurefin}
                              </span>
                            </div>

                            {/* Ligne */}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-700 truncate">
                                  {p.ligne?.libelle || "—"}
                                </p>
                                {p.ligne?.debutDeLigne && p.ligne?.finDeLigne && (
                                  <p className="text-xs text-gray-400 truncate">
                                    {p.ligne.debutDeLigne} → {p.ligne.finDeLigne}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Bus */}
                            <div className="flex items-center gap-2">
                              <Bus size={14} className="text-indigo-400 flex-shrink-0" />
                              <span className="text-sm text-gray-600 font-medium">
                                {p.bus?.matricule || "—"}
                              </span>
                            </div>

                            {/* Mon rôle */}
                            <span className={`text-xs font-bold px-3 py-1 rounded-full bg-${myColor}-100 text-${myColor}-700 flex-shrink-0`}>
                              {myRole}
                            </span>

                            {/* Collègue */}
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
    </div>
  );
}