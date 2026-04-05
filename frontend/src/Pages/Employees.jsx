import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import DataTable from "react-data-table-component";
import { Edit2, Trash2, Plus, X, Search } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import api from "../api/axios";

const Employees = () => {
  const [employes, setEmployes] = useState([]);
  const [filteredEmployes, setFilteredEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
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
  });

  const fetchEmployes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/employe/lister");
      setEmployes(res.data);
      setFilteredEmployes(res.data);
    } catch (error) {
      toast.error("Erreur lors de la récupération des employés");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployes();
  }, []);

  useEffect(() => {
    const result = employes.filter(
      (emp) =>
        emp.nom.toLowerCase().includes(search.toLowerCase()) ||
        emp.prenom.toLowerCase().includes(search.toLowerCase()) ||
        emp.mecano.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredEmployes(result);
  }, [search, employes]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Toggle statut directly from the table (inline)
  const handleToggleStatut = async (employe) => {
    const statuts = ["actif", "inactif", "en cong\u00e9"];
    const currentIndex = statuts.indexOf(employe.statut || "actif");
    const newStatut = statuts[(currentIndex + 1) % statuts.length];
    try {
      await api.post(`/employe/modifier/${employe._id}`, { statut: newStatut });
      toast.success(`Statut chang\u00e9 en: ${newStatut}`);
      fetchEmployes();
    } catch (error) {
      toast.error("Erreur lors du changement de statut");
    }
  };

  const openForm = (employe = null) => {
    if (employe) {
      setEditingId(employe._id);
      setFormData({
        nom: employe.nom,
        prenom: employe.prenom,
        mecano: employe.mecano,
        localisation: employe.localisation || "",
        email: employe.email,
        role: employe.role,
        telephone: employe.telephone || "",
        age: employe.age || "",
        MotDePasse: "",
        statut: employe.statut || "actif",
      });
    } else {
      setEditingId(null);
      setFormData({
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
      });
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
      if (editingId) {
        const payload = { ...formData };
        if (!payload.MotDePasse) delete payload.MotDePasse;
        await api.post(`/employe/modifier/${editingId}`, payload);
        toast.success("Employé modifié avec succès");
      } else {
        await api.post("/employe/ajouter", formData);
        toast.success("Employé ajouté avec succès");
      }
      closeForm();
      fetchEmployes();
    } catch (error) {
      toast.error(error.response?.data?.error || "Une erreur est survenue");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) {
      try {
        await api.get(`/employe/supprimer/${id}`);
        toast.success("Employé supprimé avec succès");
        fetchEmployes();
      } catch (error) {
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  const columns = [
    {
      name: "Mécano",
      selector: (row) => row.mecano,
      sortable: true,
      width: "110px",
    },
    {
      name: "Nom",
      selector: (row) => row.nom,
      sortable: true,
    },
    {
      name: "Prénom",
      selector: (row) => row.prenom,
      sortable: true,
    },
    {
      name: "Âge",
      selector: (row) => row.age || "-",
      sortable: true,
      width: "80px",
    },
    {
      name: "Rôle",
      selector: (row) => row.role,
      sortable: true,
      cell: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
            row.role === "admin"
              ? "bg-purple-100 text-purple-800"
              : row.role === "chauffeur"
              ? "bg-blue-100 text-blue-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {row.role}
        </span>
      ),
    },
    {
      name: "Email",
      selector: (row) => row.email,
      sortable: true,
      hide: "sm",
    },
    // ─── NEW STATUS COLUMN ───────────────────────────────────────────────────
    {
      name: "Statut",
      sortable: true,
      selector: (row) => row.statut,
      width: "140px",
      cell: (row) => {
        const status = row.statut || "actif";
        const getStatusStyles = (status) => {
          switch (status) {
            case "actif":
              return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200";
            case "inactif":
              return "bg-red-100 text-red-600 hover:bg-red-200";
            case "en congé":
              return "bg-yellow-100 text-yellow-700 hover:bg-yellow-200";
            default:
              return "bg-gray-100 text-gray-700 hover:bg-gray-200";
          }
        };
        
        const getStatusLabel = (status) => {
          switch (status) {
            case "actif":
              return "Actif";
            case "inactif":
              return "Inactif";
            case "en congé":
              return "En congé";
            default:
              return status;
          }
        };

        return (
          <button
            onClick={() => handleToggleStatut(row)}
            title="Cliquer pour changer de statut"
            className={`relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer select-none ${getStatusStyles(status)}`}
          >
            <span className="w-2 h-2 rounded-full bg-current" />
            {getStatusLabel(status)}
          </button>
        );
      },
    },
    // ────────────────────────────────────────────────────────────────────────
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => openForm(row)}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
            title="Modifier"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
            title="Supprimer"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
      width: "120px",
    },
  ];

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-64 bg-gray-50 min-h-screen pt-16 md:pt-0">
        <Toaster position="top-right" />

        {/* Top Header */}
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
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
              />
            </div>
            <button
              onClick={() => openForm()}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <Plus size={18} />
              Ajouter
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <DataTable
              columns={columns}
              data={filteredEmployes}
              progressPending={loading}
              pagination
              highlightOnHover
              responsive
              noDataComponent={
                <div className="p-8 text-gray-500">
                  Aucun employé trouvé.
                </div>
              }
              customStyles={{
                headRow: {
                  style: {
                    backgroundColor: "#f9fafb",
                    fontWeight: "600",
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingId ? "Modifier l'Employé" : "Ajouter un Employé"}
                </h2>
                <button
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
                      value={formData.telephone}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="8 chiffres minimum"
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
                      Mot de Passe{" "}
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
                      className="w-full p-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                  {/* ─── STATUT TOGGLE ──────────────────────────────────────── */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Statut de l'employé
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            statut: prev.statut === "actif" ? "inactif" : "actif",
                          }))
                        }
                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                          formData.statut === "actif"
                            ? "bg-emerald-500"
                            : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                            formData.statut === "actif"
                              ? "translate-x-8"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span
                        className={`text-sm font-semibold ${
                          formData.statut === "actif"
                            ? "text-emerald-600"
                            : "text-red-500"
                        }`}
                      >
                        {formData.statut === "actif" ? "Actif" : "Inactif"}
                      </span>
                    </div>
                  </div>
                  {/* ──────────────────────────────────────────────────────── */}
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
};

export default Employees;