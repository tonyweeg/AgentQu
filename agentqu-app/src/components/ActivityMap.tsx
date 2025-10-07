import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Activity, Location } from '../lib/types';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface ActivityMapProps {
  activities: Activity[];
  userLocation: Location | null;
}

// Component to update map center when location changes
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}

const ActivityMap: React.FC<ActivityMapProps> = ({ activities, userLocation }) => {
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
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <MapUpdater center={center} />

        {/* Map tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location marker */}
        <Marker position={center}>
          <Popup>
            <div className="text-center">
              <p className="font-bold">You are here</p>
            </div>
          </Popup>
        </Marker>

        {/* Activity markers */}
        {activities.map((activity) => {
          const lat = activity.location?.lat || activity.lat;
          const lng = activity.location?.lng || activity.lng;

          if (!lat || !lng) return null;

          return (
            <Marker key={activity.id || activity.activityId} position={[lat, lng]}>
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
                    <p className="text-xs text-gray-500 mt-1">
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
