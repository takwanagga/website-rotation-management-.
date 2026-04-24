import React from "react";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "../components/AdminSidebar";
import NotificationBell from "../components/NotificationBell";
import { getAdminStats } from "../lib/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Users, Bus, MapPin, TrendingUp, Moon, Sun, Activity } from "lucide-react";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const displayName =
    [user?.prenom, user?.nom].filter(Boolean).join(" ").trim() ||
    user?.email ||
    "Administrateur";

  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getAdminStats();
        setStats(res.data);
      } catch (err) {
        console.error("Error fetching admin stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const initial = (displayName.charAt(0) || "A").toUpperCase();

  if (loading) {
    return (
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 md:ml-64 bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Chargement des statistiques…</p>
          </div>
        </div>
      </div>
    );
  }

  const empStatus = stats?.employeeStatus || { actif: 0, 'en congé': 0, inactif: 0, total: 0 };
  const busStatusData = stats?.busStatus || { actif: 0, 'en maintenance': 0, 'retiré': 0, total: 0 };
  const lineStatus = stats?.lineStatus || { actif: 0, inactif: 0, total: 0 };
  const workHours = stats?.workHours || [];
  const coverageData = stats?.coverageData || [];

  const topEmployees = [...workHours].sort((a, b) => b.hours - a.hours).slice(0, 10);
  const workHoursChartData = {
    labels: topEmployees.map(e => `${e.nom} ${e.prenom?.charAt(0) || ''}.`),
    datasets: [
      {
        label: "Heures jour ☀️",
        data: topEmployees.map(e => e.dayHours || 0),
        backgroundColor: "rgba(99, 102, 241, 0.8)",
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: "Heures nuit 🌙",
        data: topEmployees.map(e => e.nightHours || 0),
        backgroundColor: "rgba(139, 92, 246, 0.6)",
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const empDoughnutData = {
    labels: ["Actif", "En congé", "Inactif"],
    datasets: [{
      data: [empStatus.actif, empStatus['en congé'], empStatus.inactif],
      backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  const busDoughnutData = {
    labels: ["Actif", "En maintenance", "Retiré"],
    datasets: [{
      data: [busStatusData.actif, busStatusData['en maintenance'], busStatusData['retiré']],
      backgroundColor: ["#6366f1", "#f59e0b", "#94a3b8"],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  const coverageChartData = {
    labels: coverageData.map(d => d.label),
    datasets: [{
      label: "Couverture %",
      data: coverageData.map(d => d.percent),
      borderColor: "#6366f1",
      backgroundColor: "rgba(99, 102, 241, 0.1)",
      fill: true,
      tension: 0.4,
      pointBackgroundColor: "#6366f1",
      pointBorderWidth: 2,
      pointRadius: 5,
    }],
  };

  const totalDay = workHours.reduce((s, e) => s + (e.dayHours || 0), 0);
  const totalNight = workHours.reduce((s, e) => s + (e.nightHours || 0), 0);
  const dayNightData = {
    labels: ["Jour (5h-20h)", "Nuit (20h-5h)"],
    datasets: [{
      data: [totalDay, totalNight],
      backgroundColor: ["#f59e0b", "#6366f1"],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: { position: "bottom", labels: { padding: 16, usePointStyle: true, font: { size: 12 } } },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { usePointStyle: true, font: { size: 12 } } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" }, ticks: { font: { size: 11 } } },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: { callback: v => v + "%", font: { size: 11 } },
      },
    },
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-64 bg-gray-50 min-h-screen pt-16 md:pt-0">

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
            <p className="text-sm text-gray-500 mt-0.5">Bienvenue, {displayName}</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
              {initial}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-8 space-y-8">

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Employés", value: empStatus.total, sub: `${empStatus.actif} actifs`, icon: Users, color: "indigo" },
              { label: "Bus", value: busStatusData.total, sub: `${busStatusData.actif} actifs`, icon: Bus, color: "violet" },
              { label: "Lignes", value: lineStatus.total, sub: `${lineStatus.actif} actives`, icon: MapPin, color: "emerald" },
              { label: "Heures totales", value: (totalDay + totalNight) + "h", sub: `${totalDay}h jour / ${totalNight}h nuit`, icon: Activity, color: "amber" },
            ].map(({ label, value, sub, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center mb-3`}>
                  <Icon size={20} className={`text-${color}-600`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm font-medium text-gray-600 mt-0.5">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Work hours bar chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4">Heures de travail — Top 10 employés</h2>
            <div style={{ height: 280 }}>
              <Bar data={workHoursChartData} options={barOptions} />
            </div>
          </div>

          {/* Doughnuts row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users size={16} className="text-indigo-500" /> Statut Employés
              </h2>
              <div style={{ height: 220 }}>
                <Doughnut data={empDoughnutData} options={doughnutOptions} />
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Bus size={16} className="text-violet-500" /> Statut Bus
              </h2>
              <div style={{ height: 220 }}>
                <Doughnut data={busDoughnutData} options={doughnutOptions} />
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Sun size={16} className="text-amber-500" />/<Moon size={16} className="text-indigo-500" /> Jour vs Nuit
              </h2>
              <div style={{ height: 220 }}>
                <Doughnut data={dayNightData} options={doughnutOptions} />
              </div>
            </div>
          </div>

          {/* Coverage line chart */}
          {coverageData.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-indigo-500" /> Couverture Planning (7 derniers jours)
              </h2>
              <div style={{ height: 220 }}>
                <Line data={coverageChartData} options={lineOptions} />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;