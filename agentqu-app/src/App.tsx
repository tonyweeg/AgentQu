import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import { useLocation } from './hooks/useLocation';
import { useDiscovery } from './hooks/useDiscovery';
import { useReverseGeocode } from './hooks/useReverseGeocode';
import AuthScreen from './components/AuthScreen';
import OnboardingScreen from './components/OnboardingScreen';
import ActivityCard from './components/ActivityCard';
import ActivityMap from './components/ActivityMap';
import ActivityDetailTray from './components/ActivityDetailTray';
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
import BiomeRenderer from './biomes/core/BiomeRenderer';
import LocalFlavorColumn from './components/LocalFlavorColumn';
import EVPanel from './components/EVPanel';
import BeenThereView from './components/BeenThereView';
import { DiscoveryFilters, Activity } from './lib/types';

// Known chain restaurants and brands (same as backend)
const KNOWN_CHAINS = [
  // Fast Food Chains
  'mcdonalds', "mcdonald's", 'burger king', 'wendy\'s', 'wendys',
  'taco bell', 'kfc', 'popeyes', 'chick-fil-a', 'chick fil a',
  'sonic', 'dairy queen', 'arby\'s', 'arbys', 'carl\'s jr', 'carls jr',
  'hardee\'s', 'hardees', 'jack in the box', 'white castle',
  'five guys', 'in-n-out', 'shake shack', 'whataburger',

  // Pizza Chains
  'pizza hut', 'dominos', 'domino\'s', 'papa john\'s', 'papa johns',
  'little caesars', 'papa murphy\'s', 'marco\'s pizza',

  // Sandwich/Sub Chains
  'subway', 'jimmy john\'s', 'jimmy johns', 'jersey mike\'s',
  'firehouse subs', 'quiznos', 'blimpie', 'potbelly',

  // Coffee Chains (corporate, not local)
  'starbucks', 'dunkin', 'dunkin donuts', 'tim hortons',

  // Convenience Stores
  'wawa', '7-eleven', '7 eleven', 'circle k', 'sheetz',
  'cumberland farms', 'speedway', 'pilot', 'flying j',
  'love\'s', 'loves', 'ta petro', 'am/pm', 'ampm',

  // Casual Dining Chains
  'applebee\'s', 'applebees', 'chili\'s', 'chilis', 'tgi friday\'s',
  'red lobster', 'olive garden', 'outback steakhouse',
  'texas roadhouse', 'longhorn steakhouse', 'cracker barrel',
  'denny\'s', 'dennys', 'ihop', 'waffle house', 'bob evans',
  'panera bread', 'panera', 'chipotle', 'qdoba', 'moe\'s southwest',

  // Other Chains
  'panda express', 'pei wei', 'noodles & company',
  'buffalo wild wings', 'wingstop', 'hooters',
  'golden corral', 'cici\'s pizza', 'cicis pizza',

  // Big Box Stores (last resort only)
  'walmart', 'target', 'costco', 'sam\'s club', 'sams club',
  'bj\'s wholesale', 'bjs wholesale'
];

// Check if a place is a known chain
function isKnownChain(placeName: string): boolean {
  const nameLower = (placeName || '').toLowerCase();
  return KNOWN_CHAINS.some(chain => nameLower.includes(chain));
}

// Normalize chain name for grouping (remove numbers, addresses, etc)
function normalizeChainName(placeName: string): string {
  let normalized = placeName.toLowerCase().trim();

  // Remove common suffixes and prefixes
  normalized = normalized.replace(/#\d+$/, ''); // Remove #123
  normalized = normalized.replace(/\d+$/, ''); // Remove trailing numbers
  normalized = normalized.replace(/\s+-\s+.*$/, ''); // Remove everything after " - "
  normalized = normalized.replace(/\s+\(.*\)/, ''); // Remove parenthetical info

  return normalized.trim();
}

// Extended Activity type with grouped locations
interface GroupedActivity extends Activity {
  isGrouped?: boolean;
  locationCount?: number;
  locations?: Activity[];
}

// Group activities by chain name when showFastFood is active
function groupActivitiesByChain(activities: Activity[], shouldGroup: boolean): GroupedActivity[] {
  if (!shouldGroup) {
    return activities;
  }

  const chainGroups: { [key: string]: Activity[] } = {};
  const nonChains: Activity[] = [];

  // Separate chains from non-chains
  activities.forEach(activity => {
    if (isKnownChain(activity.name)) {
      const normalizedName = normalizeChainName(activity.name);
      if (!chainGroups[normalizedName]) {
        chainGroups[normalizedName] = [];
      }
      chainGroups[normalizedName].push(activity);
    } else {
      nonChains.push(activity);
    }
  });

  // Create grouped activities
  const grouped: GroupedActivity[] = [];

  Object.entries(chainGroups).forEach(([chainName, locations]) => {
    if (locations.length > 1) {
      // Multiple locations - create grouped activity
      const primaryLocation = locations[0];
      grouped.push({
        ...primaryLocation,
        isGrouped: true,
        locationCount: locations.length,
        locations: locations.sort((a, b) => (a.distance || 0) - (b.distance || 0)), // Sort by distance
        name: locations[0].name.split(' -')[0].split(' #')[0].replace(/\d+$/, '').trim() // Clean name
      });
    } else {
      // Single location - keep as is
      grouped.push(locations[0]);
    }
  });

  // Combine and sort by score
  return [...grouped, ...nonChains].sort((a, b) => (b.score || 0) - (a.score || 0));
}

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
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'offgrid' | 'trip-creation' | 'trips' | 'trip-detail' | 'cirqle' | 'been-there'>(
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [offgridViewMode, setOffgridViewMode] = useState<'list' | 'map'>('list');
  const [showEVPanel, setShowEVPanel] = useState(false);
  const [showEVMap, setShowEVMap] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showDetailTray, setShowDetailTray] = useState(false);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [showFastFood, setShowFastFood] = useState(false); // Toggle for "Give me all the calories!"
  const [textSearch, setTextSearch] = useState(''); // Text search query
  const [activeTextSearch, setActiveTextSearch] = useState(''); // Currently active search
  const [canScrollLeft, setCanScrollLeft] = useState(false); // Can scroll controls left
  const [canScrollRight, setCanScrollRight] = useState(false); // Can scroll controls right
  const controlsScrollRef = useRef<HTMLDivElement>(null);
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
  const { activities, chargingStations, loading: activitiesLoading, error: activitiesError, metadata } = useDiscovery({
    location: profile?.onboarded ? activeLocation : null,
    userId: user?.uid || null,
    filters,
    enablePlaces,
    enableCustomSearch,
    showFastFood,
    textSearch: activeTextSearch,
    key: refreshKey
  });

  // Don't auto-request location - let user trigger it manually
  // This is important for Safari mobile which requires user interaction
  // Location request happens in the "Enable Location" screen below

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check if controls can scroll left/right
  const checkScrollPosition = () => {
    const container = controlsScrollRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const canLeft = scrollLeft > 5; // Give it a 5px threshold
    const canRight = scrollLeft < scrollWidth - clientWidth - 5; // -5 for small buffer

    setCanScrollLeft(canLeft);
    setCanScrollRight(canRight);
  };

  // Attach scroll listener to controls container
  useEffect(() => {
    const container = controlsScrollRef.current;
    if (!container) return;

    // Check initial state
    checkScrollPosition();

    // Safari mobile needs a delayed check after layout completes
    const safariDelayCheck = setTimeout(() => {
      checkScrollPosition();
    }, 100);

    // Use polling during scroll for mobile reliability
    let scrollTimer: NodeJS.Timeout | null = null;
    let isScrolling = false;

    const handleScrollStart = () => {
      if (isScrolling) return;
      isScrolling = true;

      // Poll every 50ms while scrolling
      scrollTimer = setInterval(() => {
        checkScrollPosition();
      }, 50);
    };

    const handleScrollEnd = () => {
      if (scrollTimer) {
        clearInterval(scrollTimer);
        scrollTimer = null;
      }
      isScrolling = false;
      // Final check after scroll ends
      setTimeout(checkScrollPosition, 100);
    };

    // Listen for scroll events - works on most browsers
    container.addEventListener('scroll', () => {
      handleScrollStart();
      // Reset the timeout on every scroll event
      if (scrollTimer) {
        clearInterval(scrollTimer);
      }
      scrollTimer = setInterval(checkScrollPosition, 50);

      // Clear polling after scroll stops (no events for 150ms)
      setTimeout(() => {
        if (scrollTimer) {
          clearInterval(scrollTimer);
          scrollTimer = null;
          isScrolling = false;
          checkScrollPosition();
        }
      }, 150);
    }, { passive: true });

    // Touch events for mobile
    container.addEventListener('touchstart', handleScrollStart, { passive: true });
    container.addEventListener('touchmove', checkScrollPosition, { passive: true });
    container.addEventListener('touchend', handleScrollEnd, { passive: true });

    // Check on resize in case content width changes
    window.addEventListener('resize', checkScrollPosition);

    return () => {
      clearTimeout(safariDelayCheck);
      if (scrollTimer) clearInterval(scrollTimer);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, []);

  // Re-check scroll position when activities load or view changes
  useEffect(() => {
    checkScrollPosition();
  }, [activities.length, viewMode]);

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
  }, [activeLocation, city]);

  // Filter geocaches from activities
  const geocaches = activities.filter((activity) => activity.type === 'cache');

  // Calculate Q scores for charging stations (for EV map mode)
  const evStationsWithQScores = chargingStations.map(station => {
    const name = station.name.toLowerCase();

    // Priority detection
    const isWawa = name.includes('wawa');
    const isTesla = name.includes('tesla');
    const is250kw = name.includes('250') || name.includes('350');
    const isPriority = isWawa || isTesla || is250kw;

    // Q Score calculation
    let qScore = 100; // Base
    if (isPriority) qScore += 40; // Priority bonus
    qScore += Math.max(0, 30 - (station.distance * 2)); // Distance score (closer = higher)

    return {
      ...station,
      qScore: Math.round(qScore),
      isPriority,
      isWawa,
      isTesla,
      is250kw
    };
  }).sort((a, b) => {
    // Tesla superchargers take absolute precedence
    if (a.isTesla && !b.isTesla) return -1;
    if (!a.isTesla && b.isTesla) return 1;

    // Then other priorities (Wawa, 250kW+)
    if (a.isPriority && !b.isPriority) return -1;
    if (!a.isPriority && b.isPriority) return 1;

    // Within same priority level, sort by Q score
    return b.qScore - a.qScore;
  });

  // Top 3 EV stations for map display
  const top3EVStations = evStationsWithQScores.slice(0, 3);

  // Handle map drag to search new location
  const handleMapLocationChange = (lat: number, lng: number) => {
    console.log('🗺️ Searching new location from map drag:', lat, lng);
    setManualLocation({ lat, lng });
    setRefreshKey(prev => prev + 1);
  };

  // Handle marker click to open detail tray
  const handleMarkerClick = (activity: Activity) => {
    console.log('🗺️ MAP_DEBUG: Opening detail tray for:', activity.name);
    const index = activities.findIndex(a => (a.id || a.activityId) === (activity.id || activity.activityId));
    setSelectedActivity(activity);
    setCurrentActivityIndex(index !== -1 ? index : 0);
    setShowDetailTray(true);
  };

  // Handle tray navigation
  const handleNextActivity = () => {
    if (currentActivityIndex < activities.length - 1) {
      const nextIndex = currentActivityIndex + 1;
      setCurrentActivityIndex(nextIndex);
      setSelectedActivity(activities[nextIndex]);
    }
  };

  const handlePrevActivity = () => {
    if (currentActivityIndex > 0) {
      const prevIndex = currentActivityIndex - 1;
      setCurrentActivityIndex(prevIndex);
      setSelectedActivity(activities[prevIndex]);
    }
  };

  // Debug: Log activity types
  useEffect(() => {
    if (activities.length > 0) {
      console.log('🗺️ CLIENT DEBUG: Total activities:', activities.length);
      console.log('🗺️ CLIENT DEBUG: Activity types:', activities.map(a => a.type));
      console.log('🗺️ CLIENT DEBUG: Geocaches found:', geocaches.length);
    }
  }, [activities, geocaches.length]);

  // Fetch Wikipedia info about the city with rich data
  const [wikiData, setWikiData] = useState<any>(null);
  useEffect(() => {
    const fetchLocationInfo = async () => {
      if (!city || !state) {
        setWikiData(null);
        return;
      }

      try {
        // Use Wikipedia API to get a summary
        const searchQuery = `${city}, ${state}`;
        const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchQuery)}`;

        const response = await fetch(wikiUrl);
        if (response.ok) {
          const data = await response.json();
          setWikiData(data);
        } else {
          // Fallback: try without state
          const fallbackUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`;
          const fallbackResponse = await fetch(fallbackUrl);
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setWikiData(fallbackData);
          } else {
            setWikiData(null);
          }
        }
      } catch (error) {
        console.error('Error fetching location info:', error);
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
          <header className="bg-white/85 backdrop-blur-sm shadow-sm sticky top-0 z-10">
            <div className="w-full px-4 py-4 sm:px-6">
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
            <div className="w-full px-4">
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

  // Corporate pages accessible while authenticated
  if (isPrivacyPolicy || isTermsOfService || isContactUs) {
    return (
      <div className="min-h-screen bg-transparent">
        {/* Simple Header for logged-in users on corporate pages */}
        <header className="bg-white/85 backdrop-blur-sm shadow-sm sticky top-0 z-10">
          <div className="w-full px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <a href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                <img src="/agentqu-glyph.png" alt="AgentQu" className="h-8 w-8 hidden lg:block" />
                <h1 className="text-2xl sm:text-3xl font-bold text-black" style={{ letterSpacing: '-0.05em' }}>AgentQu</h1>
              </a>

              {/* Navigation Links */}
              <div className="flex items-center gap-4">
                <a href="/" className="text-sm font-medium text-gray-700 hover:text-ocean-bright transition-colors">Home</a>
                <a href="/privacy" className="text-sm font-medium text-gray-700 hover:text-ocean-bright transition-colors">Privacy</a>
                <a href="/terms" className="text-sm font-medium text-gray-700 hover:text-ocean-bright transition-colors">Terms</a>
                <a href="/contact" className="text-sm font-medium text-gray-700 hover:text-ocean-bright transition-colors">Contact</a>
                {profile.photoURL && (
                  <img
                    src={profile.photoURL}
                    alt={profile.displayName || 'User'}
                    className="w-8 h-8 rounded-full border-2 border-ocean-bright"
                  />
                )}
                <button
                  onClick={signOut}
                  className="text-sm text-gray-600 hover:text-ocean-bright transition-colors"
                >
                  Sign Out
                </button>
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
          <div className="w-full px-4">
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

  // Location permission needed - Show welcome screen with manual trigger
  // This is important for Safari mobile which requires user interaction
  if (!location && !locationLoading && !locationError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-seafoam p-4">
        <div className="text-center max-w-md">
          <img
            src="/agentqu-logo.png"
            alt="AgentQu"
            className="h-24 w-auto mx-auto mb-6 opacity-90"
          />
          <div className="text-6xl mb-6">📍</div>
          <h2 className="text-3xl font-bold text-navy-text mb-3">One More Step!</h2>
          <p className="text-gray-700 mb-6 text-lg">
            We need your location to find amazing activities nearby.
          </p>
          <button
            onClick={() => requestLocation()}
            className="bg-ocean-bright text-white px-8 py-4 rounded-xl hover:bg-ocean-mid transition-colors font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Enable Location 📍
          </button>
          <p className="text-gray-500 mt-6 text-sm">
            Your location is only used to find activities near you and is never shared.
          </p>
        </div>
      </div>
    );
  }

  // Location loading
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
          <p className="text-gray-600 mt-2 text-sm">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  // Location error - Show helpful message with retry
  if (locationError) {
    const errorMessages = {
      1: {
        title: 'Location Permission Denied',
        message: 'Please enable location access in your device settings to use AgentQu.',
        tip: 'On iPhone: Settings → Privacy & Security → Location Services → Safari Websites → Choose "While Using the App" and enable "Use Precise Location"'
      },
      2: {
        title: 'Location Unavailable',
        message: 'Unable to determine your location. Please check your device settings.',
        tip: 'Make sure Location Services are enabled: Settings → Privacy & Security → Location Services (turn ON)'
      },
      3: {
        title: 'Location Request Timeout',
        message: 'The location request took too long. Please try again.',
        tip: 'This can happen on slower connections or if GPS signal is weak. We\'ll retry automatically.'
      }
    };

    const errorInfo = errorMessages[locationError.code as keyof typeof errorMessages] || {
      title: 'Location Error',
      message: 'Unable to get your location. Please try again.',
      tip: 'Make sure Location Services are enabled in your device settings.'
    };

    return (
      <div className="flex items-center justify-center min-h-screen bg-seafoam p-4">
        <div className="text-center max-w-lg bg-white rounded-2xl shadow-xl p-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-navy-text mb-3">{errorInfo.title}</h2>
          <p className="text-gray-700 mb-4">{errorInfo.message}</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-blue-900 leading-relaxed">
              <span className="font-bold">💡 How to fix:</span>
            </p>
            <p className="text-sm text-blue-800 mt-2 leading-relaxed">
              {errorInfo.tip}
            </p>
          </div>
          <button
            onClick={() => requestLocation()}
            className="bg-ocean-bright text-white px-8 py-3 rounded-xl hover:bg-ocean-mid transition-colors font-medium shadow-lg w-full"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Calculate time of day for theme
  const timeOfDay = (() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 7) return 'dawn';
    if (hour >= 7 && hour < 17) return 'day';
    if (hour >= 17 && hour < 19) return 'dusk';
    return 'night';
  })();

  // Time-aware text colors
  const isDarkBackground = timeOfDay === 'night' || timeOfDay === 'dusk';
  const headerTextColor = isDarkBackground ? 'text-white' : 'text-navy-text';
  const subTextColor = isDarkBackground ? 'text-gray-200' : 'text-gray-600';

  // Main app - show discoveries
  return (
    <>
      {/* Biome Background - Vector-based, location-aware backgrounds */}
      <BiomeRenderer
        location={activeLocation}
        state={state}
        timeOfDay={timeOfDay}
      />

      <div className="min-h-screen bg-transparent relative z-0">
        {/* Header */}
      <header className="bg-white/85 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="w-full px-4 py-4 sm:px-6">
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
                {/* Location Display with Date/Time */}
                <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                  <span className="text-base">📍</span>
                  {city && state ? (
                    <span className="text-xs font-bold text-gray-800">
                      {city}, {state} · {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-700">
                      {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                {/* Nearby Towns */}
                {city && nearbyTowns.length > 0 && (
                  <div className="relative group">
                    <button className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-full border border-amber-200 text-xs font-bold text-gray-800 transition-colors">
                      <span>Nearby</span>
                      <span className="text-[10px]">▼</span>
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all bg-amber-50 text-gray-800 hover:bg-amber-100 border border-amber-200"
                  >
                    <span>🎒</span>
                    <span>Adventure</span>
                    <span className={`text-[10px] transition-transform ${showAdventureMenu ? 'rotate-180' : ''}`}>▼</span>
                  </button>

                  {/* Dropdown Menu */}
                  {showAdventureMenu && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 z-50 overflow-hidden">
                      <button
                        onClick={() => {
                          setViewMode('been-there');
                          window.history.pushState({}, '', '/?view=been-there');
                          setShowAdventureMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-green-50 transition-colors ${
                          viewMode === 'been-there' ? 'bg-green-100 text-green-700' : 'text-gray-700'
                        }`}
                      >
                        <span className="text-xl">✓</span>
                        <span className="font-medium">Places I've Been</span>
                      </button>
                      <button
                        onClick={() => {
                          setViewMode('cirqle');
                          window.history.pushState({}, '', '/?view=cirqle');
                          setShowAdventureMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-purple-50 transition-colors border-t border-gray-100 ${
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
          <div className="lg:hidden border-t border-gray-200 bg-white/85 backdrop-blur-sm">
            <div className="w-full px-4 py-4 space-y-3">
              {/* Location Display */}
              {location && city && state && (
                <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                  <span className="text-base">📍</span>
                  <span className="text-xs font-bold text-gray-800">
                    {city}, {state} · {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              )}

              {/* Adventure Menu */}
              <div>
                <div className="text-xs text-gray-500 font-bold uppercase px-3 mb-2">🎒 Adventure</div>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setViewMode('been-there');
                      window.history.pushState({}, '', '/?view=been-there');
                      setShowMobileMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all ${
                      viewMode === 'been-there'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-white text-gray-700 hover:bg-green-50 border border-gray-200'
                    }`}
                  >
                    <span className="text-xl">✓</span>
                    <span className="font-medium">Places I've Been</span>
                  </button>

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
      <div className="bg-white/85 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="w-full">
          {/* Drawer Toggle Button with View Mode Toggle */}
          <div className="px-4 py-3">
            {/* Mobile: Scrollable horizontal layout with scroll indicators */}
            <div className="relative">
              <div ref={controlsScrollRef} className="overflow-x-auto -mx-4 px-4 pb-2 scrollbar-hide">
                <div className="flex items-center gap-3 min-w-max">
                  <button
                    onClick={() => setShowControlsDrawer(!showControlsDrawer)}
                    className="flex items-center gap-2 hover:opacity-70 transition-opacity flex-shrink-0"
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

                  {/* Text Search Input - Smaller width */}
                  <div className="flex-shrink-0 w-[180px] sm:w-[220px]">
                  <div className="relative">
                    <input
                      type="text"
                      value={textSearch}
                      onChange={(e) => setTextSearch(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && textSearch.trim()) {
                          setActiveTextSearch(textSearch.trim());
                          setRefreshKey(prev => prev + 1);
                        }
                      }}
                      placeholder="Search places..."
                      className="w-full h-[42px] px-4 pr-20 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-ocean-bright focus:border-transparent"
                    />
                    {textSearch && (
                      <button
                        onClick={() => {
                          setTextSearch('');
                          setActiveTextSearch('');
                          setRefreshKey(prev => prev + 1);
                        }}
                        className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (textSearch.trim()) {
                          setActiveTextSearch(textSearch.trim());
                          setRefreshKey(prev => prev + 1);
                        }
                      }}
                      disabled={!textSearch.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-ocean-bright text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-ocean-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      🔍
                    </button>
                  </div>
                </div>

                {/* View Mode Toggle - Pill style with text */}
                {(viewMode === 'list' || viewMode === 'map' || viewMode === 'offgrid') && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex bg-white/80 backdrop-blur-sm rounded-full p-1 border border-gray-200 shadow-sm">
                      <button
                        onClick={() => {
                          if (viewMode === 'offgrid') {
                            setOffgridViewMode('list');
                          } else {
                            setViewMode('list');
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          (viewMode === 'list') || (viewMode === 'offgrid' && offgridViewMode === 'list')
                            ? 'bg-ocean-bright text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <span className="text-base">📋</span>
                        <span>List</span>
                      </button>
                      <button
                        onClick={() => {
                          if (viewMode === 'offgrid') {
                            setOffgridViewMode('map');
                          } else {
                            setViewMode('map');
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          (viewMode === 'map') || (viewMode === 'offgrid' && offgridViewMode === 'map')
                            ? 'bg-ocean-bright text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <span className="text-base">🗺️</span>
                        <span>Map</span>
                      </button>
                    </div>

                    {/* Off-Grid Button - Show for all users */}
                    <button
                      onClick={() => {
                        setViewMode('offgrid');
                        setShowSettings(false);
                        setShowGeocaches(false);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border backdrop-blur-sm whitespace-nowrap ${
                        viewMode === 'offgrid'
                          ? 'bg-green-600 text-white shadow-md border-green-700'
                          : 'bg-white/80 text-gray-700 hover:bg-green-50 border-gray-200'
                      }`}
                    >
                      <span className="text-base">🏕️</span>
                      <span>Off-Grid</span>
                    </button>

                    {/* EV Charging Button - Only show for EV owners with stations */}
                    {profile?.isEV && chargingStations && chargingStations.length > 0 && (
                      <button
                        onClick={() => setShowEVPanel(!showEVPanel)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border backdrop-blur-sm whitespace-nowrap ${
                          showEVPanel
                            ? 'bg-green-600 text-white shadow-md border-green-700'
                            : 'bg-white/80 text-gray-700 hover:bg-green-50 border-gray-200'
                        }`}
                      >
                        <span className="text-base">⚡</span>
                        <span>Charging</span>
                        <span className="text-xs bg-white/30 px-1.5 py-0.5 rounded-full">
                          {chargingStations.length}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Scroll indicator - Arrow stays on right, direction flips when user scrolls */}
              {/* Only show on mobile (< 640px) - shows if can scroll either direction */}
              {(canScrollRight || canScrollLeft) && (
                <div className="absolute -right-4 top-0 bottom-0 w-16 bg-gradient-to-l from-white/90 to-transparent pointer-events-none flex items-center justify-end pr-4 block sm:hidden z-10">
                  <span className="text-ocean-bright text-base animate-pulse font-bold">
                    {canScrollLeft ? '←' : '→'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

          {/* Drawer Content - Small square map + location info + controls */}
          {showControlsDrawer && (
            <div className="border-t border-gray-200 bg-gray-50/50">
              <div className="w-full px-4 py-4">
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
                        <span className="text-xs text-gray-700">🎫 Real Events</span>
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

      {/* EV Charging Panel - Collapsible Tray */}
      {profile?.isEV && activeLocation && showEVPanel && (
        <EVPanel
          stations={chargingStations}
          userLocation={activeLocation}
          onViewAllMap={() => {
            setViewMode('map');
            setShowEVPanel(false);
            setShowEVMap(true);
          }}
        />
      )}

      {/* Activity Detail Tray - Slides down from top */}
      {viewMode === 'map' && (
        <ActivityDetailTray
          activity={selectedActivity}
          isVisible={showDetailTray}
          onClose={() => setShowDetailTray(false)}
          onNext={handleNextActivity}
          onPrev={handlePrevActivity}
          hasNext={currentActivityIndex < activities.length - 1}
          hasPrev={currentActivityIndex > 0}
          currentActivityIndex={currentActivityIndex}
          totalActivities={activities.length}
          userAffinities={profile?.affinities}
        />
      )}

      {/* Main Content */}
      <main className="w-full px-4 py-8 sm:px-6">

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
                    {/* Back to Activities Button (EV mode only) */}
                    {showEVMap && (
                      <button
                        onClick={() => setShowEVMap(false)}
                        className="flex items-center gap-2 bg-white hover:bg-gray-50 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 transition-colors shadow-sm"
                      >
                        <span>←</span>
                        <span>Back to Activities</span>
                      </button>
                    )}

                    {/* Map */}
                    <ActivityMap
                      activities={activities}
                      userLocation={activeLocation}
                      onLocationChange={handleMapLocationChange}
                      onMarkerClick={handleMarkerClick}
                      evMode={showEVMap}
                      evStations={evStationsWithQScores}
                      top3EVStations={top3EVStations}
                    />

                    {/* Compact Activity List - Tufte Style (hide in EV mode) */}
                    {!showEVMap && <div className="space-y-2 mt-4">
                      {/* Top 20 activities sorted by distance */}
                      {activities
                        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
                        .slice(0, 20)
                        .map((activity) => {
                          const category = activity.primaryCategory || 'other';
                          const score = activity.score || 0;

                          // Check if visited
                          const isVisited = profile?.visitedPlaces?.some(
                            p => p.activityId === (activity.id || activity.activityId)
                          );

                          return (
                            <button
                              key={activity.id || activity.activityId}
                              onClick={() => handleMarkerClick(activity)}
                              className="w-full text-left px-3 py-2 bg-white/80 hover:bg-white border border-gray-200 hover:border-ocean-bright rounded-lg transition-all"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline gap-2">
                                    <span className="font-bold text-sm text-navy-text truncate">
                                      {activity.name}
                                    </span>
                                    {isVisited && (
                                      <span className="text-xs text-green-600 font-bold whitespace-nowrap">
                                        ✓ Visited
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-500 capitalize whitespace-nowrap">
                                      {category.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  {activity.rating && <span>⭐ {activity.rating.toFixed(1)}</span>}
                                  <span className="font-medium">{activity.distance?.toFixed(1)} mi</span>
                                  <span className="text-ocean-bright">→</span>
                                </div>
                              </div>
                            </button>
                          );
                        })}

                      {activities.length > 20 && (
                        <p className="text-center text-xs text-gray-500 mt-2">
                          Showing top 20 of {activities.length} activities • Click any to see details
                        </p>
                      )}
                    </div>}
                  </div>
                )}

                {/* Been There View */}
                {viewMode === 'been-there' && (
                  <BeenThereView
                    onBackToResults={() => {
                      setViewMode('list');
                      window.history.pushState({}, '', '/');
                    }}
                  />
                )}

                {/* Off Grid View */}
                {viewMode === 'offgrid' && (
                  <OffGridView
                    activities={activities}
                    userLocation={activeLocation}
                    viewMode={offgridViewMode}
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

                {/* List View - Places First (Cards), Events Below (Text List) */}
                {viewMode === 'list' && (
                  (() => {
                      // Helper function to check if text contains date/time information
                      const hasDateInfo = (text: string): boolean => {
                        if (!text) return false;
                        const lower = text.toLowerCase();

                        // Date patterns
                        const datePatterns = [
                          /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}/i, // "Oct 12", "October 12"
                          /\b\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?/,  // "10/12", "10-12-2025"
                          /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, // Day names
                          /\b(today|tomorrow|tonight|this\s+(week|weekend|month))/i, // Relative dates
                          /\b\d{1,2}(st|nd|rd|th)\s+(of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i, // "12th of October"
                        ];

                        // Time patterns
                        const timePatterns = [
                          /\b\d{1,2}:\d{2}\s*(am|pm|AM|PM)?/,  // "7:30pm", "19:30"
                          /\b(at|from|starting|begins)\s+\d{1,2}/i, // "at 7", "from 6"
                        ];

                        return datePatterns.some(pattern => pattern.test(text)) ||
                               timePatterns.some(pattern => pattern.test(text));
                      };

                      // Separate places from events
                      const places = activities.filter(a => a.type === 'permanent');

                      // Filter events to only those with date/time information
                      const events = activities.filter(a => {
                        if (a.type !== 'event') return false;

                        // Check if event has structured date field (Ticketmaster, etc.)
                        if ((a as any).details?.eventDate) return true;

                        // Check name, description, and snippet for date/time info
                        const textToCheck = [
                          a.name,
                          a.description,
                          (a as any).details?.description,
                          (a as any).details?.shortDescription
                        ].filter(Boolean).join(' ');

                        return hasDateInfo(textToCheck);
                      });

                      // Get unique categories from places only (exclude events from category chips)
                      const allCategories = Array.from(new Set(places.map(a => a.primaryCategory || 'other')));

                      // Filter places by selected category
                      const filteredPlaces = selectedCategory === 'all'
                        ? places
                        : places.filter(a => (a.primaryCategory || 'other') === selectedCategory);

                      // Sort places by distance (closest first)
                      const sortedPlaces = [...filteredPlaces].sort((a, b) => (a.distance || 0) - (b.distance || 0));

                      // Apply chain grouping when fast food mode is active
                      const displayPlaces = groupActivitiesByChain(sortedPlaces, showFastFood);

                      // Sort events by distance (closest first)
                      const sortedEvents = [...events].sort((a, b) => (a.distance || 0) - (b.distance || 0));

                      // Category emoji mapping
                      const getCategoryEmoji = (cat: string) => {
                        const emojiMap: Record<string, string> = {
                          hiking: '🥾', events: '🎉', food_and_dining: '🍽️',
                          arts_and_culture: '🎨', sports_and_recreation: '⚽',
                          nature_and_outdoors: '🌲', entertainment: '🎭',
                          shopping: '🛍️', museums: '🏛️', camping: '⛺',
                          parks: '🌳', other: '📍'
                        };
                        return emojiMap[cat] || '📍';
                      };

                      // Count places per category
                      const categoryCounts = allCategories.reduce((acc, cat) => {
                        acc[cat] = places.filter(a => (a.primaryCategory || 'other') === cat).length;
                        return acc;
                      }, {} as Record<string, number>);

                      return (
                        <>
                          {/* Category Filter Chips - For Places Only */}
                          {places.length > 0 && (
                            <div className="mb-6 flex flex-wrap gap-2 items-center">
                              {/* Active Text Search Indicator */}
                              {activeTextSearch && (
                                <div className="flex items-center gap-2 bg-sky-100 border-2 border-sky-300 px-4 py-2 rounded-full">
                                  <span className="text-sm font-bold text-gray-800">🔍 Searching:</span>
                                  <span className="text-sm font-bold text-gray-800">"{activeTextSearch}"</span>
                                  <button
                                    onClick={() => {
                                      setTextSearch('');
                                      setActiveTextSearch('');
                                      setRefreshKey(prev => prev + 1);
                                    }}
                                    className="ml-1 bg-white hover:bg-sky-200 text-gray-800 font-bold px-2 py-0.5 rounded-full transition-colors"
                                  >
                                    ✕
                                  </button>
                                </div>
                              )}

                              <button
                                onClick={() => setSelectedCategory('all')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                  selectedCategory === 'all'
                                    ? 'bg-ocean-bright text-white shadow-md'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:border-ocean-bright'
                                }`}
                              >
                                All Places ({places.length})
                              </button>
                              {allCategories
                                .sort((a, b) => categoryCounts[b] - categoryCounts[a])
                                .map(category => (
                                  <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                                      selectedCategory === category
                                        ? 'bg-ocean-bright text-white shadow-md'
                                        : 'bg-white border border-gray-300 text-gray-700 hover:border-ocean-bright'
                                    }`}
                                  >
                                    <span>{getCategoryEmoji(category)}</span>
                                    <span className="capitalize">{category.replace(/_/g, ' ')}</span>
                                    <span className="text-xs opacity-75">({categoryCounts[category]})</span>
                                  </button>
                                ))}

                              {/* Fast Food Toggle - Only show when viewing food/dining category */}
                              {selectedCategory === 'food_and_dining' && (
                                <button
                                  onClick={() => {
                                    setShowFastFood(!showFastFood);
                                    setRefreshKey(prev => prev + 1);
                                  }}
                                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                                    showFastFood
                                      ? 'bg-red-500 text-white border-red-600 shadow-sm'
                                      : 'bg-white text-gray-600 border-gray-300 hover:border-red-400 hover:text-red-500'
                                  }`}
                                  title={showFastFood ? 'Hide chains & fast food' : 'Show chains & fast food'}
                                >
                                  <span>🍔 Give me all the calories!</span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* Places Grid - Cards */}
                          {displayPlaces.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-12">
                              {displayPlaces.map((activity, index) => (
                                <ActivityCard
                                  key={activity.id || activity.activityId}
                                  activity={activity}
                                  index={index}
                                  allActivities={displayPlaces}
                                />
                              ))}
                            </div>
                          )}

                          {displayPlaces.length === 0 && places.length > 0 && (
                            <div className="text-center py-12 mb-12">
                              <div className="text-4xl mb-3">{getCategoryEmoji(selectedCategory)}</div>
                              <p className="text-gray-600">No {selectedCategory.replace(/_/g, ' ')} places found</p>
                            </div>
                          )}

                          {/* Events Section - Grouped by Genre (Top 3 per genre) */}
                          {sortedEvents.length > 0 && (() => {
                            // Group events by music genre
                            const eventsByGenre = sortedEvents.reduce((acc, event) => {
                              const genres = (event as any).musicGenres || ['Other'];
                              const primaryGenre = genres[0] || 'Other';

                              if (!acc[primaryGenre]) {
                                acc[primaryGenre] = [];
                              }
                              acc[primaryGenre].push(event);
                              return acc;
                            }, {} as Record<string, typeof sortedEvents>);

                            // Get genre display info
                            const getGenreInfo = (genre: string): { emoji: string; name: string } => {
                              const genreMap: Record<string, { emoji: string; name: string }> = {
                                'Rock': { emoji: '🎸', name: 'Rock' },
                                'Pop': { emoji: '✨', name: 'Pop' },
                                'Country': { emoji: '🤠', name: 'Country' },
                                'Hip-Hop/Rap': { emoji: '🎤', name: 'Hip-Hop' },
                                'R&B': { emoji: '💜', name: 'R&B' },
                                'Jazz': { emoji: '🎺', name: 'Jazz' },
                                'Blues': { emoji: '🎹', name: 'Blues' },
                                'Classical': { emoji: '🎻', name: 'Classical' },
                                'Latin': { emoji: '💃', name: 'Latin' },
                                'Other': { emoji: '🎵', name: 'Other' }
                              };
                              return genreMap[genre] || { emoji: '🎵', name: genre };
                            };

                            return (
                              <div className="mt-8 space-y-8">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-2xl font-bold text-white">🎉 Upcoming Events</h3>
                                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
                                    {Object.keys(eventsByGenre).length} genres, {sortedEvents.length} total
                                  </span>
                                </div>

                                {Object.entries(eventsByGenre)
                                  .sort(([, a], [, b]) => b.length - a.length) // Sort by number of events per genre
                                  .map(([genre, genreEvents]) => {
                                    const { emoji, name } = getGenreInfo(genre);
                                    const topEvents = genreEvents.slice(0, 3); // Only show top 3

                                    return (
                                      <div key={genre} className="space-y-3">
                                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                          <span className="text-2xl">{emoji}</span>
                                          <span>{name}</span>
                                          <span className="text-sm font-normal text-white/70">
                                            ({genreEvents.length} event{genreEvents.length !== 1 ? 's' : ''})
                                          </span>
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                          {topEvents.map((event, index) => (
                                            <ActivityCard
                                              key={event.id || event.activityId}
                                              activity={event}
                                              index={index}
                                              allActivities={topEvents}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            );
                          })()}

                          {/* Empty State */}
                          {places.length === 0 && events.length === 0 && (
                            <div className="text-center py-12">
                              <div className="text-6xl mb-4">🔍</div>
                              <h3 className="text-xl font-bold text-navy-text mb-2">No activities found</h3>
                              <p className="text-gray-600">Try expanding your search radius</p>
                            </div>
                          )}
                        </>
                      );
                    })()
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
      <footer className="bg-navy-text/40 backdrop-blur-sm text-white mt-12 py-8">
        <div className="w-full px-4">
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
    </>
  );
}

export default App;
