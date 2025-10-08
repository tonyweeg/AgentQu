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
import OffGridView from './components/OffGridView';
import { DiscoveryFilters } from './lib/types';

function App() {
  const [filters, setFilters] = useState<DiscoveryFilters>({ maxDistance: 10 });
  const [radius, setRadius] = useState(10); // miles
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'offgrid'>('list');
  const [showSettings, setShowSettings] = useState(false);
  const [showGeocaches, setShowGeocaches] = useState(false);
  const [enablePlaces, setEnablePlaces] = useState(true);
  const [enableCustomSearch, setEnableCustomSearch] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [nearbyTowns, setNearbyTowns] = useState<Array<{name: string; lat: number; lng: number; distance: number}>>([]);
  const [manualLocation, setManualLocation] = useState<{lat: number; lng: number} | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showControlsDrawer, setShowControlsDrawer] = useState(false);
  const [locationInfo, setLocationInfo] = useState<string>('');
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

  // Handle map drag to search new location
  const handleMapLocationChange = (lat: number, lng: number) => {
    console.log('🗺️ Searching new location from map drag:', lat, lng);
    setManualLocation({ lat, lng });
    setRefreshKey(prev => prev + 1);
  };

  // Debug: Log activity types
  useEffect(() => {
    if (activities.length > 0) {
      console.log('🗺️ CLIENT DEBUG: Total activities:', activities.length);
      console.log('🗺️ CLIENT DEBUG: Activity types:', activities.map(a => a.type));
      console.log('🗺️ CLIENT DEBUG: Geocaches found:', geocaches.length);
    }
  }, [activities.length, geocaches.length]);

  // Fetch Wikipedia info about the city
  useEffect(() => {
    const fetchLocationInfo = async () => {
      if (!city || !state) {
        setLocationInfo('');
        return;
      }

      try {
        setLocationInfo('Loading...');
        // Use Wikipedia API to get a summary
        const searchQuery = `${city}, ${state}`;
        const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchQuery)}`;

        const response = await fetch(wikiUrl);
        if (response.ok) {
          const data = await response.json();
          setLocationInfo(data.extract || 'No information available.');
        } else {
          // Fallback: try without state
          const fallbackUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`;
          const fallbackResponse = await fetch(fallbackUrl);
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setLocationInfo(fallbackData.extract || 'No information available.');
          } else {
            setLocationInfo('No information available for this location.');
          }
        }
      } catch (error) {
        console.error('Error fetching location info:', error);
        setLocationInfo('Unable to load location information.');
      }
    };

    fetchLocationInfo();
  }, [city, state]);

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
            {/* Logo */}
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
                className="h-8 w-8 hidden lg:block"
              />
              <h1 className="text-2xl sm:text-3xl font-bold text-black" style={{ letterSpacing: '-0.05em' }}>AgentQu</h1>
            </button>

            {/* Desktop Navigation */}
            {location && (
              <div className="hidden lg:flex items-center gap-3">
                {/* Location Display */}
                <div className="flex items-center gap-2 bg-gradient-to-r from-peach/10 to-orange-100/50 px-4 py-2.5 rounded-full border border-peach/20">
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
                    <button className="flex items-center gap-1 bg-white hover:bg-gray-50 px-4 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 transition-colors h-[42px]">
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

                {/* Off Grid Button */}
                <button
                  onClick={() => setViewMode('offgrid')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all h-[42px] ${
                    viewMode === 'offgrid'
                      ? 'bg-dark-text text-white shadow-md'
                      : 'bg-white text-dark-text hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <span className="text-lg">🏕️</span>
                  <span>Off Grid</span>
                </button>

                {geocaches.length > 0 && (
                  <button
                    onClick={() => setShowGeocaches(true)}
                    className="flex items-center gap-2 bg-peach/10 hover:bg-peach/20 text-peach px-4 py-2.5 rounded-full text-sm font-medium transition-colors h-[42px]"
                  >
                    <span className="text-lg">🗺️</span>
                    <span>{geocaches.length} Geocache{geocaches.length !== 1 ? 's' : ''}</span>
                  </button>
                )}
              </div>
            )}

            {/* Desktop User Menu */}
            <div className="hidden lg:flex items-center gap-4">
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

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <img
                src="/agentqu-glyph.png"
                alt="Menu"
                className="h-8 w-8"
              />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
              {/* Location Display */}
              {location && city && state && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-peach/10 to-orange-100/50 px-4 py-2.5 rounded-full border border-peach/20">
                  <span className="text-lg">📍</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-dark-text leading-tight">
                      {city}, {state}
                    </span>
                    <span className="text-xs text-gray-500">
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </span>
                  </div>
                </div>
              )}

              {/* Off Grid */}
              <button
                onClick={() => {
                  setViewMode('offgrid');
                  setShowMobileMenu(false);
                }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all ${
                  viewMode === 'offgrid'
                    ? 'bg-dark-text text-white shadow-md'
                    : 'bg-white text-dark-text hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <span className="text-lg">🏕️</span>
                <span>Off Grid</span>
              </button>

              {/* Nearby Towns */}
              {city && nearbyTowns.length > 0 && (
                <div className="border-t pt-3">
                  <div className="text-xs text-gray-500 font-medium uppercase px-3 mb-2">Nearby Towns</div>
                  {nearbyTowns.map((town) => (
                    <button
                      key={town.name}
                      onClick={() => {
                        setManualLocation({ lat: town.lat, lng: town.lng });
                        setRefreshKey(prev => prev + 1);
                        setShowMobileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-peach/10 rounded-md text-sm text-gray-700 hover:text-peach transition-colors flex items-center justify-between"
                    >
                      <span>{town.name}</span>
                      <span className="text-xs text-gray-400">{town.distance.toFixed(0)} mi</span>
                    </button>
                  ))}
                  {manualLocation && (
                    <button
                      onClick={() => {
                        setManualLocation(null);
                        setRefreshKey(prev => prev + 1);
                        setShowMobileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 rounded-md text-sm text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-2 mt-2"
                    >
                      <span>📍</span>
                      <span>Back to my location</span>
                    </button>
                  )}
                </div>
              )}

              {/* Geocaches */}
              {geocaches.length > 0 && (
                <button
                  onClick={() => {
                    setShowGeocaches(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 bg-peach/10 hover:bg-peach/20 text-peach px-4 py-2.5 rounded-full text-sm font-medium transition-colors"
                >
                  <span className="text-lg">🗺️</span>
                  <span>{geocaches.length} Geocache{geocaches.length !== 1 ? 's' : ''}</span>
                </button>
              )}

              {/* Settings */}
              <button
                onClick={() => {
                  setShowSettings(true);
                  setShowMobileMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:text-peach transition-colors font-medium"
              >
                ⚙️ Settings
              </button>

              {/* Profile */}
              <div className="flex items-center gap-3 px-4 py-2 border-t pt-3">
                {profile.photoURL && (
                  <img
                    src={profile.photoURL}
                    alt={profile.displayName || 'User'}
                    className="w-10 h-10 rounded-full border-2 border-peach"
                  />
                )}
                <div className="flex-1">
                  <div className="text-sm font-medium text-dark-text">{profile.displayName || 'User'}</div>
                  <button
                    onClick={signOut}
                    className="text-xs text-gray-600 hover:text-peach transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Collapsible Controls Drawer */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto">
          {/* Drawer Toggle Button with View Mode Toggle */}
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setShowControlsDrawer(!showControlsDrawer)}
              className="flex items-center gap-3 hover:opacity-70 transition-opacity"
            >
              <span className="text-sm font-medium text-gray-700">
                {activities.length} activities
              </span>
              <span className="text-xs text-gray-500">
                {radius} mi
              </span>
              <span className={`text-gray-400 transition-transform ${showControlsDrawer ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {/* View Mode Toggle - Standalone */}
            {viewMode !== 'offgrid' && (
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-peach shadow-sm'
                      : 'text-gray-600'
                  }`}
                >
                  📋
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'map'
                      ? 'bg-white text-peach shadow-sm'
                      : 'text-gray-600'
                  }`}
                >
                  🗺️
                </button>
              </div>
            )}
          </div>

          {/* Drawer Content - Small square map + location info + controls */}
          {showControlsDrawer && (
            <div className="border-t border-gray-200 bg-gray-50/50">
              <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                  {/* Condensed Controls - Mobile First */}
                  <div className="flex flex-wrap gap-4 md:hidden">
                    {/* Radius - Inline */}
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Radius
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
                        className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-peach"
                      />
                      <div className="flex justify-between mt-0.5">
                        <span className="text-xs text-gray-400">1</span>
                        <span className="text-xs font-bold text-dark-text">{radius} mi</span>
                        <span className="text-xs text-gray-400">50</span>
                      </div>
                    </div>

                    {/* Sources - Inline */}
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enablePlaces}
                          onChange={(e) => setEnablePlaces(e.target.checked)}
                          className="w-3 h-3 accent-peach rounded"
                        />
                        <span className="text-xs text-gray-700">Places</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableCustomSearch}
                          onChange={(e) => setEnableCustomSearch(e.target.checked)}
                          className="w-3 h-3 accent-peach rounded"
                        />
                        <span className="text-xs text-gray-700">Events</span>
                      </label>
                      <button
                        onClick={() => setRefreshKey(prev => prev + 1)}
                        disabled={activitiesLoading}
                        className="px-2.5 py-1 bg-peach text-white rounded text-xs font-medium hover:bg-peach/90 transition-colors disabled:opacity-50"
                      >
                        🔄
                      </button>
                    </div>
                  </div>

                  {/* Small Square Map - Desktop */}
                  {activeLocation && (
                    <div className="hidden md:block w-64 h-64 rounded-lg overflow-hidden border border-gray-300 bg-white shadow-sm flex-shrink-0">
                      <ActivityMap
                        activities={[]}
                        userLocation={activeLocation}
                        onLocationChange={handleMapLocationChange}
                        compact={false}
                      />
                    </div>
                  )}

                  {/* Location Info from Wikipedia */}
                  <div className="flex-1 bg-white rounded-lg border border-gray-300 p-4 overflow-y-auto max-h-64">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">About This Area</h3>
                    {city && state ? (
                      <div>
                        <p className="text-lg font-bold text-dark-text mb-2">{city}, {state}</p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {locationInfo || 'Loading local information...'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Location information unavailable</p>
                    )}
                  </div>

                  {/* Condensed Controls Column - Desktop */}
                  <div className="hidden md:block w-48 space-y-4 flex-shrink-0">
                    {/* Radius */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                        Radius
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
                        className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-peach"
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-400">1</span>
                        <span className="text-sm font-bold text-dark-text">{radius} mi</span>
                        <span className="text-xs text-gray-400">50</span>
                      </div>
                    </div>

                    {/* Sources */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                        Sources
                      </label>
                      <div className="space-y-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enablePlaces}
                            onChange={(e) => setEnablePlaces(e.target.checked)}
                            className="w-3 h-3 accent-peach rounded"
                          />
                          <span className="text-xs text-gray-700">Places</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enableCustomSearch}
                            onChange={(e) => setEnableCustomSearch(e.target.checked)}
                            className="w-3 h-3 accent-peach rounded"
                          />
                          <span className="text-xs text-gray-700">Events</span>
                        </label>
                      </div>
                    </div>

                    {/* Refresh */}
                    <button
                      onClick={() => setRefreshKey(prev => prev + 1)}
                      disabled={activitiesLoading}
                      className="w-full px-3 py-1.5 bg-peach text-white rounded-md text-xs font-medium hover:bg-peach/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <span>🔄</span>
                      <span>Refresh</span>
                    </button>

                    {/* Metadata */}
                    {metadata && (
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-400 leading-relaxed">
                          {metadata.queryTimeMs}ms
                          {metadata.sources && (
                            <>
                              <br />
                              P:{metadata.sources.google_places || 0} · S:{metadata.sources.google_search || 0}
                            </>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6">

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
                {/* Map View with Condensed List */}
                {viewMode === 'map' && (
                  <div className="space-y-6">
                    {/* Map */}
                    <ActivityMap
                      activities={activities}
                      userLocation={activeLocation}
                      onLocationChange={handleMapLocationChange}
                    />

                    {/* Rich Activity List with Details */}
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <h3 className="text-xl font-bold text-dark-text mb-4">Activities on Map</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activities.slice(0, 12).map((activity) => {
                          // Check for images in multiple possible locations
                          const imageUrl = activity.images?.[0] || (activity as any).details?.imageUrl || activity.website;
                          const hasImage = !!imageUrl;

                          return (
                            <div
                              key={activity.id || activity.activityId}
                              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                            >
                              {/* Image */}
                              {hasImage ? (
                                <div className="h-48 overflow-hidden bg-gray-100">
                                  <img
                                    src={imageUrl}
                                    alt={activity.name}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      // Fallback if image fails to load
                                      e.currentTarget.style.display = 'none';
                                      const parent = e.currentTarget.parentElement;
                                      if (parent) {
                                        parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-peach/20 to-orange-100/50"><span class="text-6xl">${
                                          activity.primaryCategory === 'hiking' ? '🥾' :
                                          activity.primaryCategory === 'events' ? '🎉' :
                                          activity.primaryCategory === 'food_and_dining' ? '🍽️' :
                                          activity.primaryCategory === 'arts_and_culture' ? '🎨' :
                                          activity.primaryCategory === 'sports_and_recreation' ? '⚽' :
                                          activity.primaryCategory === 'nature_and_outdoors' ? '🌲' :
                                          activity.primaryCategory === 'entertainment' ? '🎭' :
                                          activity.primaryCategory === 'shopping' ? '🛍️' : '📍'
                                        }</span></div>`;
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="h-48 bg-gradient-to-br from-peach/20 to-orange-100/50 flex items-center justify-center">
                                  <span className="text-6xl">
                                    {activity.primaryCategory === 'hiking' ? '🥾' :
                                     activity.primaryCategory === 'events' ? '🎉' :
                                     activity.primaryCategory === 'food_and_dining' ? '🍽️' :
                                     activity.primaryCategory === 'arts_and_culture' ? '🎨' :
                                     activity.primaryCategory === 'sports_and_recreation' ? '⚽' :
                                     activity.primaryCategory === 'nature_and_outdoors' ? '🌲' :
                                     activity.primaryCategory === 'entertainment' ? '🎭' :
                                     activity.primaryCategory === 'shopping' ? '🛍️' : '📍'}
                                  </span>
                                </div>
                              )}

                              {/* Content */}
                              <div className="p-4">
                                <h4 className="font-bold text-base text-dark-text mb-2 line-clamp-2">
                                  {activity.name}
                                </h4>

                                {/* Category & Distance */}
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-xs bg-peach/10 text-peach px-2 py-1 rounded-full font-medium capitalize">
                                    {activity.primaryCategory?.replace(/_/g, ' ')}
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    📍 {activity.distance?.toFixed(1)} mi
                                  </span>
                                </div>

                                {/* Dynamic Details */}
                                <div className="space-y-2 mb-3 text-sm">
                                  {/* Trail/Hike Info */}
                                  {(activity.primaryCategory === 'hiking' || activity.primaryCategory === 'nature_and_outdoors') && (
                                    <>
                                      {activity.accessibility?.mobilityLevel && (
                                        <div className="flex items-center gap-2 text-gray-700">
                                          <span className="font-medium">Difficulty:</span>
                                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                            activity.accessibility.mobilityLevel === 'easy' ? 'bg-green-100 text-green-700' :
                                            activity.accessibility.mobilityLevel === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                          }`}>
                                            {activity.accessibility.mobilityLevel}
                                          </span>
                                        </div>
                                      )}
                                      {activity.duration && (
                                        <div className="flex items-center gap-2 text-gray-700">
                                          <span>⏱️</span>
                                          <span>{Math.round(activity.duration / 60)} hours</span>
                                        </div>
                                      )}
                                    </>
                                  )}

                                  {/* Event Info */}
                                  {activity.primaryCategory === 'events' && activity.hoursToday && (
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <span>🕐</span>
                                      <span>{activity.hoursToday.open} - {activity.hoursToday.close}</span>
                                    </div>
                                  )}

                                  {/* Rating */}
                                  {activity.rating && (
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <span>⭐</span>
                                      <span>{activity.rating.toFixed(1)}</span>
                                      {activity.reviewCount && (
                                        <span className="text-xs text-gray-500">({activity.reviewCount} reviews)</span>
                                      )}
                                    </div>
                                  )}

                                  {/* Cost */}
                                  {activity.cost && activity.cost.free ? (
                                    <div className="flex items-center gap-2 text-green-600 font-medium">
                                      <span>💰</span>
                                      <span>Free</span>
                                    </div>
                                  ) : activity.cost && activity.cost.priceLevel ? (
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <span>💰</span>
                                      <span>{'$'.repeat(activity.cost.priceLevel)}</span>
                                    </div>
                                  ) : null}

                                  {/* Accessibility */}
                                  {activity.accessibility?.wheelchairAccessible && (
                                    <div className="flex items-center gap-2 text-blue-600">
                                      <span>♿</span>
                                      <span className="text-xs">Wheelchair Accessible</span>
                                    </div>
                                  )}
                                </div>

                                {/* Match Score */}
                                {activity.score !== undefined && (
                                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                    <span className="text-xs text-gray-600">Match Score</span>
                                    <span className="text-sm font-bold text-peach">
                                      {activity.score >= 300 ? '⭐⭐⭐⭐⭐' :
                                       activity.score >= 250 ? '⭐⭐⭐⭐' :
                                       activity.score >= 200 ? '⭐⭐⭐' :
                                       activity.score >= 150 ? '⭐⭐' : '⭐'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {activities.length > 12 && (
                        <p className="text-center text-sm text-gray-500 mt-4">
                          +{activities.length - 12} more activities (switch to List view to see all)
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Off Grid View */}
                {viewMode === 'offgrid' && (
                  <OffGridView
                    activities={activities}
                    onLocationSearch={async (cityName) => {
                      try {
                        const { getFunctions, httpsCallable } = await import('firebase/functions');
                        const functions = getFunctions();
                        const geocode = httpsCallable(functions, 'geocode');

                        console.log('🔍 Geocoding:', cityName);
                        const result = await geocode({ address: cityName });
                        console.log('🔍 Geocode result:', result.data);

                        const data = result.data as { success: boolean; location?: { lat: number; lng: number }; error?: string };

                        if (data.success && data.location) {
                          const { lat, lng } = data.location;
                          setManualLocation({ lat, lng });
                          setRefreshKey(prev => prev + 1);
                        } else {
                          alert(data.error || `Could not find location: ${cityName}`);
                        }
                      } catch (error) {
                        console.error('Error geocoding city:', error);
                        alert('Failed to search for city. Please try again.');
                      }
                    }}
                  />
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
