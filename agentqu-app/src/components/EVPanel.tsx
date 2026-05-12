import React from 'react';

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
  onViewAllMap?: () => void;
}

const EVPanel: React.FC<EVPanelProps> = ({ stations, userLocation, onViewAllMap }) => {
  if (!stations || stations.length === 0) {
    return null;
  }

  // Extract charger type and landmark from station name
  const parseStation = (station: ChargingStation) => {
    const name = station.name;
    const address = station.address;

    // Check for priority stations
    const isWawa = name.toLowerCase().includes('wawa');
    const isTesla = name.toLowerCase().includes('tesla');
    const is250kw = name.toLowerCase().includes('250') || name.toLowerCase().includes('350');

    // Extract type (Supercharger, DC Fast, Level 2, etc.)
    let type = 'L2';
    if (name.toLowerCase().includes('supercharger') || name.toLowerCase().includes('dc fast')) {
      type = 'DC Fast';
    }
    if (is250kw) {
      type = '250kW+';
    }
    if (isTesla) {
      type = 'Tesla SC';
    }

    // Extract landmark (first part of address or business name)
    let landmark = name.split('-')[0].trim();
    if (landmark.length > 30) {
      landmark = address.split(',')[0].trim();
    }

    return {
      ...station,
      type,
      landmark,
      isPriority: isWawa || is250kw || isTesla,
      isWawa,
      isTesla
    };
  };

  // Parse and sort: Priority first (Wawa, 250kw, Tesla), then by distance
  const sortedStations = stations
    .map(parseStation)
    .sort((a, b) => {
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return a.distance - b.distance;
    });

  // Show top 10 closest
  const topStations = sortedStations.slice(0, 10);
  const hasMore = sortedStations.length > 10;

  return (
    <div className="w-full bg-white/75 border-b border-gray-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Tufte-style Table */}
        <div className="space-y-1">
          {topStations.map((station, idx) => (
            <a
              key={station.id}
              href={`https://www.google.com/maps/dir/?api=1&destination=${station.location.lat},${station.location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group block hover:bg-black/5 transition-colors py-1.5 px-2 rounded"
            >
              <div className="flex items-center justify-between gap-3">
                {/* Left: Priority badge + Landmark */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* Priority indicator */}
                  {station.isPriority && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      station.isTesla ? 'bg-red-100 text-red-700' :
                      station.isWawa ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {station.isTesla ? 'TESLA' : station.isWawa ? 'WAWA' : '250KW'}
                    </span>
                  )}
                  <span className="text-sm text-gray-900 font-medium truncate">
                    {station.landmark}
                  </span>
                </div>

                {/* Middle: Type */}
                <span className="text-xs text-gray-600 font-mono whitespace-nowrap">
                  {station.type}
                </span>

                {/* Right: Distance + Arrow */}
                <div className="flex items-center gap-1.5 text-xs text-gray-700 font-bold">
                  <span>{station.distance.toFixed(1)} mi</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* View All link */}
        {hasMore && (
          <div className="mt-2 pt-2 border-t border-gray-300">
            <button
              onClick={onViewAllMap}
              className="text-xs text-gray-600 hover:text-ocean-bright font-medium transition-colors"
            >
              + {sortedStations.length - 10} more stations • View All on Map →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EVPanel;
