import React from "react";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "../components/AdminSidebar";
<<<<<<< HEAD
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
import {
  Users,
  Bus,
  MapPin,
  TrendingUp,
  Moon,
  Sun,
  Activity,
} from "lucide-react";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
);

const AdminDashboard = () => {
  const { user } = useAuth();
=======
import { getAdminStats, listEmployees, listBuses, listLines } from "../lib/api";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
>>>>>>> a49756bd5b0272b7aa8892ab327a7c1a3b40d74a
  const displayName =
    [user?.prenom, user?.nom].filter(Boolean).join(" ").trim() ||
    user?.email ||
    "Administrateur";
<<<<<<< HEAD

  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
=======
  const [stats, setStats] = React.useState({
    employees: 0,
    buses: 0,
    lines: 0,
    workHours: [],
  });
>>>>>>> a49756bd5b0272b7aa8892ab327a7c1a3b40d74a

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
<<<<<<< HEAD
        const res = await getAdminStats();
        setStats(res.data);
      } catch (err) {
        console.error("Error fetching admin stats", err);
      } finally {
        setLoading(false);
=======
        const [empRes, busRes, lineRes, statsRes] = await Promise.all([
          listEmployees(),
          listBuses(),
          listLines(),
          getAdminStats(),
        ]);
        
        setStats({
          employees: empRes.data.length || 0,
          buses: busRes.data.length || 0,
          lines: lineRes.data.length || 0,
          workHours: statsRes.data.workHours || [],
        });
      } catch (err) {
        console.error("Error fetching admin stats", err);
>>>>>>> a49756bd5b0272b7aa8892ab327a7c1a3b40d74a
      }
    };
    fetchStats();
  }, []);

  const initial = (displayName.charAt(0) || "A").toUpperCase();

<<<<<<< HEAD
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

  // ── Chart: Work hours per employee (Top 10) ──
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

  // ── Chart: Employee status doughnut ──
  const empDoughnutData = {
    labels: ["Actif", "En congé", "Inactif"],
    datasets: [{
      data: [empStatus.actif, empStatus['en congé'], empStatus.inactif],
      backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  // ── Chart: Bus status doughnut ──
  const busDoughnutData = {
    labels: ["Actif", "En maintenance", "Retiré"],
    datasets: [{
      data: [busStatusData.actif, busStatusData['en maintenance'], busStatusData['retiré']],
      backgroundColor: ["#6366f1", "#f59e0b", "#94a3b8"],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  // ── Chart: Planning coverage (last 7 days) ──
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

  // ── Chart: Overall Day vs Night ──
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
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { beginAtZero: true, max: 100, grid: { color: "rgba(0,0,0,0.05)" }, ticks: { callback: v => v + "%", font: { size: 11 } } },
    },
  };

=======
>>>>>>> a49756bd5b0272b7aa8892ab327a7c1a3b40d74a
  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-64 bg-gray-50 min-h-screen pt-16 md:pt-0">
<<<<<<< HEAD
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Bienvenue, <span className="font-semibold text-indigo-600">{displayName}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
              {initial}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 space-y-6">
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Employees */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Users size={20} className="text-emerald-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{empStatus.total}</span>
              </div>
              <p className="text-sm font-semibold text-gray-700">Employés</p>
              <div className="flex gap-2 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">{empStatus.actif} actifs</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">{empStatus['en congé']} congé</span>
                {empStatus.inactif > 0 && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">{empStatus.inactif} inactifs</span>}
              </div>
            </div>

            {/* Buses */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Bus size={20} className="text-indigo-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{busStatusData.total}</span>
              </div>
              <p className="text-sm font-semibold text-gray-700">Bus</p>
              <div className="flex gap-2 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">{busStatusData.actif} actifs</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">{busStatusData['en maintenance']} maint.</span>
              </div>
            </div>

            {/* Lines */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                  <MapPin size={20} className="text-violet-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{lineStatus.total}</span>
              </div>
              <p className="text-sm font-semibold text-gray-700">Lignes</p>
              <div className="flex gap-2 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700">{lineStatus.actif} actives</span>
                {lineStatus.inactif > 0 && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">{lineStatus.inactif} inactives</span>}
              </div>
            </div>

            {/* Day/Night split */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Activity size={20} className="text-amber-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{totalDay + totalNight}h</span>
              </div>
              <p className="text-sm font-semibold text-gray-700">Heures Totales</p>
              <div className="flex gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700"><Sun size={10} />{totalDay}h jour</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700"><Moon size={10} />{totalNight}h nuit</span>
              </div>
            </div>
          </div>

          {/* ── Charts Row 1 ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coverage line chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-indigo-600" />
                <h3 className="text-sm font-bold text-gray-800">Couverture Planning (7 derniers jours)</h3>
              </div>
              <div className="h-64">
                <Line data={coverageChartData} options={lineOptions} />
              </div>
            </div>

            {/* Day/Night doughnut */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sun size={18} className="text-amber-500" />
                <h3 className="text-sm font-bold text-gray-800">Jour vs Nuit</h3>
              </div>
              <div className="h-64">
                <Doughnut data={dayNightData} options={doughnutOptions} />
              </div>
            </div>
          </div>

          {/* ── Charts Row 2 ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Work hours bar chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-indigo-600" />
                <h3 className="text-sm font-bold text-gray-800">Heures de travail par employé (Top 10)</h3>
              </div>
              <div className="h-72">
                <Bar data={workHoursChartData} options={barOptions} />
              </div>
            </div>

            {/* Status doughnuts */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3">Statut Employés</h3>
                <div className="h-40">
                  <Doughnut data={empDoughnutData} options={doughnutOptions} />
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3">Statut Bus</h3>
                <div className="h-40">
                  <Doughnut data={busDoughnutData} options={doughnutOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Work hours table ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4">
              Détail des heures par employé
            </h2>
            {workHours.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune donnée disponible</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nom Prénom</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rôle</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1"><Sun size={12} /> Jour</span>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1"><Moon size={12} /> Nuit</span>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {[...workHours].sort((a, b) => b.hours - a.hours).map((emp, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{emp.nom} {emp.prenom}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${emp.role === 'chauffeur' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {emp.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-semibold text-amber-600">{emp.dayHours || 0}h</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-semibold text-indigo-600">{emp.nightHours || 0}h</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-bold text-gray-900">{emp.hours}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
=======
        <div className="bg-white shadow-sm p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Tableau de Bord</h1>
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
              {initial}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-4 md:p-6">
              <h3 className="text-gray-500 text-xs md:text-sm font-semibold mb-2">Total Employés</h3>
              <p className="text-2xl md:text-3xl font-bold text-gray-800">{stats.employees}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 md:p-6">
              <h3 className="text-gray-500 text-xs md:text-sm font-semibold mb-2">Bus Actifs</h3>
              <p className="text-2xl md:text-3xl font-bold text-blue-600">{stats.buses}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 md:p-6">
              <h3 className="text-gray-500 text-xs md:text-sm font-semibold mb-2">Lignes</h3>
              <p className="text-2xl md:text-3xl font-bold text-green-600">{stats.lines}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-8">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
              Bienvenue, {displayName} !
            </h2>
            <p className="text-gray-600 text-sm md:text-base">
              Vous êtes connecté en tant qu&apos;administrateur.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 md:p-6 border border-gray-100">
             <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">
                Statistiques de planification (Heures)
             </h2>
             {stats.workHours.length === 0 ? (
                 <p className="text-sm text-gray-500">Aucune donnée disponible</p>
             ) : (
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                       <thead className="bg-gray-50">
                          <tr>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom Prénom</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heures Calculées</th>
                          </tr>
                       </thead>
                       <tbody className="bg-white divide-y divide-gray-200">
                           {stats.workHours.sort((a,b) => b.hours - a.hours).map((employee, idx) => (
                               <tr key={idx}>
                                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.nom} {employee.prenom}</td>
                                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{employee.role}</td>
                                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">{employee.hours} h</td>
                               </tr>
                           ))}
                       </tbody>
                    </table>
                 </div>
             )}
>>>>>>> a49756bd5b0272b7aa8892ab327a7c1a3b40d74a
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
<<<<<<< HEAD
=======

>>>>>>> a49756bd5b0272b7aa8892ab327a7c1a3b40d74a
