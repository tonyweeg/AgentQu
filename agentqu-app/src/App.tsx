import React, { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useLocation } from './hooks/useLocation';
import { useDiscovery } from './hooks/useDiscovery';
import { useReverseGeocode } from './hooks/useReverseGeocode';
import AuthScreen from './components/AuthScreen';
import OnboardingScreen from './components/OnboardingScreen';
import ActivityCard from './components/ActivityCard';
import ActivityMap from './components/ActivityMap';
import Settings from './components/Settings';
import GeocacheView from './components/GeocacheView';
import { DiscoveryFilters } from './lib/types';

function App() {
  const [filters, setFilters] = useState<DiscoveryFilters>({ maxDistance: 10 });
  const [radius, setRadius] = useState(10); // miles
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showSettings, setShowSettings] = useState(false);
  const [showGeocaches, setShowGeocaches] = useState(false);
  const [enablePlaces, setEnablePlaces] = useState(true);
  const [enableCustomSearch, setEnableCustomSearch] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [nearbyTowns, setNearbyTowns] = useState<Array<{name: string; lat: number; lng: number; distance: number}>>([]);
  const [manualLocation, setManualLocation] = useState<{lat: number; lng: number} | null>(null);
  const { user, profile, loading: authLoading, updateAffinities, signOut } = useAuth();

  // Get user location
  const {
    location,
    loading: locationLoading,
    error: locationError,
    requestLocation,
  } = useLocation();

  // Use manual location if set, otherwise GPS location
  const activeLocation = manualLocation || location;

  // Reverse geocode to get city name
  const { city, state } = useReverseGeocode(activeLocation);

  // Fetch activities (only when user is onboarded)
  const { activities, loading: activitiesLoading, error: activitiesError, metadata, refetch } = useDiscovery({
    location: profile?.onboarded ? activeLocation : null,
    userId: user?.uid || null,
    filters,
    enablePlaces,
    enableCustomSearch,
    key: refreshKey
  });

  // Request location when user completes onboarding
  useEffect(() => {
    if (profile?.onboarded && !location) {
      requestLocation();
    }
  }, [profile?.onboarded, location, requestLocation]);

  // Fetch nearby towns when location and city are available
  useEffect(() => {
    if (!activeLocation || !city) return;

    const fetchNearbyTowns = async () => {
      try {
        const { functions } = await import('./lib/firebase');
        const { httpsCallable } = await import('firebase/functions');
        const getNearbyTowns = httpsCallable(functions, 'getNearbyTowns');

        const result = await getNearbyTowns({
          lat: activeLocation.lat,
          lng: activeLocation.lng,
          currentCity: city,
        }) as any;

        if (result.data?.success && result.data?.towns) {
          setNearbyTowns(result.data.towns);
        }
      } catch (error) {
        console.error('Error fetching nearby towns:', error);
      }
    };

    fetchNearbyTowns();
  }, [activeLocation?.lat, activeLocation?.lng, city]);

  // Filter geocaches from activities
  const geocaches = activities.filter((activity) => activity.type === 'cache');

  // Debug: Log activity types
  useEffect(() => {
    if (activities.length > 0) {
      console.log('🗺️ CLIENT DEBUG: Total activities:', activities.length);
      console.log('🗺️ CLIENT DEBUG: Activity types:', activities.map(a => a.type));
      console.log('🗺️ CLIENT DEBUG: Geocaches found:', geocaches.length);
    }
  }, [activities.length, geocaches.length]);

  // Loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="text-center">
          <img
            src="/agentqu-logo.png"
            alt="AgentQu"
            className="h-24 w-auto mx-auto mb-6 opacity-90"
          />
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
          <img
            src="/agentqu-logo.png"
            alt="AgentQu"
            className="h-24 w-auto mx-auto mb-6 opacity-90"
          />
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
              <button
                onClick={() => {
                  setViewMode('list');
                  setShowSettings(false);
                  setShowGeocaches(false);
                }}
                className="flex items-center gap-2 hover:opacity-70 transition-opacity cursor-pointer"
              >
                <img
                  src="/agentqu-glyph.png"
                  alt="AgentQu"
                  className="h-8 w-8"
                />
                <h1 className="text-3xl font-bold text-black" style={{ letterSpacing: '-0.05em' }}>AgentQu</h1>
              </button>
              {location && (
                <div className="flex items-center gap-3">
                  {/* Location Display */}
                  <div className="flex items-center gap-2 bg-gradient-to-r from-peach/10 to-orange-100/50 px-4 py-2 rounded-full border border-peach/20">
                    <span className="text-lg">📍</span>
                    {city && state ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-dark-text leading-tight">
                          {city}, {state}
                        </span>
                        <span className="text-xs text-gray-500">
                          {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-600">
                        {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </span>
                    )}
                  </div>

                  {/* Nearby Towns */}
                  {city && nearbyTowns.length > 0 && (
                    <div className="relative group">
                      <button className="flex items-center gap-1 bg-white hover:bg-gray-50 px-3 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 transition-colors">
                        <span>Nearby</span>
                        <span className="text-xs">▼</span>
                      </button>

                      {/* Dropdown */}
                      <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                        <div className="p-2">
                          <div className="px-3 py-2 text-xs text-gray-500 font-medium uppercase">Explore nearby</div>

                          {nearbyTowns.map((town) => (
                            <button
                              key={town.name}
                              onClick={() => {
                                setManualLocation({ lat: town.lat, lng: town.lng });
                                setRefreshKey(prev => prev + 1);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-peach/10 rounded-md text-sm text-gray-700 hover:text-peach transition-colors flex items-center justify-between"
                            >
                              <span>{town.name}</span>
                              <span className="text-xs text-gray-400">{town.distance.toFixed(0)} mi</span>
                            </button>
                          ))}

                          {/* Reset to GPS location */}
                          {manualLocation && (
                            <>
                              <div className="border-t my-2"></div>
                              <button
                                onClick={() => {
                                  setManualLocation(null);
                                  setRefreshKey(prev => prev + 1);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-md text-sm text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-2"
                              >
                                <span>📍</span>
                                <span>Back to my location</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {geocaches.length > 0 && (
                    <button
                      onClick={() => setShowGeocaches(true)}
                      className="flex items-center gap-2 bg-peach/10 hover:bg-peach/20 text-peach px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                    >
                      <span className="text-lg">🗺️</span>
                      <span>{geocaches.length} Geocache{geocaches.length !== 1 ? 's' : ''}</span>
                    </button>
                  )}
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

          {/* Data Source Toggles & Refresh */}
          <div className="border-t pt-4 mt-4 flex items-center justify-between">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enablePlaces}
                  onChange={(e) => setEnablePlaces(e.target.checked)}
                  className="w-4 h-4 accent-peach rounded"
                />
                <span className="text-sm font-medium text-gray-700">Google Places</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableCustomSearch}
                  onChange={(e) => setEnableCustomSearch(e.target.checked)}
                  className="w-4 h-4 accent-peach rounded"
                />
                <span className="text-sm font-medium text-gray-700">Custom Search (Events)</span>
              </label>
            </div>
            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              disabled={activitiesLoading}
              className="px-4 py-2 bg-peach text-white rounded-lg hover:bg-peach/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              🔄 Refresh Results
            </button>
          </div>
        </div>

        {/* Loading State */}
        {activitiesLoading && (
          <div className="text-center py-16">
            <img
              src="/agentqu-logo.png"
              alt="AgentQu"
              className="h-20 w-auto mx-auto mb-4 opacity-75"
            />
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

      {/* Geocache View Modal */}
      {showGeocaches && (
        <GeocacheView geocaches={geocaches} onClose={() => setShowGeocaches(false)} />
      )}
    </div>
  );
}

export default App;
