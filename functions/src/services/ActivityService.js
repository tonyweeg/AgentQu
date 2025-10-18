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
const { GooglePlacesClient, GoogleSearchClient, TicketmasterClient } = require('../api');
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
    this.ticketmasterClient = new TicketmasterClient();
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
        enableTicketmaster = true,
        showFastFood = false,
        textSearch = null,
      } = params;

      // Validate inputs
      validateCoordinates(lat, lng);
      validateRadius(radius);

      this.logger.info('Discovering activities', { lat, lng, radius, userId });

      // Load user affinities and EV owner status
      let userAffinities = null;
      let musicGenreAffinities = null;
      let restaurantGenreAffinities = null;
      let isEVOwner = false;

      if (userId) {
        const userProfile = await this.userRepo.getProfile(userId);
        if (userProfile) {
          userAffinities = userProfile.affinities;
          musicGenreAffinities = userProfile.musicGenreAffinities;
          restaurantGenreAffinities = userProfile.restaurantGenreAffinities;
          isEVOwner = userProfile.isEV || false;
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

      // Fetch from Ticketmaster (only if not doing text search)
      if (enableTicketmaster && !textSearch) {
        const ticketmasterEvents = await this.fetchTicketmasterEvents(lat, lng, radius);
        allActivities.push(...ticketmasterEvents);
        this.logger.debug(`Got ${ticketmasterEvents.length} events from Ticketmaster`);
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
      let chargingStations = [];
      if (isEVOwner) {
        this.logger.info('User is EV owner - fetching charging stations');
        chargingStations = await this.fetchEVChargingStations(lat, lng, radius);
        this.logger.info(`Returning ${chargingStations.length} charging stations`);
      }

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
   * Fetch events from Ticketmaster
   * @private
   */
  async fetchTicketmasterEvents(lat, lng, radius, days = 3) {
    try {
      if (!this.ticketmasterClient.isReady()) {
        this.logger.debug('Ticketmaster not configured, skipping');
        return [];
      }

      const events = await this.ticketmasterClient.getUpcomingEvents({
        lat,
        lng,
        radius,
        days,
      });

      // Transform to our activity format
      return events.map((event) => this.transformTicketmasterEvent(event));
    } catch (error) {
      this.logger.error('Ticketmaster fetch failed', error);
      return [];
    }
  }

  /**
   * Fetch EV charging stations from Google Places API (New)
   * @private
   */
  async fetchEVChargingStations(lat, lng, radius) {
    try {
      if (!this.placesClient.isReady()) {
        this.logger.warn('Google Places not configured');
        return [];
      }

      const radiusMeters = radius * 1609; // Convert miles to meters

      this.logger.info(`Searching charging stations within ${radius} miles`);

      // Use Places API (New) searchNearby endpoint
      // Note: Using axios directly instead of placesClient.get() because this is a new API endpoint
      const axios = require('axios');
      const response = await axios.post(
        'https://places.googleapis.com/v1/places:searchNearby',
        {
          includedTypes: ['electric_vehicle_charging_station'],
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: {
                latitude: lat,
                longitude: lng,
              },
              radius: radiusMeters,
            },
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.placesClient.getKey(),
            'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.rating,places.currentOpeningHours,places.id',
          },
        }
      );

      const places = response.data.places || [];
      this.logger.info(`Found ${places.length} charging stations`);

      if (places.length === 0) {
        return [];
      }

      return places.map((place) => {
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
            lng: placeLng,
          },
          rating: place.rating || null,
          openNow: place.currentOpeningHours?.openNow || false,
        };
      });
    } catch (error) {
      this.logger.error('EV charging fetch failed', error);
      if (error.response) {
        this.logger.error(`API status ${error.response.status}:`, error.response.data);
      }
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
      type: 'permanent',
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
   * Transform Ticketmaster event to Activity format
   * @private
   */
  transformTicketmasterEvent(tmEvent) {
    const categories = ['events', 'entertainment'];

    // Add music category if it's a music event
    if (tmEvent.musicGenres && tmEvent.musicGenres.length > 0) {
      categories.push('music');
    }

    return {
      id: tmEvent.id,
      activityId: tmEvent.activityId,
      name: tmEvent.name,
      type: 'event',
      location: {
        lat: tmEvent.location.lat,
        lng: tmEvent.location.lng,
        address: tmEvent.address,
        city: tmEvent.city,
        geohash: encodeGeohash(tmEvent.location.lat, tmEvent.location.lng),
      },
      categories,
      primaryCategory: 'event',
      rating: null, // Ticketmaster doesn't provide ratings
      reviewCount: 0,
      openNow: true,
      cost: {
        free: tmEvent.priceRange?.min === 0,
        priceLevel: tmEvent.priceRange?.min > 100 ? 4 : tmEvent.priceRange?.min > 50 ? 3 : tmEvent.priceRange?.min > 20 ? 2 : 1,
      },
      images: tmEvent.images || [],
      details: {
        description: tmEvent.description,
        shortDescription: tmEvent.description?.substring(0, 150) || tmEvent.name,
        imageUrl: tmEvent.images?.[0],
        website: tmEvent.website,
        eventDate: tmEvent.eventDate,
        venue: tmEvent.venue,
        venueAddress: tmEvent.venueAddress,
        priceRange: tmEvent.priceRange,
      },
      musicGenres: tmEvent.musicGenres || [],
      source: tmEvent.source,
      sourceId: tmEvent.sourceId,
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
