import { useState, useEffect, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { Activity, Location, DiscoveryFilters } from '../lib/types';

export function useDiscovery(location: Location | null, filters: DiscoveryFilters = {}) {
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
      // Call the Cloud Function
      const discoverActivities = httpsCallable(functions, 'discoverActivities');

      const result = await discoverActivities({
        lat: location.lat,
        lng: location.lng,
        radius: filters.maxDistance || 10,
        filters,
      });

      const data = result.data as any;

      if (data.success) {
        setActivities(data.activities || []);
        setMetadata(data.metadata);
      } else {
        throw new Error('Discovery failed');
      }
    } catch (err: any) {
      console.error('Discovery error:', err);
      setError(err);

      // If Cloud Function fails, show empty state
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [location, filters]);

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
