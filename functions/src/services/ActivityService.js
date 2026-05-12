/**
 * Activity Service (Refactored)
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Activity discovery orchestration
 * - Dependency Inversion: Depends on fetcher and interaction service abstractions
 * - Open/Closed: Extensible through configuration
 *
 * Handles:
 * - Activity discovery orchestration
 * - User profile loading
 * - Filtering, scoring, and ranking
 * - Delegates data fetching to ActivityDataFetcherService
 * - Delegates user interactions to ActivityUserInteractionService
 */

const { UserRepository } = require('../repositories');
const ActivityDataFetcherService = require('./ActivityDataFetcherService');
const ActivityUserInteractionService = require('./ActivityUserInteractionService');
const { createLogger } = require('../utils/logger');
const { calculateDistance } = require('../utils/distance');
const { calculateFinalScore, passesMusicGenreFilter, passesRestaurantGenreFilter } = require('../utils/scoring');
const { validateCoordinates, validateRadius } = require('../utils/validation');
const { isKnownChain } = require('../config/chainConstants');
const { RATE_LIMITS } = require('../config/constants');

class ActivityService {
  constructor() {
    this.userRepo = new UserRepository();
    this.dataFetcher = new ActivityDataFetcherService();
    this.userInteraction = new ActivityUserInteractionService();
    this.logger = createLogger('ACTIVITY_SERVICE');
  }

  /**
   * Discover activities near a location
   * @param {Object} params - Discovery parameters
   * @param {number} params.lat - Latitude
   * @param {number} params.lng - Longitude
   * @param {number} params.radius - Search radius in miles
   * @param {string|null} params.userId - User ID for personalization
   * @param {boolean} params.enablePlaces - Enable Google Places
   * @param {boolean} params.enableCustomSearch - Enable Custom Search
   * @param {boolean} params.enableTicketmaster - Enable Ticketmaster
   * @param {boolean} params.showFastFood - Include chain restaurants
   * @param {string|null} params.textSearch - Text search query
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

      // Fetch from Google Places API (delegated to DataFetcher)
      if (enablePlaces) {
        const places = await this.dataFetcher.fetchGooglePlaces(lat, lng, radius, textSearch);
        allActivities.push(...places);
        this.logger.debug(`Got ${places.length} places from Google Places`);
      }

      // Fetch from Google Custom Search (delegated to DataFetcher)
      if (enableCustomSearch && !textSearch) {
        // TODO: Get city name for better search
        const events = await this.dataFetcher.fetchCustomSearchEvents(lat, lng);
        allActivities.push(...events);
        this.logger.debug(`Got ${events.length} events from Custom Search`);
      }

      // Fetch from Ticketmaster (delegated to DataFetcher)
      // Enable for both general search AND text search (keyword search)
      if (enableTicketmaster) {
        const ticketmasterEvents = await this.dataFetcher.fetchTicketmasterEvents(
          lat,
          lng,
          radius,
          7, // days
          textSearch // Pass search query as keyword
        );
        allActivities.push(...ticketmasterEvents);
        this.logger.debug(`Got ${ticketmasterEvents.length} events from Ticketmaster`);
      }

      // Calculate distance for all activities
      allActivities.forEach((activity) => {
        const actLat = activity.location?.lat || activity.lat;
        const actLng = activity.location?.lng || activity.lng;
        activity.distance = calculateDistance(lat, lng, actLat, actLng);
      });

      // Deduplicate activities (delegated to DataFetcher)
      const deduped = this.dataFetcher.deduplicateActivities(allActivities);
      this.logger.debug(`Deduplicated ${allActivities.length} → ${deduped.length} activities`);

      // Filter by radius
      let withinRadius = deduped.filter((a) => a.distance <= radius);

      // Filter out corporate chains unless showFastFood is true
      if (!showFastFood) {
        withinRadius = withinRadius.filter((a) => !isKnownChain(a.name));
        this.logger.debug(`Filtered chains, ${withinRadius.length} activities remaining`);
      }

      // Apply genre filters if user has preferences (skip during text search)
      let filtered = withinRadius;

      if (!textSearch) {
        if (musicGenreAffinities) {
          filtered = filtered.filter((a) => passesMusicGenreFilter(a, musicGenreAffinities));
        }

        if (restaurantGenreAffinities) {
          filtered = filtered.filter((a) => passesRestaurantGenreFilter(a, restaurantGenreAffinities));
        }
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

      // Fetch EV charging stations if user is EV owner (delegated to DataFetcher)
      let chargingStations = [];
      if (isEVOwner) {
        this.logger.info('User is EV owner - fetching charging stations');
        chargingStations = await this.dataFetcher.fetchEVChargingStations(lat, lng, radius);
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
   * Submit review for activity (delegated to UserInteraction)
   * @param {Object} params - Review parameters
   * @returns {Promise<Object>} Updated activity
   */
  async submitReview(params) {
    return this.userInteraction.submitReview(params);
  }

  /**
   * Vote on activity (delegated to UserInteraction)
   * @param {Object} params - Vote parameters
   * @returns {Promise<Object>} Updated activity
   */
  async voteActivity(params) {
    return this.userInteraction.voteActivity(params);
  }

  /**
   * Check in to activity (delegated to UserInteraction)
   * @param {Object} params - Check-in parameters
   * @returns {Promise<Object>} Check-in result
   */
  async checkInActivity(params) {
    return this.userInteraction.checkInActivity(params);
  }

  /**
   * Get user's activity history (delegated to UserInteraction)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User history
   */
  async getUserHistory(userId) {
    return this.userInteraction.getUserHistory(userId);
  }
}

module.exports = ActivityService;
