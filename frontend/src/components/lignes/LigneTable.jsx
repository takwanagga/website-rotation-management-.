import { useMemo } from "react";
import { Edit2, Trash2 } from "lucide-react";

export default function LigneTable({
  rows,
  loading,
  page,
  perPage,
  totalCount,
  onPageChange,
  onEdit,
  onDelete,
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
        Aucune ligne trouvée.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold">
              <th className="px-4 py-3 whitespace-nowrap">Code</th>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Départ</th>
              <th className="px-4 py-3">Arrivée</th>
              <th className="px-4 py-3 hidden md:table-cell">Distance (km)</th>
              <th className="px-4 py-3 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr
                key={row._id}
                className="border-b border-gray-100 hover:bg-gray-50/80"
              >
                <td className="px-4 py-3 font-medium">{row.code}</td>
                <td className="px-4 py-3">{row.nom}</td>
                <td className="px-4 py-3">{row.depart}</td>
                <td className="px-4 py-3">{row.arrivee}</td>
                <td className="px-4 py-3 hidden md:table-cell">{row.distance ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(row)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      title="Modifier"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(row._id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/50">
        <p className="text-xs text-gray-500">
          {totalCount} ligne(s) — page {page} / {totalPages}
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
