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
 * Calculate final composite score
 */
function calculateFinalScore(activity, userLat, userLng, userAffinities) {
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

  // Affinity factor (0-40 points) - BIGGEST WEIGHT
  const affinityScore = calculateAffinityScore(activity.categories, userAffinities);
  const affinityPoints = affinityScore * 40;
  baseScore += affinityPoints;

  return {
    finalScore: Math.max(0, Math.round(baseScore)),
    baseScore: Math.round(baseScore - affinityPoints),
    affinityScore: Math.round(affinityPoints),
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
    console.warn("Google Search API not configured");
    return [];
  }

  try {
    const searchQuery = city
      ? `things to do near ${city} today`
      : `things to do at ${lat},${lng} today`;

    const response = await axios.get(`https://www.googleapis.com/customsearch/v1`, {
      params: {
        key: GOOGLE_SEARCH_API_KEY,
        cx: GOOGLE_SEARCH_ENGINE_ID,
        q: searchQuery,
        num: 10,
      },
    });

    if (!response.data.items) return [];

    return response.data.items
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
          sourceId: item.cacheId || item.link,
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
        categories,
        primaryCategory: categories[0] || place.types?.[0] || "venue",
        details: {
          description: place.formattedAddress,
          shortDescription: place.formattedAddress,
          imageUrl: place.photos?.[0]?.name
            ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?key=${GOOGLE_PLACES_API_KEY}&maxHeightPx=400&maxWidthPx=400`
            : null,
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
  const {lat, lng, radius = 10, userId} = request.data;

  if (!lat || !lng) {
    throw new Error("Missing required parameters: lat, lng");
  }

  const startTime = Date.now();

  try {
    // Get user affinities
    let userAffinities = null;
    if (userId) {
      const userDoc = await db.collection("users").doc(userId).get();
      if (userDoc.exists) {
        userAffinities = userDoc.data().affinities;
      }
    }

    // Generate geohash and cache key
    const geohashKey = geohash.encode(lat, lng, 5); // ~5km precision
    const affinitySignature = generateAffinitySignature(userAffinities);

    console.log(`Discovery request: ${geohashKey}, radius: ${radius}, affinity: ${affinitySignature}`);

    // Check cache first
    const cachedData = await checkCache(geohashKey, radius, affinitySignature);

    if (cachedData) {
      const personalizedResults = await personalizeCachedResults(cachedData, userAffinities);

      return {
        success: true,
        activities: personalizedResults.slice(0, 50),
        metadata: {
          totalFound: personalizedResults.length,
          queryTimeMs: Date.now() - startTime,
          cacheHit: true,
          cacheAge: Date.now() - cachedData.createdAt,
          cacheUsers: cachedData.userCount,
          userLocation: {lat, lng},
        },
      };
    }

    // Cache miss - fetch from APIs
    console.log("Cache MISS - fetching from APIs");

    const [googleSearch, googlePlaces] = await Promise.all([
      fetchGoogleSearch(lat, lng),
      fetchGooglePlaces(lat, lng, radius, userAffinities),
    ]);

    let allActivities = [...googleSearch, ...googlePlaces];

    // Calculate distances
    allActivities = allActivities.map((activity) => ({
      ...activity,
      distance: calculateDistance(lat, lng, activity.location.lat, activity.location.lng),
    }));

    // Filter by radius
    allActivities = allActivities.filter((a) => a.distance <= radius);

    // Calculate scores
    allActivities = allActivities.map((activity) => {
      const scores = calculateFinalScore(activity, lat, lng, userAffinities);
      return {
        ...activity,
        score: scores.finalScore,
        baseScore: scores.baseScore,
        affinityScore: scores.affinityScore,
      };
    });

    // Sort by score
    allActivities.sort((a, b) => b.score - a.score);

    // Save to database and cache
    await saveActivitiesAndCache(allActivities, geohashKey, radius, affinitySignature, userAffinities);

    const results = allActivities.slice(0, 50);

    return {
      success: true,
      activities: results,
      metadata: {
        totalFound: results.length,
        queryTimeMs: Date.now() - startTime,
        cacheHit: false,
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
