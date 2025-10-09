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
import TripCreation from './components/TripCreation';
import CirqleManager from './components/CirqleManager';
import JoinCirqle from './components/JoinCirqle';
import MyTrips from './components/MyTrips';
import TripDetail from './components/TripDetail';
import TestHarness from './components/TestHarness';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import ContactUs from './components/ContactUs';
import { DiscoveryFilters } from './lib/types';

function App() {
  // Check URL for special routes
  const urlPath = window.location.pathname;
  const urlParams = new URLSearchParams(window.location.search);
  const isJoinCirqle = urlPath === '/join-cirqle' || urlParams.has('token');
  const isTestHarness = urlPath === '/test-harness';
  const isPrivacyPolicy = urlPath === '/privacy';
  const isTermsOfService = urlPath === '/terms';
  const isContactUs = urlPath === '/contact';
  const urlView = urlParams.get('view');
  const tripId = urlParams.get('id');

  const [filters, setFilters] = useState<DiscoveryFilters>({ maxDistance: 10 });
  const [radius, setRadius] = useState(10); // miles
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'offgrid' | 'trip-creation' | 'trips' | 'trip-detail' | 'cirqle'>(
    (urlView as any) || 'list'
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showGeocaches, setShowGeocaches] = useState(false);
  const [enablePlaces, setEnablePlaces] = useState(true);
  const [enableCustomSearch, setEnableCustomSearch] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [nearbyTowns, setNearbyTowns] = useState<Array<{name: string; lat: number; lng: number; distance: number}>>([]);
  const [manualLocation, setManualLocation] = useState<{lat: number; lng: number} | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showControlsDrawer, setShowControlsDrawer] = useState(false);
  const [showAdventureMenu, setShowAdventureMenu] = useState(false);
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

  // Fetch Wikipedia info about the city with rich data
  const [wikiData, setWikiData] = useState<any>(null);
  useEffect(() => {
    const fetchLocationInfo = async () => {
      if (!city || !state) {
        setLocationInfo('');
        setWikiData(null);
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
          setWikiData(data);
        } else {
          // Fallback: try without state
          const fallbackUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`;
          const fallbackResponse = await fetch(fallbackUrl);
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setLocationInfo(fallbackData.extract || 'No information available.');
            setWikiData(fallbackData);
          } else {
            setLocationInfo('No information available for this location.');
            setWikiData(null);
          }
        }
      } catch (error) {
        console.error('Error fetching location info:', error);
        setLocationInfo('Unable to load location information.');
        setWikiData(null);
      }
    };

    fetchLocationInfo();
  }, [city, state]);

  // Loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-seafoam">
        <div className="text-center">
          <img
            src="/agentqu-logo.png"
            alt="AgentQu"
            className="h-24 w-auto mx-auto mb-6 opacity-90"
          />
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-ocean-bright border-t-transparent mx-auto mb-4"></div>
          <p className="text-navy-text text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Test Harness (special route - accessible without full auth)
  if (isTestHarness) {
    return <TestHarness />;
  }

  // Join Cirqle flow (special route)
  if (isJoinCirqle) {
    return <JoinCirqle />;
  }

  // Not authenticated - show login (unless viewing corporate pages)
  if (!user || !profile) {
    // Corporate pages are accessible without auth
    if (isPrivacyPolicy || isTermsOfService || isContactUs) {
      // Render with simple header and corporate page content
      return (
        <div className="min-h-screen bg-transparent">
          {/* Simple Header for non-logged-in users */}
          <header className="bg-white shadow-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                {/* Logo */}
                <a href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                  <img src="/agentqu-glyph.png" alt="AgentQu" className="h-8 w-8 hidden lg:block" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-black" style={{ letterSpacing: '-0.05em' }}>AgentQu</h1>
                </a>

                {/* Links for non-logged-in users */}
                <div className="flex items-center gap-4">
                  <a href="/privacy" className="text-sm font-medium text-gray-700 hover:text-ocean-bright transition-colors">Privacy</a>
                  <a href="/terms" className="text-sm font-medium text-gray-700 hover:text-ocean-bright transition-colors">Terms</a>
                  <a href="/contact" className="text-sm font-medium text-gray-700 hover:text-ocean-bright transition-colors">Contact</a>
                  <a href="/" className="bg-ocean-bright text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-ocean-mid transition-colors">Sign In</a>
                </div>
              </div>
            </div>
          </header>

          {/* Corporate Page Content */}
          {isPrivacyPolicy && <PrivacyPolicy />}
          {isTermsOfService && <TermsOfService />}
          {isContactUs && <ContactUs />}

          {/* Footer */}
          <footer className="bg-navy-text text-white mt-12 py-8">
            <div className="max-w-7xl mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                <div>
                  <h3 className="font-bold text-xl mb-3">AgentQu</h3>
                  <p className="text-gray-300 text-sm">
                    Discover amazing activities near you with personalized recommendations powered by AI.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-3">Legal</h3>
                  <div className="space-y-2">
                    <a href="/privacy" className="block text-gray-300 hover:text-white text-sm transition-colors">Privacy Policy</a>
                    <a href="/terms" className="block text-gray-300 hover:text-white text-sm transition-colors">Terms of Service</a>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-3">Get in Touch</h3>
                  <div className="space-y-2">
                    <a href="/contact" className="block text-gray-300 hover:text-white text-sm transition-colors">Contact Us</a>
                    <a href="mailto:support@agentqu.com" className="block text-gray-300 hover:text-white text-sm transition-colors">support@agentqu.com</a>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-700 pt-6 text-center text-sm text-gray-400">
                <p>© {new Date().getFullYear()} AgentQu. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      );
    }

    // Regular login screen
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
        onSignOut={signOut}
      />
    );
  }

  // Location permission needed
  if (locationLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-seafoam">
        <div className="text-center">
          <img
            src="/agentqu-logo.png"
            alt="AgentQu"
            className="h-24 w-auto mx-auto mb-6 opacity-90"
          />
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-ocean-bright border-t-transparent mx-auto mb-4"></div>
          <p className="text-navy-text text-lg font-medium">Getting your location...</p>
          <p className="text-gray-600 mt-2 text-sm">Please allow location access</p>
        </div>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-seafoam">
        <div className="text-center max-w-md p-6">
          <div className="text-6xl mb-4">📍</div>
          <h2 className="text-2xl font-bold text-navy-text mb-3">Location Access Required</h2>
          <p className="text-gray-600 mb-6">AgentQu needs your location to find activities near you.</p>
          <button
            onClick={requestLocation}
            className="bg-ocean-bright text-white px-8 py-3 rounded-xl hover:bg-ocean-mid transition-colors font-medium"
          >
            Enable Location
          </button>
        </div>
      </div>
    );
  }

  // Main app - show discoveries
  return (
    <div className="min-h-screen bg-transparent">
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
                <div className="flex items-center gap-2 bg-gradient-to-r from-ocean-bright/10 to-orange-100/50 px-4 py-2.5 rounded-full border border-ocean-bright/20">
                  <span className="text-lg">📍</span>
                  {city && state ? (
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-navy-text leading-tight">
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
                            className="w-full text-left px-3 py-2 hover:bg-ocean-bright/10 rounded-md text-sm text-gray-700 hover:text-ocean-bright transition-colors flex items-center justify-between"
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

                {/* Adventure Menu Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowAdventureMenu(!showAdventureMenu)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all h-[42px] bg-white text-navy-text hover:bg-gray-50 border border-gray-200"
                  >
                    <span>🎒</span>
                    <span>Adventure</span>
                    <span className={`text-xs transition-transform ${showAdventureMenu ? 'rotate-180' : ''}`}>▼</span>
                  </button>

                  {/* Dropdown Menu */}
                  {showAdventureMenu && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 z-50 overflow-hidden">
                      <button
                        onClick={() => {
                          setViewMode('cirqle');
                          window.history.pushState({}, '', '/?view=cirqle');
                          setShowAdventureMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-purple-50 transition-colors ${
                          viewMode === 'cirqle' ? 'bg-purple-100 text-purple-700' : 'text-gray-700'
                        }`}
                      >
                        <span className="text-xl">👥</span>
                        <span className="font-medium">Cirqle</span>
                      </button>
                      <button
                        onClick={() => {
                          setViewMode('trip-creation');
                          window.history.pushState({}, '', '/?view=trip-creation');
                          setShowAdventureMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-orange-50 transition-colors border-t border-gray-100 ${
                          viewMode === 'trip-creation' ? 'bg-orange-100 text-orange-700' : 'text-gray-700'
                        }`}
                      >
                        <span className="text-xl">🌍</span>
                        <span className="font-medium">There-Then</span>
                      </button>
                      <button
                        onClick={() => {
                          setViewMode('trips');
                          window.history.pushState({}, '', '/?view=trips');
                          setShowAdventureMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors border-t border-gray-100 ${
                          viewMode === 'trips' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        <span className="text-xl">✈️</span>
                        <span className="font-medium">My Trips</span>
                      </button>
                      <button
                        onClick={() => {
                          setViewMode('offgrid');
                          setShowAdventureMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-green-50 transition-colors border-t border-gray-100 ${
                          viewMode === 'offgrid' ? 'bg-green-100 text-green-700' : 'text-gray-700'
                        }`}
                      >
                        <span className="text-xl">🏕️</span>
                        <span className="font-medium">Off Grid</span>
                      </button>
                    </div>
                  )}
                </div>

                {geocaches.length > 0 && (
                  <button
                    onClick={() => setShowGeocaches(true)}
                    className="flex items-center gap-2 bg-ocean-bright/10 hover:bg-ocean-bright/20 text-ocean-bright px-4 py-2.5 rounded-full text-sm font-medium transition-colors h-[42px]"
                  >
                    <span className="text-lg">🗺️</span>
                    <span>{geocaches.length} Geocache{geocaches.length !== 1 ? 's' : ''}</span>
                  </button>
                )}
              </div>
            )}

            {/* Desktop User Menu */}
            <div className="hidden lg:flex items-center gap-4">
              <a
                href="/contact"
                className="text-sm text-gray-600 hover:text-ocean-bright transition-colors font-medium"
              >
                ✉️ Contact
              </a>
              <button
                onClick={() => setShowSettings(true)}
                className="text-sm text-gray-600 hover:text-ocean-bright transition-colors font-medium"
              >
                ⚙️ Settings
              </button>
              {profile.photoURL && (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName || 'User'}
                  className="w-10 h-10 rounded-full border-2 border-ocean-bright"
                />
              )}
              <button
                onClick={signOut}
                className="text-sm text-gray-600 hover:text-ocean-bright transition-colors"
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
                <div className="flex items-center gap-2 bg-gradient-to-r from-ocean-bright/10 to-orange-100/50 px-4 py-2.5 rounded-full border border-ocean-bright/20">
                  <span className="text-lg">📍</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-navy-text leading-tight">
                      {city}, {state}
                    </span>
                    <span className="text-xs text-gray-500">
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </span>
                  </div>
                </div>
              )}

              {/* Adventure Menu */}
              <div>
                <div className="text-xs text-gray-500 font-bold uppercase px-3 mb-2">🎒 Adventure</div>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setViewMode('cirqle');
                      window.history.pushState({}, '', '/?view=cirqle');
                      setShowMobileMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all ${
                      viewMode === 'cirqle'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-white text-gray-700 hover:bg-purple-50 border border-gray-200'
                    }`}
                  >
                    <span className="text-xl">👥</span>
                    <span className="font-medium">Cirqle</span>
                  </button>

                  <button
                    onClick={() => {
                      setViewMode('trip-creation');
                      window.history.pushState({}, '', '/?view=trip-creation');
                      setShowMobileMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all ${
                      viewMode === 'trip-creation'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-white text-gray-700 hover:bg-orange-50 border border-gray-200'
                    }`}
                  >
                    <span className="text-xl">🌍</span>
                    <span className="font-medium">There-Then</span>
                  </button>

                  <button
                    onClick={() => {
                      setViewMode('trips');
                      window.history.pushState({}, '', '/?view=trips');
                      setShowMobileMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all ${
                      viewMode === 'trips'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-200'
                    }`}
                  >
                    <span className="text-xl">✈️</span>
                    <span className="font-medium">My Trips</span>
                  </button>

                  <button
                    onClick={() => {
                      setViewMode('offgrid');
                      setShowMobileMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all ${
                      viewMode === 'offgrid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-white text-gray-700 hover:bg-green-50 border border-gray-200'
                    }`}
                  >
                    <span className="text-xl">🏕️</span>
                    <span className="font-medium">Off Grid</span>
                  </button>
                </div>
              </div>

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
                      className="w-full text-left px-4 py-2 hover:bg-ocean-bright/10 rounded-md text-sm text-gray-700 hover:text-ocean-bright transition-colors flex items-center justify-between"
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
                  className="w-full flex items-center gap-2 bg-ocean-bright/10 hover:bg-ocean-bright/20 text-ocean-bright px-4 py-2.5 rounded-full text-sm font-medium transition-colors"
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
                className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:text-ocean-bright transition-colors font-medium"
              >
                ⚙️ Settings
              </button>

              {/* Profile */}
              <div className="flex items-center gap-3 px-4 py-2 border-t pt-3">
                {profile.photoURL && (
                  <img
                    src={profile.photoURL}
                    alt={profile.displayName || 'User'}
                    className="w-10 h-10 rounded-full border-2 border-ocean-bright"
                  />
                )}
                <div className="flex-1">
                  <div className="text-sm font-medium text-navy-text">{profile.displayName || 'User'}</div>
                  <button
                    onClick={signOut}
                    className="text-xs text-gray-600 hover:text-ocean-bright transition-colors"
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowControlsDrawer(!showControlsDrawer)}
                className="flex items-center gap-2 hover:opacity-70 transition-opacity"
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

              {/* View Mode Toggle - Next to drawer button */}
              {viewMode !== 'offgrid' && viewMode !== 'cirqle' && viewMode !== 'trip-creation' && viewMode !== 'trips' && viewMode !== 'trip-detail' && (
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-2.5 py-1 rounded-md text-base transition-all ${
                      viewMode === 'list'
                        ? 'bg-white text-ocean-bright shadow-sm'
                        : 'text-gray-600'
                    }`}
                    title="List View"
                  >
                    📋
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`px-2.5 py-1 rounded-md text-base transition-all ${
                      viewMode === 'map'
                        ? 'bg-white text-ocean-bright shadow-sm'
                        : 'text-gray-600'
                    }`}
                    title="Map View"
                  >
                    🗺️
                  </button>
                </div>
              )}
            </div>
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
                        <span className="text-xs font-bold text-navy-text">{radius} mi</span>
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
                        className="px-2.5 py-1 bg-ocean-bright text-white rounded text-xs font-medium hover:bg-ocean-bright/90 transition-colors disabled:opacity-50"
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
                        compact={true}
                      />
                    </div>
                  )}

                  {/* Location Info from Wikipedia - Enhanced with STOKED meter and rich data */}
                  <div className="flex-1 bg-white rounded-lg border border-gray-300 p-4 overflow-y-auto max-h-64">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">About This Area</h3>
                    {city && state ? (
                      <div className="space-y-3">
                        {/* City Header with Wikipedia Link and STOKED Badge */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="text-lg font-bold text-navy-text">{city}, {state}</p>
                          <div className="flex items-center gap-2">
                            {/* Compact STOKED Meter Badge */}
                            {(() => {
                              // Calculate STOKED level based on average activity scores
                              const avgScore = activities.length > 0
                                ? activities.reduce((sum, a) => sum + (a.score || 0), 0) / activities.length
                                : 0;

                              let stokedText = "Give it a shot!";
                              let stokedColor = "bg-gradient-to-r from-gray-400 to-gray-500";

                              if (avgScore >= 280) {
                                stokedText = "You'll love it";
                                stokedColor = "bg-gradient-to-r from-[#FF6B9D] via-[#FEC163] to-[#EE4E4E]";
                              } else if (avgScore >= 220) {
                                stokedText = "You'll like it";
                                stokedColor = "bg-gradient-to-r from-[#FEC163] via-[#FF6B9D] to-[#F97171]";
                              } else if (avgScore >= 180) {
                                stokedText = "You should like it";
                                stokedColor = "bg-gradient-to-r from-[#4FACFE] via-[#00F2FE] to-[#43E97B]";
                              } else if (avgScore >= 140) {
                                stokedText = "Give it a shot!";
                                stokedColor = "bg-gradient-to-r from-[#667EEA] via-[#764BA2] to-[#F093FB]";
                              }

                              return (
                                <div className={`${stokedColor} text-white px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide shadow-sm whitespace-nowrap`}>
                                  {stokedText}
                                </div>
                              );
                            })()}
                            {wikiData?.content_urls?.desktop?.page && (
                              <a
                                href={wikiData.content_urls.desktop.page}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-ocean-bright hover:text-ocean-mid transition-colors font-medium whitespace-nowrap"
                              >
                                Wikipedia →
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Wikipedia Description - Full Text */}
                        {wikiData?.extract && (
                          <p className="text-sm text-gray-600 leading-relaxed mb-3">
                            {wikiData.extract}
                          </p>
                        )}

                        {/* Rich Data Grid - Tufte style */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs border-t border-gray-200 pt-2">
                          {wikiData?.extract && (
                            <>
                              {/* Population */}
                              {(() => {
                                const popMatch = wikiData.extract.match(/population[^0-9]*([0-9,]+)/i);
                                if (popMatch) {
                                  return (
                                    <>
                                      <span className="text-gray-500 font-medium">Population</span>
                                      <span className="text-navy-text text-right font-bold">{popMatch[1]}</span>
                                    </>
                                  );
                                }
                                return null;
                              })()}
                              {/* Founded/Historical fact */}
                              {(() => {
                                const foundedMatch = wikiData.extract.match(/(founded|established|incorporated)[^0-9]*([0-9]{4})/i);
                                if (foundedMatch) {
                                  return (
                                    <>
                                      <span className="text-gray-500 font-medium">Founded</span>
                                      <span className="text-navy-text text-right font-bold">{foundedMatch[2]}</span>
                                    </>
                                  );
                                }
                                return null;
                              })()}
                            </>
                          )}
                          {/* Activities Found */}
                          <span className="text-gray-500 font-medium">Activities</span>
                          <span className="text-navy-text text-right font-bold">{activities.length}</span>
                          {/* Main Street Rating (based on activity density) */}
                          <span className="text-gray-500 font-medium">Main St. Rating</span>
                          <span className="text-navy-text text-right font-bold">
                            {activities.length > 30 ? "⭐⭐⭐" : activities.length > 15 ? "⭐⭐" : activities.length > 5 ? "⭐" : "—"}
                          </span>
                        </div>
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
                        <span className="text-sm font-bold text-navy-text">{radius} mi</span>
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
                      className="w-full px-3 py-1.5 bg-ocean-bright text-white rounded-md text-xs font-medium hover:bg-ocean-bright/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
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
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-ocean-bright border-t-transparent mx-auto mb-4"></div>
            <p className="text-navy-text font-medium">Finding activities...</p>
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
                <h3 className="text-xl font-bold text-navy-text mb-2">No activities found</h3>
                <p className="text-gray-600">Try expanding your search radius</p>
              </div>
            ) : (
              <>
                {/* Map View with Compact List */}
                {viewMode === 'map' && (
                  <div className="space-y-4">
                    {/* Map */}
                    <ActivityMap
                      activities={activities}
                      userLocation={activeLocation}
                      onLocationChange={handleMapLocationChange}
                    />

                    {/* Compact Activity List - Tufte Style */}
                    <div className="space-y-2">
                      {/* Sort by score and show top 20 */}
                      {activities
                        .sort((a, b) => (b.score || 0) - (a.score || 0))
                        .slice(0, 20)
                        .map((activity) => {
                          // Category-based gradient
                          const getCategoryGradient = (cat: string) => {
                            switch (cat) {
                              case 'hiking': return 'from-green-50 to-emerald-50 border-green-200';
                              case 'events': return 'from-purple-50 to-pink-50 border-purple-200';
                              case 'food_and_dining': return 'from-orange-50 to-amber-50 border-orange-200';
                              case 'arts_and_culture': return 'from-pink-50 to-rose-50 border-pink-200';
                              case 'sports_and_recreation': return 'from-blue-50 to-cyan-50 border-blue-200';
                              case 'nature_and_outdoors': return 'from-teal-50 to-green-50 border-teal-200';
                              case 'entertainment': return 'from-indigo-50 to-purple-50 border-indigo-200';
                              case 'shopping': return 'from-yellow-50 to-amber-50 border-yellow-200';
                              case 'museums': return 'from-amber-50 to-orange-50 border-amber-200';
                              default: return 'from-gray-50 to-slate-50 border-gray-200';
                            }
                          };

                          const getCategoryEmoji = (cat: string) => {
                            switch (cat) {
                              case 'hiking': return '🥾';
                              case 'events': return '🎉';
                              case 'food_and_dining': return '🍽️';
                              case 'arts_and_culture': return '🎨';
                              case 'sports_and_recreation': return '⚽';
                              case 'nature_and_outdoors': return '🌲';
                              case 'entertainment': return '🎭';
                              case 'shopping': return '🛍️';
                              case 'museums': return '🏛️';
                              default: return '📍';
                            }
                          };

                          // Calculate STOKED badge
                          const score = activity.score || 0;
                          let stokedText = "";
                          let stokedColor = "";
                          if (score >= 280) {
                            stokedText = "You'll love it";
                            stokedColor = "bg-gradient-to-r from-[#FF6B9D] via-[#FEC163] to-[#EE4E4E]";
                          } else if (score >= 220) {
                            stokedText = "You'll like it";
                            stokedColor = "bg-gradient-to-r from-[#FEC163] via-[#FF6B9D] to-[#F97171]";
                          } else if (score >= 180) {
                            stokedText = "You should like it";
                            stokedColor = "bg-gradient-to-r from-[#4FACFE] via-[#00F2FE] to-[#43E97B]";
                          } else if (score >= 140) {
                            stokedText = "Give it a shot!";
                            stokedColor = "bg-gradient-to-r from-[#667EEA] via-[#764BA2] to-[#F093FB]";
                          }

                          const category = activity.primaryCategory || 'other';

                          return (
                            <div
                              key={activity.id || activity.activityId}
                              className={`bg-gradient-to-r ${getCategoryGradient(category)} border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer`}
                            >
                              <div className="flex items-start gap-3">
                                {/* Category Emoji */}
                                <div className="text-3xl flex-shrink-0">
                                  {getCategoryEmoji(category)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  {/* Name + Distance */}
                                  <div className="flex items-start justify-between gap-3 mb-1.5">
                                    <h4 className="font-bold text-base text-navy-text line-clamp-2 flex-1 leading-snug">
                                      {activity.name}
                                    </h4>
                                    <span className="text-sm text-gray-600 whitespace-nowrap font-medium">
                                      {activity.distance?.toFixed(1)} mi
                                    </span>
                                  </div>

                                  {/* Info Grid - Dense but readable */}
                                  <div className="flex items-center gap-3 text-sm text-gray-700 mb-2 flex-wrap">
                                    <span className="capitalize text-gray-600 font-medium">
                                      {category.replace(/_/g, ' ')}
                                    </span>
                                    {activity.rating && (
                                      <span className="flex items-center gap-1 font-medium">
                                        ⭐ {activity.rating.toFixed(1)}
                                      </span>
                                    )}
                                    {activity.cost?.free && (
                                      <span className="text-green-600 font-bold">Free</span>
                                    )}
                                    {activity.cost?.priceLevel && !activity.cost.free && (
                                      <span className="font-medium">{'$'.repeat(activity.cost.priceLevel)}</span>
                                    )}
                                    {activity.accessibility?.wheelchairAccessible && (
                                      <span title="Wheelchair Accessible">♿</span>
                                    )}
                                  </div>

                                  {/* STOKED Badge */}
                                  {stokedText && (
                                    <div className={`${stokedColor} text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide inline-block shadow-sm`}>
                                      {stokedText}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {activities.length > 20 && (
                      <p className="text-center text-xs text-gray-500 mt-2">
                        Showing top 20 of {activities.length} activities • Switch to List view for full details
                      </p>
                    )}
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

                {/* Cirqle View */}
                {viewMode === 'cirqle' && <CirqleManager />}

                {/* Trip Planning View */}
                {viewMode === 'trip-creation' && <TripCreation />}

                {/* My Trips View */}
                {viewMode === 'trips' && <MyTrips />}

                {/* Trip Detail View */}
                {viewMode === 'trip-detail' && tripId && <TripDetail tripId={tripId} />}

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
                                <h3 className="text-xl font-bold text-navy-text capitalize">
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
                          <h3 className="text-2xl font-bold text-navy-text mb-2">
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

      {/* Footer */}
      <footer className="bg-navy-text text-white mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            {/* About */}
            <div>
              <h3 className="font-bold text-xl mb-3">AgentQu</h3>
              <p className="text-gray-300 text-sm">
                Discover amazing activities near you with personalized recommendations powered by AI.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-lg mb-3">Legal</h3>
              <div className="space-y-2">
                <a href="/privacy" className="block text-gray-300 hover:text-white text-sm transition-colors">
                  Privacy Policy
                </a>
                <a href="/terms" className="block text-gray-300 hover:text-white text-sm transition-colors">
                  Terms of Service
                </a>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-bold text-lg mb-3">Get in Touch</h3>
              <div className="space-y-2">
                <a href="/contact" className="block text-gray-300 hover:text-white text-sm transition-colors">
                  Contact Us
                </a>
                <a href="mailto:support@agentqu.com" className="block text-gray-300 hover:text-white text-sm transition-colors">
                  support@agentqu.com
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-700 pt-6 text-center text-sm text-gray-400">
            <p>© {new Date().getFullYear()} AgentQu. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
