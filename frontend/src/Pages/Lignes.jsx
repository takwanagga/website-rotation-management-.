import { useState, useEffect, useCallback } from "react";
import AdminSidebar from "../components/AdminSidebar.jsx";
import LigneTable from "../components/lignes/LigneTable.jsx";
import { Plus, X, Search } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { ligneService } from "../services/ligneService.js";

const emptyForm = {
  libelle: "",
  debutDeLigne: "",
  finDeLigne: "",
  distance: "",
};

export default function Lignes() {
  const [lignes, setLignes] = useState([]);
  const [filteredLignes, setFilteredLignes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchLignes = useCallback(async () => {
    try {
      setLoading(true);
      const list = await ligneService.list();
      setLignes(list);
      setFilteredLignes(list);
    } catch {
      toast.error("Erreur lors de la récupération des lignes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLignes();
  }, [fetchLignes]);

  useEffect(() => {
    const q = search.toLowerCase();
    const result = lignes.filter(
      (ligne) =>
        ligne.libelle?.toLowerCase().includes(q) ||
        ligne.debutDeLigne?.toLowerCase().includes(q) ||
        ligne.finDeLigne?.toLowerCase().includes(q)
    );
    setFilteredLignes(result);
    setPage(1);
  }, [search, lignes]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openForm = (ligne = null) => {
    if (ligne) {
      setEditingId(ligne._id);
      setFormData({
        libelle: ligne.libelle ?? "",
        debutDeLigne: ligne.debutDeLigne ?? "",
        finDeLigne: ligne.finDeLigne ?? "",
        distance: ligne.distance != null ? String(ligne.distance) : "",
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
        distance: formData.distance === "" ? undefined : Number(formData.distance),
      };
      if (editingId) {
        await ligneService.update(editingId, payload);
        toast.success("Ligne modifiée avec succès");
      } else {
        await ligneService.create(payload);
        toast.success("Ligne ajoutée avec succès");
      }
      closeForm();
      fetchLignes();
    } catch (err) {
      toast.error(err.response?.data?.error || "Une erreur est survenue");
    }
  };

 

  const handleToggleStatut = async (ligne) => {
    try {
      const newStatut = ligne.status === "actif" ? "inactif" : "actif";
      await ligneService.update(ligne._id, { ...ligne, status: newStatut });
      toast.success("Statut modifié avec succès");
      fetchLignes();
    } catch {
      toast.error("Erreur lors de la modification du statut");
    }
  };

 

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-64 bg-gray-50 min-h-screen pt-16 md:pt-0">
        <Toaster position="top-right" />

        <div className="bg-white shadow-sm p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Gestion des Lignes
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
            <LigneTable
              rows={filteredLignes}
              loading={loading}
              page={page}
              perPage={perPage}
              totalCount={filteredLignes.length}
              onPageChange={setPage}
              onEdit={openForm}
              onToggleStatut={handleToggleStatut}
            />
          </div>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingId ? "Modifier la ligne" : "Ajouter une ligne"}
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
                  id="ligne-form"
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code *
                    </label>
                    <input
                      required
                      type="text"
                      name="code"
                      value={formData.libelle}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Ex: LIGNE-101"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Départ *
                    </label>
                    <input
                      required
                      type="text"
                      name="depart"
                      value={formData.debutDeLigne}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Point de départ"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Arrivée *
                    </label>
                    <input
                      required
                      type="text"
                      name="arrivee"
                      value={formData.finDeLigne}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Point d'arrivée"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Distance (km)
                    </label>
                    <input
                      type="number"
                      name="distance"
                      min={0}
                      step="0.1"
                      value={formData.distance}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Distance en km"
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
                  form="ligne-form"
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
