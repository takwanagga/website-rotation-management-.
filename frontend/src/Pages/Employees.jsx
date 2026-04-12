import { useState, useEffect, useCallback } from "react";
import AdminSidebar from "../components/AdminSidebar.jsx";
import EmployeeTable from "../components/employees/EmployeeTable.jsx";
import { Plus, X, Search } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { employeeService } from "../services/employeeService.js";

const emptyForm = {
  nom: "",
  prenom: "",
  mecano: "",
  localisation: "",
  email: "",
  role: "chauffeur",
  telephone: "",
  age: "",
  MotDePasse: "",
  statut: "actif",
};

const STATUTS_CYCLE = ["actif", "inactif", "en congé"];

export default function Employees() {
  const [employes, setEmployes] = useState([]);
  const [filteredEmployes, setFilteredEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEmploye, setSelectedEmploye] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchEmployes = useCallback(async () => {
    try {
      setLoading(true);
      const list = await employeeService.list();
      setEmployes(list);
      setFilteredEmployes(list);
    } catch {
      toast.error("Erreur lors de la récupération des employés");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployes();
  }, [fetchEmployes]);

  useEffect(() => {
    const q = search.toLowerCase();
    const result = employes.filter(
      (emp) =>
        emp.nom?.toLowerCase().includes(q) ||
        emp.prenom?.toLowerCase().includes(q) ||
        emp.mecano?.toLowerCase().includes(q)
    );
    setFilteredEmployes(result);
    setPage(1);
  }, [search, employes]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleStatut = async (employe) => {
    let i = STATUTS_CYCLE.indexOf(employe.statut || "actif");
    if (i < 0) i = 0;
    const next = STATUTS_CYCLE[(i + 1) % STATUTS_CYCLE.length];
    try {
      await employeeService.setStatut(employe._id, next);
      toast.success(`Statut changé en : ${next}`);
      fetchEmployes();
    } catch {
      toast.error("Erreur lors du changement de statut");
    }
  };

  const openForm = (employe = null) => {
    if (employe) {
      setEditingId(employe._id);
      setFormData({
        nom: employe.nom ?? "",
        prenom: employe.prenom ?? "",
        mecano: employe.mecano ?? "",
        localisation: employe.localisation ?? "",
        email: employe.email ?? "",
        role: employe.role ?? "chauffeur",
        telephone: employe.telephone ?? "",
        age: employe.age != null ? String(employe.age) : "",
        MotDePasse: "",
        statut: employe.statut || "actif",
      });
    } else {
      setEditingId(null);
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  const closeForm = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const openViewModal = (employe) => {
    setSelectedEmploye(employe);
    setIsViewModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        age: formData.age === "" ? undefined : Number(formData.age),
      };
      if (editingId) {
        if (!payload.MotDePasse) delete payload.MotDePasse;
        await employeeService.update(editingId, payload);
        toast.success("Employé modifié avec succès");
      } else {
        await employeeService.create(payload);
        toast.success("Employé ajouté avec succès");
      }
      closeForm();
      fetchEmployes();
    } catch (err) {
      toast.error(err.response?.data?.error || "Une erreur est survenue");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) return;
    try {
      await employeeService.remove(id);
      toast.success("Employé supprimé avec succès");
      fetchEmployes();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-64 bg-gray-50 min-h-screen pt-16 md:pt-0">
        <Toaster position="top-right" />

        <div className="bg-white shadow-sm p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Gestion des Employés
          </h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="search"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
              />
            </div>
            <button
              type="button"
              onClick={() => openForm()}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <Plus size={18} />
              Ajouter
            </button>
          </div>
        </div>

        <div className="p-4 md:p-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <EmployeeTable
              rows={filteredEmployes}
              loading={loading}
              page={page}
              perPage={perPage}
              totalCount={filteredEmployes.length}
              onPageChange={setPage}
              onView={openViewModal}
              onEdit={openForm}
              onDelete={handleDelete}
              onToggleStatut={handleToggleStatut}
            />
          </div>
        </div>

        {isViewModalOpen && selectedEmploye && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-xl">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">Details employe</h2>
                <button type="button" onClick={() => setIsViewModalOpen(false)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <p><span className="font-semibold">Nom:</span> {selectedEmploye.nom}</p>
                <p><span className="font-semibold">Prenom:</span> {selectedEmploye.prenom}</p>
                <p><span className="font-semibold">Mecano:</span> {selectedEmploye.mecano}</p>
                <p><span className="font-semibold">Role:</span> {selectedEmploye.role}</p>
                <p><span className="font-semibold">Statut:</span> {selectedEmploye.statut}</p>
                <p><span className="font-semibold">Age:</span> {selectedEmploye.age ?? "-"}</p>
                <p className="md:col-span-2"><span className="font-semibold">Email:</span> {selectedEmploye.email}</p>
                <p className="md:col-span-2"><span className="font-semibold">Telephone:</span> {selectedEmploye.telephone || "-"}</p>
                <p className="md:col-span-2"><span className="font-semibold">Localisation:</span> {selectedEmploye.localisation || "-"}</p>
              </div>
            </div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingId ? "Modifier l'employé" : "Ajouter un employé"}
                </h2>
                <button
                  type="button"
                  onClick={closeForm}
                  className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form
                  id="employe-form"
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mécano *
                    </label>
                    <input
                      required
                      type="text"
                      name="mecano"
                      value={formData.mecano}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Ex: M1234"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="jean@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom *
                    </label>
                    <input
                      required
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom *
                    </label>
                    <input
                      required
                      type="text"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="text"
                      name="telephone"
                      inputMode="numeric"
                      value={formData.telephone}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="8 chiffres"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Localisation
                    </label>
                    <input
                      type="text"
                      name="localisation"
                      value={formData.localisation}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Âge
                    </label>
                    <input
                      type="number"
                      name="age"
                      min={18}
                      max={65}
                      value={formData.age}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="18–65"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Statut
                    </label>
                    <select
                      name="statut"
                      value={formData.statut}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="actif">Actif</option>
                      <option value="inactif">Inactif</option>
                      <option value="en congé">En congé</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rôle *
                    </label>
                    <select
                      required
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="chauffeur">Chauffeur</option>
                      <option value="receveur">Receveur</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mot de passe{" "}
                      {editingId
                        ? "(laisser vide pour ne pas changer)"
                        : "*"}
                    </label>
                    <input
                      type="password"
                      name="MotDePasse"
                      value={formData.MotDePasse}
                      onChange={handleInputChange}
                      required={!editingId}
                      autoComplete="new-password"
                      className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </form>
              </div>

              <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  form="employe-form"
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingId ? "Enregistrer" : "Ajouter"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
