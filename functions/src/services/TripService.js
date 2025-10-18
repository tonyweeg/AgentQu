/**
 * Trip Service
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Trip planning and management only
 * - Dependency Inversion: Depends on repository interfaces
 */

const { TripRepository, UserRepository, ActivityRepository } = require('../repositories');
const { createLogger } = require('../utils/logger');
const { calculateFinalScore } = require('../utils/scoring');
const { validateUserId, validateTimestamp } = require('../utils/validation');

class TripService {
  constructor() {
    this.tripRepo = new TripRepository();
    this.userRepo = new UserRepository();
    this.activityRepo = new ActivityRepository();
    this.logger = createLogger('TRIP_SERVICE');
  }

  /**
   * Create new trip
   * @param {Object} params - Trip parameters
   * @returns {Promise<Object>} Created trip
   */
  async createTrip(params) {
    try {
      const { createdBy, destination, dates, participants = [] } = params;

      validateUserId(createdBy);
      validateTimestamp(dates.startDate);
      validateTimestamp(dates.endDate);

      const tripId = `trip_${createdBy}_${Date.now()}`;

      const tripData = {
        createdBy,
        destination,
        dates,
        participants: [
          {
            userId: createdBy,
            role: 'owner',
            invitedAt: Date.now(),
            joinedAt: Date.now(),
          },
          ...participants,
        ],
        itinerary: [],
        suggestedActivities: [],
        sharing: {
          isPublic: false,
          allowComments: false,
        },
        status: 'draft',
        metadata: {
          totalParticipants: 1 + participants.length,
          totalActivities: 0,
        },
      };

      const trip = await this.tripRepo.createTrip(tripId, tripData);

      this.logger.info('Trip created', { tripId, createdBy });

      return { success: true, trip };
    } catch (error) {
      this.logger.error('Create trip failed', error);
      throw error;
    }
  }

  /**
   * Score activities for a trip (There-Then feature)
   * @param {Object} params - Scoring parameters
   * @returns {Promise<Object>} Scored activities
   */
  async scoreThereThenActivities(params) {
    try {
      const { tripId, lat, lng, radius = 10 } = params;

      const trip = await this.tripRepo.getById(tripId);
      if (!trip) {
        throw new Error(`Trip not found: ${tripId}`);
      }

      // Get all participants with their affinities
      const participantAffinities = await this.getParticipantAffinities(trip.participants);

      // Calculate group consensus affinities (average across all participants)
      const groupAffinities = this.calculateGroupAffinities(participantAffinities);

      // Find activities near destination
      const activities = await this.activityRepo.findNearby(lat, lng, radius);

      // Score activities based on group affinities
      const scored = activities.map((activity) => {
        const scoreData = calculateFinalScore(
          activity,
          lat,
          lng,
          groupAffinities.general,
          groupAffinities.music,
          groupAffinities.restaurant
        );

        return {
          ...activity,
          score: scoreData.finalScore,
          affinityScore: scoreData.affinityScore,
          participantScores: this.calculateIndividualScores(activity, participantAffinities),
        };
      });

      // Sort by group score
      scored.sort((a, b) => b.score - a.score);

      this.logger.info('Scored activities for trip', { tripId, count: scored.length });

      return {
        success: true,
        activities: scored,
        groupAffinities,
      };
    } catch (error) {
      this.logger.error('Score activities failed', error);
      throw error;
    }
  }

  /**
   * Add participant to trip
   * @param {Object} params - Participant parameters
   * @returns {Promise<Object>} Updated trip
   */
  async addParticipant(params) {
    try {
      const { tripId, participant } = params;

      const trip = await this.tripRepo.addParticipant(tripId, participant);

      this.logger.info('Participant added to trip', { tripId, userId: participant.userId });

      return { success: true, trip };
    } catch (error) {
      this.logger.error('Add participant failed', error);
      throw error;
    }
  }

  /**
   * Add activity to trip itinerary
   * @param {Object} params - Itinerary parameters
   * @returns {Promise<Object>} Updated trip
   */
  async addToItinerary(params) {
    try {
      const { tripId, dayIndex, timeSlot } = params;

      const trip = await this.tripRepo.addTimeSlot(tripId, dayIndex, timeSlot);

      this.logger.info('Activity added to itinerary', { tripId, dayIndex, activityId: timeSlot.activityId });

      return { success: true, trip };
    } catch (error) {
      this.logger.error('Add to itinerary failed', error);
      throw error;
    }
  }

  /**
   * Get user's trips
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User trips
   */
  async getUserTrips(userId) {
    try {
      validateUserId(userId);

      const trips = await this.tripRepo.getUserTrips(userId);

      this.logger.info('Retrieved user trips', { userId, count: trips.length });

      return { success: true, trips };
    } catch (error) {
      this.logger.error('Get user trips failed', error);
      throw error;
    }
  }

  /**
   * Get participant affinities
   * @private
   */
  async getParticipantAffinities(participants) {
    const affinities = [];

    for (const participant of participants) {
      if (participant.userId) {
        const user = await this.userRepo.getProfile(participant.userId);
        if (user) {
          affinities.push({
            userId: participant.userId,
            general: user.affinities || {},
            music: user.musicGenreAffinities || {},
            restaurant: user.restaurantGenreAffinities || {},
          });
        }
      } else if (participant.affinities) {
        // Use participant-specific affinities if no user account
        affinities.push({
          userId: participant.memberId,
          general: participant.affinities || {},
          music: {},
          restaurant: {},
        });
      }
    }

    return affinities;
  }

  /**
   * Calculate group consensus affinities
   * @private
   */
  calculateGroupAffinities(participantAffinities) {
    if (participantAffinities.length === 0) {
      return { general: {}, music: {}, restaurant: {} };
    }

    const groupGeneral = {};
    const groupMusic = {};
    const groupRestaurant = {};

    // Collect all categories
    const allGeneralCategories = new Set();
    const allMusicCategories = new Set();
    const allRestaurantCategories = new Set();

    participantAffinities.forEach((p) => {
      Object.keys(p.general).forEach((cat) => allGeneralCategories.add(cat));
      Object.keys(p.music).forEach((cat) => allMusicCategories.add(cat));
      Object.keys(p.restaurant).forEach((cat) => allRestaurantCategories.add(cat));
    });

    // Calculate average for each category
    allGeneralCategories.forEach((cat) => {
      const scores = participantAffinities.map((p) => p.general[cat] || 0);
      groupGeneral[cat] = scores.reduce((a, b) => a + b, 0) / scores.length;
    });

    allMusicCategories.forEach((cat) => {
      const scores = participantAffinities.map((p) => p.music[cat] || 0);
      groupMusic[cat] = scores.reduce((a, b) => a + b, 0) / scores.length;
    });

    allRestaurantCategories.forEach((cat) => {
      const scores = participantAffinities.map((p) => p.restaurant[cat] || 0);
      groupRestaurant[cat] = scores.reduce((a, b) => a + b, 0) / scores.length;
    });

    return {
      general: groupGeneral,
      music: groupMusic,
      restaurant: groupRestaurant,
    };
  }

  /**
   * Calculate individual scores for each participant
   * @private
   */
  calculateIndividualScores(activity, participantAffinities) {
    return participantAffinities.map((p) => {
      const scoreData = calculateFinalScore(
        activity,
        activity.location.lat,
        activity.location.lng,
        p.general,
        p.music,
        p.restaurant
      );

      return {
        userId: p.userId,
        score: scoreData.finalScore,
      };
    });
  }
}

module.exports = TripService;
