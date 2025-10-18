/**
 * Google Places API Client
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Google Places API communication only
 * - Liskov Substitution: Extends BaseApiClient
 */

const BaseApiClient = require('./BaseApiClient');
const { getApiKey, isConfigured } = require('../config/api-keys');
const { RATE_LIMITS } = require('../config/constants');

class GooglePlacesClient extends BaseApiClient {
  constructor() {
    super({
      name: 'GOOGLE_PLACES',
      baseURL: 'https://maps.googleapis.com/maps/api',
      timeout: 15000,
      cacheTTL: 3600, // 1 hour cache
    });

    this.apiKey = null;
  }

  /**
   * Get API key (lazy loading)
   * @private
   */
  getKey() {
    if (!this.apiKey) {
      if (!isConfigured('googlePlaces')) {
        throw new Error('Google Places API key not configured');
      }
      this.apiKey = getApiKey('googlePlaces');
    }
    return this.apiKey;
  }

  /**
   * Search nearby places
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radius - Radius in meters
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Places
   */
  async searchNearby(lat, lng, radius, options = {}) {
    const params = {
      location: `${lat},${lng}`,
      radius,
      key: this.getKey(),
      ...options,
    };

    const data = await this.get('/place/nearbysearch/json', params);

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      this.logger.warn(`Places API returned status: ${data.status}`);
    }

    return data.results || [];
  }

  /**
   * Text search for places
   * @param {string} query - Search query
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radius - Radius in meters
   * @returns {Promise<Array>} Places
   */
  async textSearch(query, lat, lng, radius) {
    const params = {
      query,
      location: `${lat},${lng}`,
      radius,
      key: this.getKey(),
    };

    const data = await this.get('/place/textsearch/json', params);

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      this.logger.warn(`Text search returned status: ${data.status}`);
    }

    return data.results || [];
  }

  /**
   * Get place details
   * @param {string} placeId - Google Place ID
   * @returns {Promise<Object>} Place details
   */
  async getDetails(placeId) {
    const params = {
      place_id: placeId,
      key: this.getKey(),
      fields: 'name,formatted_address,geometry,photos,rating,reviews,opening_hours,website,price_level,types',
    };

    const data = await this.get('/place/details/json', params);

    if (data.status !== 'OK') {
      throw new Error(`Failed to get place details: ${data.status}`);
    }

    return data.result;
  }

  /**
   * Get photo URL
   * @param {string} photoReference - Photo reference from place
   * @param {number} maxWidth - Max photo width
   * @returns {string} Photo URL
   */
  getPhotoUrl(photoReference, maxWidth = 400) {
    return `${this.baseURL}/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${this.getKey()}`;
  }

  /**
   * Autocomplete place search
   * @param {string} input - User input
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Array>} Predictions
   */
  async autocomplete(input, lat, lng) {
    const params = {
      input,
      location: `${lat},${lng}`,
      radius: 50000, // 50km
      key: this.getKey(),
    };

    const data = await this.get('/place/autocomplete/json', params);

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      this.logger.warn(`Autocomplete returned status: ${data.status}`);
    }

    return data.predictions || [];
  }
}

module.exports = GooglePlacesClient;
