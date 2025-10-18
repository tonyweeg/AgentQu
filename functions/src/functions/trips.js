/**
 * Trip Cloud Functions
 *
 * Thin HTTP handlers that delegate to TripService
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { TripService } = require('../services');
const { createLogger } = require('../utils/logger');

const logger = createLogger('TRIP_FUNCTIONS');
const tripService = new TripService();

/**
 * Create new trip
 */
exports.createTrip = onCall(async (request) => {
  try {
    const { createdBy, destination, dates, participants } = request.data;

    if (!createdBy || !destination || !dates) {
      throw new HttpsError(
        'invalid-argument',
        'Created by, destination, and dates are required'
      );
    }

    logger.info('createTrip called', { createdBy, destination });

    const result = await tripService.createTrip({
      createdBy,
      destination,
      dates,
      participants,
    });

    return result;
  } catch (error) {
    logger.error('createTrip failed', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Score activities for trip (There-Then feature)
 */
exports.scoreThereThenActivities = onCall(async (request) => {
  try {
    const { tripId, lat, lng, radius } = request.data;

    if (!tripId || !lat || !lng) {
      throw new HttpsError('invalid-argument', 'Trip ID and location (lat, lng) are required');
    }

    logger.info('scoreThereThenActivities called', { tripId, lat, lng, radius });

    const result = await tripService.scoreThereThenActivities({
      tripId,
      lat,
      lng,
      radius,
    });

    return result;
  } catch (error) {
    logger.error('scoreThereThenActivities failed', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Get user's trips
 */
exports.getUserTrips = onCall(async (request) => {
  try {
    const { userId } = request.data;

    if (!userId) {
      throw new HttpsError('invalid-argument', 'User ID is required');
    }

    logger.info('getUserTrips called', { userId });

    const result = await tripService.getUserTrips(userId);

    return result;
  } catch (error) {
    logger.error('getUserTrips failed', error);
    throw new HttpsError('internal', error.message);
  }
});
