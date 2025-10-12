import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Activity, Location } from '../lib/types';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom Q pushpin icon (black and white with [Q])
const createQIcon = () => {
  const svgIcon = `
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
      <!-- Pushpin shape -->
      <path d="M16 0C9.373 0 4 5.373 4 12c0 8.5 12 26 12 26s12-17.5 12-26c0-6.627-5.373-12-12-12z"
            fill="white"
            stroke="black"
            stroke-width="2"/>
      <!-- Q letter -->
      <text x="16" y="16"
            font-family="Arial, sans-serif"
            font-size="14"
            font-weight="bold"
            fill="black"
            text-anchor="middle"
            dominant-baseline="middle">Q</text>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-q-icon',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });
};

const qIcon = createQIcon();

// User location icon (blue dot)
const userIcon = L.divIcon({
  html: '<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.3);"></div>',
  className: 'user-location-icon',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// EV Charging icon (green charging bolt)
const createEVIcon = () => {
  const svgIcon = `
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
      <!-- Pushpin shape -->
      <path d="M16 0C9.373 0 4 5.373 4 12c0 8.5 12 26 12 26s12-17.5 12-26c0-6.627-5.373-12-12-12z"
            fill="#10b981"
            stroke="black"
            stroke-width="2"/>
      <!-- Charging bolt -->
      <text x="16" y="16"
            font-size="16"
            fill="white"
            text-anchor="middle"
            dominant-baseline="middle">⚡</text>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-ev-icon',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });
};

// EV Charging icon with Q score badge (for top 3)
const createEVQIcon = (qScore: number) => {
  const svgIcon = `
    <svg width="48" height="52" viewBox="0 0 48 52" xmlns="http://www.w3.org/2000/svg">
      <!-- Pushpin shape -->
      <path d="M24 0C17.373 0 12 5.373 12 12c0 8.5 12 26 12 26s12-17.5 12-26c0-6.627-5.373-12-12-12z"
            fill="#10b981"
            stroke="black"
            stroke-width="2"/>
      <!-- Charging bolt -->
      <text x="24" y="16"
            font-size="16"
            fill="white"
            font-weight="bold"
            text-anchor="middle"
            dominant-baseline="middle">⚡</text>
      <!-- Q Score Badge -->
      <rect x="28" y="-4" width="20" height="16" rx="8" fill="#f59e0b" stroke="black" stroke-width="1.5"/>
      <text x="38" y="4"
            font-family="Arial, sans-serif"
            font-size="10"
            font-weight="bold"
            fill="white"
            text-anchor="middle"
            dominant-baseline="middle">Q${qScore}</text>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-ev-q-icon',
    iconSize: [48, 52],
    iconAnchor: [24, 42],
    popupAnchor: [0, -42],
  });
};

const evIcon = createEVIcon();

interface ActivityMapProps {
  activities: Activity[];
  userLocation: Location | null;
  onLocationChange?: (lat: number, lng: number) => void;
  compact?: boolean;
  evMode?: boolean;
  evStations?: any[];
  top3EVStations?: any[];
}

// Component to handle map drag events with manual search button
function MapDragHandler({ onLocationChange }: { onLocationChange?: (lat: number, lng: number) => void }) {
  const [pendingCenter, setPendingCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const map = useMap();

  console.log('🗺️ MAP_DEBUG: MapDragHandler mounted, onLocationChange callback:', !!onLocationChange);

  useMapEvents({
    dragstart: () => {
      console.log('🗺️ MAP_DEBUG: Drag STARTED');
      setIsDragging(true);
    },
    dragend: (e) => {
      console.log('🗺️ MAP_DEBUG: Drag ENDED');
      setIsDragging(false);
      const center = e.target.getCenter();
      console.log('🗺️ MAP_DEBUG: New center:', center.lat, center.lng);

      setPendingCenter({ lat: center.lat, lng: center.lng });
    },
  });

  const handleSearchClick = () => {
    console.log('🗺️ MAP_DEBUG: Search button clicked');
    const center = map.getCenter();
    const currentCenter = pendingCenter || { lat: center.lat, lng: center.lng };

    if (onLocationChange) {
      console.log('🗺️ MAP_DEBUG: Calling onLocationChange callback with:', currentCenter);
      onLocationChange(currentCenter.lat, currentCenter.lng);
      setPendingCenter(null);
    }
  };

  return (
    <>
      {/* Center crosshair - shows when dragging */}
      {isDragging && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 999,
            pointerEvents: 'none',
          }}
        >
          {/* Circular target zone */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              border: '2px dashed #30B1BB',
              background: 'rgba(48, 177, 187, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {/* [Q] marker in center */}
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'white',
                border: '3px solid #003D5B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#003D5B',
                fontFamily: 'Arial, sans-serif',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              Q
            </div>
          </div>
        </div>
      )}

      {/* Search button */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
        }}
      >
        <button
          onClick={handleSearchClick}
          style={{
            background: 'white',
            color: '#003D5B',
            padding: '8px 12px',
            borderRadius: '4px',
            border: '2px solid rgba(0,0,0,0.2)',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'Arial, sans-serif',
            whiteSpace: 'nowrap',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#30B1BB';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.color = '#003D5B';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Search this area"
        >
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Q</span>
          <span>AgentQu Search</span>
        </button>
      </div>
    </>
  );
}

// Component to update map center when location changes
function MapUpdater({ center, compact }: { center: [number, number], compact: boolean }) {
  const map = useMap();

  useEffect(() => {
    // Force map to recalculate size
    setTimeout(() => {
      map.invalidateSize();
      // Only use setView in compact mode - in full mode, AutoZoomToMarkers handles it
      if (compact) {
        map.setView(center, 12);
      }
    }, 100);
  }, [center, map, compact]);

  return null;
}

// Component to auto-zoom to fit all activity markers or EV stations
function AutoZoomToMarkers({ items, userLocation, evMode }: { items: any[], userLocation: Location, evMode: boolean }) {
  const map = useMap();
  const [hasZoomed, setHasZoomed] = useState(false);
  const [lastMode, setLastMode] = useState(evMode);
  const [userInteracted, setUserInteracted] = useState(false);

  // Listen for user zoom/pan interactions
  useEffect(() => {
    const handleUserInteraction = () => {
      console.log('🗺️ MAP_DEBUG: User manually interacted with map, disabling auto-zoom');
      setUserInteracted(true);
    };

    map.on('zoomend', handleUserInteraction);
    map.on('moveend', handleUserInteraction);

    return () => {
      map.off('zoomend', handleUserInteraction);
      map.off('moveend', handleUserInteraction);
    };
  }, [map]);

  useEffect(() => {
    // Reset when mode changes
    if (lastMode !== evMode) {
      setHasZoomed(false);
      setUserInteracted(false);
      setLastMode(evMode);
      return;
    }

    // Don't auto-zoom if user has manually interacted or already zoomed
    if (hasZoomed || userInteracted || !items || items.length === 0) {
      return;
    }

    // Get all valid coordinates (works for activities or EV stations)
    const itemCoords = items
      .map(item => {
        const lat = item.location?.lat || item.lat;
        const lng = item.location?.lng || item.lng;
        return lat && lng ? [lat, lng] as [number, number] : null;
      })
      .filter((coord): coord is [number, number] => coord !== null);

    if (itemCoords.length === 0) {
      return;
    }

    // Include user location in bounds
    const allCoords = [[userLocation.lat, userLocation.lng], ...itemCoords];

    // Calculate bounds
    const bounds = allCoords.reduce(
      (acc, [lat, lng]) => {
        return [
          [Math.min(acc[0][0], lat), Math.min(acc[0][1], lng)],
          [Math.max(acc[1][0], lat), Math.max(acc[1][1], lng)]
        ];
      },
      [[allCoords[0][0], allCoords[0][1]], [allCoords[0][0], allCoords[0][1]]]
    ) as [[number, number], [number, number]];

    // Fit bounds with padding
    setTimeout(() => {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      setHasZoomed(true);
    }, 200);
  }, [items, userLocation, map, hasZoomed, evMode, lastMode, userInteracted]);

  return null;
}

const ActivityMap: React.FC<ActivityMapProps> = ({
  activities,
  userLocation,
  onLocationChange,
  compact = false,
  evMode = false,
  evStations = [],
  top3EVStations = []
}) => {
  console.log('🗺️ MAP_DEBUG: ActivityMap rendering');
  console.log('🗺️ MAP_DEBUG: EV mode:', evMode);
  console.log('🗺️ MAP_DEBUG: Activities:', activities.length);
  console.log('🗺️ MAP_DEBUG: EV stations:', evStations.length);
  console.log('🗺️ MAP_DEBUG: Top 3 EV stations:', top3EVStations.length);
  console.log('🗺️ MAP_DEBUG: onLocationChange callback provided:', !!onLocationChange);
  console.log('🗺️ MAP_DEBUG: Compact mode:', compact);

  if (!userLocation) {
    return (
      <div className={`${compact ? 'h-full' : 'h-[500px]'} bg-gray-100 rounded-2xl flex items-center justify-center`}>
        <p className="text-gray-600">Location required to show map</p>
      </div>
    );
  }

  const center: [number, number] = [userLocation.lat, userLocation.lng];
  console.log('🗺️ MAP_DEBUG: Map center:', center);

  return (
    <div className={`${compact ? 'h-full' : 'h-[500px]'} rounded-2xl overflow-hidden shadow-md`}>
      <MapContainer
        center={center}
        zoom={compact ? 12 : 14}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
        dragging={!compact}
        zoomControl={!compact}
        scrollWheelZoom={!compact}
        doubleClickZoom={!compact}
        touchZoom={!compact}
      >
        <MapUpdater center={center} compact={compact} />
        {!compact && <AutoZoomToMarkers items={evMode ? evStations : activities} userLocation={userLocation} evMode={evMode} />}
        {!compact && <MapDragHandler onLocationChange={onLocationChange} />}

        {/* Map tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location marker */}
        <Marker position={center} icon={userIcon}>
          {!compact && (
            <Popup>
              <div className="text-center">
                <p className="font-bold">You are here</p>
              </div>
            </Popup>
          )}
        </Marker>

        {/* Activity markers with custom Q icon - only show in full mode and NOT in EV mode */}
        {!compact && !evMode && activities.map((activity, index) => {
          const lat = activity.location?.lat || activity.lat;
          const lng = activity.location?.lng || activity.lng;

          console.log(`🗺️ MAP_DEBUG: Activity ${index} - ${activity.name}:`, { lat, lng, hasLocation: !!(lat && lng) });

          if (!lat || !lng) {
            console.log(`🗺️ MAP_DEBUG: Skipping activity ${index} - no coordinates`);
            return null;
          }

          // Google Maps link
          const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

          return (
            <Marker key={activity.id || activity.activityId} position={[lat, lng]} icon={qIcon}>
              <Popup>
                <div style={{ minWidth: '250px', padding: '8px' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginBottom: '12px',
                    color: '#1f2937',
                    lineHeight: '1.3'
                  }}>
                    {activity.name}
                  </h3>

                  {activity.distance && (
                    <p style={{
                      fontSize: '14px',
                      color: '#4b5563',
                      marginBottom: '8px',
                      fontWeight: '500'
                    }}>
                      📍 {activity.distance.toFixed(1)} miles away
                    </p>
                  )}

                  {activity.score && (
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#f97316',
                      marginBottom: '8px'
                    }}>
                      Match Score: {activity.score}
                    </p>
                  )}

                  {activity.primaryCategory && (
                    <p style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      marginBottom: '16px',
                      textTransform: 'capitalize',
                      fontWeight: '500'
                    }}>
                      {activity.primaryCategory.replace(/_/g, ' ')}
                    </p>
                  )}

                  {/* Google Maps Link */}
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      padding: '12px 20px',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      fontSize: '15px',
                      fontWeight: '700',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                      transition: 'all 0.2s',
                      width: '100%',
                      justifyContent: 'center',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>🗺️</span>
                    <span>Open in Google Maps</span>
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* EV Charging Station markers - only show top 3 in EV mode */}
        {!compact && evMode && top3EVStations.map((station, index) => {
          const lat = station.location?.lat;
          const lng = station.location?.lng;

          console.log(`⚡ EV_MAP_DEBUG: Station ${index} - ${station.name}:`, { lat, lng, qScore: station.qScore });

          if (!lat || !lng) {
            console.log(`⚡ EV_MAP_DEBUG: Skipping station ${index} - no coordinates`);
            return null;
          }

          // Check if this station is in the top 3
          const isTop3 = top3EVStations.some(top => top.id === station.id);
          const stationIcon = isTop3 ? createEVQIcon(station.qScore) : evIcon;

          // Google Maps link
          const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

          return (
            <Marker key={station.id} position={[lat, lng]} icon={stationIcon}>
              <Popup>
                <div style={{ minWidth: '180px', padding: '6px' }}>
                  <h3 style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    marginBottom: '6px',
                    color: '#1f2937',
                    lineHeight: '1.2'
                  }}>
                    {station.name}
                  </h3>

                  {station.distance && (
                    <p style={{
                      fontSize: '11px',
                      color: '#4b5563',
                      marginBottom: '4px',
                      fontWeight: '500'
                    }}>
                      📍 {station.distance.toFixed(1)} mi
                    </p>
                  )}

                  {station.qScore && (
                    <p style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#10b981',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}>
                      <span>⚡</span>
                      <span>Q{station.qScore}</span>
                    </p>
                  )}

                  {station.isPriority && (
                    <p style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      color: '#f59e0b',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px'
                    }}>
                      {station.isTesla ? '⚡ Tesla' : station.isWawa ? '⚡ Wawa' : '⚡ Fast'}
                    </p>
                  )}

                  {/* Google Maps Directions Link */}
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontSize: '11px',
                      fontWeight: '700',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                      transition: 'all 0.2s',
                      width: '100%',
                      justifyContent: 'center',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 10px rgba(16, 185, 129, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(16, 185, 129, 0.3)';
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>🗺️</span>
                    <span>Directions</span>
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default ActivityMap;
