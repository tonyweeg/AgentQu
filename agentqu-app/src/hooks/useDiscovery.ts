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
  key?: number;
}

export function useDiscovery({
  location,
  userId,
  filters = {},
  enablePlaces = true,
  enableCustomSearch = true,
  key = 0
}: UseDiscoveryOptions) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [metadata, setMetadata] = useState<any>(null);

  const fetchActivities = useCallback(async () => {
    if (!location) return;

    setLoading(true);
    setError(null);

    const startTime = Date.now();

    try {
      // Call the Cloud Function with userId for affinity scoring
      const discoverActivities = httpsCallable(functions, 'discoverActivities');

      console.log('🔍 AGENTQU_DEBUG: Calling discoverActivities with:', {
        lat: location.lat,
        lng: location.lng,
        radius: filters.maxDistance || 10,
        userId: userId || null,
        enablePlaces,
        enableCustomSearch,
        bypassCache: key > 0,
      });

      const result = await discoverActivities({
        lat: location.lat,
        lng: location.lng,
        radius: filters.maxDistance || 10,
        userId: userId || null,
        filters,
        enablePlaces,
        enableCustomSearch,
        bypassCache: key > 0,
      });

      const data = result.data as any;

      console.log('🔍 AGENTQU_DEBUG: Cloud Function response:', data);
      console.log('🔍 AGENTQU_DEBUG: Response JSON:', JSON.stringify(data, null, 2));

      if (data.success) {
        console.log(`🔍 AGENTQU_DEBUG: Got ${data.activities?.length || 0} activities`);
        console.log('🔍 AGENTQU_DEBUG: Metadata:', JSON.stringify(data.metadata, null, 2));
        setActivities(data.activities || []);
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
    } finally {
      setLoading(false);
    }
  }, [location, filters, enablePlaces, enableCustomSearch, key]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
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
