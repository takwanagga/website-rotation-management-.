import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "../components/AdminSidebar";
import { getSettings, updateSettings } from "../lib/api";
import toast, { Toaster } from "react-hot-toast";
import {
  Settings2, Bell, Calendar, Shield, Palette, Save, Loader2,
  Sun, Moon, Monitor,
} from "lucide-react";

const TABS = [
  { key: "general", label: "Général", icon: Settings2 },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "planning", label: "Planning", icon: Calendar },
  { key: "security", label: "Sécurité", icon: Shield },
  { key: "theme", label: "Apparence", icon: Palette },
];

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await getSettings();
        setSettings(res.data);
      } catch (err) {
        console.error("Error loading settings:", err);
        toast.error("Erreur lors du chargement des paramètres");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await updateSettings(settings);
      setSettings(res.data.settings);
      toast.success("Paramètres enregistrés avec succès");
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 md:ml-64 bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Chargement des paramètres…</p>
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

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configurez les paramètres de l'application</p>
        </div>

        <div className="p-4 md:p-8">
          <div className="flex flex-col lg:flex-row gap-6 max-w-5xl">
            {/* Sidebar tabs */}
            <div className="lg:w-56 flex-shrink-0">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition border-b border-gray-50 last:border-0 ${
                        activeTab === tab.key
                          ? "bg-indigo-50 text-indigo-700 border-l-4 border-l-indigo-600"
                          : "text-gray-600 hover:bg-gray-50 border-l-4 border-l-transparent"
                      }`}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                {/* General */}
                {activeTab === "general" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-800 mb-1">Paramètres Généraux</h2>
                      <p className="text-sm text-gray-500">Informations de base de l'application</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom de l'application</label>
                        <input
                          type="text"
                          value={settings?.appName || ""}
                          onChange={(e) => handleChange("appName", e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email de support</label>
                        <input
                          type="email"
                          value={settings?.supportEmail || ""}
                          onChange={(e) => handleChange("supportEmail", e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fuseau horaire</label>
                        <select
                          value={settings?.timezone || "Africa/Tunis"}
                          onChange={(e) => handleChange("timezone", e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition"
                        >
                          <option value="Africa/Tunis">Africa/Tunis (UTC+1)</option>
                          <option value="Europe/Paris">Europe/Paris (UTC+1/+2)</option>
                          <option value="Africa/Algiers">Africa/Algiers (UTC+1)</option>
                          <option value="Africa/Casablanca">Africa/Casablanca (UTC+0/+1)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications */}
                {activeTab === "notifications" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-800 mb-1">Notifications</h2>
                      <p className="text-sm text-gray-500">Gérer les préférences de notification</p>
                    </div>
                    <div className="space-y-4">
                      {[
                        { field: "emailNotificationsEnabled", label: "Notifications par email", desc: "Activer l'envoi d'emails automatiques" },
                        { field: "notifyOnPlanningPublish", label: "Publication de planning", desc: "Notifier les employés lorsqu'un planning est publié" },
                        { field: "notifyOnPasswordChange", label: "Changement de mot de passe", desc: "Notifier l'employé lorsque son mot de passe est modifié" },
                        { field: "notifyOnPlanningModification", label: "Modification de planning", desc: "Notifier lors d'une modification de planning publié" },
                      ].map(({ field, label, desc }) => (
                        <div key={field} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                          </div>
                          <button
                            onClick={() => handleChange(field, !settings?.[field])}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              settings?.[field] ? "bg-indigo-600" : "bg-gray-300"
                            }`}
                          >
                            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              settings?.[field] ? "translate-x-6" : "translate-x-0.5"
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Planning */}
                {activeTab === "planning" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-800 mb-1">Paramètres de Planning</h2>
                      <p className="text-sm text-gray-500">Configuration des créneaux et limites</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Début de journée</label>
                        <input
                          type="time"
                          value={settings?.workDayStart || "06:00"}
                          onChange={(e) => handleChange("workDayStart", e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fin de journée</label>
                        <input
                          type="time"
                          value={settings?.workDayEnd || "22:00"}
                          onChange={(e) => handleChange("workDayEnd", e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Durée d'un créneau (heures)</label>
                        <input
                          type="number"
                          min={1}
                          max={8}
                          value={settings?.slotDurationHours || 2}
                          onChange={(e) => handleChange("slotDurationHours", parseInt(e.target.value))}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Heures max/jour par employé</label>
                        <input
                          type="number"
                          min={1}
                          max={16}
                          value={settings?.maxDailyHoursPerEmployee || 8}
                          onChange={(e) => handleChange("maxDailyHoursPerEmployee", parseInt(e.target.value))}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Security */}
                {activeTab === "security" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-800 mb-1">Sécurité</h2>
                      <p className="text-sm text-gray-500">Paramètres de session et mot de passe</p>
                    </div>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expiration de session (heures)</label>
                        <input
                          type="number"
                          min={1}
                          max={24}
                          value={settings?.sessionTimeoutHours || 8}
                          onChange={(e) => handleChange("sessionTimeoutHours", parseInt(e.target.value))}
                          className="w-full max-w-xs px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition"
                        />
                        <p className="text-xs text-gray-400 mt-1">Les sessions seront automatiquement expirées après cette durée</p>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Mots de passe forts obligatoires</p>
                          <p className="text-xs text-gray-500 mt-0.5">Min 8 caractères, majuscule, minuscule, chiffre, caractère spécial</p>
                        </div>
                        <button
                          onClick={() => handleChange("enforceStrongPasswords", !settings?.enforceStrongPasswords)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            settings?.enforceStrongPasswords ? "bg-indigo-600" : "bg-gray-300"
                          }`}
                        >
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            settings?.enforceStrongPasswords ? "translate-x-6" : "translate-x-0.5"
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Theme */}
                {activeTab === "theme" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-800 mb-1">Apparence</h2>
                      <p className="text-sm text-gray-500">Personnaliser l'apparence de l'application</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: "light", label: "Clair", Icon: Sun, desc: "Thème clair classique" },
                        { value: "dark", label: "Sombre", Icon: Moon, desc: "Thème sombre" },
                        { value: "system", label: "Système", Icon: Monitor, desc: "Suit le système" },
                      ].map(({ value, label, Icon, desc }) => (
                        <button
                          key={value}
                          onClick={() => handleChange("theme", value)}
                          className={`p-4 rounded-xl border-2 text-center transition ${
                            settings?.theme === value
                              ? "border-indigo-600 bg-indigo-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <Icon size={24} className={`mx-auto mb-2 ${settings?.theme === value ? "text-indigo-600" : "text-gray-400"}`} />
                          <p className={`text-sm font-semibold ${settings?.theme === value ? "text-indigo-700" : "text-gray-700"}`}>{label}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save button */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition shadow-sm"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? "Enregistrement…" : "Enregistrer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
