import { useState, useEffect } from 'react';
import { getLanguageFromCountryCode } from '../lib/affinityCategories';

interface UseGeoLanguageReturn {
  geoLanguage: string;
  geoCountry: string | null;
  loading: boolean;
}

/**
 * Hook to detect user's physical location and map to local language
 * This is separate from user language preference - it's based on where they ARE
 */
export function useGeoLanguage(): UseGeoLanguageReturn {
  const [geoLanguage, setGeoLanguage] = useState<string>('en');
  const [geoCountry, setGeoCountry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectGeoLanguage = async () => {
      try {
        // Get user's current location
        if (!navigator.geolocation) {
          console.log('🌍 Geolocation not supported, defaulting to EN');
          setLoading(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            console.log('🌍 Got user location:', latitude, longitude);

            try {
              // Reverse geocode to get country
              const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=***REMOVED***`
              );
              const data = await response.json();

              if (data.results && data.results[0]) {
                const addressComponents = data.results[0].address_components;
                const countryComponent = addressComponents.find((c: any) =>
                  c.types.includes('country')
                );

                if (countryComponent) {
                  const countryCode = countryComponent.short_name;
                  const detectedLanguage = getLanguageFromCountryCode(countryCode);

                  console.log('🌍 Detected country:', countryCode, '→ Language:', detectedLanguage);
                  setGeoCountry(countryCode);
                  setGeoLanguage(detectedLanguage);
                }
              }
            } catch (error) {
              console.error('🌍 Error reverse geocoding:', error);
            } finally {
              setLoading(false);
            }
          },
          (error) => {
            console.log('🌍 Geolocation denied or failed:', error.message);
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('🌍 Error detecting geo language:', error);
        setLoading(false);
      }
    };

    detectGeoLanguage();
  }, []);

  return { geoLanguage, geoCountry, loading };
}
