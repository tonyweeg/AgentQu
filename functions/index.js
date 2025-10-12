const {onCall} = require("firebase-functions/v2/https");
const {onRequest} = require("firebase-functions/v2/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {defineString} = require("firebase-functions/params");
const {setGlobalOptions} = require("firebase-functions/v2");
const admin = require("firebase-admin");
const axios = require("axios");
const geohash = require("ngeohash");
const profanityFilter = require("leo-profanity");

// Set global options for all functions
setGlobalOptions({
  cors: true,
  maxInstances: 10,
});

admin.initializeApp();
const db = admin.firestore();

// Define config parameters
const googlePlacesApiKey = defineString("GOOGLE_PLACES_API_KEY");
const googleSearchApiKey = defineString("GOOGLE_SEARCH_API_KEY");
const googleSearchEngineId = defineString("GOOGLE_SEARCH_ENGINE_ID");
const googleGeocodingApiKey = defineString("GOOGLE_GEOCODING_API_KEY");
const openWeatherApiKey = defineString("OPENWEATHER_API_KEY");
const eventbritePrivateToken = defineString("EVENTBRITE_PRIVATE_TOKEN");
const ticketmasterApiKey = defineString("TICKETMASTER_API_KEY");

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate distance between two points (Haversine formula)
 * @returns {number} Distance in miles
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Map Google Place types to affinity categories
 */
function mapPlaceTypeToCategories(types = []) {
  const categoryMap = {
    // Watersports & Water Activities
    beach: ["watersports", "beaches", "swimming"],
    aquarium: ["watersports", "family"],
    marina: ["boating", "watersports"],

    // Dining & Food
    restaurant: ["dining", "restaurants"],
    cafe: ["coffee", "cafes"],
    bar: ["nightlife", "bars"],
    night_club: ["nightlife", "clubs"],
    food: ["dining", "food_trucks"],
    bakery: ["coffee", "cafes"],

    // Nature & Outdoors
    park: ["parks", "hiking", "picnic"],
    campground: ["camping", "outdoors"],
    hiking_area: ["hiking", "outdoors"],
    natural_feature: ["hiking", "nature"],

    // Culture & Arts
    museum: ["museums", "culture"],
    art_gallery: ["arts", "culture"],
    library: ["culture", "reading"],
    movie_theater: ["movies", "entertainment"],

    // Sports & Fitness
    gym: ["fitness", "sports"],
    stadium: ["sports", "events"],
    bowling_alley: ["sports", "entertainment"],
    golf_course: ["sports", "golf"],

    // Entertainment & Events
    amusement_park: ["family", "entertainment"],
    casino: ["entertainment", "nightlife"],
    spa: ["wellness", "relaxation"],
    shopping_mall: ["shopping", "entertainment"],

    // Community & Volunteering
    church: ["volunteering", "community"],
    community_center: ["volunteering", "community"],
    local_government_office: ["community"],
  };

  const categories = new Set();
  types.forEach((type) => {
    if (categoryMap[type]) {
      categoryMap[type].forEach((cat) => categories.add(cat));
    }
  });

  return Array.from(categories);
}

/**
 * Generate affinity signature from user affinities
 * Top 5 categories for cache key
 */
function generateAffinitySignature(affinities) {
  if (!affinities) return "default";

  const topAffinities = Object.entries(affinities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, score]) => `${cat}:${Math.round(score * 10)}`)
    .join("_");

  return topAffinities || "default";
}

/**
 * Calculate affinity-based score for an activity
 */
function calculateAffinityScore(activityCategories, userAffinities) {
  if (!userAffinities || !activityCategories || activityCategories.length === 0) {
    return 0.5; // Neutral score
  }

  let totalScore = 0;
  let matchCount = 0;

  activityCategories.forEach((category) => {
    if (userAffinities[category] !== undefined) {
      totalScore += userAffinities[category];
      matchCount++;
    }
  });

  // If no matches, return slight preference (0.4) for variety
  if (matchCount === 0) return 0.4;

  // Average affinity score for matched categories
  return totalScore / matchCount;
}

/**
 * Music Genre Affinity Mapping
 * Maps Ticketmaster genre names to our genre IDs
 */
const MUSIC_GENRE_MAP = {
  // Rock & Alternative
  'rock': 'rock',
  'classic rock': 'rock',
  'hard rock': 'rock',
  'alternative': 'alternative',
  'alternative rock': 'alternative',
  'indie rock': 'alternative',
  'metal': 'metal',
  'heavy metal': 'metal',
  'metalcore': 'metal',

  // Pop & Electronic
  'pop': 'pop',
  'dance pop': 'pop',
  'electro pop': 'pop',
  'dance/electronic': 'dance-electronic',
  'edm': 'dance-electronic',
  'house': 'dance-electronic',
  'techno': 'dance-electronic',
  'electronic': 'dance-electronic',

  // Hip Hop & Rap
  'hip-hop/rap': 'hip-hop-rap',
  'rap': 'hip-hop-rap',
  'hip hop': 'hip-hop-rap',
  'french rap': 'hip-hop-rap',

  // R&B & Soul
  'r&b': 'r-and-b',
  'soul': 'r-and-b',
  'funk': 'r-and-b',
  'neo-soul': 'r-and-b',

  // Country & Folk
  'country': 'country',
  'bluegrass': 'country',
  'country folk': 'country',
  'americana': 'country',
  'folk': 'folk',
  'singer-songwriter': 'folk',
  'acoustic': 'folk',

  // Jazz & Blues
  'jazz': 'jazz',
  'swing': 'jazz',
  'bebop': 'jazz',
  'jazz fusion': 'jazz',
  'blues': 'blues',
  'blues rock': 'blues',

  // Classical & Opera
  'classical': 'classical',
  'orchestral': 'classical',
  'chamber music': 'classical',
  'symphony': 'classical',
  'opera': 'opera',
  'operetta': 'opera',

  // Latin & World
  'latin': 'latin',
  'reggaeton': 'latin',
  'salsa': 'latin',
  'latin pop': 'latin',
  'world': 'world',
  'world music': 'world',
  'international': 'world',
  'reggae': 'reggae',
  'ska': 'reggae',
  'caribbean': 'reggae',

  // Special Categories
  'oldies & classics': 'oldies-classics',
  'classic hits': 'oldies-classics',
  'retro': 'oldies-classics',
  'christian': 'christian-gospel',
  'gospel': 'christian-gospel',
  'contemporary christian': 'christian-gospel',
  'other': 'other',
  'undefined': 'other',
  'miscellaneous': 'other',
};

/**
 * Restaurant genre map - Maps Google Places categories to our restaurant genre IDs
 */
const RESTAURANT_GENRE_MAP = {
  // Indian
  'indian': 'indian',
  'indian restaurant': 'indian',
  'curry': 'indian',
  'tandoori': 'indian',
  'biryani': 'indian',

  // Thai
  'thai': 'thai',
  'thai restaurant': 'thai',
  'pad thai': 'thai',
  'tom yum': 'thai',

  // Chinese
  'chinese': 'chinese',
  'chinese restaurant': 'chinese',
  'dim sum': 'chinese',
  'cantonese': 'chinese',
  'szechuan': 'chinese',

  // Japanese
  'japanese': 'japanese',
  'japanese restaurant': 'japanese',
  'sushi': 'japanese',
  'sushi bar': 'japanese',
  'ramen': 'japanese',
  'izakaya': 'japanese',

  // Mexican
  'mexican': 'mexican',
  'mexican restaurant': 'mexican',
  'taco': 'mexican',
  'burrito': 'mexican',
  'tex-mex': 'mexican',

  // Italian
  'italian': 'italian',
  'italian restaurant': 'italian',
  'pasta': 'italian',
  'pizza': 'pizza',
  'pizzeria': 'pizza',
  'trattoria': 'italian',

  // Mediterranean
  'mediterranean': 'mediterranean',
  'mediterranean restaurant': 'mediterranean',
  'greek': 'mediterranean',
  'greek restaurant': 'mediterranean',
  'middle eastern': 'mediterranean',
  'lebanese': 'mediterranean',
  'turkish': 'mediterranean',

  // Vietnamese
  'vietnamese': 'vietnamese',
  'vietnamese restaurant': 'vietnamese',
  'pho': 'vietnamese',
  'banh mi': 'vietnamese',

  // Korean
  'korean': 'korean',
  'korean restaurant': 'korean',
  'korean bbq': 'korean',
  'kimchi': 'korean',
  'bibimbap': 'korean',

  // French
  'french': 'french',
  'french restaurant': 'french',
  'bistro': 'french',
  'brasserie': 'french',
  'creperie': 'french',

  // American & Western
  'american': 'american',
  'american restaurant': 'american',
  'burger': 'american',
  'grill': 'american',
  'hamburger': 'american',
  'bar': 'bar-pub',
  'pub': 'bar-pub',
  'tavern': 'bar-pub',
  'brewpub': 'bar-pub',
  'sports bar': 'bar-pub',
  'diner': 'diner',
  'comfort food': 'diner',
  'home cooking': 'diner',
  'barbecue': 'bbq-southern',
  'bbq': 'bbq-southern',
  'southern': 'bbq-southern',
  'smokehouse': 'bbq-southern',

  // Specialty
  'seafood': 'seafood',
  'seafood restaurant': 'seafood',
  'fish': 'seafood',
  'oyster bar': 'seafood',
  'crab house': 'seafood',
  'lobster': 'seafood',
  'steakhouse': 'steakhouse',
  'steak house': 'steakhouse',
  'steak': 'steakhouse',
  'chophouse': 'steakhouse',
  'prime rib': 'steakhouse',

  // Meal Types & Occasions
  'breakfast': 'breakfast-brunch',
  'breakfast restaurant': 'breakfast-brunch',
  'brunch': 'breakfast-brunch',
  'brunch restaurant': 'breakfast-brunch',
  'pancake': 'breakfast-brunch',
  'waffle': 'breakfast-brunch',
  'eggs': 'breakfast-brunch',
  'coffee': 'coffee-cafe',
  'coffee shop': 'coffee-cafe',
  'cafe': 'coffee-cafe',
  'espresso': 'coffee-cafe',
  'coffeehouse': 'coffee-cafe',
  'bakery': 'bakery-dessert',
  'dessert': 'bakery-dessert',
  'dessert shop': 'bakery-dessert',
  'pastry': 'bakery-dessert',
  'ice cream': 'bakery-dessert',
  'sweets': 'bakery-dessert',

  // Vibe & Style
  'local': 'local-independent',
  'independent': 'local-independent',
  'family-owned': 'local-independent',
  'mom and pop': 'local-independent',
  'chain': 'chain-corporate',
  'franchise': 'chain-corporate',
  'food truck': 'offgrid-casual',
  'street food': 'offgrid-casual',
  'food cart': 'offgrid-casual',
  'outdoor seating': 'offgrid-casual',
  'casual dining': 'offgrid-casual',
  'fine dining': 'fine-dining',
  'upscale': 'fine-dining',
  'elegant': 'fine-dining',
  'gourmet': 'fine-dining',
  'fast food': 'fast-food',
  'quick service': 'fast-food',
  'drive-through': 'fast-food',
  'drive-thru': 'fast-food',
};

/**
 * Calculate music genre affinity score for an event
 * Returns score 0-100, or null if not a music event
 */
function calculateMusicGenreAffinityScore(musicGenres, musicGenreAffinities) {
  // If no genre data or no user affinities, return neutral
  if (!musicGenres || musicGenres.length === 0 || !musicGenreAffinities) {
    return null; // Not applicable
  }

  let totalScore = 0;
  let matchCount = 0;

  // Map Ticketmaster genres to our genre IDs and get affinity scores
  musicGenres.forEach((tmGenre) => {
    const genreId = MUSIC_GENRE_MAP[tmGenre.toLowerCase()];
    if (genreId && musicGenreAffinities[genreId] !== undefined) {
      totalScore += musicGenreAffinities[genreId];
      matchCount++;
    }
  });

  // If no matches found, return neutral score
  if (matchCount === 0) return 50;

  // Return average affinity score
  return Math.round(totalScore / matchCount);
}

/**
 * Filter threshold for music genres (configurable)
 * Events with genre affinity below this score will be filtered out
 */
const MUSIC_GENRE_FILTER_THRESHOLD = 20;

/**
 * Calculate restaurant genre affinity score for a restaurant
 * Returns score 0-100, or null if not a restaurant or no match
 */
function calculateRestaurantGenreAffinityScore(restaurantCategories, restaurantGenreAffinities) {
  // If no category data or no user affinities, return neutral
  if (!restaurantCategories || restaurantCategories.length === 0 || !restaurantGenreAffinities) {
    return null; // Not applicable
  }

  let totalScore = 0;
  let matchCount = 0;

  // Map Google Places categories to our genre IDs and get affinity scores
  const categoriesLower = restaurantCategories.map(c => (c || '').toLowerCase());

  // Check each category against our restaurant genre map
  categoriesLower.forEach((category) => {
    const genreId = RESTAURANT_GENRE_MAP[category];
    if (genreId && restaurantGenreAffinities[genreId] !== undefined) {
      totalScore += restaurantGenreAffinities[genreId];
      matchCount++;
    }
  });

  // If no matches found, return neutral score
  if (matchCount === 0) return 50;

  // Return average affinity score
  return Math.round(totalScore / matchCount);
}

/**
 * Filter threshold for restaurant genres (configurable)
 * Restaurants with genre affinity below this score will be filtered out
 */
const RESTAURANT_GENRE_FILTER_THRESHOLD = 20;

/**
 * Calculate final composite score
 */
function calculateFinalScore(activity, userLat, userLng, userAffinities, musicGenreAffinities, restaurantGenreAffinities) {
  let baseScore = 100;

  // Distance factor (0-30 points)
  const distance = activity.distance || 0;
  if (distance <= 1) baseScore += 30;
  else if (distance <= 3) baseScore += 20;
  else if (distance <= 5) baseScore += 10;
  else if (distance <= 10) baseScore += 5;
  else baseScore -= (distance - 10) * 2; // Penalty for far distances

  // Rating factor (0-20 points)
  if (activity.ratings?.agentQuRating) {
    baseScore += (activity.ratings.agentQuRating / 5) * 20;
  } else if (activity.ratings?.googleRating) {
    baseScore += (activity.ratings.googleRating / 5) * 15;
  }

  // Open now bonus (10 points)
  if (activity.schedule?.isOpen24Hours || activity.openNow) {
    baseScore += 10;
  }

  // Free activities bonus (5 points)
  if (activity.details?.priceLevel === 0) {
    baseScore += 5;
  }

  // Popularity factor (0-15 points)
  if (activity.ratings?.voteScore > 0) {
    baseScore += Math.min(15, activity.ratings.voteScore);
  }

  // Category affinity factor (0-40 points) - BIGGEST WEIGHT
  const affinityScore = calculateAffinityScore(activity.categories, userAffinities);
  const affinityPoints = affinityScore * 40;
  baseScore += affinityPoints;

  // Music genre affinity bonus for events (0-20 points)
  let genreAffinityPoints = 0;
  if (activity.type === 'event' && activity.musicGenres && musicGenreAffinities) {
    const genreScore = calculateMusicGenreAffinityScore(activity.musicGenres, musicGenreAffinities);
    if (genreScore !== null) {
      // Convert 0-100 score to 0-20 points bonus
      genreAffinityPoints = (genreScore / 100) * 20;
      baseScore += genreAffinityPoints;
    }
  }

  // Restaurant genre affinity bonus for dining places (0-15 points)
  let restaurantAffinityPoints = 0;
  if (activity.categories && restaurantGenreAffinities) {
    const restaurantScore = calculateRestaurantGenreAffinityScore(activity.categories, restaurantGenreAffinities);
    if (restaurantScore !== null) {
      // Convert 0-100 score to 0-15 points bonus (slightly less than music for balance)
      restaurantAffinityPoints = (restaurantScore / 100) * 15;
      baseScore += restaurantAffinityPoints;
    }
  }

  return {
    finalScore: Math.max(0, Math.round(baseScore)),
    baseScore: Math.round(baseScore - affinityPoints - genreAffinityPoints - restaurantAffinityPoints),
    affinityScore: Math.round(affinityPoints),
    genreAffinityScore: Math.round(genreAffinityPoints),
    restaurantAffinityScore: Math.round(restaurantAffinityPoints),
  };
}

// ============================================================================
// API FETCHING FUNCTIONS
// ============================================================================

/**
 * Fetch activities from Google Custom Search
 */
async function fetchGoogleSearch(lat, lng, city = null) {
  const GOOGLE_SEARCH_API_KEY = googleSearchApiKey.value();
  const GOOGLE_SEARCH_ENGINE_ID = googleSearchEngineId.value();

  if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
    console.warn("🔍 SEARCH API: Not configured");
    return [];
  }

  try {
    // Calculate date range for next 3 days
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    const formatDate = (date) => {
      const month = date.toLocaleString('en-US', { month: 'short' });
      const day = date.getDate();
      return `${month} ${day}`;
    };

    const dateRange = `${formatDate(today)}-${formatDate(threeDaysFromNow)}`;

    // Use city name if available, otherwise skip Custom Search (coordinates don't work well)
    if (!city) {
      console.log('🔍 SEARCH API: Skipping - no city name available (coordinates not supported)');
      return [];
    }

    // Multiple search queries for immediate/actionable events (next 3 days)
    const queries = [
      `events ${city} today tonight this weekend`,
      `events site:facebook.com ${city} today this weekend`,
      `things to do ${city} this weekend`,
    ];

    const allResults = [];

    for (const searchQuery of queries) {
      try {
        console.log(`🔍 SEARCH API: Trying query: "${searchQuery}"`);

        const response = await axios.get(`https://www.googleapis.com/customsearch/v1`, {
          params: {
            key: GOOGLE_SEARCH_API_KEY,
            cx: GOOGLE_SEARCH_ENGINE_ID,
            q: searchQuery,
            num: 10,
            dateRestrict: 'd30', // Only results from past 30 days (fresh event listings)
          },
        });

        console.log(`🔍 SEARCH API: Got ${response.data.items?.length || 0} results for "${searchQuery}"`);

        if (response.data.items) {
          allResults.push(...response.data.items);
        }
      } catch (queryError) {
        console.error(`🔍 SEARCH API: Query "${searchQuery}" failed:`, queryError.message);
        if (queryError.response) {
          console.error(`🔍 SEARCH API: Status ${queryError.response.status}:`, queryError.response.data);
        }
      }
    }

    console.log(`🔍 SEARCH API: Total results from all queries: ${allResults.length}`);

    if (allResults.length === 0) return [];

    // Deduplicate by URL
    const uniqueResults = Array.from(
      new Map(allResults.map(item => [item.link, item])).values()
    );

    console.log(`🔍 SEARCH API: Unique results after deduplication: ${uniqueResults.length}`);

    // Filter out fake Facebook "events" (posts, pages, groups, etc.)
    const isFakeFacebookEvent = (item) => {
      const url = item.link.toLowerCase();
      const title = item.title.toLowerCase();
      const snippet = item.snippet?.toLowerCase() || '';

      // Not a Facebook URL - keep it
      if (!url.includes('facebook.com') && !url.includes('fb.me')) {
        return false;
      }

      // Real Facebook event URL patterns - keep these
      const realEventPatterns = [
        '/events/',        // facebook.com/events/123456789
        'fb.me/e/',        // fb.me/e/shortcode
        'facebook.com/event', // Alternative pattern
      ];

      if (realEventPatterns.some(pattern => url.includes(pattern))) {
        console.log(`✅ Real FB event: ${title}`);
        return false; // Keep it
      }

      // Fake Facebook content patterns - filter these out
      const fakePatterns = [
        '/posts/',         // Facebook posts
        '/groups/',        // Facebook groups
        '/pages/',         // Facebook pages
        '/photos/',        // Photo posts
        '/videos/',        // Video posts
        '/permalink/',     // Permalink to posts
        '/story.php',      // Stories
        '/watch/',         // Watch videos
        'shared a post',   // Shared posts in snippet
        'commented on',    // Comments
        'posted in',       // Group posts
      ];

      if (fakePatterns.some(pattern => url.includes(pattern) || snippet.includes(pattern))) {
        console.log(`🚫 Fake FB event filtered: ${title} (${url})`);
        return true; // Filter it out
      }

      // If it's a Facebook URL but doesn't match real event or fake patterns,
      // check title/snippet for event keywords
      const eventKeywords = ['event', 'happening', 'tickets', 'register', 'rsvp'];
      const hasEventKeywords = eventKeywords.some(keyword =>
        title.includes(keyword) || snippet.includes(keyword)
      );

      if (!hasEventKeywords) {
        console.log(`🚫 FB content missing event keywords: ${title}`);
        return true; // Filter it out
      }

      return false; // Keep it if it passes all checks
    };

    const filteredResults = uniqueResults.filter(item => !isFakeFacebookEvent(item));

    console.log(`🔍 SEARCH API: After FB filtering: ${filteredResults.length} (removed ${uniqueResults.length - filteredResults.length} fake FB posts)`);

    return filteredResults
      .map((item, index) => ({
        activityId: `search_${Buffer.from(item.link).toString("base64").substring(0, 16)}`,
        name: item.title,
        type: "event",
        location: {
          lat,
          lng,
          geohash: geohash.encode(lat, lng, 7),
          geohashPrecise: geohash.encode(lat, lng, 9),
          address: item.displayLink,
        },
        categories: ["events", "activities"],
        primaryCategory: "event",
        details: {
          description: item.snippet,
          shortDescription: item.snippet.substring(0, 150),
          imageUrl: item.pagemap?.cse_image?.[0]?.src || null,
          website: item.link,
          priceLevel: item.snippet?.toLowerCase().includes("free") ? 0 : null,
        },
        expiration: {
          type: "date",
          expiresAt: Date.now() + 86400000, // 24 hours
          lastVerified: Date.now(),
          isActive: true,
        },
        ratings: {
          googleRating: null,
          agentQuRating: null,
          totalReviews: 0,
          totalVotes: 0,
          upvotes: 0,
          downvotes: 0,
          voteScore: 0,
        },
        searchMetadata: {
          firstSeen: Date.now(),
          lastSearched: Date.now(),
          searchCount: 1,
          source: "google_search",
          sourceId: item.cacheId || item.link || `search_${index}`,
        },
        openNow: true,
      }))
      .filter((activity) => activity.name);
  } catch (error) {
    console.error("Error fetching Google Search:", error.message);
    return [];
  }
}

/**
 * Fetch events from Eventbrite API
 */
async function fetchEventbriteEvents(lat, lng, radius = 10, city = null) {
  const EVENTBRITE_TOKEN = eventbritePrivateToken.value();

  if (!EVENTBRITE_TOKEN) {
    console.warn("🎟️ EVENTBRITE: Not configured");
    return [];
  }

  try {
    const radiusKm = radius * 1.60934; // Convert miles to km

    console.log(`🎟️ EVENTBRITE: Searching events within ${radius} miles (${radiusKm}km) of ${lat},${lng}`);

    const response = await axios.get(`https://www.eventbriteapi.com/v3/events/search`, {
      params: {
        'location.latitude': lat,
        'location.longitude': lng,
        'location.within': `${radiusKm}km`,
        'expand': 'venue,organizer,ticket_availability',
        'page_size': 50,
      },
      headers: {
        'Authorization': `Bearer ${EVENTBRITE_TOKEN}`,
      },
    });

    console.log(`🎟️ EVENTBRITE: Got ${response.data.events?.length || 0} events`);

    if (!response.data.events || response.data.events.length === 0) {
      return [];
    }

    return response.data.events.map((event) => {
      const eventLat = event.venue?.latitude ? parseFloat(event.venue.latitude) : lat;
      const eventLng = event.venue?.longitude ? parseFloat(event.venue.longitude) : lng;

      // Extract event date/time
      const startDate = event.start?.local || event.start?.utc;
      const endDate = event.end?.local || event.end?.utc;

      // Get high-quality image
      const imageUrl = event.logo?.original?.url || event.logo?.url || null;

      // Extract venue info
      const venueName = event.venue?.name || 'Venue TBA';
      const venueAddress = event.venue?.address?.localized_address_display ||
                          event.venue?.address?.address_1 || '';

      // Check if free
      const isFree = event.is_free ||
                    (event.ticket_availability?.minimum_ticket_price?.major_value === 0);

      // Build description
      const description = event.description?.text || event.summary ||
                         `${event.name.text} at ${venueName}`;

      return {
        activityId: `eventbrite_${event.id}`,
        name: event.name.text,
        type: "event",
        location: {
          lat: eventLat,
          lng: eventLng,
          geohash: geohash.encode(eventLat, eventLng, 7),
          geohashPrecise: geohash.encode(eventLat, eventLng, 9),
          address: venueAddress || city || 'Location TBA',
        },
        categories: ["events", "activities"],
        primaryCategory: "event",
        details: {
          description: description,
          shortDescription: description.substring(0, 200),
          imageUrl: imageUrl,
          website: event.url,
          eventDate: startDate,
          eventEndDate: endDate,
          venue: venueName,
          venueAddress: venueAddress,
          organizerName: event.organizer?.name,
          capacity: event.capacity,
          priceLevel: isFree ? 0 : (event.ticket_availability?.minimum_ticket_price?.major_value > 50 ? 3 : 2),
        },
        expiration: {
          type: "date",
          expiresAt: new Date(endDate || startDate).getTime() || Date.now() + 86400000,
          lastVerified: Date.now(),
          isActive: true,
        },
        ratings: {
          googleRating: null,
          agentQuRating: null,
          totalReviews: 0,
          totalVotes: 0,
          upvotes: 0,
          downvotes: 0,
          voteScore: 0,
        },
        searchMetadata: {
          firstSeen: Date.now(),
          lastSearched: Date.now(),
          searchCount: 1,
          source: "eventbrite",
          sourceId: event.id,
        },
        openNow: true,
      };
    }).filter((activity) => activity.name);
  } catch (error) {
    console.error("🎟️ EVENTBRITE: Error fetching events:", error.message);
    if (error.response) {
      console.error(`🎟️ EVENTBRITE: Status ${error.response.status}:`, error.response.data);
    }
    return [];
  }
}

/**
 * Affiliate Tracking Configuration
 *
 * To monetize event ticket sales, sign up for affiliate programs:
 * - Ticketmaster: https://ticketmaster.com/partners
 * - StubHub: https://stubhub.com/affiliates
 * - SeatGeek: https://seatgeek.com/partners
 *
 * Add your affiliate IDs to .env:
 * TICKETMASTER_AFFILIATE_ID=your_id_here
 * STUBHUB_AFFILIATE_ID=your_id_here
 * SEATGEEK_AFFILIATE_ID=your_id_here
 */
function addAffiliateTracking(url, platform) {
  // TODO: Add your affiliate IDs to .env and uncomment the tracking logic below

  // For now, return the URL as-is (may have default tracking from API)
  // The Ticketmaster Discovery API returns URLs with affiliate tracking by default
  return url;

  /* UNCOMMENT WHEN YOU HAVE AFFILIATE IDs:

  const affiliateIds = {
    ticketmaster: process.env.TICKETMASTER_AFFILIATE_ID || null,
    stubhub: process.env.STUBHUB_AFFILIATE_ID || null,
    seatgeek: process.env.SEATGEEK_AFFILIATE_ID || null,
  };

  if (!affiliateIds[platform]) {
    console.warn(`⚠️ No affiliate ID configured for ${platform}`);
    return url;
  }

  // Add affiliate tracking based on platform
  switch (platform) {
    case 'ticketmaster':
      // Ticketmaster affiliate link format
      return `https://ticketmaster.evyy.net/c/${affiliateIds.ticketmaster}?u=${encodeURIComponent(url)}`;

    case 'stubhub':
      // StubHub affiliate link format
      return `${url}${url.includes('?') ? '&' : '?'}affiliateId=${affiliateIds.stubhub}`;

    case 'seatgeek':
      // SeatGeek affiliate link format
      return `${url}${url.includes('?') ? '&' : '?'}aid=${affiliateIds.seatgeek}`;

    default:
      return url;
  }
  */
}

/**
 * Fetch events from Ticketmaster Discovery API
 */
async function fetchTicketmasterEvents(lat, lng, radius = 10, city = null) {
  const TICKETMASTER_API_KEY = ticketmasterApiKey.value();

  if (!TICKETMASTER_API_KEY) {
    console.warn("🎫 TICKETMASTER: Not configured");
    return [];
  }

  try {
    const radiusMiles = radius; // Ticketmaster uses miles directly

    console.log(`🎫 TICKETMASTER: Searching events within ${radiusMiles} miles of ${lat},${lng}`);

    // Get current date in ISO format for filtering future events only
    // Ticketmaster requires YYYY-MM-DDTHH:mm:ssZ (no milliseconds)
    const now = new Date();
    const startDateTime = now.toISOString().replace(/\.\d{3}Z$/, 'Z');

    // Filter to next 3 days for immediate/actionable events
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(now.getDate() + 3);
    const endDateTime = threeDaysFromNow.toISOString().replace(/\.\d{3}Z$/, 'Z');

    console.log(`🎫 TICKETMASTER: Searching events from ${now.toLocaleDateString()} to ${threeDaysFromNow.toLocaleDateString()}`);

    const response = await axios.get(`https://app.ticketmaster.com/discovery/v2/events.json`, {
      params: {
        apikey: TICKETMASTER_API_KEY,
        latlong: `${lat},${lng}`,
        radius: radiusMiles,
        unit: 'miles',
        size: 50,
        sort: 'date,asc',
        startDateTime: startDateTime, // Now
        endDateTime: endDateTime // Next 3 days
      }
    });

    console.log(`🎫 TICKETMASTER: Got ${response.data._embedded?.events?.length || 0} events`);

    if (!response.data._embedded?.events || response.data._embedded.events.length === 0) {
      return [];
    }

    return response.data._embedded.events.map((event) => {
      // Extract venue location
      const venue = event._embedded?.venues?.[0];
      const eventLat = venue?.location?.latitude ? parseFloat(venue.location.latitude) : lat;
      const eventLng = venue?.location?.longitude ? parseFloat(venue.location.longitude) : lng;

      // Get high-quality image
      const images = event.images || [];
      const imageUrl = images.find(img => img.width >= 1024)?.url || images[0]?.url || null;

      // Extract event date/time
      const startDate = event.dates?.start?.dateTime || event.dates?.start?.localDate;

      // DEBUG: Log the actual date from Ticketmaster
      if (startDate) {
        const parsedDate = new Date(startDate);
        console.log(`🎫 DEBUG: Event "${event.name}" - Raw date: ${startDate}, Parsed: ${parsedDate.toLocaleDateString()}, Is past? ${parsedDate < now}`);
      }

      // Check if free
      const isFree = event.priceRanges?.[0]?.min === 0;
      const priceMin = event.priceRanges?.[0]?.min || null;
      const priceMax = event.priceRanges?.[0]?.max || null;

      // Extract music genres from classifications
      const classifications = event.classifications || [];
      const musicClassification = classifications.find(c => c.segment?.name === 'Music');
      const musicGenres = [];

      if (musicClassification) {
        if (musicClassification.genre?.name) {
          musicGenres.push(musicClassification.genre.name);
        }
        if (musicClassification.subGenre?.name &&
            musicClassification.subGenre.name !== musicClassification.genre?.name) {
          musicGenres.push(musicClassification.subGenre.name);
        }
      }

      return {
        activityId: `ticketmaster_${event.id}`,
        name: event.name,
        type: "event",
        // TOP-LEVEL: Frontend looks for these
        images: imageUrl ? [imageUrl] : [], // Frontend expects array
        website: addAffiliateTracking(event.url, 'ticketmaster'), // TOP-LEVEL for frontend
        description: event.info || event.pleaseNote || `${event.name} at ${venue?.name || 'venue'}`,
        address: venue?.address?.line1 || city || 'Location TBA',
        city: venue?.city?.name || city || '',
        state: venue?.state?.stateCode || '',
        location: {
          lat: eventLat,
          lng: eventLng,
          geohash: geohash.encode(eventLat, eventLng, 7),
          geohashPrecise: geohash.encode(eventLat, eventLng, 9),
          address: venue?.address?.line1 || city || 'Location TBA',
        },
        categories: ["events", "activities", ...(event.classifications?.[0]?.segment?.name ? [event.classifications[0].segment.name.toLowerCase()] : [])],
        primaryCategory: "events",
        musicGenres: musicGenres, // TOP-LEVEL: Music genre tags for filtering
        cost: {
          free: isFree,
          price: priceMin,
          priceLevel: isFree ? 0 : (priceMin > 50 ? 3 : priceMin > 25 ? 2 : 1),
        },
        details: {
          description: event.info || event.pleaseNote || `${event.name} at ${venue?.name || 'venue'}`,
          shortDescription: (event.info || event.name).substring(0, 200),
          imageUrl: imageUrl,
          website: addAffiliateTracking(event.url, 'ticketmaster'),
          eventDate: startDate,
          venue: venue?.name || 'Venue TBA',
          venueAddress: venue?.address?.line1 || '',
          organizerName: event.promoter?.name || event._embedded?.attractions?.[0]?.name,
          priceLevel: isFree ? 0 : (priceMin > 50 ? 3 : priceMin > 25 ? 2 : 1),
          priceRange: priceMin && priceMax ? `$${priceMin}-$${priceMax}` : null,
          musicGenres: musicGenres, // Array of genre tags
        },
        expiration: {
          type: "date",
          expiresAt: new Date(startDate).getTime() || Date.now() + 86400000,
          lastVerified: Date.now(),
          isActive: true,
        },
        ratings: {
          googleRating: null,
          agentQuRating: null,
          totalReviews: 0,
          totalVotes: 0,
          upvotes: 0,
          downvotes: 0,
          voteScore: 0,
        },
        searchMetadata: {
          firstSeen: Date.now(),
          lastSearched: Date.now(),
          searchCount: 1,
          source: "ticketmaster",
          sourceId: event.id,
        },
        openNow: true,
      };
    }).filter((activity) => {
      // Filter out events without names
      if (!activity.name) return false;

      // Filter out past events AND events beyond 3 days (safety check) - STRICT FILTERING
      if (activity.details?.eventDate) {
        const eventDate = new Date(activity.details.eventDate);
        const nowCheck = new Date();
        const threeDaysOut = new Date(nowCheck);
        threeDaysOut.setDate(nowCheck.getDate() + 3);

        // For localDate format (YYYY-MM-DD), compare just the dates
        // For dateTime format, compare full timestamps
        const isLocalDateOnly = activity.details.eventDate.length === 10; // "YYYY-MM-DD"

        if (isLocalDateOnly) {
          // Compare dates only (set time to start of day)
          const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
          const today = new Date(nowCheck.getFullYear(), nowCheck.getMonth(), nowCheck.getDate());
          const maxDay = new Date(threeDaysOut.getFullYear(), threeDaysOut.getMonth(), threeDaysOut.getDate());

          if (eventDay < today) {
            console.log(`🎫 FILTERED (past): "${activity.name}" - Date: ${activity.details.eventDate} is before today`);
            return false;
          }
          if (eventDay > maxDay) {
            console.log(`🎫 FILTERED (too far): "${activity.name}" - Date: ${activity.details.eventDate} is beyond 3 days`);
            return false;
          }
        } else {
          // Full timestamp comparison
          if (eventDate < nowCheck) {
            console.log(`🎫 FILTERED (past): "${activity.name}" - DateTime: ${activity.details.eventDate} is before now`);
            return false;
          }
          if (eventDate > threeDaysOut) {
            console.log(`🎫 FILTERED (too far): "${activity.name}" - DateTime: ${activity.details.eventDate} is beyond 3 days`);
            return false;
          }
        }
      }

      return true;
    });
  } catch (error) {
    console.error("🎫 TICKETMASTER: Error fetching events:", error.message);
    if (error.response) {
      console.error(`🎫 TICKETMASTER: Status ${error.response.status}:`, error.response.data);
    }
    return [];
  }
}

/**
 * Fetch local recommendations from Reddit
 */
async function fetchRedditLocalBuzz(lat, lng, city = null, state = null) {
  if (!city) {
    console.log('🤖 REDDIT: Skipping - no city name available');
    return [];
  }

  try {
    console.log(`🤖 REDDIT: Searching for local buzz in ${city}, ${state}`);

    // Build subreddit search queries
    const subredditQueries = [
      city.toLowerCase().replace(/\s+/g, ''), // e.g., "baltimore"
      state ? state.toLowerCase() : null, // e.g., "maryland"
    ].filter(Boolean);

    const allPosts = [];

    // Search multiple subreddits
    for (const sub of subredditQueries.slice(0, 2)) { // Limit to 2 subreddits
      try {
        const searchQuery = `things to do OR hidden gem OR local favorite OR must visit`;
        const redditUrl = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(searchQuery)}&restrict_sr=1&sort=top&t=month&limit=10`;

        const response = await axios.get(redditUrl, {
          headers: {
            'User-Agent': 'AgentQu/1.0'
          }
        });

        if (response.data?.data?.children) {
          allPosts.push(...response.data.data.children.map(child => child.data));
        }
      } catch (subError) {
        console.log(`🤖 REDDIT: Subreddit r/${sub} failed:`, subError.message);
      }
    }

    console.log(`🤖 REDDIT: Found ${allPosts.length} local posts`);

    // Convert Reddit posts to activities
    return allPosts.slice(0, 10).map((post, index) => ({
      activityId: `reddit_${post.id}`,
      name: post.title,
      type: "event", // Treat as recommendation
      location: {
        lat,
        lng,
        geohash: geohash.encode(lat, lng, 7),
        geohashPrecise: geohash.encode(lat, lng, 9),
        address: `${city}, ${state}`,
      },
      categories: ["local_buzz", "community_rec"],
      primaryCategory: "local_buzz",
      details: {
        description: post.selftext || post.title,
        shortDescription: (post.selftext || post.title).substring(0, 200),
        imageUrl: post.thumbnail && post.thumbnail.startsWith('http') ? post.thumbnail : null,
        website: `https://reddit.com${post.permalink}`,
      },
      expiration: {
        type: "date",
        expiresAt: Date.now() + 86400000 * 7, // 7 days
        lastVerified: Date.now(),
        isActive: true,
      },
      ratings: {
        googleRating: null,
        agentQuRating: post.score / 100, // Convert Reddit score to 0-10 scale
        totalReviews: post.num_comments,
        totalVotes: post.ups + post.downs,
        upvotes: post.ups,
        downvotes: post.downs || 0,
        voteScore: post.score,
      },
      searchMetadata: {
        firstSeen: Date.now(),
        lastSearched: Date.now(),
        searchCount: 1,
        source: "reddit",
        sourceId: post.id,
      },
      openNow: true,
    }));
  } catch (error) {
    console.error("🤖 REDDIT: Error fetching local buzz:", error.message);
    return [];
  }
}

/**
 * Map affinity categories to Google Place types
 */
function affinityToPlaceTypes(affinities) {
  const categoryMapping = {
    'local_favorites': ['restaurant', 'cafe', 'bakery'],
    'museums': ['museum', 'art_gallery'],
    'hiking': ['park', 'hiking_area', 'national_park'],
    'festivals': ['tourist_attraction', 'event_venue'],
    'happy_hour': ['bar', 'night_club', 'wine_bar'],
    'coffee_shops': ['cafe', 'coffee_shop'],
    'fine_dining': ['restaurant', 'fine_dining_restaurant'],
    'outdoor_adventure': ['park', 'campground', 'hiking_area'],
    'live_music': ['night_club', 'live_music_venue', 'performing_arts_theater'],
    'sports': ['stadium', 'gym', 'sports_complex'],
    'skateparks': ['park', 'sports_complex'],
    'art_culture': ['art_gallery', 'museum', 'cultural_center'],
    'nightlife': ['bar', 'night_club', 'dance_club'],
    'shopping': ['shopping_mall', 'clothing_store', 'book_store'],
    'wellness': ['spa', 'gym', 'yoga_studio'],
    'family_friendly': ['amusement_park', 'zoo', 'aquarium', 'park']
  };

  if (!affinities || Object.keys(affinities).length === 0) {
    // Default: broad categories
    return ['restaurant', 'cafe', 'park', 'museum', 'tourist_attraction', 'bar'];
  }

  // Get top 5 affinity categories
  const topCategories = Object.entries(affinities)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([cat]) => cat);

  // Convert to place types
  const placeTypes = new Set();
  topCategories.forEach(cat => {
    const types = categoryMapping[cat] || [];
    types.forEach(type => placeTypes.add(type));
  });

  return Array.from(placeTypes).slice(0, 10); // Limit to 10 types
}

/**
 * Fetch places from Google Places API (New)
 */
async function fetchGooglePlaces(lat, lng, radius = 10, userAffinities = null) {
  const GOOGLE_PLACES_API_KEY = googlePlacesApiKey.value();

  if (!GOOGLE_PLACES_API_KEY) {
    console.warn("Google Places API key not configured");
    return [];
  }

  try {
    const radiusMeters = radius * 1609; // miles to meters

    // Convert affinities to place types
    const includedTypes = affinityToPlaceTypes(userAffinities);
    console.log(`🎯 Using place types based on affinities:`, includedTypes);

    // Use Places API (New) - nearbysearch endpoint
    const response = await axios.post(
      `https://places.googleapis.com/v1/places:searchNearby`,
      {
        includedTypes: includedTypes,
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: {
              latitude: lat,
              longitude: lng
            },
            radius: radiusMeters
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.id,places.photos'
        }
      }
    );

    console.log("🔍 PLACES API RESPONSE:", JSON.stringify(response.data, null, 2));

    if (!response.data.places || response.data.places.length === 0) {
      console.log("Google Places API returned 0 results");
      console.log("Request params:", {lat, lng, radiusMeters, includedTypes: ["restaurant", "cafe", "park", "museum", "tourist_attraction", "bar", "night_club", "art_gallery", "shopping_mall", "movie_theater"]});
      return [];
    }

    return response.data.places.map((place) => {
      const placeLat = place.location.latitude;
      const placeLng = place.location.longitude;
      const categories = mapPlaceTypeToCategories(place.types || []);

      // Build image URLs from photos array
      const images = place.photos && place.photos.length > 0
        ? place.photos.slice(0, 3).map(photo =>
            `https://places.googleapis.com/v1/${photo.name}/media?key=${GOOGLE_PLACES_API_KEY}&maxHeightPx=800&maxWidthPx=800`
          )
        : [];

      return {
        activityId: `place_${place.id}`,
        name: place.displayName?.text || place.displayName || 'Unknown Place',
        type: "permanent",
        location: {
          lat: placeLat,
          lng: placeLng,
          geohash: geohash.encode(placeLat, placeLng, 7),
          geohashPrecise: geohash.encode(placeLat, placeLng, 9),
          address: place.formattedAddress,
          placeId: place.id,
        },
        address: place.formattedAddress, // Top-level for easy access
        categories,
        primaryCategory: categories[0] || place.types?.[0] || "venue",
        images, // Add images array for frontend
        rating: place.rating || null, // Top-level rating
        reviewCount: place.userRatingCount || 0, // Top-level review count
        cost: {
          free: false,
          priceLevel: null,
        },
        details: {
          description: place.formattedAddress,
          shortDescription: place.formattedAddress,
          imageUrl: images[0] || null, // Keep for backward compatibility
          priceLevel: null,
        },
        schedule: {
          isOpen24Hours: false,
          openingHours: null,
        },
        expiration: {
          type: "permanent",
          expiresAt: null,
          lastVerified: Date.now(),
          isActive: true,
        },
        ratings: {
          googleRating: place.rating || null,
          agentQuRating: null,
          totalReviews: place.userRatingCount || 0,
          totalVotes: 0,
          upvotes: 0,
          downvotes: 0,
          voteScore: 0,
        },
        searchMetadata: {
          firstSeen: Date.now(),
          lastSearched: Date.now(),
          searchCount: 1,
          source: "google_places",
          sourceId: place.place_id,
        },
        openNow: place.opening_hours?.open_now || false,
      };
    });
  } catch (error) {
    console.error("Error fetching Google Places:", error.message);
    if (error.response) {
      console.error("Places API response status:", error.response.status);
      console.error("Places API response data:", JSON.stringify(error.response.data));
    }
    return [];
  }
}

/**
 * Fetch EV charging stations from Google Places API (New)
 */
async function fetchEVChargingStations(lat, lng, radius = 10) {
  const GOOGLE_PLACES_API_KEY = googlePlacesApiKey.value();

  if (!GOOGLE_PLACES_API_KEY) {
    console.warn("⚡ EV CHARGING: Google Places API key not configured");
    return [];
  }

  try {
    const radiusMeters = radius * 1609; // miles to meters

    console.log(`⚡ EV CHARGING: Searching charging stations within ${radius} miles of ${lat},${lng}`);

    // Use Places API (New) - nearbysearch endpoint for EV charging stations
    const response = await axios.post(
      `https://places.googleapis.com/v1/places:searchNearby`,
      {
        includedTypes: ["electric_vehicle_charging_station"],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: {
              latitude: lat,
              longitude: lng
            },
            radius: radiusMeters
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.rating,places.currentOpeningHours,places.id'
        }
      }
    );

    console.log(`⚡ EV CHARGING: Found ${response.data.places?.length || 0} charging stations`);

    if (!response.data.places || response.data.places.length === 0) {
      return [];
    }

    return response.data.places.map((place) => {
      const placeLat = place.location.latitude;
      const placeLng = place.location.longitude;
      const distance = calculateDistance(lat, lng, placeLat, placeLng);

      return {
        id: place.id,
        name: place.displayName?.text || place.displayName || 'Charging Station',
        address: place.formattedAddress || '',
        distance: distance,
        location: {
          lat: placeLat,
          lng: placeLng
        },
        rating: place.rating || null,
        openNow: place.currentOpeningHours?.openNow || false
      };
    });
  } catch (error) {
    console.error("⚡ EV CHARGING: Error fetching charging stations:", error.message);
    if (error.response) {
      console.error("⚡ EV CHARGING: API response status:", error.response.status);
      console.error("⚡ EV CHARGING: API response data:", JSON.stringify(error.response.data));
    }
    return [];
  }
}

// ============================================================================
// CACHING FUNCTIONS
// ============================================================================

/**
 * Check cache for existing results
 */
async function checkCache(geohashKey, radius, affinitySignature) {
  try {
    const cacheKey = `geo_${geohashKey}_rad_${radius}_aff_${affinitySignature}`;
    const now = Date.now();

    const cacheDoc = await db.collection("search_cache").doc(cacheKey).get();

    if (!cacheDoc.exists) return null;

    const cacheData = cacheDoc.data();

    // Check expiration
    if (cacheData.expiresAt < now) {
      console.log("Cache expired, deleting:", cacheKey);
      await cacheDoc.ref.delete();
      return null;
    }

    console.log("Cache HIT:", cacheKey);

    // Update cache stats
    await cacheDoc.ref.update({
      lastAccessed: now,
      userCount: admin.firestore.FieldValue.increment(1),
    });

    return cacheData;
  } catch (error) {
    console.error("Error checking cache:", error);
    return null;
  }
}

/**
 * Save activities to database and cache results
 */
async function saveActivitiesAndCache(activities, geohashKey, radius, affinitySignature, userAffinities) {
  try {
    const batch = db.batch();
    const now = Date.now();

    // Save/update activities in master collection
    activities.forEach((activity) => {
      const activityRef = db.collection("activities").doc(activity.activityId);

      // Upsert with merge (preserve existing data like votes/reviews)
      batch.set(activityRef, activity, {merge: true});
    });

    // Create cache entry
    const cacheKey = `geo_${geohashKey}_rad_${radius}_aff_${affinitySignature}`;
    const cacheRef = db.collection("search_cache").doc(cacheKey);

    const hasEvents = activities.some((a) => a.type === "event");
    const hasPermanent = activities.some((a) => a.type === "permanent");

    // Cache TTL: 1 hour for events, 24 hours for permanent only
    const ttlMs = hasEvents ? 3600000 : 86400000;

    const scoredResults = activities.map((activity) => {
      const scores = calculateFinalScore(
        activity,
        activity.location.lat,
        activity.location.lng,
        userAffinities,
        musicGenreAffinities,
        restaurantGenreAffinities,
      );
      return {
        activityId: activity.activityId,
        baseScore: scores.baseScore,
        affinityScore: scores.affinityScore,
        finalScore: scores.finalScore,
        matchedCategories: activity.categories,
        distance: activity.distance,
      };
    });

    batch.set(cacheRef, {
      cacheKey,
      geohash: geohashKey,
      radius,
      affinitySignature,
      activityIds: activities.map((a) => a.activityId),
      scoredResults,
      createdAt: now,
      expiresAt: now + ttlMs,
      ttl: ttlMs,
      userCount: 1,
      lastAccessed: now,
      hasEvents,
      hasPermanent,
      freshness: 1.0,
    });

    await batch.commit();
    console.log(`Saved ${activities.length} activities and created cache: ${cacheKey}`);
  } catch (error) {
    console.error("Error saving activities/cache:", error);
  }
}

/**
 * Personalize cached results for a specific user's affinities
 */
async function personalizeCachedResults(cachedData, userAffinities) {
  try {
    // If no activities in cache, return empty array
    if (!cachedData.activityIds || cachedData.activityIds.length === 0) {
      return [];
    }

    // Fetch full activity data
    const activityDocs = await db
      .collection("activities")
      .where(admin.firestore.FieldPath.documentId(), "in", cachedData.activityIds)
      .get();

    const activities = activityDocs.docs.map((doc) => doc.data());

    // Recalculate scores with THIS user's exact affinities
    const personalizedActivities = activities.map((activity) => {
      const scores = calculateFinalScore(
        activity,
        activity.location.lat,
        activity.location.lng,
        userAffinities,
        musicGenreAffinities,
        restaurantGenreAffinities,
      );

      return {
        ...activity,
        score: scores.finalScore,
        baseScore: scores.baseScore,
        affinityScore: scores.affinityScore,
      };
    });

    // Sort by personalized score
    personalizedActivities.sort((a, b) => b.score - a.score);

    return personalizedActivities;
  } catch (error) {
    console.error("Error personalizing cached results:", error);
    return [];
  }
}

// ============================================================================
// CLOUD FUNCTIONS - DISCOVERY
// ============================================================================

/**
 * Main Discovery Function with Caching
 */
exports.discoverActivities = onCall(
  {
    cors: true,
    invoker: "public",
  },
  async (request) => {
  const {
    lat,
    lng,
    radius = 10,
    userId,
    enablePlaces = true,
    enableCustomSearch = true,
    bypassCache = false
  } = request.data;

  if (!lat || !lng) {
    throw new Error("Missing required parameters: lat, lng");
  }

  const startTime = Date.now();

  try {
    // Get user affinities and EV status
    let userAffinities = null;
    let musicGenreAffinities = null;
    let restaurantGenreAffinities = null;
    let isEVOwner = false;
    if (userId) {
      const userDoc = await db.collection("users").doc(userId).get();
      if (userDoc.exists) {
        userAffinities = userDoc.data().affinities;
        musicGenreAffinities = userDoc.data().musicGenreAffinities || null;
        restaurantGenreAffinities = userDoc.data().restaurantGenreAffinities || null;
        isEVOwner = userDoc.data().isEV || false;
      }
    }

    // Generate geohash and cache key
    const geohashKey = geohash.encode(lat, lng, 5); // ~5km precision
    const affinitySignature = generateAffinitySignature(userAffinities);

    console.log(`Discovery request: ${geohashKey}, radius: ${radius}, affinity: ${affinitySignature}, bypass: ${bypassCache}, places: ${enablePlaces}, search: ${enableCustomSearch}`);

    // CACHE DISABLED FOR DEVELOPMENT - Always fetch fresh data
    console.log("🚧 CACHE DISABLED - fetching fresh data from APIs");

    // Try to get city name from reverse geocoding for better search results
    let cityName = null;
    try {
      const GOOGLE_GEOCODING_API_KEY = googleGeocodingApiKey.value();

      console.log(`🔍 Attempting reverse geocode for: ${lat},${lng}`);

      const geocodeResponse = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            latlng: `${lat},${lng}`,
            key: GOOGLE_GEOCODING_API_KEY,
          },
        }
      );

      console.log(`🔍 Reverse geocoding full response:`, JSON.stringify(geocodeResponse.data, null, 2));

      if (geocodeResponse.data.status !== 'OK') {
        console.error(`🔍 Reverse geocoding API error: ${geocodeResponse.data.status}`, geocodeResponse.data.error_message);
      } else if (geocodeResponse.data.results?.[0]) {
        const result = geocodeResponse.data.results[0];
        console.log(`🔍 Formatted address: ${result.formatted_address}`);

        const addressComponents = result.address_components;
        const city = addressComponents.find(c => c.types.includes('locality'));
        const state = addressComponents.find(c => c.types.includes('administrative_area_level_1'));

        if (city && state) {
          cityName = `${city.long_name}, ${state.short_name}`;
          console.log(`🔍 ✅ Reverse geocoded to: ${cityName}`);
        } else {
          console.warn(`🔍 No city/state found. Address components:`, JSON.stringify(addressComponents, null, 2));
        }
      } else {
        console.warn(`🔍 No results from reverse geocoding`);
      }
    } catch (geocodeError) {
      console.error('🔍 Reverse geocoding exception:', geocodeError.message);
      if (geocodeError.response) {
        console.error('🔍 Response data:', geocodeError.response.data);
      }
    }

    // Extract city and state from cityName for Reddit
    const cityOnly = cityName ? cityName.split(',')[0].trim() : null;
    const stateOnly = cityName ? cityName.split(',')[1]?.trim() : null;

    // Fetch from all enabled sources in parallel
    const fetchPromises = [];

    // Google Places (permanent locations)
    if (enablePlaces) {
      fetchPromises.push(fetchGooglePlaces(lat, lng, radius, userAffinities));
    } else {
      fetchPromises.push(Promise.resolve([]));
    }

    // Ticketmaster Events (only if events enabled)
    // NOTE: Get your affiliate ID from https://ticketmaster.com/partners
    if (enableCustomSearch) {
      fetchPromises.push(fetchTicketmasterEvents(lat, lng, radius, cityName));
    } else {
      fetchPromises.push(Promise.resolve([]));
    }

    // Reddit (local community buzz)
    fetchPromises.push(fetchRedditLocalBuzz(lat, lng, cityOnly, stateOnly));

    const [googlePlaces, ticketmasterEvents, redditBuzz] = await Promise.all(fetchPromises);

    let allActivities = [...googlePlaces, ...ticketmasterEvents, ...redditBuzz];

    console.log(`✅ Fetched ${googlePlaces.length} from Places, ${ticketmasterEvents.length} from Ticketmaster, ${redditBuzz.length} from Reddit`);

    // Fetch EV charging stations if user is an EV owner
    let chargingStations = [];
    if (isEVOwner) {
      console.log('⚡ User is EV owner - fetching charging stations');
      chargingStations = await fetchEVChargingStations(lat, lng, radius);
      console.log(`⚡ EV CHARGING: Returning ${chargingStations.length} charging stations to frontend`);
    }

    // Calculate distances
    allActivities = allActivities.map((activity) => ({
      ...activity,
      distance: calculateDistance(lat, lng, activity.location.lat, activity.location.lng),
    }));

    // Filter by radius
    allActivities = allActivities.filter((a) => a.distance <= radius);
    console.log(`📏 After radius filter: ${allActivities.length} total (${allActivities.filter(a => a.type === 'permanent').length} places, ${allActivities.filter(a => a.type === 'event').length} events)`);

    // Filter events by music genre affinity
    if (musicGenreAffinities) {
      const beforeGenreFilter = allActivities.length;
      allActivities = allActivities.filter((activity) => {
        // Only filter music events
        if (activity.type === 'event' && activity.musicGenres && activity.musicGenres.length > 0) {
          const genreScore = calculateMusicGenreAffinityScore(activity.musicGenres, musicGenreAffinities);
          if (genreScore !== null && genreScore < MUSIC_GENRE_FILTER_THRESHOLD) {
            console.log(`🎵 Filtered out event: ${activity.name} (genre score: ${genreScore}, genres: ${activity.musicGenres.join(', ')})`);
            return false; // Filter out
          }
        }
        return true; // Keep
      });
      const afterGenreFilter = allActivities.length;
      if (beforeGenreFilter > afterGenreFilter) {
        console.log(`🎵 Music genre filter: removed ${beforeGenreFilter - afterGenreFilter} events with low affinity`);
      }
      console.log(`🎵 After genre filter: ${allActivities.length} total (${allActivities.filter(a => a.type === 'permanent').length} places, ${allActivities.filter(a => a.type === 'event').length} events)`);
    }

    // Filter restaurants by restaurant genre affinity
    if (restaurantGenreAffinities) {
      const beforeRestaurantFilter = allActivities.length;
      allActivities = allActivities.filter((activity) => {
        // Only filter restaurants/dining places (check if has restaurant categories)
        if (activity.categories && activity.categories.length > 0) {
          const restaurantScore = calculateRestaurantGenreAffinityScore(activity.categories, restaurantGenreAffinities);
          if (restaurantScore !== null && restaurantScore < RESTAURANT_GENRE_FILTER_THRESHOLD) {
            console.log(`🍽️ Filtered out restaurant: ${activity.name} (restaurant score: ${restaurantScore}, categories: ${activity.categories.join(', ')})`);
            return false; // Filter out
          }
        }
        return true; // Keep
      });
      const afterRestaurantFilter = allActivities.length;
      if (beforeRestaurantFilter > afterRestaurantFilter) {
        console.log(`🍽️ Restaurant genre filter: removed ${beforeRestaurantFilter - afterRestaurantFilter} places with low affinity`);
      }
      console.log(`🍽️ After restaurant filter: ${allActivities.length} total (${allActivities.filter(a => a.type === 'permanent').length} places, ${allActivities.filter(a => a.type === 'event').length} events)`);
    }

    // Calculate scores
    allActivities = allActivities.map((activity) => {
      const scores = calculateFinalScore(activity, lat, lng, userAffinities, musicGenreAffinities, restaurantGenreAffinities);
      return {
        ...activity,
        score: scores.finalScore,
        baseScore: scores.baseScore,
        affinityScore: scores.affinityScore,
        genreAffinityScore: scores.genreAffinityScore,
      };
    });

    // Sort by type first (events at top), then by score
    allActivities.sort((a, b) => {
      // Events always come first
      if (a.type === 'event' && b.type !== 'event') return -1;
      if (a.type !== 'event' && b.type === 'event') return 1;

      // Within same type, sort by score
      return b.score - a.score;
    });

    // CACHE DISABLED FOR DEVELOPMENT - Skip saving to cache
    console.log("🚧 CACHE DISABLED - skipping cache write");
    // await saveActivitiesAndCache(allActivities, geohashKey, radius, affinitySignature, userAffinities);

    console.log(`📊 Before slice: ${allActivities.length} total (${allActivities.filter(a => a.type === 'permanent').length} places, ${allActivities.filter(a => a.type === 'event').length} events)`);

    // Separate events and places to ensure balanced results
    const events = allActivities.filter(a => a.type === 'event');
    const places = allActivities.filter(a => a.type === 'permanent');

    // Take top 30 events and top 30 places (frontend shows top 3 per genre, so 30 events is plenty)
    const topEvents = events.slice(0, 30);
    const topPlaces = places.slice(0, 30);

    // Combine: events first, then places
    const results = [...topEvents, ...topPlaces];

    console.log(`📊 After balanced slice: ${results.length} total (${topPlaces.length} places, ${topEvents.length} events)`);
    console.log(`✅ Balanced results: ${topEvents.length} events + ${topPlaces.length} places`);

    return {
      success: true,
      activities: results,
      chargingStations: chargingStations, // EV charging stations for EV owners
      metadata: {
        totalFound: results.length,
        queryTimeMs: Date.now() - startTime,
        cacheHit: false,
        sources: {
          google_places: googlePlaces.length,
          ticketmaster: ticketmasterEvents.length,
          reddit: redditBuzz.length,
          charging_stations: chargingStations.length,
        },
        userLocation: {lat, lng},
        isEVOwner: isEVOwner, // Include EV owner status in metadata
      },
    };
  } catch (error) {
    console.error("Discovery error:", error);
    throw new Error(`Discovery failed: ${error.message}`);
  }
});

// ============================================================================
// CLOUD FUNCTIONS - REVIEWS & VOTING
// ============================================================================

/**
 * Submit a review for an activity
 */
exports.submitReview = onCall({ cors: true }, async (request) => {
  const {activityId, userId, rating, title, content, photos = []} = request.data;

  if (!activityId || !userId || !rating || !content) {
    throw new Error("Missing required fields");
  }

  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  try {
    // Check for profanity
    const contentFiltered = profanityFilter.check(content);
    const titleFiltered = title ? profanityFilter.check(title) : false;

    const cleanContent = contentFiltered ? profanityFilter.clean(content) : content;
    const cleanTitle = titleFiltered ? profanityFilter.clean(title) : title;

    // Get user info
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    // Create review
    const reviewRef = db.collection("reviews").doc();
    await reviewRef.set({
      reviewId: reviewRef.id,
      activityId,
      userId,
      rating,
      title: cleanTitle || "",
      content: cleanContent,
      contentOriginal: content,
      contentFiltered: contentFiltered || titleFiltered,
      photos,
      visitDate: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      helpfulCount: 0,
      reportCount: 0,
      moderation: {
        status: contentFiltered || titleFiltered ? "pending" : "approved",
        autoFiltered: contentFiltered || titleFiltered,
        flagReasons: [],
        moderatedBy: null,
        moderatedAt: null,
        moderationNotes: "",
      },
      userSnapshot: {
        displayName: userData?.displayName || "Anonymous",
        photoURL: userData?.photoURL || null,
        reviewCount: (userData?.stats?.totalReviews || 0) + 1,
      },
    });

    // Update activity ratings
    const activityRef = db.collection("activities").doc(activityId);
    const activityDoc = await activityRef.get();

    if (activityDoc.exists) {
      const activityData = activityDoc.data();
      const currentRating = activityData.ratings?.agentQuRating || 0;
      const currentCount = activityData.ratings?.totalReviews || 0;

      const newCount = currentCount + 1;
      const newRating = ((currentRating * currentCount) + rating) / newCount;

      await activityRef.update({
        "ratings.agentQuRating": newRating,
        "ratings.totalReviews": newCount,
        "ratings.lastRatingUpdate": Date.now(),
      });
    }

    // Update user stats
    await db.collection("users").doc(userId).update({
      "stats.totalReviews": admin.firestore.FieldValue.increment(1),
    });

    return {
      success: true,
      reviewId: reviewRef.id,
      filtered: contentFiltered || titleFiltered,
      status: contentFiltered || titleFiltered ? "pending" : "approved",
    };
  } catch (error) {
    console.error("Error submitting review:", error);
    throw new Error(`Failed to submit review: ${error.message}`);
  }
});

/**
 * Vote on an activity (upvote/downvote)
 */
exports.voteActivity = onCall({ cors: true }, async (request) => {
  const {activityId, userId, vote} = request.data;

  if (!activityId || !userId || !vote) {
    throw new Error("Missing required fields");
  }

  if (vote !== "up" && vote !== "down") {
    throw new Error("Vote must be 'up' or 'down'");
  }

  try {
    const voteId = `${userId}_${activityId}`;
    const voteRef = db.collection("user_votes").doc(voteId);
    const voteDoc = await voteRef.get();

    const now = Date.now();
    let previousVote = null;

    if (voteDoc.exists) {
      previousVote = voteDoc.data().vote;
    }

    // Save/update vote
    await voteRef.set({
      userId,
      activityId,
      vote,
      createdAt: voteDoc.exists ? voteDoc.data().createdAt : now,
      updatedAt: now,
    });

    // Update activity vote counts
    const activityRef = db.collection("activities").doc(activityId);
    const updateData = {
      "ratings.totalVotes": admin.firestore.FieldValue.increment(1),
    };

    if (previousVote === "up" && vote === "down") {
      // Changed from up to down
      updateData["ratings.upvotes"] = admin.firestore.FieldValue.increment(-1);
      updateData["ratings.downvotes"] = admin.firestore.FieldValue.increment(1);
      updateData["ratings.voteScore"] = admin.firestore.FieldValue.increment(-2);
    } else if (previousVote === "down" && vote === "up") {
      // Changed from down to up
      updateData["ratings.upvotes"] = admin.firestore.FieldValue.increment(1);
      updateData["ratings.downvotes"] = admin.firestore.FieldValue.increment(-1);
      updateData["ratings.voteScore"] = admin.firestore.FieldValue.increment(2);
    } else if (!previousVote && vote === "up") {
      // New upvote
      updateData["ratings.upvotes"] = admin.firestore.FieldValue.increment(1);
      updateData["ratings.voteScore"] = admin.firestore.FieldValue.increment(1);
    } else if (!previousVote && vote === "down") {
      // New downvote
      updateData["ratings.downvotes"] = admin.firestore.FieldValue.increment(1);
      updateData["ratings.voteScore"] = admin.firestore.FieldValue.increment(-1);
    }

    await activityRef.update(updateData);

    // Update user stats
    if (!previousVote) {
      await db.collection("users").doc(userId).update({
        "stats.totalVotes": admin.firestore.FieldValue.increment(1),
      });
    }

    return {
      success: true,
      vote,
      changed: previousVote !== vote,
    };
  } catch (error) {
    console.error("Error voting:", error);
    throw new Error(`Failed to vote: ${error.message}`);
  }
});

// ============================================================================
// SCHEDULED CLEANUP FUNCTIONS
// ============================================================================

/**
 * Clean up expired activities and cache entries
 * Runs every 6 hours
 */
exports.cleanupExpired = onSchedule("every 6 hours", async () => {
  const now = Date.now();
  console.log("Running cleanup job...");

  try {
    // Delete expired cache entries
    const expiredCacheQuery = await db
      .collection("search_cache")
      .where("expiresAt", "<", now)
      .limit(500)
      .get();

    const cacheBatch = db.batch();
    expiredCacheQuery.docs.forEach((doc) => {
      cacheBatch.delete(doc.ref);
    });
    await cacheBatch.commit();
    console.log(`Deleted ${expiredCacheQuery.size} expired cache entries`);

    // Delete expired events
    const expiredEventsQuery = await db
      .collection("activities")
      .where("expiration.type", "in", ["datetime", "date"])
      .where("expiration.expiresAt", "<", now)
      .limit(500)
      .get();

    const eventsBatch = db.batch();
    expiredEventsQuery.docs.forEach((doc) => {
      eventsBatch.update(doc.ref, {"expiration.isActive": false});
    });
    await eventsBatch.commit();
    console.log(`Deactivated ${expiredEventsQuery.size} expired events`);

    return {
      success: true,
      cacheDeleted: expiredCacheQuery.size,
      eventsDeactivated: expiredEventsQuery.size,
    };
  } catch (error) {
    console.error("Cleanup error:", error);
    return {success: false, error: error.message};
  }
});

// ============================================================================
// CLOUD FUNCTIONS - USER TRACKING & SOCIAL
// ============================================================================

/**
 * Check in to an activity (GPS verified visit)
 */
exports.checkInActivity = onCall({ cors: true, invoker: "public" }, async (request) => {
  const {userId, activityId, lat, lng, photos = [], notes = ""} = request.data;

  if (!userId || !activityId || !lat || !lng) {
    throw new Error("Missing required fields");
  }

  try {
    // Get activity location
    const activityDoc = await db.collection("activities").doc(activityId).get();
    if (!activityDoc.exists) {
      throw new Error("Activity not found");
    }

    const activity = activityDoc.data();
    const distance = calculateDistance(lat, lng, activity.location.lat, activity.location.lng);

    // Verify within 0.06 miles (~100 meters)
    if (distance > 0.06) {
      return {
        success: false,
        error: "too_far",
        distance,
        message: "You must be within 100m of the activity to check in",
      };
    }

    // Create visit record
    const historyRef = db.collection("user_activity_history").doc(`${userId}_${activityId}`);
    const historyDoc = await historyRef.get();

    const isFirstVisit = !historyDoc.exists;
    const now = Date.now();

    const visit = {
      visitedAt: now,
      location: {
        lat,
        lng,
        verifiedByGPS: true,
        verifiedByQR: false,
        verifiedByAR: false,
      },
      photos,
      notes,
    };

    await historyRef.set(
      {
        userId,
        activityId,
        visits: admin.firestore.FieldValue.arrayUnion(visit),
        totalVisits: admin.firestore.FieldValue.increment(1),
        firstVisit: isFirstVisit ? now : historyDoc.data().firstVisit,
        lastVisit: now,
      },
      {merge: true},
    );

    // Update activity stats
    await db.collection("activities").doc(activityId).update({
      "social.totalVisits": admin.firestore.FieldValue.increment(1),
      "social.uniqueVisitors": isFirstVisit
        ? admin.firestore.FieldValue.increment(1)
        : admin.firestore.FieldValue.increment(0),
    });

    // Award Qus
    let qusEarned = 0;
    if (isFirstVisit) qusEarned += 10; // First visit bonus
    if (photos.length > 0) qusEarned += Math.min(photos.length * 5, 15); // Photo bonus (max 3)

    if (qusEarned > 0) {
      await db.collection("users").doc(userId).update({
        "stats.qusEarned": admin.firestore.FieldValue.increment(qusEarned),
        "stats.totalVisits": admin.firestore.FieldValue.increment(1),
      });
    }

    return {
      success: true,
      isFirstVisit,
      qusEarned,
      totalVisits: (historyDoc.data()?.totalVisits || 0) + 1,
    };
  } catch (error) {
    console.error("Error checking in:", error);
    throw new Error(`Failed to check in: ${error.message}`);
  }
});

/**
 * Qu-up an activity (renamed from voteActivity)
 * Keeps existing voteActivity for backwards compatibility
 */
exports.qupActivity = onCall({ cors: true, invoker: "public" }, async (request) => {
  const {activityId, userId, qup} = request.data;

  if (!activityId || !userId || typeof qup !== "boolean") {
    throw new Error("Missing required fields");
  }

  try {
    // Check if user has visited
    const historyDoc = await db
      .collection("user_activity_history")
      .doc(`${userId}_${activityId}`)
      .get();

    const afterVisit = historyDoc.exists && historyDoc.data().totalVisits > 0;
    const now = Date.now();

    const qupId = `${userId}_${activityId}`;
    const qupRef = db.collection("user_qups").doc(qupId);
    const qupDoc = await qupRef.get();

    let previousQup = null;
    if (qupDoc.exists) {
      previousQup = qupDoc.data().qudUp;
    }

    // Save Qu-up
    await qupRef.set({
      userId,
      activityId,
      qudUp: qup,
      createdAt: qupDoc.exists ? qupDoc.data().createdAt : now,
      updatedAt: now,
      qudFrom: {
        afterVisit,
        withReview: false, // Will be updated if review exists
      },
    });

    // Update activity ratings
    const activityRef = db.collection("activities").doc(activityId);
    const updateData = {
      "ratings.totalQups": admin.firestore.FieldValue.increment(1),
    };

    if (previousQup === true && qup === false) {
      // Changed from Qu-up to Qu-down
      updateData["ratings.qups"] = admin.firestore.FieldValue.increment(-1);
      updateData["ratings.qudowns"] = admin.firestore.FieldValue.increment(1);
      updateData["ratings.qupScore"] = admin.firestore.FieldValue.increment(-2);
    } else if (previousQup === false && qup === true) {
      // Changed from Qu-down to Qu-up
      updateData["ratings.qups"] = admin.firestore.FieldValue.increment(1);
      updateData["ratings.qudowns"] = admin.firestore.FieldValue.increment(-1);
      updateData["ratings.qupScore"] = admin.firestore.FieldValue.increment(2);
    } else if (previousQup === null && qup === true) {
      // New Qu-up
      updateData["ratings.qups"] = admin.firestore.FieldValue.increment(1);
      updateData["ratings.qupScore"] = admin.firestore.FieldValue.increment(1);
    } else if (previousQup === null && qup === false) {
      // New Qu-down
      updateData["ratings.qudowns"] = admin.firestore.FieldValue.increment(1);
      updateData["ratings.qupScore"] = admin.firestore.FieldValue.increment(-1);
    }

    await activityRef.update(updateData);

    // Award Qus (bonus for Qu-up after visit)
    let qusEarned = 0;
    if (previousQup === null && qup === true) {
      qusEarned = afterVisit ? 10 : 5; // Bonus for Qu-up after visit
      await db.collection("users").doc(userId).update({
        "stats.qusEarned": admin.firestore.FieldValue.increment(qusEarned),
        "stats.totalQups": admin.firestore.FieldValue.increment(1),
      });
    }

    return {
      success: true,
      qup,
      changed: previousQup !== qup,
      afterVisit,
      qusEarned,
    };
  } catch (error) {
    console.error("Error Qu-ing:", error);
    throw new Error(`Failed to Qu activity: ${error.message}`);
  }
});

/**
 * Suggest a new activity
 */
exports.suggestActivity = onCall({ cors: true }, async (request) => {
  const {userId, name, description, lat, lng, categories = [], photos = [], website, phone} = request.data;

  if (!userId || !name || !lat || !lng) {
    throw new Error("Missing required fields");
  }

  try {
    // Get user info
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    // Check for nearby duplicates
    const geohashKey = geohash.encode(lat, lng, 7);
    const nearbyQuery = await db
      .collection("activities")
      .where("location.geohashPrecise", "==", geohashKey)
      .get();

    const duplicates = nearbyQuery.docs
      .map((doc) => doc.data())
      .filter((activity) => {
        const distance = calculateDistance(lat, lng, activity.location.lat, activity.location.lng);
        return distance < 0.1 && activity.name.toLowerCase().includes(name.toLowerCase());
      });

    if (duplicates.length > 0) {
      return {
        success: false,
        duplicate: true,
        suggestions: duplicates.map((d) => ({
          activityId: d.activityId,
          name: d.name,
          distance: calculateDistance(lat, lng, d.location.lat, d.location.lng),
        })),
      };
    }

    // Create suggestion
    const suggestionRef = db.collection("activity_suggestions").doc();
    await suggestionRef.set({
      suggestionId: suggestionRef.id,
      userId,
      userName: userData?.displayName || "Anonymous",
      userPhoto: userData?.photoURL || null,
      name,
      description,
      categories,
      location: {
        lat,
        lng,
        geohash: geohash.encode(lat, lng, 5),
        geohashPrecise: geohash.encode(lat, lng, 7),
      },
      photos,
      website: website || null,
      phone: phone || null,
      suggestedAt: Date.now(),
      status: "pending",
      upvotes: 0,
      downvotes: 0,
      userVotes: {},
    });

    // Award Qus for suggestion (will get bonus if approved)
    await db.collection("users").doc(userId).update({
      "stats.totalSuggestions": admin.firestore.FieldValue.increment(1),
      "stats.qusEarned": admin.firestore.FieldValue.increment(10),
    });

    return {
      success: true,
      suggestionId: suggestionRef.id,
      qusEarned: 10,
      message: "Thank you! We'll review your suggestion.",
    };
  } catch (error) {
    console.error("Error suggesting activity:", error);
    throw new Error(`Failed to suggest activity: ${error.message}`);
  }
});

/**
 * Share an activity with friends
 */
exports.shareActivity = onCall({ cors: true, invoker: "public" }, async (request) => {
  const {userId, activityId, sharedWith = [], message = "", method = "direct"} = request.data;

  if (!userId || !activityId || sharedWith.length === 0) {
    throw new Error("Missing required fields");
  }

  try {
    // Get user and activity info
    const [userDoc, activityDoc] = await Promise.all([
      db.collection("users").doc(userId).get(),
      db.collection("activities").doc(activityId).get(),
    ]);

    if (!activityDoc.exists) {
      throw new Error("Activity not found");
    }

    const userData = userDoc.data();
    const activityData = activityDoc.data();

    // Create share record
    const shareRef = db.collection("activity_shares").doc();
    const shareId = shareRef.id;

    await shareRef.set({
      shareId,
      sharedBy: userId,
      sharedByName: userData?.displayName || "Anonymous",
      sharedByPhoto: userData?.photoURL || null,
      activityId,
      activityName: activityData.name,
      sharedWith,
      message,
      shareMethod: method,
      sharedAt: Date.now(),
      viewed: [],
      visitedAfterShare: [],
      qudUpAfterShare: [],
      qusEarnedForShare: 0,
    });

    // Update activity share count
    await db.collection("activities").doc(activityId).update({
      "social.totalShares": admin.firestore.FieldValue.increment(1),
    });

    // Update user history
    await db
      .collection("user_activity_history")
      .doc(`${userId}_${activityId}`)
      .set(
        {
          shared: true,
          sharedAt: Date.now(),
          sharedWith: admin.firestore.FieldValue.arrayUnion(...sharedWith),
        },
        {merge: true},
      );

    // Update user stats
    await db.collection("users").doc(userId).update({
      "stats.totalShares": admin.firestore.FieldValue.increment(1),
      "stats.qusEarned": admin.firestore.FieldValue.increment(5), // Immediate share bonus
    });

    // Generate share link
    const shareLink = `https://agentqu-platform.web.app/activity/${activityId}?share=${shareId}`;

    return {
      success: true,
      shareId,
      shareLink,
      qusEarned: 5,
      message: "Activity shared! You'll earn more Qus if they visit.",
    };
  } catch (error) {
    console.error("Error sharing activity:", error);
    throw new Error(`Failed to share activity: ${error.message}`);
  }
});

/**
 * Get user's activity history
 */
exports.getUserHistory = onCall({ cors: true }, async (request) => {
  const {userId, limit = 50} = request.data;

  if (!userId) {
    throw new Error("Missing userId");
  }

  try {
    const historyQuery = await db
      .collection("user_activity_history")
      .where("userId", "==", userId)
      .orderBy("lastVisit", "desc")
      .limit(limit)
      .get();

    const history = [];
    for (const doc of historyQuery.docs) {
      const historyData = doc.data();

      // Get activity details
      const activityDoc = await db.collection("activities").doc(historyData.activityId).get();
      const activityData = activityDoc.exists ? activityDoc.data() : null;

      history.push({
        activityId: historyData.activityId,
        activityName: activityData?.name || "Unknown",
        totalVisits: historyData.totalVisits,
        firstVisit: historyData.firstVisit,
        lastVisit: historyData.lastVisit,
        qudUp: historyData.qudUp || false,
        reviewed: historyData.reviewed || false,
        shared: historyData.shared || false,
      });
    }

    return {
      success: true,
      history,
      total: history.length,
    };
  } catch (error) {
    console.error("Error getting user history:", error);
    throw new Error(`Failed to get history: ${error.message}`);
  }
});

/**
 * Clear cache endpoint (admin only)
 */
exports.clearCache = onRequest(async (req, res) => {
  try {
    const cacheQuery = await db.collection("search_cache").get();
    const batch = db.batch();

    cacheQuery.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    res.json({
      status: "success",
      deletedCount: cacheQuery.size,
      message: `Cleared ${cacheQuery.size} cache entries`,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: error.message,
    });
  }
});

/**
 * Get nearby towns for location exploration
 */
exports.getNearbyTowns = onCall(
  {
    cors: true,
    invoker: "public",
  },
  async (request) => {
    const { lat, lng, currentCity } = request.data;

    if (!lat || !lng) {
      throw new Error("Missing required parameters: lat, lng");
    }

    try {
      const GOOGLE_PLACES_API_KEY = googlePlacesApiKey.value();

      // Search for nearby localities within 50km
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
        {
          params: {
            location: `${lat},${lng}`,
            radius: 50000, // 50km
            type: "locality",
            key: GOOGLE_PLACES_API_KEY,
          },
        }
      );

      if (response.data.status === "OK" && response.data.results) {
        const towns = response.data.results
          .filter((place) => place.name !== currentCity) // Exclude current city
          .slice(0, 5) // Get top 5
          .map((place) => ({
            name: place.name,
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            distance: calculateDistance(
              lat,
              lng,
              place.geometry.location.lat,
              place.geometry.location.lng
            ),
          }))
          .sort((a, b) => a.distance - b.distance) // Sort by distance
          .slice(0, 3); // Take closest 3

        return {
          success: true,
          towns,
        };
      }

      return {
        success: true,
        towns: [],
      };
    } catch (error) {
      console.error("Error fetching nearby towns:", error);
      throw new Error(`Failed to fetch nearby towns: ${error.message}`);
    }
  }
);

/**
 * Geocode a city/address to coordinates
 */
exports.geocode = onCall(
  {
    cors: true,
    maxInstances: 10,
  },
  async (request) => {
    try {
      const { address } = request.data;

      if (!address || typeof address !== "string") {
        throw new Error("Address is required");
      }

      console.log("🌍 GEOCODE: Geocoding address:", address);

      const GOOGLE_GEOCODING_API_KEY = googleGeocodingApiKey.value();

      const response = await axios.get(
        "https://maps.googleapis.com/maps/api/geocode/json",
        {
          params: {
            address: address,
            key: GOOGLE_GEOCODING_API_KEY,
          },
        }
      );

      console.log("🌍 GEOCODE: Response status:", response.data.status);

      if (response.data.status === "OK" && response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        const location = result.geometry.location;

        console.log("🌍 GEOCODE: Found location:", location);

        return {
          success: true,
          location: {
            lat: location.lat,
            lng: location.lng,
          },
          formattedAddress: result.formatted_address,
        };
      } else {
        console.log("🌍 GEOCODE: No results found for:", address);
        return {
          success: false,
          error: `Could not find location: ${address}`,
        };
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
      throw new Error(`Failed to geocode address: ${error.message}`);
    }
  }
);

/**
 * Invite someone to your Cirqle
 */
exports.inviteToCirqle = onCall(
  {
    cors: true,
    maxInstances: 10,
  },
  async (request) => {
    try {
      const { email, nickname, relationship } = request.data;
      const userId = request.auth?.uid;

      if (!userId) {
        throw new Error("Authentication required");
      }

      if (!email || !nickname || !relationship) {
        throw new Error("Email, nickname, and relationship are required");
      }

      console.log("👥 CIRQLE INVITE:", { userId, email, nickname, relationship });

      // Check if user exists in the system by email
      const normalizedEmail = email.toLowerCase();
      const usersSnapshot = await db.collection("users")
        .where("email", "==", normalizedEmail)
        .limit(1)
        .get();

      let existingUser = null;
      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0];
        existingUser = {
          uid: userDoc.id,
          displayName: userDoc.data().displayName,
          email: userDoc.data().email,
          photoURL: userDoc.data().photoURL,
        };
        console.log("👥 CIRQLE INVITE: Found existing user:", existingUser.uid);
      }

      // Generate unique invite token
      const inviteToken = `${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Create member object
      const member = {
        memberId: inviteToken,
        ownerUserId: userId,
        email: normalizedEmail,
        nickname,
        relationship,
        memberType: "invited",
        status: "pending",
        inviteToken,
        invitedAt: Date.now(),
      };

      // Add to Cirqle
      const cirqleRef = db.collection("cirqles").doc(userId);
      const cirqleDoc = await cirqleRef.get();

      if (cirqleDoc.exists) {
        await cirqleRef.update({
          members: admin.firestore.FieldValue.arrayUnion(member),
          updatedAt: Date.now(),
        });
      } else {
        // Create new Cirqle
        const userDoc = await db.collection("users").doc(userId).get();
        const userName = userDoc.exists ? userDoc.data().displayName : "My Cirqle";

        await cirqleRef.set({
          cirqleId: userId,
          ownerId: userId,
          ownerName: userName,
          members: [member],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      // Create invite link
      const inviteLink = `https://agentqu-platform.web.app/join-cirqle?token=${inviteToken}`;

      console.log("👥 CIRQLE INVITE: Created invite link:", inviteLink);

      // TODO: Send email invite (future enhancement)
      // For now, just return the member and link

      return {
        success: true,
        member,
        inviteLink,
        existingUser, // If user exists in system, return their info
      };
    } catch (error) {
      console.error("Error inviting to Cirqle:", error);
      throw new Error(`Failed to invite to Cirqle: ${error.message}`);
    }
  }
);

/**
 * Add existing user directly to Cirqle (no invite needed)
 */
exports.addExistingUserToCirqle = onCall(
  {
    cors: true,
    maxInstances: 10,
  },
  async (request) => {
    try {
      const { targetUserId, nickname, relationship } = request.data;
      const userId = request.auth?.uid;

      if (!userId) {
        throw new Error("Authentication required");
      }

      if (!targetUserId || !nickname || !relationship) {
        throw new Error("Target user ID, nickname, and relationship are required");
      }

      console.log("👥 ADD EXISTING USER:", { userId, targetUserId, nickname, relationship });

      // Get target user's info
      const targetUserDoc = await db.collection("users").doc(targetUserId).get();
      if (!targetUserDoc.exists) {
        throw new Error("Target user not found");
      }

      const targetUserData = targetUserDoc.data();

      // Create member object (active status since they're already registered)
      const member = {
        memberId: targetUserId,
        ownerUserId: userId,
        email: targetUserData.email,
        nickname,
        relationship,
        memberType: "invited",
        status: "active",
        userId: targetUserId,
        displayName: targetUserData.displayName,
        photoURL: targetUserData.photoURL || null,
        addedAt: Date.now(),
      };

      // Add to Cirqle
      const cirqleRef = db.collection("cirqles").doc(userId);
      const cirqleDoc = await cirqleRef.get();

      if (cirqleDoc.exists) {
        await cirqleRef.update({
          members: admin.firestore.FieldValue.arrayUnion(member),
          updatedAt: Date.now(),
        });
      } else {
        // Create new Cirqle
        const userDoc = await db.collection("users").doc(userId).get();
        const userName = userDoc.exists ? userDoc.data().displayName : "My Cirqle";

        await cirqleRef.set({
          cirqleId: userId,
          ownerId: userId,
          ownerName: userName,
          members: [member],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      console.log("✅ Added existing user to Cirqle:", targetUserId);

      return {
        success: true,
        member,
      };
    } catch (error) {
      console.error("Error adding existing user to Cirqle:", error);
      throw new Error(`Failed to add user to Cirqle: ${error.message}`);
    }
  }
);

/**
 * Join a Cirqle using invite token
 */
exports.joinCirqle = onCall(
  {
    cors: true,
    maxInstances: 10,
  },
  async (request) => {
    try {
      const { inviteToken } = request.data;
      const userId = request.auth?.uid;

      if (!userId) {
        throw new Error("Authentication required");
      }

      if (!inviteToken) {
        throw new Error("Invite token is required");
      }

      console.log("👥 JOIN CIRQLE:", { userId, inviteToken });

      // Find the Cirqle with this invite token
      const cirqlesSnapshot = await db.collection("cirqles").get();
      let foundCirqle = null;
      let foundMember = null;

      cirqlesSnapshot.forEach((doc) => {
        const cirqle = doc.data();
        const member = cirqle.members?.find((m) => m.inviteToken === inviteToken);
        if (member) {
          foundCirqle = { id: doc.id, ...cirqle };
          foundMember = member;
        }
      });

      if (!foundCirqle || !foundMember) {
        throw new Error("Invalid invite token");
      }

      // Get user info
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();

      // Update member status
      const updatedMembers = foundCirqle.members.map((m) =>
        m.inviteToken === inviteToken
          ? {
              ...m,
              userId,
              displayName: userData?.displayName,
              photoURL: userData?.photoURL,
              status: "active",
              joinedAt: Date.now(),
            }
          : m
      );

      await db.collection("cirqles").doc(foundCirqle.id).update({
        members: updatedMembers,
        updatedAt: Date.now(),
      });

      console.log("👥 JOIN CIRQLE: Successfully joined:", foundCirqle.ownerName);

      return {
        success: true,
        cirqle: {
          ...foundCirqle,
          members: updatedMembers,
        },
      };
    } catch (error) {
      console.error("Error joining Cirqle:", error);
      throw new Error(`Failed to join Cirqle: ${error.message}`);
    }
  }
);

/**
 * Health check endpoint
 */
exports.healthCheck = onRequest((req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "agentqu-api",
    version: "3.0-social-tracking",
  });
});

/**
 * Send contact form email to tonyweeg@gmail.com
 */
exports.sendContactEmail = onCall(
  {
    cors: true,
    invoker: "public",
  },
  async (request) => {
    try {
      const { name, email, subject, message } = request.data;

      if (!name || !email || !subject || !message) {
        throw new Error("Missing required fields");
      }

      console.log("📧 Contact form submission:", { name, email, subject });

      // Create email content
      const emailContent = {
        to: "tonyweeg@gmail.com",
        from: email,
        replyTo: email,
        subject: `[AgentQu Contact] ${subject}`,
        text: `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
Sent from AgentQu Contact Form
https://agentqu-platform.web.app/contact
        `,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1e40af;">AgentQu Contact Form Submission</h2>

  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p><strong>From:</strong> ${name}</p>
    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
    <p><strong>Subject:</strong> ${subject}</p>
  </div>

  <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
    <h3>Message:</h3>
    <p style="white-space: pre-wrap;">${message}</p>
  </div>

  <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
    <p>Sent from <a href="https://agentqu-platform.web.app/contact">AgentQu Contact Form</a></p>
  </div>
</div>
        `,
      };

      // For now, we'll save to Firestore and notify admin
      // In production, you'd integrate with SendGrid, Mailgun, or Firebase Extensions
      const contactRef = db.collection("contact_submissions").doc();
      await contactRef.set({
        id: contactRef.id,
        name,
        email,
        subject,
        message,
        submittedAt: Date.now(),
        status: "pending",
        notifiedAdmin: false,
      });

      console.log("✅ Contact form saved to Firestore:", contactRef.id);

      // TODO: Integrate with email service (SendGrid, Mailgun, or Firebase Extensions)
      // For now, we're storing in Firestore and you can set up email notifications

      return {
        success: true,
        message: "Message received! We'll get back to you soon.",
        submissionId: contactRef.id,
      };
    } catch (error) {
      console.error("Error processing contact form:", error);
      throw new Error(`Failed to send contact message: ${error.message}`);
    }
  }
);

// ============================================================================
// THERE-THEN: Environmental Data APIs
// ============================================================================

/**
 * Get weather forecast for trip location and dates
 * Uses OpenWeatherMap 5-day/3-hour forecast API (free tier)
 */
exports.getWeatherForecast = onCall(async (request) => {
  try {
    const {lat, lng, startDate, endDate} = request.data;

    if (!lat || !lng || !startDate || !endDate) {
      throw new Error("Missing required parameters: lat, lng, startDate, endDate");
    }

    console.log("🌤️ Fetching weather forecast:", {lat, lng, startDate, endDate});

    // OpenWeatherMap 5 Day / 3 Hour Forecast API
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${openWeatherApiKey.value()}&units=imperial`;

    const response = await axios.get(url);
    const data = response.data;

    console.log(`✅ Weather forecast retrieved: ${data.list.length} data points`);

    // Filter forecast data to only include dates within trip range
    const tripStart = new Date(startDate);
    const tripEnd = new Date(endDate);

    const filteredForecast = data.list.filter((item) => {
      const forecastDate = new Date(item.dt * 1000);
      return forecastDate >= tripStart && forecastDate <= tripEnd;
    });

    // Group by day
    const dailyForecasts = {};

    filteredForecast.forEach((item) => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD

      if (!dailyForecasts[dateKey]) {
        dailyForecasts[dateKey] = {
          date: dateKey,
          hourly: [],
        };
      }

      dailyForecasts[dateKey].hourly.push({
        time: date.toTimeString().slice(0, 5), // HH:MM
        temp: Math.round(item.main.temp),
        feelsLike: Math.round(item.main.feels_like),
        condition: item.weather[0].main.toLowerCase(),
        conditionDescription: item.weather[0].description,
        precipitation: item.pop * 100, // Probability of precipitation (0-100%)
        windSpeed: Math.round(item.wind.speed),
        humidity: item.main.humidity,
        uv: 0, // UV not available in 5-day forecast, would need One Call API
        icon: item.weather[0].icon,
      });
    });

    return {
      success: true,
      location: {
        lat,
        lng,
        city: data.city.name,
        country: data.city.country,
      },
      forecasts: Object.values(dailyForecasts),
      totalDataPoints: filteredForecast.length,
    };
  } catch (error) {
    console.error("Error fetching weather forecast:", error);
    throw new Error(`Failed to fetch weather forecast: ${error.message}`);
  }
});

/**
 * Get Air Quality forecast for trip location and dates
 * Uses OpenWeatherMap Air Pollution API (free tier)
 */
exports.getAirQuality = onCall(async (request) => {
  try {
    const {lat, lng, startDate, endDate} = request.data;

    if (!lat || !lng || !startDate || !endDate) {
      throw new Error("Missing required parameters: lat, lng, startDate, endDate");
    }

    console.log("🌫️ Fetching air quality data:", {lat, lng, startDate, endDate});

    // Current air pollution
    const currentUrl = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lng}&appid=${openWeatherApiKey.value()}`;

    // Note: OpenWeatherMap doesn't have AQ forecast in free tier
    // We'll return current AQ data as a baseline
    const response = await axios.get(currentUrl);
    const data = response.data;

    console.log("✅ Air quality data retrieved");

    // AQI Categories
    const getAQICategory = (aqi) => {
      const categories = [
        "Good",
        "Fair",
        "Moderate",
        "Poor",
        "Very Poor",
      ];
      return categories[aqi - 1] || "Unknown";
    };

    const aqData = data.list[0];
    const airQuality = {
      date: new Date(aqData.dt * 1000).toISOString().split("T")[0],
      aqi: aqData.main.aqi,
      category: getAQICategory(aqData.main.aqi),
      pollutants: {
        pm25: aqData.components.pm2_5.toFixed(2),
        pm10: aqData.components.pm10.toFixed(2),
        o3: aqData.components.o3.toFixed(2),
        no2: aqData.components.no2.toFixed(2),
        so2: aqData.components.so2.toFixed(2),
        co: aqData.components.co.toFixed(2),
      },
    };

    return {
      success: true,
      location: {lat, lng},
      current: airQuality,
      note: "Air quality forecast requires premium API. Showing current conditions.",
    };
  } catch (error) {
    console.error("Error fetching air quality:", error);
    throw new Error(`Failed to fetch air quality: ${error.message}`);
  }
});

/**
 * Get solar data (sunrise/sunset/golden hour) for trip dates
 * Uses sunrise-sunset.org free API
 */
exports.getSolarData = onCall(async (request) => {
  try {
    const {lat, lng, startDate, endDate} = request.data;

    if (!lat || !lng || !startDate || !endDate) {
      throw new Error("Missing required parameters: lat, lng, startDate, endDate");
    }

    console.log("🌅 Fetching solar data:", {lat, lng, startDate, endDate});

    const start = new Date(startDate);
    const end = new Date(endDate);
    const solarData = [];

    // Fetch solar data for each day in trip
    let currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split("T")[0];

      const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&date=${dateStr}&formatted=0`;
      const response = await axios.get(url);
      const data = response.data.results;

      // Calculate golden hour (1 hour after sunrise, 1 hour before sunset)
      const sunrise = new Date(data.sunrise);
      const sunset = new Date(data.sunset);
      const goldenHourMorning = new Date(sunrise.getTime() + 60 * 60 * 1000);
      const goldenHourEvening = new Date(sunset.getTime() - 60 * 60 * 1000);

      solarData.push({
        date: dateStr,
        sunrise: data.sunrise, // Return full ISO timestamp for timezone conversion
        sunset: data.sunset, // Return full ISO timestamp for timezone conversion
        goldenHour: {
          morning: goldenHourMorning.toISOString(), // Full ISO timestamp
          evening: goldenHourEvening.toISOString(), // Full ISO timestamp
        },
        dayLength: Math.round(data.day_length / 3600), // Convert to hours
        solarNoon: data.solar_noon, // Full ISO timestamp
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`✅ Solar data retrieved for ${solarData.length} days`);

    return {
      success: true,
      location: {lat, lng},
      solarData,
    };
  } catch (error) {
    console.error("Error fetching solar data:", error);
    throw new Error(`Failed to fetch solar data: ${error.message}`);
  }
});

// ============================================
// THERE-THEN: Trip Planning Scoring Algorithm
// ============================================

/**
 * Smart activity scoring for There-Then trip planning.
 * Weights activities by environmental conditions and user affinities.
 *
 * Scoring breakdown:
 * - 40% Weather Suitability
 * - 20% Air Quality
 * - 20% Time Optimization (solar data)
 * - 20% User Affinity
 *
 * Age-based filtering:
 * - Penalizes adult-only activities when children are present
 * - Boosts kid-friendly activities based on youngest age
 */
exports.scoreThereThenActivities = onCall(async (request) => {
  try {
    const {
      activities,
      weather,
      airQuality,
      solarData,
      userAffinities,
      tripDates,
      participants = [], // Array of TripParticipant objects with age field
    } = request.data;

    if (!activities || !Array.isArray(activities)) {
      throw new Error("Missing or invalid activities array");
    }

    console.log(`🎯 Scoring ${activities.length} activities for There-Then`);

    // Calculate youngest age in group
    const youngestAge = participants.length > 0
      ? Math.min(...participants.map(p => p.age || 999).filter(age => age !== 999))
      : null;

    if (youngestAge && youngestAge < 21) {
      console.log(`👶 Age filtering active: youngest participant is ${youngestAge} years old`);
    }

    // Helper: Check if activity is outdoors
    const isOutdoorActivity = (activity) => {
      const outdoorCategories = [
        "hiking",
        "parks",
        "beaches",
        "camping",
        "fishing",
        "kayaking",
        "biking",
        "rock_climbing",
        "geocaching",
        "outdoor_adventures",
        "nature",
        "photography",
        "stargazing",
        "surfing",
        "skiing",
        "outdoor_sports",
      ];

      return (
        activity.categories?.some((cat) =>
          outdoorCategories.includes(cat.toLowerCase()),
        ) || false
      );
    };

    // Helper: Weather score (0-100)
    const calculateWeatherScore = (activity, weatherData) => {
      if (!weatherData || !weatherData.forecasts || weatherData.forecasts.length === 0) {
        return 50; // Neutral if no weather data
      }

      const isOutdoor = isOutdoorActivity(activity);
      let totalScore = 0;
      let dayCount = 0;

      weatherData.forecasts.forEach((day) => {
        if (!day.hourly || day.hourly.length === 0) return;

        // Average conditions for the day
        const avgTemp = day.hourly.reduce((sum, h) => sum + h.temp, 0) / day.hourly.length;
        const maxPrecipitation = Math.max(...day.hourly.map((h) => h.precipitation || 0));
        const avgCondition = day.hourly[0].condition; // Simplified: use first condition

        let dayScore = 100;

        if (isOutdoor) {
          // Outdoor activities
          // Penalize rain
          if (maxPrecipitation > 70) {
            dayScore -= 50;
          } else if (maxPrecipitation > 30) {
            dayScore -= 25;
          }

          // Penalize extreme temps
          if (avgTemp < 30 || avgTemp > 95) {
            dayScore -= 30;
          } else if (avgTemp < 40 || avgTemp > 85) {
            dayScore -= 15;
          }

          // Bonus for sunny
          if (avgCondition === "clear" || avgCondition === "sunny") {
            dayScore += 10;
          }
        } else {
          // Indoor activities - bonus for bad weather
          if (maxPrecipitation > 50) {
            dayScore += 20;
          }
          if (avgTemp < 30 || avgTemp > 95) {
            dayScore += 15;
          }
        }

        totalScore += Math.max(0, Math.min(100, dayScore));
        dayCount++;
      });

      return dayCount > 0 ? totalScore / dayCount : 50;
    };

    // Helper: Air Quality score (0-100)
    const calculateAirQualityScore = (activity, aqData) => {
      if (!aqData || !aqData.current) {
        return 50; // Neutral if no AQ data
      }

      const aqi = aqData.current.aqi;
      const isOutdoor = isOutdoorActivity(activity);

      if (!isOutdoor) {
        return 100; // Indoor activities unaffected by AQ
      }

      // AQI scale: 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor
      const aqiScores = {
        1: 100, // Good
        2: 80, // Fair
        3: 50, // Moderate - caution for outdoor
        4: 20, // Poor - avoid outdoor
        5: 0, // Very Poor - strongly avoid outdoor
      };

      return aqiScores[aqi] || 50;
    };

    // Helper: Time Optimization score (0-100)
    const calculateTimeScore = (activity, solarDataArray) => {
      if (!solarDataArray || solarDataArray.length === 0) {
        return 50; // Neutral if no solar data
      }

      // Photography activities get bonus during golden hour
      const isPhotography = activity.categories?.some((cat) =>
        ["photography", "scenic_views", "nature"].includes(cat.toLowerCase()),
      );

      // Stargazing needs nighttime
      const isStargazing = activity.categories?.includes("stargazing");

      if (isPhotography) {
        return 85; // Bonus for golden hour opportunities
      }

      if (isStargazing) {
        return 90; // Perfect for nighttime
      }

      // General outdoor activities - slightly prefer daytime
      if (isOutdoorActivity(activity)) {
        return 70;
      }

      return 50; // Neutral for other activities
    };

    // Helper: User Affinity score (0-100)
    const calculateAffinityScore = (activity, affinities) => {
      if (!affinities || !activity.categories || activity.categories.length === 0) {
        return 50; // Neutral if no affinity data
      }

      // Find highest matching affinity
      let maxAffinity = 0.3; // Default minimum

      activity.categories.forEach((category) => {
        const affinity = affinities[category] || 0.3;
        maxAffinity = Math.max(maxAffinity, affinity);
      });

      // Convert 0-1 scale to 0-100
      return maxAffinity * 100;
    };

    // Helper: Age appropriateness check
    const isAdultOnly = (activity) => {
      const adultCategories = [
        "nightlife",
        "bars",
        "clubs",
        "wine_tasting",
        "breweries",
        "casinos",
        "adult_entertainment",
      ];

      return activity.categories?.some((cat) =>
        adultCategories.includes(cat.toLowerCase()),
      ) || false;
    };

    // Helper: Kid-friendly check
    const isKidFriendly = (activity) => {
      const kidCategories = [
        "playgrounds",
        "children_museums",
        "amusement_parks",
        "zoos",
        "aquariums",
        "family_entertainment",
        "parks",
        "ice_cream",
        "arcades",
      ];

      return activity.categories?.some((cat) =>
        kidCategories.includes(cat.toLowerCase()),
      ) || false;
    };

    // Helper: Age-based score adjustment
    const calculateAgeAdjustment = (activity, youngestAge) => {
      if (!youngestAge) return 1.0; // No adjustment if no age data

      // Adult-only activities when kids present: zero out the score
      if (isAdultOnly(activity) && youngestAge < 21) {
        console.log(`🚫 AGE_FILTER: Zeroing adult activity "${activity.name}" (youngest: ${youngestAge})`);
        return 0;
      }

      // Boost kid-friendly activities for young children
      if (isKidFriendly(activity) && youngestAge < 13) {
        const boostFactor = youngestAge < 6 ? 1.3 : 1.2;
        console.log(`✨ AGE_FILTER: Boosting kid activity "${activity.name}" by ${boostFactor}x (youngest: ${youngestAge})`);
        return boostFactor;
      }

      return 1.0; // No adjustment
    };

    // Score each activity
    const scoredActivities = activities.map((activity) => {
      const weatherScore = calculateWeatherScore(activity, weather);
      const aqScore = calculateAirQualityScore(activity, airQuality);
      const timeScore = calculateTimeScore(activity, solarData?.solarData);
      const affinityScore = calculateAffinityScore(activity, userAffinities);

      // Base weighted score (40% weather, 20% AQ, 20% time, 20% affinity)
      let baseScore = (
        weatherScore * 0.4 +
        aqScore * 0.2 +
        timeScore * 0.2 +
        affinityScore * 0.2
      );

      // Apply age-based adjustment
      const ageAdjustment = calculateAgeAdjustment(activity, youngestAge);
      const finalScore = ageAdjustment === 0 ? 0 : Math.min(100, baseScore * ageAdjustment);

      return {
        ...activity,
        thereThenScore: Math.round(finalScore),
        thereThenBreakdown: {
          weather: Math.round(weatherScore),
          airQuality: Math.round(aqScore),
          timeOptimization: Math.round(timeScore),
          userAffinity: Math.round(affinityScore),
          ageAdjustment: ageAdjustment !== 1.0 ? ageAdjustment : undefined, // Only include if adjusted
        },
      };
    });

    // Sort by score (highest first)
    scoredActivities.sort((a, b) => b.thereThenScore - a.thereThenScore);

    console.log(`✅ Scored ${scoredActivities.length} activities. Top score: ${scoredActivities[0]?.thereThenScore || 0}`);

    return {
      success: true,
      activities: scoredActivities,
      scoringWeights: {
        weather: "40%",
        airQuality: "20%",
        timeOptimization: "20%",
        userAffinity: "20%",
      },
    };
  } catch (error) {
    console.error("Error scoring There-Then activities:", error);
    throw new Error(`Failed to score activities: ${error.message}`);
  }
});

// ============================================================================
// TWITTER/X INTEGRATION
// ============================================================================

/**
 * Calculate simple vibe summary from events
 * Analyzes event content and engagement to determine local mood/energy
 */
function calculateSimpleVibe(events) {
  if (!events || events.length === 0) {
    return {
      mood: "quiet",
      energy: "low",
      description: "Not much happening right now. Check back later for local events!",
      topThemes: [],
      eventCount: 0,
    };
  }

  // Analyze keywords to determine themes
  const allText = events.map(e => e.text.toLowerCase()).join(" ");

  const themes = {
    music: ["concert", "music", "band", "show", "live music", "festival"].some(k => allText.includes(k)),
    food: ["food", "restaurant", "dining", "chef", "culinary"].some(k => allText.includes(k)),
    arts: ["art", "gallery", "exhibit", "museum", "theater"].some(k => allText.includes(k)),
    sports: ["game", "sports", "team", "match", "tournament"].some(k => allText.includes(k)),
    nightlife: ["bar", "club", "party", "drinks", "nightlife"].some(k => allText.includes(k)),
    family: ["family", "kids", "children", "festival", "fair"].some(k => allText.includes(k)),
  };

  const topThemes = Object.entries(themes)
    .filter(([_, active]) => active)
    .map(([theme, _]) => theme);

  // Calculate energy level based on engagement
  const avgLikes = events.reduce((sum, e) => sum + e.engagement.likes, 0) / events.length;
  const energy = avgLikes > 50 ? "high" : avgLikes > 20 ? "medium" : "low";

  // Determine mood based on themes
  let mood = "mixed";
  if (themes.music && themes.nightlife) mood = "lively";
  else if (themes.arts && themes.food) mood = "cultured";
  else if (themes.family) mood = "family-friendly";
  else if (themes.sports) mood = "energetic";
  else if (events.length > 10) mood = "buzzing";
  else if (events.length > 5) mood = "active";
  else mood = "calm";

  // Generate description
  const descriptions = {
    "lively": "The scene is lively with music and nightlife! Lots happening tonight.",
    "cultured": "Arts and dining scene is active. Great time to explore cultural offerings.",
    "family-friendly": "Family-friendly events happening. Perfect for all ages!",
    "energetic": "Sports and competitive energy in the air. Game on!",
    "buzzing": `${events.length} events happening! The area is buzzing with activity.`,
    "active": "Several events happening around you. Good time to get out!",
    "calm": "A few low-key events happening. Relaxed vibe in the area.",
    "mixed": `${events.length} diverse events happening. Something for everyone!`,
  };

  return {
    mood,
    energy,
    description: descriptions[mood],
    topThemes: topThemes.slice(0, 3),
    eventCount: events.length,
  };
}

/**
 * Search Twitter/X for local content based on location and user affinities
 *
 * Returns both event tweets and general local buzz
 */
exports.searchTwitter = onCall(async (request) => {
  try {
    const { lat, lng, radius = 10, affinities = {}, userId, cityName, stateName } = request.data;

    console.log(`🐦 TWITTER SEARCH: lat=${lat}, lng=${lng}, radius=${radius}mi, city=${cityName}, state=${stateName}`);

    if (!lat || !lng) {
      throw new Error("Location (lat, lng) is required");
    }

    // Get top affinity categories (lowered threshold to 10 for wider search)
    const topCategories = Object.entries(affinities)
      .filter(([_, rating]) => rating >= 10)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 5)
      .map(([category, _]) => category);

    console.log(`🐦 Top affinity categories (>= 10):`, topCategories);

    // Build search query with affinity hashtags + general local hashtags
    let hashtags = topCategories.map(cat => `#${cat.replace(/_/g, '')}`).join(" OR ");

    // If no affinities, add general local/community hashtags
    if (!hashtags) {
      hashtags = "#local OR #community OR #downtown OR #smalltown OR #visitmaryland OR #maryland";
      console.log(`🐦 No user affinities >= 10, using general local hashtags`);
    }

    const eventKeywords = "(event OR festival OR concert OR exhibit OR fair OR market OR show OR happening OR tonight OR weekend)";

    // Twitter API v2 Recent Search endpoint
    const searchUrl = "https://api.twitter.com/2/tweets/search/recent";

    const allTweets = [];

    // Rate limit tracking
    let rateLimitInfo = {
      limit: null,
      remaining: null,
      reset: null,
      resetTime: null,
    };

    // Search 1: Events with hashtags (now always runs)
    if (true) {
      try {
        console.log(`🐦 Searching for events with hashtags: ${hashtags}`);
        const eventResponse = await axios.get(searchUrl, {
          headers: {
            "Authorization": `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
          },
          params: {
            query: `${eventKeywords} (${hashtags}) -is:retweet -is:reply`,
            max_results: 20,
            "tweet.fields": "created_at,public_metrics,entities,geo",
            "expansions": "author_id,geo.place_id",
            "user.fields": "username,name,profile_image_url",
            "place.fields": "full_name,geo,place_type",
          },
        });

        // Capture rate limit info from headers
        const headers = eventResponse.headers;
        rateLimitInfo = {
          limit: parseInt(headers['x-rate-limit-limit']) || null,
          remaining: parseInt(headers['x-rate-limit-remaining']) || null,
          reset: parseInt(headers['x-rate-limit-reset']) || null,
          resetTime: headers['x-rate-limit-reset'] ? new Date(parseInt(headers['x-rate-limit-reset']) * 1000).toISOString() : null,
        };

        console.log(`🐦 RATE LIMIT: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} remaining, resets at ${rateLimitInfo.resetTime}`);

        if (eventResponse.data?.data) {
          allTweets.push(...eventResponse.data.data.map(tweet => ({
            ...tweet,
            searchType: 'event',
            includes: eventResponse.data.includes,
          })));
          console.log(`🐦 Found ${eventResponse.data.data.length} event tweets`);
        }
      } catch (error) {
        console.error(`🐦 Event search failed:`, error.message);
      }
    }

    // Search 2: General local content near location (tighter radius for truly local content)
    try {
      // Use the original radius for stricter geographic filtering
      const expandedRadius = radius; // Changed from radius * 2 to just radius
      const radiusKm = expandedRadius * 1.60934; // miles to km
      console.log(`🐦 Searching near ${lat},${lng} within ${radiusKm}km (${expandedRadius}mi strict)`);

      // Add location-specific search terms
      const localQuery = `point_radius:[${lng} ${lat} ${radiusKm}km] -is:retweet -is:reply`;

      const localResponse = await axios.get(searchUrl, {
        headers: {
          "Authorization": `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
        },
        params: {
          query: localQuery,
          max_results: 50,  // Increased from 30 to 50
          "tweet.fields": "created_at,public_metrics,entities,geo",
          "expansions": "author_id,geo.place_id",
          "user.fields": "username,name,profile_image_url",
          "place.fields": "full_name,geo,place_type",
        },
      });

      if (localResponse.data?.data) {
        allTweets.push(...localResponse.data.data.map(tweet => ({
          ...tweet,
          searchType: 'local',
          includes: localResponse.data.includes,
        })));
        console.log(`🐦 Found ${localResponse.data.data.length} local tweets`);
      }
    } catch (error) {
      console.error(`🐦 Local search failed:`, error.message);
    }

    // Search 3: City/State name mentions (catch tweets without location data)
    // Only run if we have city or state information
    if (cityName || stateName) {
      try {
        let locationQuery = "";

        if (cityName && stateName) {
          // Search for both city and state
          locationQuery = `("${cityName}" OR "${stateName}") -is:retweet -is:reply`;
        } else if (stateName) {
          // Just state
          locationQuery = `"${stateName}" -is:retweet -is:reply`;
        } else if (cityName) {
          // Just city (less reliable without state context)
          locationQuery = `"${cityName}" -is:retweet -is:reply`;
        }

        console.log(`🐦 Searching for location mentions: ${locationQuery}`);

        const regionResponse = await axios.get(searchUrl, {
          headers: {
            "Authorization": `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
          },
          params: {
            query: locationQuery,
            max_results: 20,
            "tweet.fields": "created_at,public_metrics,entities,geo",
            "expansions": "author_id,geo.place_id",
            "user.fields": "username,name,profile_image_url",
            "place.fields": "full_name,geo,place_type",
          },
        });

        if (regionResponse.data?.data) {
          allTweets.push(...regionResponse.data.data.map(tweet => ({
            ...tweet,
            searchType: 'local',
            includes: regionResponse.data.includes,
          })));
          console.log(`🐦 Found ${regionResponse.data.data.length} location name tweets`);
        }
      } catch (error) {
        console.error(`🐦 Location name search failed:`, error.message);
      }
    } else {
      console.log(`🐦 Skipping location name search - no city/state provided`);
    }

    // Deduplicate by tweet ID
    const uniqueTweets = Array.from(
      new Map(allTweets.map(tweet => [tweet.id, tweet])).values()
    );

    console.log(`🐦 Total unique tweets: ${uniqueTweets.length}`);

    // Helper: Check if tweet contains date/time info (likely an event)
    const hasDateInfo = (text) => {
      if (!text) return false;
      const lower = text.toLowerCase();
      
      const datePatterns = [
        /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}/i,
        /\b\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?/,
        /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
        /\b(today|tomorrow|tonight|this\s+(week|weekend|month))/i,
        /\b\d{1,2}(st|nd|rd|th)\s+(of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
      ];
      
      const timePatterns = [
        /\b\d{1,2}:\d{2}\s*(am|pm|AM|PM)?/,
        /\b(at|from|starting|begins)\s+\d{1,2}/i,
      ];
      
      return datePatterns.some(p => p.test(text)) || timePatterns.some(p => p.test(text));
    };

    // Structure tweets
    const structuredTweets = uniqueTweets.map(tweet => {
      const author = tweet.includes?.users?.find(u => u.id === tweet.author_id) || {};
      const place = tweet.includes?.places?.find(p => p.id === tweet.geo?.place_id) || {};
      
      const isEvent = tweet.searchType === 'event' || hasDateInfo(tweet.text);
      
      return {
        id: tweet.id,
        text: tweet.text,
        createdAt: tweet.created_at,
        url: `https://twitter.com/${author.username}/status/${tweet.id}`,
        author: {
          username: author.username,
          name: author.name,
          avatar: author.profile_image_url,
        },
        engagement: {
          likes: tweet.public_metrics?.like_count || 0,
          retweets: tweet.public_metrics?.retweet_count || 0,
          replies: tweet.public_metrics?.reply_count || 0,
        },
        location: place.full_name || null,
        isEvent,
        hashtags: tweet.entities?.hashtags?.map(h => h.tag) || [],
        searchType: tweet.searchType,
      };
    });

    // Separate events from general content
    const events = structuredTweets.filter(t => t.isEvent);
    const buzz = structuredTweets.filter(t => !t.isEvent);

    console.log(`🐦 Structured: ${events.length} events, ${buzz.length} buzz tweets`);

    // Calculate simple vibe summary
    const vibeSummary = calculateSimpleVibe(events);

    return {
      success: true,
      events,
      buzz,
      total: structuredTweets.length,
      location: { lat, lng, radius },
      affinityCategories: topCategories,
      rateLimit: rateLimitInfo,
      vibe: vibeSummary,
    };

  } catch (error) {
    console.error("🐦 Twitter search error:", error);
    throw new Error(`Twitter search failed: ${error.message}`);
  }
});

// ============================================================================
// VIBEINDEX CALCULATION
// ============================================================================

/**
 * VibeIndex Categories and Keywords
 */
const VIBE_CATEGORIES = {
  artsy: {
    name: "🎨 Artsy",
    keywords: ["art", "gallery", "exhibit", "mural", "artist", "creative", "painting", "sculpture"],
    hashtags: ["art", "artsy", "gallery", "streetart", "artistsontwitter", "creative"],
  },
  musicScene: {
    name: "🎵 Music Scene",
    keywords: ["concert", "band", "music", "live music", "show", "festival", "gig", "venue"],
    hashtags: ["livemusic", "concert", "musicfestival", "localmusic", "band"],
  },
  businessHub: {
    name: "🏢 Business Hub",
    keywords: ["startup", "business", "entrepreneur", "corporate", "tech", "innovation", "company"],
    hashtags: ["startup", "entrepreneur", "business", "innovation", "tech"],
  },
  sportsCulture: {
    name: "⚽ Sports Culture",
    keywords: ["game", "team", "sports", "athletic", "fitness", "championship", "tournament"],
    hashtags: ["sports", "fitness", "athletics", "gameon", "championship"],
  },
  cultureEvents: {
    name: "🎭 Culture & Events",
    keywords: ["festival", "event", "cultural", "community", "celebration", "tradition"],
    hashtags: ["festival", "culturalevent", "community", "celebration"],
  },
  quirkyFunky: {
    name: "🌈 Quirky/Funky",
    keywords: ["weird", "quirky", "unique", "funky", "alternative", "odd", "eccentric"],
    hashtags: ["weird", "quirky", "keepitweird", "unique", "funky"],
  },
  foodieScene: {
    name: "🍽️ Foodie Scene",
    keywords: ["foodie", "restaurant", "chef", "culinary", "food festival", "dining"],
    hashtags: ["foodie", "restaurant", "foodporn", "chef", "dining"],
  },
  nightlife: {
    name: "🌃 Nightlife",
    keywords: ["nightlife", "bar", "club", "party", "drinks", "happy hour"],
    hashtags: ["nightlife", "bars", "club", "drinks", "party"],
  },
};

/**
 * Calculate VibeIndex score for a category
 * @param {Array} tweets - Tweets to analyze
 * @param {Object} category - Category definition with keywords/hashtags
 * @param {number} population - City population for normalization
 * @returns {Object} Score breakdown
 */
function calculateCategoryScore(tweets, category, population) {
  if (tweets.length === 0) {
    return {
      score: 0,
      tweetCount: 0,
      uniqueUsers: 0,
      avgEngagement: 0,
    };
  }

  // Volume Score (0-30): Normalized by population
  const volumeScore = Math.min(30, (tweets.length / (population / 1000)) * 10);

  // Engagement Score (0-30): Average engagement per tweet
  const totalEngagement = tweets.reduce((sum, tweet) => {
    const likes = tweet.public_metrics?.like_count || 0;
    const retweets = tweet.public_metrics?.retweet_count || 0;
    const replies = tweet.public_metrics?.reply_count || 0;
    return sum + likes + retweets + replies;
  }, 0);
  const avgEngagement = tweets.length > 0 ? totalEngagement / tweets.length : 0;
  const engagementScore = Math.min(30, (avgEngagement / 5) * 5);

  // Diversity Score (0-20): Unique users
  const uniqueUsers = new Set(tweets.map(t => t.author_id)).size;
  const diversityScore = Math.min(20, uniqueUsers / 10);

  // Recency Score (0-10): Time decay
  const now = new Date();
  let recencyScore = 0;
  tweets.forEach(tweet => {
    const tweetDate = new Date(tweet.created_at);
    const daysAgo = (now - tweetDate) / (1000 * 60 * 60 * 24);
    if (daysAgo <= 7) recencyScore += 10 / tweets.length;
    else if (daysAgo <= 14) recencyScore += 7 / tweets.length;
    else if (daysAgo <= 21) recencyScore += 4 / tweets.length;
    else if (daysAgo <= 30) recencyScore += 2 / tweets.length;
  });
  recencyScore = Math.min(10, recencyScore);

  // Event Density Score (0-10): Tweets with date/time patterns
  const eventRegex = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\/\d{1,2}|\d{1,2}:\d{2}|at \d|pm|am)\b/i;
  const eventTweets = tweets.filter(t => eventRegex.test(t.text)).length;
  const eventScore = Math.min(10, eventTweets / 2);

  const finalScore = Math.round(volumeScore + engagementScore + diversityScore + recencyScore + eventScore);

  return {
    score: finalScore,
    tweetCount: tweets.length,
    uniqueUsers,
    avgEngagement: Math.round(avgEngagement * 10) / 10,
  };
}

/**
 * Filter tweets by category keywords and hashtags
 */
function filterTweetsByCategory(tweets, category) {
  return tweets.filter(tweet => {
    const text = tweet.text.toLowerCase();
    const tweetHashtags = tweet.entities?.hashtags?.map(h => h.tag.toLowerCase()) || [];

    // Check if tweet contains any category keywords
    const hasKeyword = category.keywords.some(keyword => text.includes(keyword.toLowerCase()));

    // Check if tweet has any category hashtags
    const hasHashtag = category.hashtags.some(hashtag =>
      tweetHashtags.includes(hashtag.toLowerCase())
    );

    return hasKeyword || hasHashtag;
  });
}

/**
 * Calculate VibeIndex for a city
 * Cloud Function (Callable)
 */
exports.calculateVibeIndex = onCall(async (request) => {
  const { cityName, state, lat, lng, radius = 15, population = 10000 } = request.data;

  console.log(`🎨 VIBEINDEX: Calculating for ${cityName}, ${state}`);

  try {
    // Fetch tweets from last 30 days near the city
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startTime = thirtyDaysAgo.toISOString();

    // Search for tweets near location (broader search for all content)
    const searchUrl = "https://api.twitter.com/2/tweets/search/recent";
    const params = new URLSearchParams({
      query: `point_radius:[${lng} ${lat} ${radius}mi]`,
      max_results: 100,
      start_time: startTime,
      "tweet.fields": "created_at,public_metrics,entities,author_id",
      "expansions": "author_id,geo.place_id",
      "user.fields": "username,name,profile_image_url",
      "place.fields": "full_name,geo",
    });

    console.log(`🎨 VIBEINDEX: Fetching tweets with query: point_radius:[${lng} ${lat} ${radius}mi]`);

    const response = await fetch(`${searchUrl}?${params}`, {
      headers: {
        "Authorization": `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`🎨 VIBEINDEX: Twitter API error ${response.status}: ${errorText}`);
      throw new Error(`Twitter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`🎨 VIBEINDEX: API Response:`, JSON.stringify(data).substring(0, 500));

    const tweets = data.data || [];

    console.log(`🎨 VIBEINDEX: Found ${tweets.length} total tweets`);

    // Calculate scores for each category
    const scores = {};
    let totalScore = 0;
    const trendingCategories = [];

    for (const [categoryKey, categoryDef] of Object.entries(VIBE_CATEGORIES)) {
      const categoryTweets = filterTweetsByCategory(tweets, categoryDef);
      const categoryScore = calculateCategoryScore(categoryTweets, categoryDef, population);

      scores[categoryKey] = {
        ...categoryScore,
        name: categoryDef.name,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      };

      totalScore += categoryScore.score;
      if (categoryScore.score >= 60) {
        trendingCategories.push({ key: categoryKey, name: categoryDef.name, score: categoryScore.score });
      }

      console.log(`🎨 ${categoryDef.name}: ${categoryScore.score} pts (${categoryScore.tweetCount} tweets)`);
    }

    // Sort trending categories by score
    trendingCategories.sort((a, b) => b.score - a.score);
    const topTrending = trendingCategories.slice(0, 2).map(c => c.key);

    const overallVibeScore = Math.round(totalScore / Object.keys(VIBE_CATEGORIES).length);

    // Store in Firestore
    const cityId = `${cityName.toLowerCase().replace(/\s+/g, '-')}-${state.toLowerCase()}`;
    const vibeDoc = {
      cityId,
      cityName,
      state,
      country: "US",
      location: {
        lat,
        lng,
        geohash: geohash.encode(lat, lng, 6),
      },
      population,
      scores,
      overallVibeScore,
      trendingCategories: topTrending,
      calculatedAt: admin.firestore.FieldValue.serverTimestamp(),
      nextUpdate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    };

    await admin.firestore().collection("vibeScores").doc(cityId).set(vibeDoc);

    console.log(`🎨 VIBEINDEX: Overall score ${overallVibeScore}, trending: ${topTrending.join(", ")}`);

    return {
      success: true,
      cityId,
      cityName,
      state,
      overallVibeScore,
      scores,
      trendingCategories: topTrending,
      totalTweets: tweets.length,
    };

  } catch (error) {
    console.error("🎨 VibeIndex calculation error:", error);
    throw new Error(`VibeIndex calculation failed: ${error.message}`);
  }
});

/**
 * Get VibeIndex scores for a city
 * Cloud Function (Callable)
 */
exports.getVibeIndex = onCall(async (request) => {
  const { cityId, cityName, state } = request.data;

  try {
    let docId = cityId;
    if (!docId && cityName && state) {
      docId = `${cityName.toLowerCase().replace(/\s+/g, '-')}-${state.toLowerCase()}`;
    }

    if (!docId) {
      throw new Error("Either cityId or (cityName + state) required");
    }

    const doc = await admin.firestore().collection("vibeScores").doc(docId).get();

    if (!doc.exists) {
      return {
        success: false,
        error: "City not found in VibeIndex database",
      };
    }

    return {
      success: true,
      ...doc.data(),
    };

  } catch (error) {
    console.error("🎨 Get VibeIndex error:", error);
    throw new Error(`Get VibeIndex failed: ${error.message}`);
  }
});
