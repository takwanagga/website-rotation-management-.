import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

/**
 * Panel showing available resources for the selected time slot
 * With visual indicators for availability status
 */
export function ResourcePanel({
  buses,
  chauffeurs,
  receveurs,
  selectedTimeRange,
  dragging,
  onDragStart,
  onSelectTimeRange
}) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'border-green-300 bg-green-50';
      case 'warning':
        return 'border-yellow-300 bg-yellow-50';
      case 'busy':
      case 'limit':
        return 'border-gray-300 bg-gray-100 opacity-60';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return <CheckCircle size={14} className="text-green-600" />;
      case 'warning':
        return <Clock size={14} className="text-yellow-600" />;
      case 'busy':
      case 'limit':
        return <AlertCircle size={14} className="text-gray-400" />;
      default:
        return null;
    }
  };

  const renderResourceItem = (item, type) => {
    const availability = item.availability || { available: true, status: 'unknown' };
    const isDraggable = availability.available;

    return (
      <div
        key={item._id}
        draggable={isDraggable}
        onDragStart={(e) => isDraggable && onDragStart(e, { type, ...item })}
        className={`flex items-center gap-3 p-2.5 rounded-lg border mb-2 transition ${
          isDraggable
            ? `cursor-grab hover:shadow-sm ${getStatusColor(availability.status)}`
            : 'cursor-not-allowed bg-gray-100 border-gray-200 opacity-60'
        }`}
        title={availability.reason || (isDraggable ? 'Disponible' : 'Indisponible')}
      >
        {/* Icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          type === 'bus'
            ? 'bg-indigo-100 text-indigo-600'
            : type === 'driver'
            ? 'bg-green-100 text-green-600'
            : 'bg-amber-100 text-amber-600'
        }`}>
          {type === 'bus' ? '🚌' : '👤'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">
            {type === 'bus' ? item.matricule || item.immatriculation : `${item.nom} ${item.prenom}`}
          </div>
          <div className="text-xs text-gray-500">
            {type === 'bus' ? item.type : type === 'driver' ? 'Chauffeur' : 'Receveur'}
          </div>
        </div>

        {/* Status */}
        <div className="flex-shrink-0">
          {getStatusIcon(availability.status)}
        </div>

        {/* Hours indicator for employees */}
        {type !== 'bus' && availability.hoursUsed !== undefined && (
          <div className="text-xs text-gray-500 flex-shrink-0">
            {availability.hoursUsed.toFixed(1)}h
          </div>
        )}
      </div>
    );
  };

  const availableBusCount = buses.filter(b => b.availability?.available).length;
  const availableChauffeurCount = chauffeurs.filter(c => c.availability?.available).length;
  const availableReceveurCount = receveurs.filter(r => r.availability?.available).length;

  return (
    <div className="w-full lg:w-72 flex-shrink-0 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Ressources disponibles</h3>
        {selectedTimeRange ? (
          <p className="text-sm text-blue-600 mt-1">
            Créneau: {selectedTimeRange}
          </p>
        ) : (
          <p className="text-sm text-gray-500 mt-1">
            Cliquez sur un créneau pour voir les disponibilités
          </p>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
          <span className="text-gray-600">Disponible</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></div>
          <span className="text-gray-600">Limite proche</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300 opacity-60"></div>
          <span className="text-gray-600">Indisponible</span>
        </div>
      </div>

      {/* Buses */}
      <div className="mb-6">
        <div className="text-xs font-bold text-gray-500 tracking-widest mb-3 flex items-center justify-between">
          <span>BUS</span>
          <span className="text-gray-400 font-normal">
            {availableBusCount}/{buses.length}
          </span>
        </div>
        {buses.length === 0 ? (
          <div className="text-xs text-gray-400">Aucun bus actif</div>
        ) : (
          buses.map(b => renderResourceItem(b, 'bus'))
        )}
      </div>

      {/* Chauffeurs */}
      <div className="mb-6">
        <div className="text-xs font-bold text-gray-500 tracking-widest mb-3 flex items-center justify-between">
          <span>CHAUFFEURS</span>
          <span className="text-gray-400 font-normal">
            {availableChauffeurCount}/{chauffeurs.length}
          </span>
        </div>
        {chauffeurs.length === 0 ? (
          <div className="text-xs text-gray-400">Aucun chauffeur actif</div>
        ) : (
          chauffeurs.map(c => renderResourceItem(c, 'driver'))
        )}
      </div>

      {/* Receveurs */}
      <div>
        <div className="text-xs font-bold text-gray-500 tracking-widest mb-3 flex items-center justify-between">
          <span>RECEVEURS</span>
          <span className="text-gray-400 font-normal">
            {availableReceveurCount}/{receveurs.length}
          </span>
        </div>
        {receveurs.length === 0 ? (
          <div className="text-xs text-gray-400">Aucun receveur actif</div>
        ) : (
          receveurs.map(r => renderResourceItem(r, 'receveur'))
        )}
      </div>

      {/* Quick select time slots */}
      {selectedTimeRange && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-xs font-bold text-gray-500 tracking-widest mb-3">
            CRÉNEAUX RAPIDES
          </div>
          <div className="grid grid-cols-2 gap-2">
            {['05:00-07:00', '07:00-09:00', '09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00', '19:00-21:00'].map(heure => (
              <button
                key={heure}
                onClick={() => onSelectTimeRange(heure)}
                className={`px-2 py-1.5 text-xs rounded border transition ${
                  selectedTimeRange === heure
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {heure}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
