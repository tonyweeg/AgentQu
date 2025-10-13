import { useState, useCallback, useEffect } from 'react';
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

// Check if geolocation permission is already granted
const checkPermissionStatus = async (): Promise<'granted' | 'denied' | 'prompt'> => {
  // Safari doesn't fully support Permissions API for geolocation yet
  // So we'll try it, but have a fallback
  try {
    if ('permissions' in navigator && 'query' in navigator.permissions) {
      const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      console.log('🔍 LOCATION: Permission status:', result.state);
      return result.state as 'granted' | 'denied' | 'prompt';
    }
  } catch (error) {
    console.log('🔍 LOCATION: Permissions API not available or error:', error);
  }

  // Fallback: assume 'prompt' if we can't check
  return 'prompt';
};

export function useLocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [permissionChecked, setPermissionChecked] = useState(false);

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

  // Check permission on mount and auto-request if already granted
  useEffect(() => {
    if (permissionChecked) return; // Only check once

    const checkAndAutoRequest = async () => {
      console.log('🔍 LOCATION: Checking permission status on mount...');

      // Try to get cached location from localStorage first
      try {
        const cached = localStorage.getItem('agentqu_last_location');
        if (cached) {
          const cachedLocation = JSON.parse(cached);
          const cacheAge = Date.now() - cachedLocation.timestamp;

          // Use cached location if less than 5 minutes old
          if (cacheAge < 5 * 60 * 1000) {
            console.log('✅ LOCATION: Using cached location', cachedLocation);
            setLocation({
              lat: cachedLocation.lat,
              lng: cachedLocation.lng,
              accuracy: cachedLocation.accuracy,
            });
          }
        }
      } catch (error) {
        console.log('📍 LOCATION: No valid cached location');
      }

      const status = await checkPermissionStatus();
      setPermissionChecked(true);

      // If permission already granted, auto-request location
      // This prevents Safari from showing "One More Step" screen every time
      if (status === 'granted') {
        console.log('✅ LOCATION: Permission already granted, auto-requesting...');
        requestLocation();
      } else {
        console.log('⏸️ LOCATION: Permission not granted, waiting for user action');
      }
    };

    checkAndAutoRequest();
  }, [permissionChecked, requestLocation]);

  // Save location to localStorage whenever it changes
  useEffect(() => {
    if (location) {
      try {
        localStorage.setItem('agentqu_last_location', JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy,
          timestamp: Date.now(),
        }));
        console.log('💾 LOCATION: Saved to localStorage');
      } catch (error) {
        console.log('⚠️ LOCATION: Failed to save to localStorage', error);
      }
    }
  }, [location]);

  return {
    location,
    loading,
    error,
    requestLocation,
    permissionChecked,
  };
}
