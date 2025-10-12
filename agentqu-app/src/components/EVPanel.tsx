import React, { useState } from 'react';

interface ChargingStation {
  id: string;
  name: string;
  address: string;
  distance: number;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
  openNow?: boolean;
}

interface EVPanelProps {
  stations: ChargingStation[];
  userLocation?: { lat: number; lng: number } | null;
}

const EVPanel: React.FC<EVPanelProps> = ({ stations, userLocation }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!stations || stations.length === 0) {
    return null; // Don't show panel if no stations
  }

  return (
    <div
      className={`fixed right-0 top-20 bottom-0 bg-gradient-to-b from-green-50 to-emerald-100 border-l-4 border-green-500 shadow-2xl transition-all duration-300 overflow-hidden z-40 ${
        isExpanded ? 'w-80' : 'w-16'
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute top-4 left-0 w-16 h-16 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-l-xl shadow-lg transition-colors"
        title={isExpanded ? 'Collapse EV Panel' : 'Expand EV Panel'}
      >
        {isExpanded ? (
          <span className="text-2xl">→</span>
        ) : (
          <span className="text-3xl">⚡</span>
        )}
      </button>

      {/* Panel Content */}
      {isExpanded && (
        <div className="mt-24 px-4 pb-4 h-full overflow-y-auto">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">⚡</span>
              <h3 className="text-xl font-bold text-green-900">Charging Stations</h3>
            </div>
            <p className="text-sm text-green-700">
              {stations.length} station{stations.length !== 1 ? 's' : ''} nearby
            </p>
          </div>

          {/* Station List */}
          <div className="space-y-3">
            {stations
              .sort((a, b) => (a.distance || 0) - (b.distance || 0))
              .map((station) => (
                <div
                  key={station.id}
                  className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow border border-green-200"
                >
                  {/* Station Name */}
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-navy-text text-sm line-clamp-2 flex-1">
                      {station.name}
                    </h4>
                    <span className="text-xs text-green-600 font-bold whitespace-nowrap ml-2">
                      {station.distance?.toFixed(1)} mi
                    </span>
                  </div>

                  {/* Address */}
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {station.address}
                  </p>

                  {/* Rating & Status */}
                  <div className="flex items-center gap-2 text-xs">
                    {station.rating && (
                      <span className="flex items-center gap-1 text-yellow-600 font-medium">
                        ⭐ {station.rating.toFixed(1)}
                      </span>
                    )}
                    {station.openNow !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold ${
                          station.openNow
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {station.openNow ? 'Open' : 'Closed'}
                      </span>
                    )}
                  </div>

                  {/* Directions Link */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${station.location.lat},${station.location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block w-full text-center bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                  >
                    Get Directions →
                  </a>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Collapsed View - Vertical Text */}
      {!isExpanded && (
        <div className="absolute top-24 left-4 transform -rotate-90 origin-left whitespace-nowrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-green-700">
              {stations.length} Chargers
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EVPanel;
