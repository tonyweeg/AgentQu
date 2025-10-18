/**
 * Location Cloud Functions
 *
 * Thin HTTP handlers that delegate to LocationService
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { LocationService } = require('../services');
const { createLogger } = require('../utils/logger');

const logger = createLogger('LOCATION_FUNCTIONS');
const locationService = new LocationService();

/**
 * Reverse geocode coordinates to address
 */
exports.geocode = onCall(async (request) => {
  try {
    const { lat, lng } = request.data;

    if (!lat || !lng) {
      throw new HttpsError('invalid-argument', 'Location (lat, lng) is required');
    }

    logger.info('geocode called', { lat, lng });

    const result = await locationService.reverseGeocode({ lat, lng });

    return result;
  } catch (error) {
    logger.error('geocode failed', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Get nearby towns and cities
 */
exports.getNearbyTowns = onCall(async (request) => {
  try {
    const { lat, lng, radius = 50 } = request.data;

    if (!lat || !lng) {
      throw new HttpsError('invalid-argument', 'Location (lat, lng) is required');
    }

    logger.info('getNearbyTowns called', { lat, lng, radius });

    const result = await locationService.getNearbyTowns({ lat, lng, radius });

    return result;
  } catch (error) {
    logger.error('getNearbyTowns failed', error);
    throw new HttpsError('internal', error.message);
  }
});
