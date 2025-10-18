/**
 * Activity Cloud Functions
 *
 * Thin HTTP handlers that delegate to ActivityService
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { ActivityService } = require('../services');
const { createLogger } = require('../utils/logger');

const logger = createLogger('ACTIVITY_FUNCTIONS');
const activityService = new ActivityService();

/**
 * Discover activities near location
 */
exports.discoverActivities = onCall(async (request) => {
  try {
    const {
      lat,
      lng,
      radius,
      userId,
      enablePlaces,
      enableCustomSearch,
      enableTicketmaster,
      showFastFood,
      textSearch,
      bypassCache,
    } = request.data;

    if (!lat || !lng) {
      throw new HttpsError('invalid-argument', 'Location (lat, lng) is required');
    }

    logger.info('discoverActivities called', {
      lat,
      lng,
      radius,
      userId,
      textSearch: textSearch || null,
    });

    const result = await activityService.discoverActivities({
      lat,
      lng,
      radius,
      userId,
      enablePlaces,
      enableCustomSearch,
      enableTicketmaster,
      showFastFood,
      textSearch,
      bypassCache,
    });

    return result;
  } catch (error) {
    logger.error('discoverActivities failed', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Submit activity review
 */
exports.submitReview = onCall(async (request) => {
  try {
    const { activityId, userId, rating, review } = request.data;

    if (!activityId || !userId || !rating) {
      throw new HttpsError('invalid-argument', 'Activity ID, user ID, and rating are required');
    }

    logger.info('submitReview called', { activityId, userId, rating });

    const result = await activityService.submitReview({
      activityId,
      userId,
      rating,
      review,
    });

    return result;
  } catch (error) {
    logger.error('submitReview failed', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Vote on activity
 */
exports.voteActivity = onCall(async (request) => {
  try {
    const { activityId, userId, voteType } = request.data;

    if (!activityId || !userId || !voteType) {
      throw new HttpsError('invalid-argument', 'Activity ID, user ID, and vote type are required');
    }

    logger.info('voteActivity called', { activityId, userId, voteType });

    const result = await activityService.voteActivity({
      activityId,
      userId,
      voteType,
    });

    return result;
  } catch (error) {
    logger.error('voteActivity failed', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Check in to activity
 */
exports.checkInActivity = onCall(async (request) => {
  try {
    const { activityId, userId } = request.data;

    if (!activityId || !userId) {
      throw new HttpsError('invalid-argument', 'Activity ID and user ID are required');
    }

    logger.info('checkInActivity called', { activityId, userId });

    const result = await activityService.checkInActivity({
      activityId,
      userId,
    });

    return result;
  } catch (error) {
    logger.error('checkInActivity failed', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Get user activity history
 */
exports.getUserHistory = onCall(async (request) => {
  try {
    const { userId } = request.data;

    if (!userId) {
      throw new HttpsError('invalid-argument', 'User ID is required');
    }

    logger.info('getUserHistory called', { userId });

    const result = await activityService.getUserHistory(userId);

    return result;
  } catch (error) {
    logger.error('getUserHistory failed', error);
    throw new HttpsError('internal', error.message);
  }
});
