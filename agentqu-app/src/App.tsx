import React, { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useLocation } from './hooks/useLocation';
import { useDiscovery } from './hooks/useDiscovery';
import AuthScreen from './components/AuthScreen';
import OnboardingScreen from './components/OnboardingScreen';
import ActivityCard from './components/ActivityCard';
import { DiscoveryFilters } from './lib/types';

function App() {
  const [filters, setFilters] = useState<DiscoveryFilters>({});
  const { user, profile, loading: authLoading, updateAffinities, signOut } = useAuth();

  // Get user location
  const {
    location,
    loading: locationLoading,
    error: locationError,
    requestLocation,
  } = useLocation();

  // Fetch activities (only when user is onboarded)
  const { activities, loading: activitiesLoading, error: activitiesError, metadata } = useDiscovery(
    profile?.onboarded ? location : null,
    filters
  );

  // Request location when user completes onboarding
  useEffect(() => {
    if (profile?.onboarded && !location) {
      requestLocation();
    }
  }, [profile?.onboarded, location, requestLocation]);

  // Loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-peach border-t-transparent mx-auto mb-4"></div>
          <p className="text-dark-text text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login
  if (!user || !profile) {
    return <AuthScreen onSuccess={() => {}} />;
  }

  // Authenticated but not onboarded - show onboarding
  if (!profile.onboarded) {
    return (
      <OnboardingScreen
        userName={profile.displayName || 'there'}
        onComplete={async (affinities) => {
          await updateAffinities(affinities);
        }}
      />
    );
  }

  // Location permission needed
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

  // Main app - show discoveries
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-peach">AgentQu</h1>
              {location && (
                <div className="text-sm text-gray-600">
                  📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              {profile.photoURL && (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName || 'User'}
                  className="w-10 h-10 rounded-full border-2 border-peach"
                />
              )}
              <button
                onClick={signOut}
                className="text-sm text-gray-600 hover:text-peach transition-colors"
              >
                Sign Out
              </button>
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
                {activities.length} activities for you
              </h2>
              <p className="text-gray-600">
                {metadata && `Found in ${metadata.queryTimeMs}ms`}
                {metadata?.sources && (
                  <span className="ml-2 text-sm">
                    ({metadata.sources.google_search || 0} from search, {metadata.sources.google_places || 0} from places)
                  </span>
                )}
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
