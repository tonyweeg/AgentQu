import { useState, useCallback } from 'react';
import { Location } from '../lib/types';

export function useLocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GeolocationPositionError | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: 2,
        message: 'Geolocation not supported',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
      {
        enableHighAccuracy: false, // Faster, uses WiFi/IP
        timeout: 5000,
        maximumAge: 60000, // Cache for 1 minute
      }
    );
  }, []);

  return {
    location,
    loading,
    error,
    requestLocation,
  };
}
