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

interface ActivityMapProps {
  activities: Activity[];
  userLocation: Location | null;
  onLocationChange?: (lat: number, lng: number) => void;
}

// Component to handle map drag events
function MapDragHandler({ onLocationChange }: { onLocationChange?: (lat: number, lng: number) => void }) {
  const [isDragging, setIsDragging] = useState(false);

  useMapEvents({
    dragstart: () => {
      setIsDragging(true);
    },
    dragend: (e) => {
      setIsDragging(false);
      const center = e.target.getCenter();
      if (onLocationChange) {
        console.log('🗺️ Map dragged to:', center.lat, center.lng);
        onLocationChange(center.lat, center.lng);
      }
    },
  });

  return isDragging ? (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        background: 'rgba(255,255,255,0.95)',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        fontWeight: 'bold',
        color: '#333',
      }}
    >
      🗺️ Release to search here
    </div>
  ) : null;
}

// Component to update map center when location changes
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}

const ActivityMap: React.FC<ActivityMapProps> = ({ activities, userLocation, onLocationChange }) => {
  if (!userLocation) {
    return (
      <div className="h-[500px] bg-gray-100 rounded-2xl flex items-center justify-center">
        <p className="text-gray-600">Location required to show map</p>
      </div>
    );
  }

  const center: [number, number] = [userLocation.lat, userLocation.lng];

  return (
    <div className="h-[500px] rounded-2xl overflow-hidden shadow-md">
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <MapUpdater center={center} />
        <MapDragHandler onLocationChange={onLocationChange} />

        {/* Map tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location marker */}
        <Marker position={center} icon={userIcon}>
          <Popup>
            <div className="text-center">
              <p className="font-bold">You are here</p>
            </div>
          </Popup>
        </Marker>

        {/* Activity markers with custom Q icon */}
        {activities.map((activity) => {
          const lat = activity.location?.lat || activity.lat;
          const lng = activity.location?.lng || activity.lng;

          if (!lat || !lng) return null;

          return (
            <Marker key={activity.id || activity.activityId} position={[lat, lng]} icon={qIcon}>
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-bold text-base mb-1">{activity.name}</h3>
                  {activity.distance && (
                    <p className="text-sm text-gray-600 mb-1">
                      📍 {activity.distance.toFixed(1)} miles away
                    </p>
                  )}
                  {activity.score && (
                    <p className="text-sm font-medium text-peach">
                      Match Score: {activity.score}
                    </p>
                  )}
                  {activity.primaryCategory && (
                    <p className="text-xs text-gray-500 mt-1 capitalize">
                      {activity.primaryCategory}
                    </p>
                  )}
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
