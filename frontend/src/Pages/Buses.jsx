import { useState, useEffect, useCallback } from "react";
import AdminSidebar from "../components/AdminSidebar.jsx";
import BusTable from "../components/buses/BusTable.jsx";
import { Plus, X, Search } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { busService } from "../services/busService.js";

const emptyForm = {
  immatriculation: "",
  numero: "",
  capacite: "",
  type: "standard",
  statut: "actif",
};

const STATUTS_CYCLE = ["actif", "inactif", "maintenance"];

export default function Buses() {
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchBuses = useCallback(async () => {
    try {
      setLoading(true);
      const list = await busService.list();
      setBuses(list);
      setFilteredBuses(list);
    } catch {
      toast.error("Erreur lors de la récupération des bus");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBuses();
  }, [fetchBuses]);

  useEffect(() => {
    const q = search.toLowerCase();
    const result = buses.filter(
      (bus) =>
        bus.immatriculation?.toLowerCase().includes(q) ||
        bus.numero?.toLowerCase().includes(q) ||
        bus.type?.toLowerCase().includes(q)
    );
    setFilteredBuses(result);
    setPage(1);
  }, [search, buses]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleStatut = async (bus) => {
    let i = STATUTS_CYCLE.indexOf(bus.statut || "actif");
    if (i < 0) i = 0;
    const next = STATUTS_CYCLE[(i + 1) % STATUTS_CYCLE.length];
    try {
      await busService.setStatut(bus._id, next);
      toast.success(`Statut changé en : ${next}`);
      fetchBuses();
    } catch {
      toast.error("Erreur lors du changement de statut");
    }
  };

  const openForm = (bus = null) => {
    if (bus) {
      setEditingId(bus._id);
      setFormData({
        immatriculation: bus.immatriculation ?? "",
        numero: bus.numero ?? "",
        capacite: bus.capacite != null ? String(bus.capacite) : "",
        type: bus.type || "standard",
        statut: bus.statut || "actif",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        capacite: formData.capacite === "" ? undefined : Number(formData.capacite),
      };
      if (editingId) {
        await busService.update(editingId, payload);
        toast.success("Bus modifié avec succès");
      } else {
        await busService.create(payload);
        toast.success("Bus ajouté avec succès");
      }
      closeForm();
      fetchBuses();
    } catch (err) {
      toast.error(err.response?.data?.error || "Une erreur est survenue");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce bus ?")) return;
    try {
      await busService.remove(id);
      toast.success("Bus supprimé avec succès");
      fetchBuses();
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
            Gestion des Bus
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
            <BusTable
              rows={filteredBuses}
              loading={loading}
              page={page}
              perPage={perPage}
              totalCount={filteredBuses.length}
              onPageChange={setPage}
              onEdit={openForm}
              onDelete={handleDelete}
              onToggleStatut={handleToggleStatut}
            />
          </div>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingId ? "Modifier le bus" : "Ajouter un bus"}
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
                  id="bus-form"
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Immatriculation *
                    </label>
                    <input
                      required
                      type="text"
                      name="immatriculation"
                      value={formData.immatriculation}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Ex: 123 TUN 456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numéro *
                    </label>
                    <input
                      required
                      type="text"
                      name="numero"
                      value={formData.numero}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Ex: BUS-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacité
                    </label>
                    <input
                      type="number"
                      name="capacite"
                      min={1}
                      max={200}
                      value={formData.capacite}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Nombre de places"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="standard">Standard</option>
                      <option value="articule">Articulé</option>
                      <option value="minibus">Minibus</option>
                      <option value="electrique">Électrique</option>
                    </select>
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
                      <option value="maintenance">Maintenance</option>
                    </select>
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
                  form="bus-form"
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
