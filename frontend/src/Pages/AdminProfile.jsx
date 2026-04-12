import { useState } from "react";
import AdminSidebar from "../components/AdminSidebar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { employeeService } from "../services/employeeService.js";
import toast, { Toaster } from "react-hot-toast";

export default function AdminProfile() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nom: user?.nom || "",
    prenom: user?.prenom || "",
    email: user?.email || "",
    telephone: user?.telephone || "",
    localisation: user?.localisation || "",
    age: user?.age ? String(user.age) : "",
  });
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?._id) return;
    try {
      setSaving(true);
      await employeeService.update(user._id, {
        ...formData,
        age: formData.age === "" ? undefined : Number(formData.age),
      });
      toast.success("Profil admin mis a jour");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Erreur lors de la mise a jour");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-64 bg-gray-50 min-h-screen pt-16 md:pt-0">
        <Toaster position="top-right" />
        <div className="bg-white shadow-sm p-4 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Profil Admin</h1>
        </div>

        <div className="p-4 md:p-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-3xl">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input name="nom" value={formData.nom} onChange={handleInputChange} className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prenom</label>
                <input name="prenom" value={formData.prenom} onChange={handleInputChange} className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
                <input name="telephone" value={formData.telephone} onChange={handleInputChange} className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localisation</label>
                <input name="localisation" value={formData.localisation} onChange={handleInputChange} className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input type="number" min={18} max={65} name="age" value={formData.age} onChange={handleInputChange} className="w-full p-2 border rounded-lg" />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
