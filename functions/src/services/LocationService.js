/**
 * Location Service
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Location/geocoding operations only
 * - Dependency Inversion: Depends on API client interfaces
 */

const axios = require('axios');
const { getApiKey, isConfigured } = require('../config/api-keys');
const { createLogger } = require('../utils/logger');
const { validateCoordinates } = require('../utils/validation');
const { calculateDistance } = require('../utils/distance');

class LocationService {
  constructor() {
    this.logger = createLogger('LOCATION_SERVICE');
    this.cache = new Map();
  }

  /**
   * Reverse geocode coordinates to address
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} Address components
   */
  async reverseGeocode(lat, lng) {
    validateCoordinates(lat, lng);

    // Check cache
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (this.cache.has(cacheKey)) {
      this.logger.debug('Reverse geocode cache hit', { lat, lng });
      return this.cache.get(cacheKey);
    }

    try {
      if (!isConfigured('googleGeocoding')) {
        throw new Error('Google Geocoding API key not configured');
      }

      const apiKey = getApiKey('googleGeocoding');

      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          latlng: `${lat},${lng}`,
          key: apiKey,
        },
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Geocoding failed: ${response.data.status}`);
      }

      const result = response.data.results[0];
      const addressComponents = result.address_components;

      // Extract city, state, country
      const getComponent = (types) => {
        const component = addressComponents.find((c) => types.some((t) => c.types.includes(t)));
        return component?.long_name || null;
      };

      const geocodeResult = {
        formattedAddress: result.formatted_address,
        city:
          getComponent(['locality']) ||
          getComponent(['administrative_area_level_3']) ||
          getComponent(['sublocality']),
        state: getComponent(['administrative_area_level_1']),
        country: getComponent(['country']),
        postalCode: getComponent(['postal_code']),
        lat,
        lng,
      };

      // Cache result (1 hour TTL)
      this.cache.set(cacheKey, geocodeResult);
      setTimeout(() => this.cache.delete(cacheKey), 3600000);

      this.logger.info('Reverse geocode success', { city: geocodeResult.city, state: geocodeResult.state });

      return geocodeResult;
    } catch (error) {
      this.logger.error('Reverse geocode failed', error);
      throw error;
    }
  }

  /**
   * Geocode address to coordinates
   * @param {string} address - Address string
   * @returns {Promise<Object>} Coordinates and address
   */
  async geocode(address) {
    try {
      if (!isConfigured('googleGeocoding')) {
        throw new Error('Google Geocoding API key not configured');
      }

      const apiKey = getApiKey('googleGeocoding');

      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address,
          key: apiKey,
        },
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Geocoding failed: ${response.data.status}`);
      }

      const result = response.data.results[0];
      const location = result.geometry.location;

      this.logger.info('Geocode success', { address, lat: location.lat, lng: location.lng });

      return {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: result.formatted_address,
      };
    } catch (error) {
      this.logger.error('Geocode failed', error);
      throw error;
    }
  }

  /**
   * Get nearby towns/cities
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radiusMiles - Search radius in miles
   * @returns {Promise<Array>} Nearby towns
   */
  async getNearbyTowns(lat, lng, radiusMiles = 200) {
    validateCoordinates(lat, lng);

    try {
      // Use Google Places API to find nearby localities
      if (!isConfigured('googlePlaces')) {
        throw new Error('Google Places API key not configured');
      }

      const apiKey = getApiKey('googlePlaces');
      const radiusMeters = radiusMiles * 1609.34;

      const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
        params: {
          location: `${lat},${lng}`,
          radius: radiusMeters,
          type: 'locality',
          key: apiKey,
        },
      });

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Nearby towns search failed: ${response.data.status}`);
      }

      const towns = (response.data.results || []).map((place) => {
        const townLat = place.geometry.location.lat;
        const townLng = place.geometry.location.lng;
        const distance = calculateDistance(lat, lng, townLat, townLng);

        return {
          name: place.name,
          lat: townLat,
          lng: townLng,
          vicinity: place.vicinity,
          distance,
        };
      });

      this.logger.info('Found nearby towns', { count: towns.length });

      return towns;
    } catch (error) {
      this.logger.error('Get nearby towns failed', error);
      throw error;
    }
  }

  /**
   * Clear geocoding cache
   */
  clearCache() {
    this.cache.clear();
    this.logger.info('Location cache cleared');
  }
}

module.exports = LocationService;
