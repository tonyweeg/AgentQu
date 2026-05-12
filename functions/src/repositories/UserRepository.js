/**
 * User Repository
 *
 * SOLID Principles Applied:
 * - Single Responsibility: User profile data access only
 * - Liskov Substitution: Extends BaseRepository
 */

const BaseRepository = require('./BaseRepository');
const { validateUserId, isValidEmail } = require('../utils/validation');

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  /**
   * Create user profile
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data
   * @returns {Promise<Object>}
   */
  async createProfile(userId, profileData) {
    validateUserId(userId);

    if (profileData.email && !isValidEmail(profileData.email)) {
      throw new Error('Invalid email format');
    }

    return this.create(userId, {
      ...profileData,
      onboarded: profileData.onboarded || false,
      lastActive: Date.now(),
    });
  }

  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>}
   */
  async getProfile(userId) {
    validateUserId(userId);
    return this.getById(userId);
  }

  /**
   * Update user affinities
   * @param {string} userId - User ID
   * @param {Object} affinities - Affinity scores
   * @returns {Promise<Object>}
   */
  async updateAffinities(userId, affinities) {
    validateUserId(userId);

    return this.merge(userId, {
      affinities,
      onboarded: true,
      lastActive: Date.now(),
    });
  }

  /**
   * Update music genre affinities
   * @param {string} userId - User ID
   * @param {Object} musicGenreAffinities - Music genre affinity scores
   * @returns {Promise<Object>}
   */
  async updateMusicGenreAffinities(userId, musicGenreAffinities) {
    validateUserId(userId);

    return this.merge(userId, {
      musicGenreAffinities,
      lastActive: Date.now(),
    });
  }

  /**
   * Update restaurant genre affinities
   * @param {string} userId - User ID
   * @param {Object} restaurantGenreAffinities - Restaurant genre affinity scores
   * @returns {Promise<Object>}
   */
  async updateRestaurantGenreAffinities(userId, restaurantGenreAffinities) {
    validateUserId(userId);

    return this.merge(userId, {
      restaurantGenreAffinities,
      lastActive: Date.now(),
    });
  }

  /**
   * Update EV status
   * @param {string} userId - User ID
   * @param {boolean} isEV - Is EV owner
   * @returns {Promise<Object>}
   */
  async updateEVStatus(userId, isEV) {
    validateUserId(userId);

    return this.merge(userId, {
      isEV,
      lastActive: Date.now(),
    });
  }

  /**
   * Mark place as visited
   * @param {string} userId - User ID
   * @param {Object} place - Visited place data
   * @returns {Promise<Object>}
   */
  async addVisitedPlace(userId, place) {
    validateUserId(userId);

    const profile = await this.getProfile(userId);
    if (!profile) {
      throw new Error(`User not found: ${userId}`);
    }

    const visitedPlaces = profile.visitedPlaces || [];

    // Check for duplicates
    const exists = visitedPlaces.some((p) => p.activityId === place.activityId);
    if (exists) {
      this.logger.debug(`Place already visited`, { userId, activityId: place.activityId });
      return profile;
    }

    visitedPlaces.push({
      ...place,
      visitedAt: place.visitedAt || Date.now(),
    });

    return this.update(userId, {
      visitedPlaces,
      lastActive: Date.now(),
    });
  }

  /**
   * Remove visited place
   * @param {string} userId - User ID
   * @param {string} activityId - Activity ID
   * @returns {Promise<Object>}
   */
  async removeVisitedPlace(userId, activityId) {
    validateUserId(userId);

    const profile = await this.getProfile(userId);
    if (!profile) {
      throw new Error(`User not found: ${userId}`);
    }

    const visitedPlaces = (profile.visitedPlaces || []).filter(
      (p) => p.activityId !== activityId
    );

    return this.update(userId, {
      visitedPlaces,
      lastActive: Date.now(),
    });
  }

  /**
   * Get user's visited places
   * @param {string} userId - User ID
   * @returns {Promise<Array>}
   */
  async getVisitedPlaces(userId) {
    validateUserId(userId);

    const profile = await this.getProfile(userId);
    return profile?.visitedPlaces || [];
  }

  /**
   * Update last active timestamp
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async updateLastActive(userId) {
    validateUserId(userId);

    return this.merge(userId, {
      lastActive: Date.now(),
    });
  }

  /**
   * Get recently active users
   * @param {number} hoursSince - Hours since last active
   * @param {number} limit - Max results
   * @returns {Promise<Array>}
   */
  async getRecentlyActive(hoursSince = 24, limit = 100) {
    const threshold = Date.now() - hoursSince * 60 * 60 * 1000;

    return this.query([['lastActive', '>=', threshold]], {
      orderBy: ['lastActive', 'desc'],
      limit,
    });
  }

  /**
   * Find users by email
   * @param {string} email - Email address
   * @returns {Promise<Array>}
   */
  async findByEmail(email) {
    if (!isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    return this.query([['email', '==', email.toLowerCase()]]);
  }
}

module.exports = UserRepository;
