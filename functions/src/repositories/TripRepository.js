/**
 * Trip Repository
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Trip data access only
 * - Liskov Substitution: Extends BaseRepository
 */

const BaseRepository = require('./BaseRepository');
const { validateUserId, validateTimestamp } = require('../utils/validation');

class TripRepository extends BaseRepository {
  constructor() {
    super('trips');
  }

  /**
   * Create trip
   * @param {string} tripId - Trip ID
   * @param {Object} tripData - Trip data
   * @returns {Promise<Object>}
   */
  async createTrip(tripId, tripData) {
    validateUserId(tripData.createdBy);
    validateTimestamp(tripData.dates.startDate);
    validateTimestamp(tripData.dates.endDate);

    if (tripData.dates.startDate >= tripData.dates.endDate) {
      throw new Error('Start date must be before end date');
    }

    return this.create(tripId, {
      ...tripData,
      status: tripData.status || 'draft',
    });
  }

  /**
   * Get user's trips
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async getUserTrips(userId, options = {}) {
    validateUserId(userId);

    return this.query([['createdBy', '==', userId]], {
      orderBy: ['createdAt', 'desc'],
      ...options,
    });
  }

  /**
   * Get trips where user is a participant
   * @param {string} userId - User ID
   * @returns {Promise<Array>}
   */
  async getParticipatingTrips(userId) {
    validateUserId(userId);

    // Firestore doesn't support array-contains on nested objects well
    // This is a simplified version - in production, use a separate index collection
    const allTrips = await this.getAll();

    return allTrips.filter((trip) =>
      trip.participants.some((p) => p.userId === userId)
    );
  }

  /**
   * Add participant to trip
   * @param {string} tripId - Trip ID
   * @param {Object} participant - Participant data
   * @returns {Promise<Object>}
   */
  async addParticipant(tripId, participant) {
    const trip = await this.getById(tripId);
    if (!trip) {
      throw new Error(`Trip not found: ${tripId}`);
    }

    const participants = trip.participants || [];

    // Check for duplicates
    const exists = participants.some((p) => p.userId === participant.userId);
    if (exists) {
      this.logger.debug(`Participant already in trip`, { tripId, userId: participant.userId });
      return trip;
    }

    participants.push({
      ...participant,
      invitedAt: participant.invitedAt || Date.now(),
    });

    return this.update(tripId, {
      participants,
      'metadata.totalParticipants': participants.length,
    });
  }

  /**
   * Update participant role
   * @param {string} tripId - Trip ID
   * @param {string} userId - User ID
   * @param {string} role - New role (owner, editor, viewer)
   * @returns {Promise<Object>}
   */
  async updateParticipantRole(tripId, userId, role) {
    const trip = await this.getById(tripId);
    if (!trip) {
      throw new Error(`Trip not found: ${tripId}`);
    }

    const participants = trip.participants.map((p) =>
      p.userId === userId ? { ...p, role } : p
    );

    return this.update(tripId, { participants });
  }

  /**
   * Add activity to trip itinerary
   * @param {string} tripId - Trip ID
   * @param {number} dayIndex - Day index
   * @param {Object} timeSlot - Time slot data
   * @returns {Promise<Object>}
   */
  async addTimeSlot(tripId, dayIndex, timeSlot) {
    const trip = await this.getById(tripId);
    if (!trip) {
      throw new Error(`Trip not found: ${tripId}`);
    }

    const itinerary = trip.itinerary || [];

    // Find or create day
    let day = itinerary.find((d) => d.dayIndex === dayIndex);
    if (!day) {
      day = { dayIndex, timeSlots: [] };
      itinerary.push(day);
    }

    day.timeSlots.push({
      ...timeSlot,
      status: timeSlot.status || 'planned',
    });

    // Sort itinerary by day
    itinerary.sort((a, b) => a.dayIndex - b.dayIndex);

    return this.update(tripId, {
      itinerary,
      'metadata.totalActivities': itinerary.reduce((sum, d) => sum + d.timeSlots.length, 0),
    });
  }

  /**
   * Update time slot status
   * @param {string} tripId - Trip ID
   * @param {number} dayIndex - Day index
   * @param {string} activityId - Activity ID
   * @param {string} status - New status
   * @returns {Promise<Object>}
   */
  async updateTimeSlotStatus(tripId, dayIndex, activityId, status) {
    const trip = await this.getById(tripId);
    if (!trip) {
      throw new Error(`Trip not found: ${tripId}`);
    }

    const itinerary = trip.itinerary.map((day) => {
      if (day.dayIndex === dayIndex) {
        return {
          ...day,
          timeSlots: day.timeSlots.map((slot) =>
            slot.activityId === activityId ? { ...slot, status } : slot
          ),
        };
      }
      return day;
    });

    return this.update(tripId, { itinerary });
  }

  /**
   * Add suggested activity
   * @param {string} tripId - Trip ID
   * @param {Object} suggestion - Suggested activity
   * @returns {Promise<Object>}
   */
  async addSuggestion(tripId, suggestion) {
    const trip = await this.getById(tripId);
    if (!trip) {
      throw new Error(`Trip not found: ${tripId}`);
    }

    const suggestedActivities = trip.suggestedActivities || [];

    // Check for duplicates
    const exists = suggestedActivities.some((s) => s.activityId === suggestion.activityId);
    if (exists) {
      return trip;
    }

    suggestedActivities.push(suggestion);

    // Sort by affinity score
    suggestedActivities.sort((a, b) => b.affinityScore - a.affinityScore);

    return this.update(tripId, { suggestedActivities });
  }

  /**
   * Update trip status
   * @param {string} tripId - Trip ID
   * @param {string} status - New status (draft, published, archived)
   * @returns {Promise<Object>}
   */
  async updateStatus(tripId, status) {
    const validStatuses = ['draft', 'published', 'archived'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    return this.update(tripId, { status });
  }

  /**
   * Get upcoming trips
   * @param {number} limit - Max results
   * @returns {Promise<Array>}
   */
  async getUpcoming(limit = 50) {
    const now = Date.now();

    return this.query([['dates.startDate', '>=', now]], {
      orderBy: ['dates.startDate', 'asc'],
      limit,
    });
  }

  /**
   * Get past trips
   * @param {number} limit - Max results
   * @returns {Promise<Array>}
   */
  async getPast(limit = 50) {
    const now = Date.now();

    return this.query([['dates.endDate', '<', now]], {
      orderBy: ['dates.endDate', 'desc'],
      limit,
    });
  }
}

module.exports = TripRepository;
