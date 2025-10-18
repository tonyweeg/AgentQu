/**
 * Weather Cloud Functions
 *
 * Thin HTTP handlers that delegate to WeatherService
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { WeatherService } = require('../services');
const { createLogger } = require('../utils/logger');

const logger = createLogger('WEATHER_FUNCTIONS');
const weatherService = new WeatherService();

/**
 * Get weather forecast for trip dates
 */
exports.getWeatherForecast = onCall(async (request) => {
  try {
    const { lat, lng, startDate, endDate } = request.data;

    if (!lat || !lng || !startDate || !endDate) {
      throw new HttpsError(
        'invalid-argument',
        'Location (lat, lng) and dates (startDate, endDate) are required'
      );
    }

    logger.info('getWeatherForecast called', { lat, lng, startDate, endDate });

    const result = await weatherService.getWeatherForecast({
      lat,
      lng,
      startDate,
      endDate,
    });

    return result;
  } catch (error) {
    logger.error('getWeatherForecast failed', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Get air quality data
 */
exports.getAirQuality = onCall(async (request) => {
  try {
    const { lat, lng, startDate, endDate } = request.data;

    if (!lat || !lng || !startDate || !endDate) {
      throw new HttpsError(
        'invalid-argument',
        'Location (lat, lng) and dates (startDate, endDate) are required'
      );
    }

    logger.info('getAirQuality called', { lat, lng, startDate, endDate });

    const result = await weatherService.getAirQuality({
      lat,
      lng,
      startDate,
      endDate,
    });

    return result;
  } catch (error) {
    logger.error('getAirQuality failed', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Get solar data for trip dates
 */
exports.getSolarData = onCall(async (request) => {
  try {
    const { lat, lng, startDate, endDate } = request.data;

    if (!lat || !lng || !startDate || !endDate) {
      throw new HttpsError(
        'invalid-argument',
        'Location (lat, lng) and dates (startDate, endDate) are required'
      );
    }

    logger.info('getSolarData called', { lat, lng, startDate, endDate });

    const result = await weatherService.getSolarData({
      lat,
      lng,
      startDate,
      endDate,
    });

    return result;
  } catch (error) {
    logger.error('getSolarData failed', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Get comprehensive environmental data
 */
exports.getEnvironmentalData = onCall(async (request) => {
  try {
    const { lat, lng, startDate, endDate } = request.data;

    if (!lat || !lng || !startDate || !endDate) {
      throw new HttpsError(
        'invalid-argument',
        'Location (lat, lng) and dates (startDate, endDate) are required'
      );
    }

    logger.info('getEnvironmentalData called', { lat, lng, startDate, endDate });

    const result = await weatherService.getEnvironmentalData({
      lat,
      lng,
      startDate,
      endDate,
    });

    return result;
  } catch (error) {
    logger.error('getEnvironmentalData failed', error);
    throw new HttpsError('internal', error.message);
  }
});
