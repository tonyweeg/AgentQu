/**
 * Weather Service
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Weather and environmental data only
 * - Dependency Inversion: Depends on WeatherClient interface
 */

const { WeatherClient } = require('../api');
const { createLogger } = require('../utils/logger');
const { validateCoordinates, validateTimestamp } = require('../utils/validation');

class WeatherService {
  constructor() {
    this.weatherClient = new WeatherClient();
    this.logger = createLogger('WEATHER_SERVICE');
  }

  /**
   * Get weather forecast for trip dates
   * @param {Object} params - Forecast parameters
   * @returns {Promise<Object>} Weather forecast data
   */
  async getWeatherForecast(params) {
    try {
      const { lat, lng, startDate, endDate } = params;

      validateCoordinates(lat, lng);
      validateTimestamp(startDate);
      validateTimestamp(endDate);

      this.logger.info('Fetching weather forecast', { lat, lng, startDate, endDate });

      // Fetch 5-day forecast from OpenWeather
      const response = await this.weatherClient.getForecast({ lat, lng });

      const data = response;

      this.logger.info('Weather forecast retrieved', { dataPoints: data.list.length });

      // Filter forecast data to only include dates within trip range
      const filteredForecast = WeatherClient.filterByDateRange(data.list, startDate, endDate);

      // Group by day
      const dailyForecasts = WeatherClient.groupByDay(filteredForecast);

      return {
        success: true,
        location: {
          lat,
          lng,
          city: data.city.name,
          country: data.city.country,
        },
        forecasts: Object.values(dailyForecasts),
        totalDataPoints: filteredForecast.length,
      };
    } catch (error) {
      this.logger.error('Get weather forecast failed', error);
      throw error;
    }
  }

  /**
   * Get air quality data
   * @param {Object} params - Air quality parameters
   * @returns {Promise<Object>} Air quality data
   */
  async getAirQuality(params) {
    try {
      const { lat, lng, startDate, endDate } = params;

      validateCoordinates(lat, lng);
      validateTimestamp(startDate);
      validateTimestamp(endDate);

      this.logger.info('Fetching air quality', { lat, lng, startDate, endDate });

      // Fetch current air quality (OpenWeather free tier doesn't have forecast)
      const response = await this.weatherClient.getAirQuality({ lat, lng });

      const data = response;

      this.logger.info('Air quality retrieved');

      const aqData = data.list[0];
      const airQuality = {
        date: new Date(aqData.dt * 1000).toISOString().split('T')[0],
        aqi: aqData.main.aqi,
        category: WeatherClient.getAQICategory(aqData.main.aqi),
        pollutants: {
          pm25: aqData.components.pm2_5.toFixed(2),
          pm10: aqData.components.pm10.toFixed(2),
          o3: aqData.components.o3.toFixed(2),
          no2: aqData.components.no2.toFixed(2),
          so2: aqData.components.so2.toFixed(2),
          co: aqData.components.co.toFixed(2),
        },
      };

      return {
        success: true,
        location: { lat, lng },
        current: airQuality,
        note: 'Air quality forecast requires premium API. Showing current conditions.',
      };
    } catch (error) {
      this.logger.error('Get air quality failed', error);
      throw error;
    }
  }

  /**
   * Get solar data for trip dates (sunrise, sunset, golden hour)
   * @param {Object} params - Solar data parameters
   * @returns {Promise<Object>} Solar data
   */
  async getSolarData(params) {
    try {
      const { lat, lng, startDate, endDate } = params;

      validateCoordinates(lat, lng);
      validateTimestamp(startDate);
      validateTimestamp(endDate);

      this.logger.info('Fetching solar data', { lat, lng, startDate, endDate });

      const start = new Date(startDate);
      const end = new Date(endDate);
      const solarData = [];

      // Fetch solar data for each day in trip
      let currentDate = new Date(start);
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];

        const data = await this.weatherClient.getSolarData({
          lat,
          lng,
          date: dateStr,
        });

        // Calculate golden hour times
        const goldenHour = WeatherClient.calculateGoldenHour(data.sunrise, data.sunset);

        // Calculate day length in hours
        const dayLengthHours = Math.round(data.day_length / 3600);

        solarData.push({
          date: dateStr,
          sunrise: data.sunrise,
          sunset: data.sunset,
          goldenHour,
          dayLength: dayLengthHours,
          solarNoon: data.solar_noon,
        });

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      this.logger.info('Solar data retrieved', { days: solarData.length });

      return {
        success: true,
        location: { lat, lng },
        solarData,
      };
    } catch (error) {
      this.logger.error('Get solar data failed', error);
      throw error;
    }
  }

  /**
   * Get comprehensive environmental data (weather + air + solar)
   * @param {Object} params - Environmental data parameters
   * @returns {Promise<Object>} Complete environmental data
   */
  async getEnvironmentalData(params) {
    try {
      const { lat, lng, startDate, endDate } = params;

      this.logger.info('Fetching comprehensive environmental data', {
        lat,
        lng,
        startDate,
        endDate,
      });

      // Fetch all data in parallel
      const [weather, airQuality, solar] = await Promise.all([
        this.getWeatherForecast({ lat, lng, startDate, endDate }),
        this.getAirQuality({ lat, lng, startDate, endDate }),
        this.getSolarData({ lat, lng, startDate, endDate }),
      ]);

      return {
        success: true,
        location: { lat, lng },
        weather: weather.forecasts,
        airQuality: airQuality.current,
        solar: solar.solarData,
      };
    } catch (error) {
      this.logger.error('Get environmental data failed', error);
      throw error;
    }
  }
}

module.exports = WeatherService;
