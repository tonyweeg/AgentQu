import { useState, useCallback } from 'react';
import { Location } from '../lib/types';

// Detect if running on Safari
const isSafari = () => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.indexOf('safari') > -1 && ua.indexOf('chrome') === -1;
};

// Detect if running on mobile
const isMobile = () => {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

export function useLocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const requestLocation = useCallback((isRetry: boolean = false) => {
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

    console.log('🔍 LOCATION: Requesting location...', {
      isRetry,
      retryCount,
      isSafari: isSafari(),
      isMobile: isMobile()
    });

    setLoading(true);
    setError(null);

    // Safari mobile needs different settings
    const safariMobile = isSafari() && isMobile();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ LOCATION: Got location successfully', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });

        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLoading(false);
        setRetryCount(0); // Reset retry count on success
      },
      (err) => {
        console.error('❌ LOCATION: Error getting location', {
          code: err.code,
          message: err.message,
          retryCount,
          isSafari: isSafari(),
          isMobile: isMobile()
        });

        // Auto-retry once for timeout errors (common on Safari)
        if (err.code === 3 && retryCount === 0) {
          console.log('🔄 LOCATION: Timeout detected, retrying...');
          setRetryCount(1);
          // Retry after 1 second
          setTimeout(() => {
            requestLocation(true);
          }, 1000);
          return;
        }

        setError(err);
        setLoading(false);
      },
      {
        // Safari mobile works better with high accuracy enabled
        enableHighAccuracy: safariMobile ? true : false,
        // Safari needs more time, especially on first request
        timeout: safariMobile ? 15000 : 10000,
        // Allow cached location for up to 1 minute
        maximumAge: 60000,
      }
    );
  }, [retryCount]);

  return {
    location,
    loading,
    error,
    requestLocation,
  };
}
