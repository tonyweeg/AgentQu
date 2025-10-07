const {onRequest} = require("firebase-functions/v2/https");
const {onCall} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

/**
 * Helper: Calculate distance between two points (Haversine formula)
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
 * Calculate score for an activity
 */
function calculateScore(activity, userLat, userLng) {
  let score = 100;

  // Distance penalty (closer = better)
  const distance = activity.distance || 0;
  if (distance > 10) score -= 40;
  else if (distance > 5) score -= 20;
  else if (distance > 1) score -= 10;

  // Free activities bonus
  if (activity.cost && activity.cost.free) score += 10;

  // Rating bonus
  if (activity.rating) {
    score += (activity.rating / 5) * 20;
  }

  // Open now bonus
  if (activity.openNow) score += 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Fetch local activities using Google Custom Search API
 * This searches for "things to do near [location]"
 */
async function fetchGoogleSearch(lat, lng, city = null) {
  const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
  const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
    console.warn("Google Search API not configured");
    return [];
  }

  try {
    // Build search query based on location
    const searchQuery = city
      ? `things to do near ${city} today`
      : `things to do at ${lat},${lng} today`;

    const url = `https://www.googleapis.com/customsearch/v1`;

    const response = await axios.get(url, {
      params: {
        key: GOOGLE_SEARCH_API_KEY,
        cx: GOOGLE_SEARCH_ENGINE_ID,
        q: searchQuery,
        num: 10, // Max 10 results per query
      },
    });

    if (!response.data.items) {
      return [];
    }

    // Parse search results into activities
    return response.data.items
      .map((item, index) => ({
        id: `search_${index}_${Date.now()}`,
        name: item.title,
        type: "event", // Assume events/activities from search
        description: item.snippet,

        // Approximate location (use search location)
        lat: lat,
        lng: lng,
        address: item.displayLink,

        categories: ["event", "activity"],
        primaryCategory: "event",

        accessibility: {
          wheelchairAccessible: false,
          mobilityLevel: "unknown",
        },

        openNow: true, // Assume open if it shows up in "today" search

        cost: {
          free: item.snippet?.toLowerCase().includes("free"),
          priceLevel: null,
        },

        rating: null,
        reviewCount: 0,

        images: item.pagemap?.cse_image?.[0]?.src
          ? [item.pagemap.cse_image[0].src]
          : [],

        source: "google_search",
        link: item.link,
      }))
      .filter((activity) => activity.name && activity.description);
  } catch (error) {
    console.error("Error fetching Google Search:", error.message);
    return [];
  }
}

/**
 * Fetch places from Google Places API
 */
async function fetchGooglePlaces(lat, lng, radius = 5) {
  const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

  if (!GOOGLE_PLACES_API_KEY) {
    console.warn("Google Places API key not configured");
    return [];
  }

  try {
    const radiusMeters = radius * 1609; // miles to meters
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;

    const response = await axios.get(url, {
      params: {
        location: `${lat},${lng}`,
        radius: radiusMeters,
        key: GOOGLE_PLACES_API_KEY,
        type: "point_of_interest",
      },
    });

    if (response.data.status !== "OK") {
      console.error("Google Places API error:", response.data.status);
      return [];
    }

    return response.data.results.map((place) => ({
      id: `google_${place.place_id}`,
      name: place.name,
      type: "venue",
      description: place.vicinity,

      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      address: place.vicinity,

      categories: place.types || [],
      primaryCategory: place.types?.[0] || "venue",

      accessibility: {
        wheelchairAccessible: false, // Google doesn't provide this in basic API
        mobilityLevel: "unknown",
      },

      openNow: place.opening_hours?.open_now || false,

      cost: {
        free: false,
        priceLevel: place.price_level || null,
      },

      rating: place.rating || null,
      reviewCount: place.user_ratings_total || 0,

      images: place.photos
        ? place.photos.slice(0, 2).map(
            (photo) =>
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`,
          )
        : [],

      source: "google_places",
    }));
  } catch (error) {
    console.error("Error fetching Google Places:", error.message);
    return [];
  }
}

/**
 * Main Discovery Function
 * Aggregates activities from all sources
 */
exports.discoverActivities = onCall(async (request) => {
  const {lat, lng, radius = 10} = request.data;

  if (!lat || !lng) {
    throw new Error("Missing required parameters: lat, lng");
  }

  const startTime = Date.now();

  try {
    // Fetch from all sources in parallel
    const [googleSearch, googlePlaces] = await Promise.all([
      fetchGoogleSearch(lat, lng), // PRIMARY: Google Search for local activities
      fetchGooglePlaces(lat, lng, radius), // SECONDARY: Google Places for venues
      // TODO: Add more sources
      // fetchTicketmaster(lat, lng),
      // fetchEventbrite(lat, lng),
      // fetchHikingTrails(lat, lng),
    ]);

    // Combine all results (prioritize Google Search)
    let allActivities = [...googleSearch, ...googlePlaces];

    // Calculate distances
    allActivities = allActivities.map((activity) => ({
      ...activity,
      distance: calculateDistance(lat, lng, activity.lat, activity.lng),
    }));

    // Filter by max distance
    allActivities = allActivities.filter((a) => a.distance <= radius);

    // Calculate scores
    allActivities = allActivities.map((activity) => ({
      ...activity,
      score: calculateScore(activity, lat, lng),
    }));

    // Sort by score
    allActivities.sort((a, b) => b.score - a.score);

    // Limit results
    const results = allActivities.slice(0, 50);

    const queryTime = Date.now() - startTime;

    return {
      success: true,
      activities: results,
      metadata: {
        totalFound: results.length,
        queryTimeMs: queryTime,
        sources: {
          google_search: googleSearch.length,
          google_places: googlePlaces.length,
        },
        userLocation: {lat, lng},
      },
    };
  } catch (error) {
    console.error("Discovery error:", error);
    throw new Error(`Discovery failed: ${error.message}`);
  }
});

/**
 * Health check endpoint
 */
exports.healthCheck = onRequest((req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "agentqu-api",
  });
});
