import { useState, useEffect } from 'react';
import { Location } from '../lib/types';

interface ReverseGeocodeResult {
  city: string | null;
  state: string | null;
  fullAddress: string | null;
  loading: boolean;
  error: Error | null;
}

const GEOCODING_API_KEY = 'AIzaSyDKTAxMKuQ4-KsuP7vr7HbvteNTYvDyWjw';

export function useReverseGeocode(location: Location | null): ReverseGeocodeResult {
  const [city, setCity] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [fullAddress, setFullAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!location) {
      setCity(null);
      setState(null);
      setFullAddress(null);
      return;
    }

    const fetchLocation = async () => {
      setLoading(true);
      setError(null);

      try {
        // OPTIMIZATION: Check cache first (saves $0.005 per request!)
        const cacheKey = `agentqu_geocode_${location.lat.toFixed(4)}_${location.lng.toFixed(4)}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
          const cachedData = JSON.parse(cached);
          const cacheAge = Date.now() - cachedData.timestamp;
          const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

          if (cacheAge < CACHE_TTL) {
            console.log(`💾 GEOCODE CACHE HIT: ${cachedData.city}, ${cachedData.state} (age: ${Math.round(cacheAge / 1000 / 60 / 60)}h, saved $0.005)`);
            setCity(cachedData.city);
            setState(cachedData.state);
            setFullAddress(cachedData.fullAddress);
            setLoading(false);
            return;
          } else {
            console.log(`⏰ GEOCODE CACHE EXPIRED: ${Math.round(cacheAge / 1000 / 60 / 60)}h > 24h`);
          }
        }

        // Cache miss - call API
        console.log(`🔍 GEOCODING API: Fetching city name (cost: $0.005)`);
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&key=${GEOCODING_API_KEY}`
        );

        const data = await response.json();

        if (data.status === 'OK' && data.results[0]) {
          const addressComponents = data.results[0].address_components;
          const fullAddr = data.results[0].formatted_address;
          setFullAddress(fullAddr);

          const cityComponent = addressComponents.find((c: any) =>
            c.types.includes('locality')
          );
          const stateComponent = addressComponents.find((c: any) =>
            c.types.includes('administrative_area_level_1')
          );

          const cityName = cityComponent?.long_name || null;
          const stateName = stateComponent?.short_name || null;

          setCity(cityName);
          setState(stateName);

          // Cache for 24 hours
          if (cityName && stateName) {
            localStorage.setItem(cacheKey, JSON.stringify({
              city: cityName,
              state: stateName,
              fullAddress: fullAddr,
              lat: location.lat,
              lng: location.lng,
              timestamp: Date.now(),
            }));
            console.log(`💾 Cached geocode result for 24h`);
          }
        } else {
          console.warn('Geocoding API returned:', data.status);
        }
      } catch (err) {
        console.error('Reverse geocoding error:', err);
        setError(err instanceof Error ? err : new Error('Geocoding failed'));
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, [location]);

  return { city, state, fullAddress, loading, error };
}
