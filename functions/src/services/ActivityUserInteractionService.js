/**
 * Activity User Interaction Service
 *
 * SOLID Principles Applied:
 * - Single Responsibility: User interactions with activities only
 * - Dependency Inversion: Depends on repository abstractions
 * - Open/Closed: Extensible by adding new interaction types
 *
 * Handles:
 * - Reviews (submit, rate)
 * - Voting (upvote/downvote)
 * - Check-ins
 * - User history
 */

const { ActivityRepository, UserRepository } = require('../repositories');
const { createLogger } = require('../utils/logger');
const { validateUserId } = require('../utils/validation');

class ActivityUserInteractionService {
  constructor() {
    this.activityRepo = new ActivityRepository();
    this.userRepo = new UserRepository();
    this.logger = createLogger('USER_INTERACTION');
  }

  /**
   * Submit review for activity
   * @param {Object} params - Review parameters
   * @param {string} params.activityId - Activity ID
   * @param {string} params.userId - User ID
   * @param {number} params.rating - Rating (1-5)
   * @param {string} params.comment - Review comment
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

    this.logger.info('Submitting review', { activityId, userId, rating });

    return this.activityRepo.addReview(activityId, review);
  }

  /**
   * Vote on activity
   * @param {Object} params - Vote parameters
   * @param {string} params.activityId - Activity ID
   * @param {string} params.userId - User ID
   * @param {string} params.vote - Vote type ('up' or 'down')
   * @returns {Promise<Object>} Updated activity
   */
  async voteActivity(params) {
    const { activityId, userId, vote } = params;

    validateUserId(userId);

    const voteDelta = vote === 'up' ? 1 : -1;

    this.logger.info('Recording vote', { activityId, userId, vote });

    return this.activityRepo.updateVotes(activityId, voteDelta);
  }

  /**
   * Check in to activity
   * @param {Object} params - Check-in parameters
   * @param {string} params.activityId - Activity ID
   * @param {string} params.userId - User ID
   * @returns {Promise<Object>} Check-in result
   */
  async checkInActivity(params) {
    const { activityId, userId } = params;

    validateUserId(userId);

    this.logger.info('Recording check-in', { activityId, userId });

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

    this.logger.info('Fetching user history', { userId });

    const visitedPlaces = await this.userRepo.getVisitedPlaces(userId);

    return {
      success: true,
      visitedPlaces,
    };
  }
}

module.exports = ActivityUserInteractionService;
