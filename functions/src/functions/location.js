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
 *
 * Converts latitude/longitude coordinates into a human-readable address with city,
 * state, country, and postal code. Uses Google Geocoding API with caching.
 *
 * @function geocode
 * @param {Object} request - Firebase callable function request
 * @param {Object} request.data - Request parameters
 * @param {number} request.data.lat - Latitude coordinate
 * @param {number} request.data.lng - Longitude coordinate
 * @returns {Promise<Object>} Geocoding results
 * @returns {string} return.city - City name
 * @returns {string} return.state - State/province name
 * @returns {string} return.country - Country name
 * @returns {string} return.postalCode - Postal/ZIP code
 * @returns {string} return.formattedAddress - Full formatted address
 * @throws {HttpsError} invalid-argument - If lat/lng missing
 * @throws {HttpsError} internal - If geocoding fails
 *
 * @example
 * const location = await geocode({
 *   lat: 40.7128,
 *   lng: -74.0060
 * });
 * // Returns: { city: "New York", state: "New York", country: "USA", ... }
 */
exports.geocode = onCall(async (request) => {
  try {
    const { lat, lng } = request.data;

    if (!lat || !lng) {
      throw new HttpsError('invalid-argument', 'Location (lat, lng) is required');
    }

    logger.info('geocode called', { lat, lng });

    const result = await locationService.reverseGeocode(lat, lng);

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

    const towns = await locationService.getNearbyTowns(lat, lng, radius);

    return {
      success: true,
      towns,
    };
  } catch (error) {
    logger.error('getNearbyTowns failed', error);
    throw new HttpsError('internal', error.message);
  }
});
