import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatDateKey } from '../../utils/timeUtils.js';

/**
 * Mobile vertical layout for planning
 * Routes as expandable cards with time slot buttons
 */
export function RouteList({
  lignes,
  heures,
  selectedDate,
  assignments,
  dragging,
  selectedTimeRange,
  onSelectTimeRange,
  onEmployeeDrop,
  onBusDrop,
  onDragOver,
  onRemove,
  getSlotAssignments
}) {
  const [expandedRoutes, setExpandedRoutes] = useState(new Set());
  const dateKey = formatDateKey(selectedDate);

  const toggleRoute = (routeId) => {
    setExpandedRoutes(prev => {
      const next = new Set(prev);
      if (next.has(routeId)) {
        next.delete(routeId);
      } else {
        next.add(routeId);
      }
      return next;
    });
  };

  const expandAll = () => setExpandedRoutes(new Set(lignes.map(l => l._id)));
  const collapseAll = () => setExpandedRoutes(new Set());

  if (lignes.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <p className="text-gray-500">Aucune ligne disponible. Ajoutez des lignes pour commencer.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Expand/Collapse buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={expandAll}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
        >
          Tout développer
        </button>
        <button
          onClick={collapseAll}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
        >
          Tout réduire
        </button>
      </div>

      {lignes.map((ligne) => {
        const isExpanded = expandedRoutes.has(ligne._id);

        return (
          <div
            key={ligne._id}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            {/* Route header */}
            <button
              onClick={() => toggleRoute(ligne._id)}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="text-left">
                <div className="font-semibold text-gray-800">{ligne.code}</div>
                <div className="text-sm text-gray-500">{ligne.nom}</div>
              </div>
              {isExpanded ? (
                <ChevronUp size={20} className="text-gray-500" />
              ) : (
                <ChevronDown size={20} className="text-gray-500" />
              )}
            </button>

            {/* Time slots */}
            {isExpanded && (
              <div className="divide-y divide-gray-100">
                {heures.map((heure) => {
                  const slotAssignments = getSlotAssignments(selectedDate, heure, ligne);
                  const isSelected = selectedTimeRange === heure;

                  return (
                    <div
                      key={heure}
                      onDragOver={onDragOver}
                      onDrop={(e) => {
                        if (dragging?.type === 'bus') {
                          onBusDrop(e, heure, ligne, selectedDate);
                        } else {
                          onEmployeeDrop(e, heure, ligne, selectedDate);
                        }
                      }}
                      className={`p-3 transition-colors ${
                        dragging
                          ? 'bg-blue-50'
                          : isSelected
                          ? 'bg-blue-50'
                          : ''
                      }`}
                    >
                      {/* Time slot header */}
                      <div className="flex items-center justify-between mb-2">
                        <button
                          onClick={() => onSelectTimeRange(heure)}
                          className={`font-semibold text-sm ${
                            isSelected ? 'text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          {heure}
                        </button>
                        {slotAssignments.length === 0 && (
                          <span className="text-xs text-gray-400">Vide</span>
                        )}
                      </div>

                      {/* Assignments */}
                      {slotAssignments.length > 0 && (
                        <div className="space-y-1.5">
                          {slotAssignments.map(({ key, value: assignment }) => (
                            <div
                              key={key}
                              className={`rounded-lg p-2 text-sm flex items-center justify-between gap-2 ${
                                assignment.type === 'bus'
                                  ? 'bg-indigo-100 text-indigo-900'
                                  : assignment.type === 'driver'
                                  ? 'bg-green-100 text-green-900'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              <span className="truncate">
                                {assignment.type === 'bus'
                                  ? assignment.matricule || assignment.immatriculation
                                  : `${assignment.nom} ${assignment.prenom}`}
                              </span>
                              <button
                                onClick={() => onRemove(key)}
                                className="text-gray-500 hover:text-gray-700 flex-shrink-0"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tap hint */}
                      {slotAssignments.length === 0 && !dragging && (
                        <div className="text-xs text-gray-400 mt-1">
                          Cliquez pour sélectionner ce créneau
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
