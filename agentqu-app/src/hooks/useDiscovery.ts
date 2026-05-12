import { useState, useEffect, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { Activity, Location, DiscoveryFilters } from '../lib/types';

interface UseDiscoveryOptions {
  location: Location | null;
  userId?: string | null;
  filters?: DiscoveryFilters;
  enablePlaces?: boolean;
  enableCustomSearch?: boolean;
  showFastFood?: boolean;
  textSearch?: string;
  key?: number;
}

export function useDiscovery({
  location,
  userId,
  filters = {},
  enablePlaces = true,
  enableCustomSearch = true,
  showFastFood = false,
  textSearch = '',
  key = 0
}: UseDiscoveryOptions) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [chargingStations, setChargingStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [metadata, setMetadata] = useState<any>(null);

  const fetchActivities = useCallback(async () => {
    if (!location) return;

    setLoading(true);
    setError(null);

    try {
      // Call the Cloud Function with userId for affinity scoring
      const discoverActivities = httpsCallable(functions, 'discoverActivities');

      // Use wider radius for text searches (especially Ticketmaster events)
      // Text searches like "Cage the Elephant" should search up to 100 miles
      const searchRadius = textSearch ? 100 : (filters.maxDistance || 10);

      console.log('🔍 AGENTQU_DEBUG: Calling discoverActivities with:', {
        lat: location.lat,
        lng: location.lng,
        radius: searchRadius,
        userId: userId || null,
        enablePlaces,
        enableCustomSearch,
        showFastFood,
        textSearch: textSearch || null,
        bypassCache: key > 0,
      });

      const result = await discoverActivities({
        lat: location.lat,
        lng: location.lng,
        radius: searchRadius,
        userId: userId || null,
        filters,
        enablePlaces,
        enableCustomSearch,
        showFastFood,
        textSearch: textSearch || null,
        bypassCache: key > 0,
      });

      const data = result.data as any;

      console.log('🔍 AGENTQU_DEBUG: Cloud Function response:', data);
      console.log('🔍 AGENTQU_DEBUG: Response JSON:', JSON.stringify(data, null, 2));

      if (data.success) {
        console.log(`🔍 AGENTQU_DEBUG: Got ${data.activities?.length || 0} activities`);
        console.log(`⚡ EV CHARGING: Got ${data.chargingStations?.length || 0} charging stations`);
        console.log('🔍 AGENTQU_DEBUG: Metadata:', JSON.stringify(data.metadata, null, 2));

        let filteredActivities = data.activities || [];

        // If text search is active, filter results to only show relevant matches
        // This prevents broad Ticketmaster keyword searches from showing unrelated events
        if (textSearch && textSearch.trim().length > 0) {
          const searchTerms = textSearch.toLowerCase().trim();
          filteredActivities = filteredActivities.filter((activity: any) => {
            const name = (activity.name || '').toLowerCase();
            const description = (activity.description || activity.details?.description || '').toLowerCase();
            const venue = (activity.details?.venue || '').toLowerCase();

            // Match if search term is in name, description, or venue
            return name.includes(searchTerms) ||
                   description.includes(searchTerms) ||
                   venue.includes(searchTerms);
          });
          console.log(`🔍 AGENTQU_DEBUG: Filtered ${data.activities?.length || 0} → ${filteredActivities.length} activities based on search: "${textSearch}"`);
        }

        setActivities(filteredActivities);
        setChargingStations(data.chargingStations || []);
        setMetadata(data.metadata);
      } else {
        console.error('🔍 AGENTQU_DEBUG: Discovery failed - no success flag');
        throw new Error('Discovery failed');
      }
    } catch (err: any) {
      console.error('🔍 AGENTQU_DEBUG: Discovery error:', err);
      console.error('🔍 AGENTQU_DEBUG: Error details:', JSON.stringify(err, null, 2));
      setError(err);

      // If Cloud Function fails, show empty state
      setActivities([]);
      setChargingStations([]);
    } finally {
      setLoading(false);
    }
  }, [location, userId, filters, enablePlaces, enableCustomSearch, showFastFood, textSearch, key]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    chargingStations,
    loading,
    error,
    metadata,
    refetch: fetchActivities,
  };
}

// Legacy export for backwards compatibility
export function useDiscoveryLegacy(location: Location | null, filters: DiscoveryFilters = {}) {
  return useDiscovery({ location, filters });
}
