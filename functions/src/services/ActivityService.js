/**
 * Activity Service
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Activity business logic only
 * - Dependency Inversion: Depends on repository and API client interfaces
 * - Open/Closed: Extensible through configuration
 *
 * Handles:
 * - Activity discovery (Google Places + Custom Search)
 * - Activity scoring and ranking
 * - Reviews and voting
 * - Check-ins and user history
 */

const { ActivityRepository, UserRepository } = require('../repositories');
const { GooglePlacesClient, GoogleSearchClient } = require('../api');
const { createLogger } = require('../utils/logger');
const { calculateDistance, encodeGeohash } = require('../utils/distance');
const { calculateFinalScore, passesMusicGenreFilter, passesRestaurantGenreFilter } = require('../utils/scoring');
const { mapPlaceTypeToCategories } = require('../utils/mappings');
const { validateCoordinates, validateRadius, validateUserId } = require('../utils/validation');
const { RATE_LIMITS } = require('../config/constants');

class ActivityService {
  constructor() {
    this.activityRepo = new ActivityRepository();
    this.userRepo = new UserRepository();
    this.placesClient = new GooglePlacesClient();
    this.searchClient = new GoogleSearchClient();
    this.logger = createLogger('ACTIVITY_SERVICE');
  }

  /**
   * Discover activities near a location
   * @param {Object} params - Discovery parameters
   * @returns {Promise<Object>} Discovery results
   */
  async discoverActivities(params) {
    const startTime = Date.now();

    try {
      const {
        lat,
        lng,
        radius = 10,
        userId = null,
        enablePlaces = true,
        enableCustomSearch = true,
        showFastFood = false,
        textSearch = null,
      } = params;

      // Validate inputs
      validateCoordinates(lat, lng);
      validateRadius(radius);

      this.logger.info('Discovering activities', { lat, lng, radius, userId });

      // Load user affinities
      let userAffinities = null;
      let musicGenreAffinities = null;
      let restaurantGenreAffinities = null;

      if (userId) {
        const userProfile = await this.userRepo.getProfile(userId);
        if (userProfile) {
          userAffinities = userProfile.affinities;
          musicGenreAffinities = userProfile.musicGenreAffinities;
          restaurantGenreAffinities = userProfile.restaurantGenreAffinities;
        }
      }

      const allActivities = [];

      // Fetch from Google Places API
      if (enablePlaces) {
        const places = await this.fetchGooglePlaces(lat, lng, radius, textSearch);
        allActivities.push(...places);
        this.logger.debug(`Got ${places.length} places from Google Places`);
      }

      // Fetch from Google Custom Search
      if (enableCustomSearch && !textSearch) {
        // TODO: Get city name for better search
        const events = await this.fetchCustomSearchEvents(lat, lng);
        allActivities.push(...events);
        this.logger.debug(`Got ${events.length} events from Custom Search`);
      }

      // Calculate distance for all activities
      allActivities.forEach((activity) => {
        const actLat = activity.location?.lat || activity.lat;
        const actLng = activity.location?.lng || activity.lng;
        activity.distance = calculateDistance(lat, lng, actLat, actLng);
      });

      // Filter by radius
      const withinRadius = allActivities.filter((a) => a.distance <= radius);

      // Apply genre filters if user has preferences
      let filtered = withinRadius;

      if (musicGenreAffinities) {
        filtered = filtered.filter((a) => passesMusicGenreFilter(a, musicGenreAffinities));
      }

      if (restaurantGenreAffinities) {
        filtered = filtered.filter((a) => passesRestaurantGenreFilter(a, restaurantGenreAffinities));
      }

      // Score and rank activities
      const scored = filtered.map((activity) => {
        const scoreData = calculateFinalScore(
          activity,
          lat,
          lng,
          userAffinities,
          musicGenreAffinities,
          restaurantGenreAffinities
        );

        return {
          ...activity,
          score: scoreData.finalScore,
          scoreBreakdown: scoreData,
        };
      });

      // Sort by score descending
      scored.sort((a, b) => b.score - a.score);

      // Take top results
      const topActivities = scored.slice(0, RATE_LIMITS.PLACES_API_MAX_RESULTS);

      // Fetch EV charging stations if user is EV owner
      // TODO: Implement full EV charging station fetching
      // For now, return empty array to maintain API compatibility
      const chargingStations = [];

      const queryTime = Date.now() - startTime;

      this.logger.info('Discovery complete', {
        totalFound: topActivities.length,
        queryTime,
      });

      return {
        success: true,
        activities: topActivities,
        chargingStations, // Required by frontend for EV owners
        metadata: {
          totalFound: topActivities.length,
          queryTimeMs: queryTime,
          userLocation: { lat, lng },
          radius,
        },
      };
    } catch (error) {
      this.logger.error('Discovery failed', error);
      throw error;
    }
  }

  /**
   * Fetch activities from Google Places
   * @private
   */
  async fetchGooglePlaces(lat, lng, radiusMiles, textQuery = null) {
    try {
      const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters

      let places = [];

      if (textQuery) {
        // Text search
        places = await this.placesClient.textSearch(textQuery, lat, lng, radiusMeters);
      } else {
        // Nearby search with multiple types
        const types = [
          'tourist_attraction',
          'museum',
          'park',
          'restaurant',
          'cafe',
          'bar',
          'night_club',
          'shopping_mall',
          'movie_theater',
        ];

        for (const type of types) {
          const results = await this.placesClient.searchNearby(lat, lng, radiusMeters, { type });
          places.push(...results);
        }
      }

      // Transform to our activity format
      return places.map((place) => this.transformGooglePlace(place));
    } catch (error) {
      this.logger.error('Google Places fetch failed', error);
      return [];
    }
  }

  /**
   * Fetch events from Google Custom Search
   * @private
   */
  async fetchCustomSearchEvents(lat, lng, city = null) {
    try {
      if (!city) {
        // Skip if no city name (Custom Search works better with city names)
        return [];
      }

      const results = await this.searchClient.searchEvents(city);

      // Transform to our activity format
      return results.map((result, index) => this.transformSearchResult(result, lat, lng, index));
    } catch (error) {
      this.logger.error('Custom Search fetch failed', error);
      return [];
    }
  }

  /**
   * Transform Google Place to Activity format
   * @private
   */
  transformGooglePlace(place) {
    const categories = mapPlaceTypeToCategories(place.types || []);

    return {
      id: place.place_id,
      activityId: `place_${place.place_id}`,
      name: place.name,
      type: 'venue',
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        address: place.vicinity || place.formatted_address,
        geohash: encodeGeohash(place.geometry.location.lat, place.geometry.location.lng),
      },
      categories,
      primaryCategory: categories[0] || 'other',
      placeTypes: place.types || [],
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      openNow: place.opening_hours?.open_now,
      cost: {
        free: false,
        priceLevel: place.price_level,
      },
      images: place.photos
        ? place.photos.slice(0, 3).map((photo) => this.placesClient.getPhotoUrl(photo.photo_reference))
        : [],
    };
  }

  /**
   * Transform Search Result to Activity format
   * @private
   */
  transformSearchResult(result, lat, lng, index) {
    return {
      activityId: `search_${Buffer.from(result.link).toString('base64').substring(0, 16)}`,
      name: result.title,
      type: 'event',
      location: {
        lat,
        lng,
        geohash: encodeGeohash(lat, lng),
        address: result.displayLink,
      },
      categories: ['events', 'activities'],
      primaryCategory: 'event',
      details: {
        description: result.snippet,
        shortDescription: result.snippet.substring(0, 150),
        imageUrl: result.pagemap?.cse_image?.[0]?.src || null,
        website: result.link,
        priceLevel: result.snippet?.toLowerCase().includes('free') ? 0 : null,
      },
      openNow: true,
      cost: {
        free: result.snippet?.toLowerCase().includes('free') || false,
      },
    };
  }

  /**
   * Submit review for activity
   * @param {Object} params - Review parameters
   * @returns {Promise<Object>} Updated activity
   */
  async submitReview(params) {
    const { activityId, userId, rating, comment } = params;

    validateUserId(userId);

    const review = {
      userId,
      rating,
      comment,
      createdAt: Date.now(),
    };

    return this.activityRepo.addReview(activityId, review);
  }

  /**
   * Vote on activity
   * @param {Object} params - Vote parameters
   * @returns {Promise<Object>} Updated activity
   */
  async voteActivity(params) {
    const { activityId, userId, vote } = params;

    validateUserId(userId);

    const voteDelta = vote === 'up' ? 1 : -1;

    return this.activityRepo.updateVotes(activityId, voteDelta);
  }

  /**
   * Check in to activity
   * @param {Object} params - Check-in parameters
   * @returns {Promise<Object>} Check-in result
   */
  async checkInActivity(params) {
    const { activityId, userId } = params;

    validateUserId(userId);

    // Record check-in in activity
    await this.activityRepo.recordCheckIn(activityId, userId);

    // TODO: Also add to user's visited places
    // This would require activity details

    return { success: true, activityId, userId };
  }

  /**
   * Get user's activity history
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User history
   */
  async getUserHistory(userId) {
    validateUserId(userId);

    const visitedPlaces = await this.userRepo.getVisitedPlaces(userId);

    return {
      success: true,
      visitedPlaces,
    };
  }
}

module.exports = ActivityService;
