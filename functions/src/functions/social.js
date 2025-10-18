/**
 * Social Media Cloud Functions
 *
 * Thin HTTP handlers that delegate to SocialService
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { SocialService } = require('../services');
const { createLogger } = require('../utils/logger');

const logger = createLogger('SOCIAL_FUNCTIONS');
const socialService = new SocialService();

/**
 * Search Twitter for local content
 */
exports.searchTwitter = onCall(async (request) => {
  try {
    const { lat, lng, radius, affinities, userId, cityName, stateName } = request.data;

    if (!lat || !lng) {
      throw new HttpsError('invalid-argument', 'Location (lat, lng) is required');
    }

    logger.info('searchTwitter called', { lat, lng, radius, cityName, stateName });

    const result = await socialService.searchTwitter({
      lat,
      lng,
      radius,
      affinities,
      userId,
      cityName,
      stateName,
    });

    return result;
  } catch (error) {
    logger.error('searchTwitter failed', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Calculate VibeIndex for a city
 */
exports.calculateVibeIndex = onCall(async (request) => {
  try {
    const { cityName, state, lat, lng, radius, population } = request.data;

    if (!cityName || !state || !lat || !lng) {
      throw new HttpsError(
        'invalid-argument',
        'City name, state, and location (lat, lng) are required'
      );
    }

    logger.info('calculateVibeIndex called', { cityName, state, lat, lng });

    const result = await socialService.calculateVibeIndex({
      cityName,
      state,
      lat,
      lng,
      radius,
      population,
    });

    return result;
  } catch (error) {
    logger.error('calculateVibeIndex failed', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Get VibeIndex for a city
 */
exports.getVibeIndex = onCall(async (request) => {
  try {
    const { cityId, cityName, state } = request.data;

    if (!cityId && (!cityName || !state)) {
      throw new HttpsError(
        'invalid-argument',
        'Either cityId or (cityName + state) is required'
      );
    }

    logger.info('getVibeIndex called', { cityId, cityName, state });

    const result = await socialService.getVibeIndex({
      cityId,
      cityName,
      state,
    });

    return result;
  } catch (error) {
    logger.error('getVibeIndex failed', error);
    throw new HttpsError('internal', error.message);
  }
});
