import { useState, useEffect, useCallback } from "react";
import { X, FileText, Sun, Moon, Clock, Calendar } from "lucide-react";
import { getEmployeeWorkHours } from "../../lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function getDefaultStart() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}

function getDefaultEnd() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function EmployeeWorkHoursModal({ employee, onClose }) {
  const [startDate, setStartDate] = useState(getDefaultStart());
  const [endDate, setEndDate] = useState(getDefaultEnd());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!employee?._id) return;
    setLoading(true);
    try {
      const res = await getEmployeeWorkHours(employee._id, startDate, endDate);
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [employee, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePrintPDF = () => {
    if (!data) return;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(16);
    doc.text(`Heures de travail`, 14, 15);
    doc.setFontSize(12);
    doc.text(`${employee.nom} ${employee.prenom} — ${employee.role}`, 14, 23);
    doc.setFontSize(10);
    doc.text(`Mécano: ${employee.mecano || "—"}`, 14, 30);
    doc.text(`Période: ${startDate} au ${endDate}`, 14, 36);

    // Summary
    doc.setFontSize(11);
    doc.text(
      `Total: ${data.totalHours}h   |   Jour: ${data.totalDayHours}h   |   Nuit: ${data.totalNightHours}h`,
      14,
      44
    );

    // Table
    const head = [["Date", "Jour (h)", "Nuit (h)", "Total (h)", "Créneaux"]];
    const body = data.dailyBreakdown.map((d) => [
      formatDate(d.date),
      `${d.dayHours}h`,
      `${d.nightHours}h`,
      `${d.totalHours}h`,
      d.slots
        .map((s) => `${s.heuredebut}-${s.heurefin} ${s.ligne}`)
        .join(", "),
    ]);

    autoTable(doc, {
      head,
      body,
      startY: 50,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [99, 102, 241] },
    });

    doc.save(
      `heures-${employee.nom}-${employee.prenom}-${startDate}.pdf`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Clock size={20} />
              Heures de travail
            </h2>
            <p className="text-indigo-200 text-sm mt-0.5">
              {employee.nom} {employee.prenom} — {employee.role} — Mécano:{" "}
              {employee.mecano || "—"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Controls */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Du
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Au
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
            />
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition"
          >
            Actualiser
          </button>
          <button
            onClick={handlePrintPDF}
            disabled={!data}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 ml-auto"
          >
            <FileText size={16} />
            Imprimer PDF
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-gray-400">Chargement…</p>
            </div>
          ) : !data ? (
            <div className="text-center py-16 text-gray-400">
              <Calendar size={48} className="mx-auto mb-4 opacity-40" />
              <p className="text-sm">Aucune donnée disponible</p>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-gray-900">
                    {data.totalHours}h
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Total Heures</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Sun size={18} className="text-amber-500" />
                    <p className="text-3xl font-bold text-amber-600">
                      {data.totalDayHours}h
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Heures Jour (5h-20h)
                  </p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Moon size={18} className="text-indigo-500" />
                    <p className="text-3xl font-bold text-indigo-600">
                      {data.totalNightHours}h
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Heures Nuit (20h-5h)
                  </p>
                </div>
              </div>

              {/* Daily breakdown */}
              {data.dailyBreakdown.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">
                    Aucun créneau dans cette période.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-sm font-bold text-gray-700">
                      Détail par jour
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                            Date
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                            <span className="inline-flex items-center gap-1">
                              <Sun size={12} /> Jour
                            </span>
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                            <span className="inline-flex items-center gap-1">
                              <Moon size={12} /> Nuit
                            </span>
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                            Total
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                            Créneaux
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.dailyBreakdown.map((day) => (
                          <tr
                            key={day.date}
                            className="border-b border-gray-50 hover:bg-gray-50 transition"
                          >
                            <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                              {formatDate(day.date)}
                            </td>
                            <td className="text-center px-4 py-3 font-semibold text-amber-600">
                              {day.dayHours}h
                            </td>
                            <td className="text-center px-4 py-3 font-semibold text-indigo-600">
                              {day.nightHours}h
                            </td>
                            <td className="text-center px-4 py-3 font-bold text-gray-900">
                              {day.totalHours}h
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">
                              {day.slots.map((s, i) => (
                                <span
                                  key={i}
                                  className="inline-block mr-2 mb-1 px-2 py-0.5 bg-gray-100 rounded-full"
                                >
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
