import React, { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useLocation } from './hooks/useLocation';
import { useDiscovery } from './hooks/useDiscovery';
import AuthScreen from './components/AuthScreen';
import OnboardingScreen from './components/OnboardingScreen';
import ActivityCard from './components/ActivityCard';
import ActivityMap from './components/ActivityMap';
import Settings from './components/Settings';
import { DiscoveryFilters } from './lib/types';

function App() {
  const [filters, setFilters] = useState<DiscoveryFilters>({ maxDistance: 10 });
  const [radius, setRadius] = useState(10); // miles
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showSettings, setShowSettings] = useState(false);
  const { user, profile, loading: authLoading, updateAffinities, signOut } = useAuth();

  // Get user location
  const {
    location,
    loading: locationLoading,
    error: locationError,
    requestLocation,
  } = useLocation();

  // Fetch activities (only when user is onboarded)
  const { activities, loading: activitiesLoading, error: activitiesError, metadata } = useDiscovery({
    location: profile?.onboarded ? location : null,
    userId: user?.uid || null,
    filters
  });

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
              <button
                onClick={() => setShowSettings(true)}
                className="text-sm text-gray-600 hover:text-peach transition-colors font-medium"
              >
                ⚙️ Settings
              </button>
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
        {/* Results Header with Radius Control */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
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

          {/* Radius Slider & View Toggle */}
          <div className="border-t pt-4 flex gap-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Radius: {radius} miles
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={radius}
                onChange={(e) => {
                  const newRadius = parseInt(e.target.value);
                  setRadius(newRadius);
                  setFilters({ ...filters, maxDistance: newRadius });
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-peach"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 mi</span>
                <span>25 mi</span>
                <span>50 mi</span>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-end">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-peach shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📋 List
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'map'
                      ? 'bg-white text-peach shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🗺️ Map
                </button>
              </div>
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
              <>
                {/* Map View */}
                {viewMode === 'map' && (
                  <ActivityMap activities={activities} userLocation={location} />
                )}

                {/* List View - Grouped by Category */}
                {viewMode === 'list' && (
                  <>
                    {/* Group activities by primary category */}
                    {(() => {
                      // Group activities by category
                      const grouped = activities.reduce((acc, activity) => {
                        const category = activity.primaryCategory || 'Other';
                        if (!acc[category]) {
                          acc[category] = [];
                        }
                        acc[category].push(activity);
                        return acc;
                      }, {} as Record<string, typeof activities>);

                      // Sort each group by score (desc), then name (asc)
                      Object.keys(grouped).forEach(category => {
                        grouped[category].sort((a, b) => {
                          const scoreDiff = (b.score || 0) - (a.score || 0);
                          if (scoreDiff !== 0) return scoreDiff;
                          return a.name.localeCompare(b.name);
                        });
                      });

                      // Get categories sorted by highest score in each group
                      const sortedCategories = Object.keys(grouped).sort((a, b) => {
                        const maxScoreA = Math.max(...grouped[a].map(act => act.score || 0));
                        const maxScoreB = Math.max(...grouped[b].map(act => act.score || 0));
                        return maxScoreB - maxScoreA;
                      });

                      return (
                        <div className="space-y-8">
                          {sortedCategories.map(category => (
                            <div key={category}>
                              {/* Category Header */}
                              <div className="mb-4">
                                <h3 className="text-xl font-bold text-dark-text capitalize">
                                  {category.replace(/_/g, ' ')}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {grouped[category].length} {grouped[category].length === 1 ? 'activity' : 'activities'}
                                </p>
                              </div>

                              {/* Activities Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {grouped[category].map((activity) => (
                                  <ActivityCard key={activity.id || activity.activityId} activity={activity} />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Edge Suggestions - Try Something New! */}
                    {activities.length > 3 && (
                      <div className="mt-12">
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6">
                          <h3 className="text-2xl font-bold text-dark-text mb-2">
                            ✨ Try Something New
                          </h3>
                          <p className="text-gray-600">
                            Step outside your comfort zone with these edge suggestions
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {activities
                            .sort((a, b) => (a.score || 0) - (b.score || 0))
                            .slice(0, 3)
                            .map((activity) => (
                              <div key={`edge-${activity.id || activity.activityId}`} className="relative">
                                <div className="absolute -top-2 -right-2 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10 shadow-lg">
                                  🌟 NEW!
                                </div>
                                <ActivityCard activity={activity} />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default App;
