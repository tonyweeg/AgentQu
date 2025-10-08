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
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&key=${GEOCODING_API_KEY}`
        );

        const data = await response.json();

        if (data.status === 'OK' && data.results[0]) {
          const addressComponents = data.results[0].address_components;
          setFullAddress(data.results[0].formatted_address);

          const cityComponent = addressComponents.find((c: any) =>
            c.types.includes('locality')
          );
          const stateComponent = addressComponents.find((c: any) =>
            c.types.includes('administrative_area_level_1')
          );

          if (cityComponent) {
            setCity(cityComponent.long_name);
          }

          if (stateComponent) {
            setState(stateComponent.short_name);
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
  }, [location?.lat, location?.lng]);

  return { city, state, fullAddress, loading, error };
}
