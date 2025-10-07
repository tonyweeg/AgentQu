import React, { useEffect, useState } from 'react';
import { useLocation } from './hooks/useLocation';
import { useDiscovery } from './hooks/useDiscovery';
import ActivityCard from './components/ActivityCard';
import { DiscoveryFilters } from './lib/types';

function App() {
  const [filters, setFilters] = useState<DiscoveryFilters>({});

  // Get user location
  const {
    location,
    loading: locationLoading,
    error: locationError,
    requestLocation,
  } = useLocation();

  // Fetch activities
  const { activities, loading: activitiesLoading, error: activitiesError, metadata } = useDiscovery(location, filters);

  // Request location on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  if (locationLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-peach border-t-transparent mx-auto mb-4"></div>
          <p className="text-dark-text text-lg font-medium">Getting your location...</p>
          <p className="text-gray-600 mt-2 text-sm">Please allow location access</p>
        </div>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="text-center max-w-md p-6">
          <div className="text-6xl mb-4">📍</div>
          <h2 className="text-2xl font-bold text-dark-text mb-3">Location Access Required</h2>
          <p className="text-gray-600 mb-6">AgentQu needs your location to find activities near you.</p>
          <button
            onClick={requestLocation}
            className="bg-peach text-white px-8 py-3 rounded-xl hover:bg-peach/90 transition-colors font-medium"
          >
            Enable Location
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-peach">AgentQu</h1>
            <div className="text-sm text-gray-600">
              {location && (
                <>
                  📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        {/* Results Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-dark-text mb-1">
                {activities.length} activities near you
              </h2>
              <p className="text-gray-600">
                {metadata && `Found in ${metadata.queryTimeMs}ms`}
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {activitiesLoading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-peach border-t-transparent mx-auto mb-4"></div>
            <p className="text-dark-text font-medium">Finding activities...</p>
          </div>
        )}

        {/* Error State */}
        {activitiesError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-800 font-medium">Error loading activities. Please try again.</p>
          </div>
        )}

        {/* Results */}
        {!activitiesLoading && !activitiesError && (
          <>
            {activities.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-dark-text mb-2">No activities found</h3>
                <p className="text-gray-600">Try expanding your search radius</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
