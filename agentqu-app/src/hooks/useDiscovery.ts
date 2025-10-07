import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Activity, Location, DiscoveryFilters } from '../lib/types';

// Helper: Calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Helper: Calculate simple score
function calculateScore(activity: Activity, userLat: number, userLng: number): number {
  let score = 100;

  // Distance penalty (closer = better)
  const distance = activity.distance || 0;
  if (distance > 10) score -= 40;
  else if (distance > 5) score -= 20;
  else if (distance > 1) score -= 10;

  // Free activities bonus
  if (activity.cost.free) score += 10;

  // Rating bonus
  if (activity.rating) {
    score += (activity.rating / 5) * 20;
  }

  return Math.max(0, Math.min(100, score));
}

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
      // Query Firestore for activities
      const activitiesRef = collection(db, 'activities');
      let q = query(activitiesRef);

      // Apply filters
      if (filters.categories && filters.categories.length > 0) {
        q = query(q, where('primaryCategory', 'in', filters.categories));
      }

      const snapshot = await getDocs(q);

      let results: Activity[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Activity));

      // Calculate distances
      results = results.map((activity) => ({
        ...activity,
        distance: calculateDistance(location.lat, location.lng, activity.lat, activity.lng),
      }));

      // Filter by distance
      const maxDistance = filters.maxDistance || 10;
      results = results.filter((a) => (a.distance || 0) <= maxDistance);

      // Calculate scores
      results = results.map((activity) => ({
        ...activity,
        score: calculateScore(activity, location.lat, location.lng),
      }));

      // Sort by score
      results.sort((a, b) => (b.score || 0) - (a.score || 0));

      setActivities(results);
      setMetadata({
        totalFound: results.length,
        queryTimeMs: Date.now() - startTime,
        userLocation: location,
      });
    } catch (err) {
      setError(err as Error);
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
