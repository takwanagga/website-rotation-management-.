import { formatDateKey, parseTimeRange } from '../../utils/timeUtils.js';

/**
 * Desktop grid layout for planning
 * Time slots as rows, routes as columns
 */
export function TimeSlotGrid({
  lignes,
  heures,
  selectedDate,
  assignments,
  conflicts,
  dragging,
  selectedTimeRange,
  onSelectTimeRange,
  onDragStart,
  onEmployeeDrop,
  onBusDrop,
  onDragOver,
  onRemove,
  getSlotAssignments
}) {
  const dateKey = formatDateKey(selectedDate);

  const hasConflict = (timeRange, ligneId) => {
    return conflicts.some(c => 
      c.timeRange1 === timeRange || c.timeRange2 === timeRange
    );
  };

  return (
    <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-x-auto shadow-sm">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-800">
          Planning du {selectedDate.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })}
        </h3>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-3 md:px-4 py-3 text-left text-xs font-bold text-gray-500 tracking-wide w-24 md:w-32">
              HEURE
            </th>
            {lignes.length === 0 ? (
              <th className="px-2 md:px-3 py-3 text-left text-xs font-bold text-gray-500">
                Aucune ligne disponible
              </th>
            ) : (
              lignes.map((l) => (
                <th
                  key={l._id}
                  className="px-2 md:px-3 py-3 text-left text-xs font-bold text-gray-500 tracking-wide border-l border-gray-200 min-w-32"
                >
                  {l.code}
                  <div className="text-xs font-normal text-gray-400">{l.nom}</div>
                </th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          {heures.map((heure) => (
            <tr key={heure} className="border-b border-gray-200">
              <td
                className={`px-3 md:px-4 py-3 font-semibold text-sm align-top cursor-pointer transition-colors ${
                  selectedTimeRange === heure
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => onSelectTimeRange(heure)}
                title="Cliquer pour sélectionner ce créneau"
              >
                {heure}
              </td>
              {lignes.length === 0 ? (
                <td className="px-2 md:px-3 py-3 text-gray-400 text-sm">
                  Ajoutez des lignes pour commencer
                </td>
              ) : (
                lignes.map((ligne) => {
                  const slotAssignments = getSlotAssignments(selectedDate, heure, ligne);
                  const slotHasConflict = hasConflict(heure, ligne._id);
                  const isSelected = selectedTimeRange === heure;

                  return (
                    <td
                      key={ligne._id}
                      onDragOver={onDragOver}
                      onDrop={(e) => {
                        if (dragging?.type === 'bus') {
                          onBusDrop(e, heure, ligne, selectedDate);
                        } else {
                          onEmployeeDrop(e, heure, ligne, selectedDate);
                        }
                      }}
                      onClick={() => onSelectTimeRange(heure)}
                      className={`px-2 md:px-3 py-2 border-l border-gray-200 min-h-24 align-top transition-colors cursor-pointer ${
                        dragging
                          ? 'bg-blue-50'
                          : slotHasConflict
                          ? 'bg-red-50'
                          : isSelected
                          ? 'bg-blue-50'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      {slotAssignments.length === 0 ? (
                        <div className="text-xs text-gray-400 font-medium text-center pt-8">
                          {isSelected ? 'Sélectionné' : 'VIDE'}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {slotAssignments.map(({ key, value: assignment }) => (
                            <div
                              key={key}
                              className={`rounded-lg p-2 text-xs font-semibold flex items-center justify-between gap-1 ${
                                assignment.type === 'bus'
                                  ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                                  : assignment.type === 'driver'
                                  ? 'bg-green-100 text-green-900 border border-green-200'
                                  : assignment.type === 'receveur'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : 'bg-blue-100 text-blue-900 border border-blue-200'
                              }`}
                            >
                              <span className="truncate">
                                {assignment.type === 'bus'
                                  ? assignment.matricule || assignment.immatriculation
                                  : `${assignment.nom} ${assignment.prenom}`}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemove(key);
                                }}
                                className="opacity-60 hover:opacity-100 flex-shrink-0 font-bold"
                                title="Supprimer"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
