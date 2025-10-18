/**
 * Weather API Client
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Weather API integration only
 * - Open/Closed: Extends BaseApiClient without modification
 * - Dependency Inversion: Depends on BaseApiClient interface
 */

const BaseApiClient = require('./BaseApiClient');
const { getApiKey } = require('../config/api-keys');

class WeatherClient extends BaseApiClient {
  constructor() {
    super('https://api.openweathermap.org/data/2.5');

    this.apiKey = getApiKey('OPEN_WEATHER_API_KEY');
    this.sunriseSunsetBase = 'https://api.sunrise-sunset.org';

    // Cache TTL: 1 hour for weather (changes slowly)
    this.cacheTTL = 60 * 60 * 1000;
  }

  /**
   * Get 5-day weather forecast (3-hour intervals)
   * @param {Object} params - Forecast parameters
   * @returns {Promise<Object>} Weather forecast data
   */
  async getForecast(params) {
    const { lat, lng, units = 'imperial' } = params;

    const response = await this.get('/forecast', {
      params: {
        lat,
        lon: lng,
        appid: this.apiKey,
        units, // imperial (F), metric (C), standard (K)
      },
    });

    return response;
  }

  /**
   * Get current air quality
   * @param {Object} params - Air quality parameters
   * @returns {Promise<Object>} Air quality data
   */
  async getAirQuality(params) {
    const { lat, lng } = params;

    const response = await this.get('/air_pollution', {
      params: {
        lat,
        lon: lng,
        appid: this.apiKey,
      },
    });

    return response;
  }

  /**
   * Get solar data (sunrise, sunset, golden hour)
   * Uses sunrise-sunset.org API (no key required)
   * @param {Object} params - Solar data parameters
   * @returns {Promise<Object>} Solar data
   */
  async getSolarData(params) {
    const { lat, lng, date } = params;

    // Build URL for sunrise-sunset.org
    const url = `${this.sunriseSunsetBase}/json`;

    // Use axios directly for this different API
    const axios = require('axios');
    const response = await axios.get(url, {
      params: {
        lat,
        lng,
        date, // YYYY-MM-DD format
        formatted: 0, // Return ISO 8601 timestamps
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Solar data API error: ${response.data.status}`);
    }

    return response.data.results;
  }

  /**
   * Parse AQI category from numeric value
   * @param {number} aqi - Air Quality Index (1-5)
   * @returns {string} Category name
   */
  static getAQICategory(aqi) {
    const categories = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
    return categories[aqi - 1] || 'Unknown';
  }

  /**
   * Filter forecast data by date range
   * @param {Array} forecastList - Forecast data points
   * @param {number} startDate - Start date timestamp
   * @param {number} endDate - End date timestamp
   * @returns {Array} Filtered forecast data
   */
  static filterByDateRange(forecastList, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return forecastList.filter(item => {
      const forecastDate = new Date(item.dt * 1000);
      return forecastDate >= start && forecastDate <= end;
    });
  }

  /**
   * Group forecast by day
   * @param {Array} forecastList - Forecast data points
   * @returns {Object} Forecast grouped by date (YYYY-MM-DD)
   */
  static groupByDay(forecastList) {
    const dailyForecasts = {};

    forecastList.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!dailyForecasts[dateKey]) {
        dailyForecasts[dateKey] = {
          date: dateKey,
          hourly: [],
        };
      }

      dailyForecasts[dateKey].hourly.push({
        time: date.toTimeString().slice(0, 5), // HH:MM
        temp: Math.round(item.main.temp),
        feelsLike: Math.round(item.main.feels_like),
        condition: item.weather[0].main.toLowerCase(),
        conditionDescription: item.weather[0].description,
        precipitation: Math.round(item.pop * 100), // 0-100%
        windSpeed: Math.round(item.wind.speed),
        humidity: item.main.humidity,
        icon: item.weather[0].icon,
      });
    });

    return dailyForecasts;
  }

  /**
   * Calculate golden hour times
   * @param {string} sunrise - Sunrise ISO timestamp
   * @param {string} sunset - Sunset ISO timestamp
   * @returns {Object} Golden hour times
   */
  static calculateGoldenHour(sunrise, sunset) {
    const sunriseTime = new Date(sunrise);
    const sunsetTime = new Date(sunset);

    // Golden hour: 1 hour after sunrise, 1 hour before sunset
    const goldenHourMorning = new Date(sunriseTime.getTime() + 60 * 60 * 1000);
    const goldenHourEvening = new Date(sunsetTime.getTime() - 60 * 60 * 1000);

    return {
      morning: goldenHourMorning.toISOString(),
      evening: goldenHourEvening.toISOString(),
    };
  }
}

module.exports = WeatherClient;
