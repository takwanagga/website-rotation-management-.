import { useMemo } from "react";
import { Edit2, Eye } from "lucide-react";

function statusStyles(status) {
  switch (status) {
    case "disponible":
      return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200";
    case "en service":
      return "bg-blue-100 text-blue-700 hover:bg-blue-200";
    case "hors service":
      return "bg-red-100 text-red-600 hover:bg-red-200";
    case "retire":
      return "bg-red-100 text-red-600 hover:bg-red-200";
    case "maintenance":
      return "bg-yellow-100 text-yellow-700 hover:bg-yellow-200";
    default:
      return "bg-gray-100 text-gray-700 hover:bg-gray-200";
  }
}

function statusLabel(status) {
  switch (status) {
    case "disponible":
      return "Disponible";
    case "en service":
      return "En service";
    case "hors service":
      return "Hors service";
    case "retire":
      return "Retiré";
    case "maintenance":
      return "Maintenance";
    default:
      return status || "Actif";
  }
}

export default function BusTable({
  rows,
  loading,
  page,
  perPage,
  totalCount,
  onPageChange,
  onView,
  onEdit,
  onToggleStatut,
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));

  const slice = useMemo(() => {
    const start = (page - 1) * perPage;
    return rows.slice(start, start + perPage);
  }, [rows, page, perPage]);

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 text-sm">Chargement…</div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="p-8 text-gray-500 text-center text-sm">
        Aucun bus trouvé.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold">
              <th className="px-4 py-3 whitespace-nowrap">Immatriculation</th>
              <th className="px-4 py-3">Modèle</th>
              <th className="px-4 py-3 whitespace-nowrap">Statut</th>
              <th className="px-4 py-3 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => {
              const status = row.statut || "disponible";
              return (
                <tr
                  key={row._id}
                  className="border-b border-gray-100 hover:bg-gray-50/80"
                >
                  <td className="px-4 py-3 font-medium">{row.immatriculation}</td>
                  <td className="px-4 py-3">{row.model || "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onToggleStatut(row)}
                      title="Cliquer pour changer de statut"
                      className={`relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer select-none ${statusStyles(status)}`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current" />
                      {statusLabel(status)}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onView?.(row)}
                        className="p-2 text-indigo-600 hover:bg-indigo-100 rounded transition-colors"
                        title="Voir"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(row)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                        title="Modifier"
                      >
                        <Edit2 size={18} />
                      </button>
                      
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/50">
        <p className="text-xs text-gray-500">
          {totalCount} bus — page {page} / {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-100"
          >
            Précédent
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-100"
          >
            Suivant
          </button>
        </div>
      </div>
    </>
  );
}
