import { useState, useEffect, useCallback } from "react";
import AdminSidebar from "../components/AdminSidebar.jsx";
import BusTable from "../components/buses/BusTable.jsx";
import { Plus, X, Search } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { busService } from "../services/busService.js";

const emptyForm = {
  immatriculation: "",
  model: "",
  statut: "actif",
};

export default function Buses() {
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
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
        bus.model?.toLowerCase().includes(q)
    );
    setFilteredBuses(result);
    setPage(1);
  }, [search, buses]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openForm = (bus = null) => {
    if (bus) {
      setEditingId(bus._id);
      setFormData({
        immatriculation: bus.immatriculation ?? "",
        model: bus.model ?? "",
        statut: bus.statut || bus.status || "actif",
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

  const openViewModal = (bus) => {
    setSelectedBus(bus);
    setIsViewModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
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
              onView={openViewModal}
              onEdit={openForm}
            />
          </div>
        </div>

        {isViewModalOpen && selectedBus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-xl">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">Details bus</h2>
                <button type="button" onClick={() => setIsViewModalOpen(false)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <p><span className="font-semibold">Immatriculation:</span> {selectedBus.immatriculation}</p>
                <p><span className="font-semibold">Modele:</span> {selectedBus.model || "-"}</p>
                <p className="md:col-span-2"><span className="font-semibold">Statut:</span> {selectedBus.statut || selectedBus.status}</p>
              </div>
            </div>
          </div>
        )}

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
                      Modèle *
                    </label>
                    <input
                      required
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Ex: Iveco Urbanway"
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
                      <option value="en maintenance">En maintenance</option>
                      <option value="retiré">Retiré</option>
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
