/**
 * Application Constants
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Constants only
 * - DRY: Single source of truth for all constants
 */

// ============================================================================
// KNOWN CHAINS & FILTERS
// ============================================================================

const FAST_FOOD_CHAINS = [
  'mcdonalds',
  "mcdonald's",
  'burger king',
  "wendy's",
  'wendys',
  'taco bell',
  'kfc',
  'popeyes',
  'chick-fil-a',
  'chick fil a',
  'sonic',
  'dairy queen',
  "arby's",
  'arbys',
  "carl's jr",
  'carls jr',
  "hardee's",
  'hardees',
  'jack in the box',
  'white castle',
  'five guys',
  'in-n-out',
  'shake shack',
  'whataburger',
];

const KNOWN_CHAINS = [
  ...FAST_FOOD_CHAINS,
  // Pizza Chains
  'pizza hut',
  'dominos',
  "domino's",
  "papa john's",
  'papa johns',
  'little caesars',
  "papa murphy's",
  "marco's pizza",
  // Sandwich/Sub Chains
  'subway',
  "jimmy john's",
  'jimmy johns',
  "jersey mike's",
  'firehouse subs',
  'quiznos',
  'blimpie',
  'potbelly',
  // Coffee Chains
  'starbucks',
  'dunkin',
  'dunkin donuts',
  'tim hortons',
  // Convenience Stores
  'wawa',
  '7-eleven',
  '7 eleven',
  'circle k',
  'sheetz',
  'cumberland farms',
  'speedway',
  'pilot',
  'flying j',
  "love's",
  'loves',
  'ta petro',
  'am/pm',
  'ampm',
  // Casual Dining Chains
  "applebee's",
  'applebees',
  "chili's",
  'chilis',
  "tgi friday's",
  'red lobster',
  'olive garden',
  'outback steakhouse',
  'texas roadhouse',
  'longhorn steakhouse',
  'cracker barrel',
  "denny's",
  'dennys',
  'ihop',
  'waffle house',
  'bob evans',
  'panera bread',
  'panera',
  'chipotle',
  'qdoba',
  "moe's southwest",
  // Other Chains
  'panda express',
  'pei wei',
  'noodles & company',
  'buffalo wild wings',
  'wingstop',
  'hooters',
  'golden corral',
  "cici's pizza",
  'cicis pizza',
  // Big Box Stores
  'walmart',
  'target',
  'costco',
  "sam's club",
  'sams club',
  "bj's wholesale",
  'bjs wholesale',
];

const HEALTHY_FOOD_INDICATORS = [
  // Place types
  'smoothie',
  'juice',
  'juice bar',
  'health food',
  'organic',
  'vegan',
  'vegetarian',
  'salad',
  'whole foods',
  'natural foods',
  'farm to table',
  'farmers market',
  'produce',
  'fresh market',
  // Meal types
  'acai',
  'poke',
  'poke bowl',
  'grain bowl',
  'mediterranean',
  'middle eastern',
  // Shop types
  'bagel',
  'bagel shop',
  'deli',
  'sandwich shop',
  'smoothie bowl',
  'fresh juice',
];

// ============================================================================
// SCORING THRESHOLDS
// ============================================================================

const MUSIC_GENRE_FILTER_THRESHOLD = 20;
const RESTAURANT_GENRE_FILTER_THRESHOLD = 20;

// ============================================================================
// CACHE SETTINGS
// ============================================================================

const CACHE_TTL = {
  ACTIVITIES: 3600, // 1 hour in seconds
  WEATHER: 1800, // 30 minutes
  VIBE_INDEX: 7200, // 2 hours
  GEOCODE: 86400, // 24 hours
};

// ============================================================================
// API RATE LIMITS
// ============================================================================

const RATE_LIMITS = {
  PLACES_API_MAX_RESULTS: 60,
  SEARCH_API_MAX_RESULTS: 30,
  TWITTER_API_MAX_RESULTS: 100,
  EVENTBRITE_MAX_RESULTS: 50,
  TICKETMASTER_MAX_RESULTS: 50,
};

// ============================================================================
// DISTANCE & LOCATION
// ============================================================================

const EARTH_RADIUS_MILES = 3959;
const GEOHASH_PRECISION = 7;
const GEOHASH_PRECISE = 9;

// ============================================================================
// VIBEINDEX CATEGORIES
// ============================================================================

const VIBE_CATEGORIES = {
  artsy: {
    name: '🎨 Artsy',
    keywords: ['art', 'gallery', 'exhibit', 'mural', 'artist', 'creative', 'painting', 'sculpture'],
    hashtags: ['art', 'artsy', 'gallery', 'streetart', 'artistsontwitter', 'creative'],
  },
  musicScene: {
    name: '🎵 Music Scene',
    keywords: ['concert', 'band', 'music', 'live music', 'show', 'festival', 'gig', 'venue'],
    hashtags: ['livemusic', 'concert', 'musicfestival', 'localmusic', 'band'],
  },
  businessHub: {
    name: '🏢 Business Hub',
    keywords: ['startup', 'business', 'entrepreneur', 'corporate', 'tech', 'innovation', 'company'],
    hashtags: ['startup', 'entrepreneur', 'business', 'innovation', 'tech'],
  },
  sportsCulture: {
    name: '⚽ Sports Culture',
    keywords: ['game', 'team', 'sports', 'athletic', 'fitness', 'championship', 'tournament'],
    hashtags: ['sports', 'fitness', 'athletics', 'gameon', 'championship'],
  },
  cultureEvents: {
    name: '🎭 Culture & Events',
    keywords: ['festival', 'event', 'cultural', 'community', 'celebration', 'tradition'],
    hashtags: ['festival', 'culturalevent', 'community', 'celebration'],
  },
  quirkyFunky: {
    name: '🌈 Quirky/Funky',
    keywords: ['weird', 'quirky', 'unique', 'funky', 'alternative', 'odd', 'eccentric'],
    hashtags: ['weird', 'quirky', 'keepitweird', 'unique', 'funky'],
  },
  foodieScene: {
    name: '🍽️ Foodie Scene',
    keywords: ['foodie', 'restaurant', 'chef', 'culinary', 'food festival', 'dining'],
    hashtags: ['foodie', 'restaurant', 'foodporn', 'chef', 'dining'],
  },
  nightlife: {
    name: '🌃 Nightlife',
    keywords: ['nightlife', 'bar', 'club', 'party', 'drinks', 'happy hour'],
    hashtags: ['nightlife', 'bars', 'club', 'drinks', 'party'],
  },
};

module.exports = {
  FAST_FOOD_CHAINS,
  KNOWN_CHAINS,
  HEALTHY_FOOD_INDICATORS,
  MUSIC_GENRE_FILTER_THRESHOLD,
  RESTAURANT_GENRE_FILTER_THRESHOLD,
  CACHE_TTL,
  RATE_LIMITS,
  EARTH_RADIUS_MILES,
  GEOHASH_PRECISION,
  GEOHASH_PRECISE,
  VIBE_CATEGORIES,
};
