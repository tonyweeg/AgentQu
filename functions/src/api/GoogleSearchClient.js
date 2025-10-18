/**
 * Google Custom Search API Client
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Google Custom Search API communication only
 * - Liskov Substitution: Extends BaseApiClient
 */

const BaseApiClient = require('./BaseApiClient');
const { getApiKey, isConfigured } = require('../config/api-keys');

class GoogleSearchClient extends BaseApiClient {
  constructor() {
    super({
      name: 'GOOGLE_SEARCH',
      baseURL: 'https://www.googleapis.com/customsearch',
      timeout: 10000,
      cacheTTL: 1800, // 30 minutes cache
    });

    this.apiKey = null;
    this.engineId = null;
  }

  /**
   * Get API credentials (lazy loading)
   * @private
   */
  getCredentials() {
    if (!this.apiKey) {
      if (!isConfigured('googleSearch') || !isConfigured('googleSearchEngineId')) {
        throw new Error('Google Search API not configured');
      }
      this.apiKey = getApiKey('googleSearch');
      this.engineId = getApiKey('googleSearchEngineId');
    }
    return { apiKey: this.apiKey, engineId: this.engineId };
  }

  /**
   * Search
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  async search(query, options = {}) {
    const { apiKey, engineId } = this.getCredentials();

    const params = {
      key: apiKey,
      cx: engineId,
      q: query,
      num: options.num || 10,
      ...options,
    };

    const data = await this.get('/v1', params);

    return data.items || [];
  }

  /**
   * Search events
   * @param {string} city - City name
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Event results
   */
  async searchEvents(city, options = {}) {
    const queries = [
      `events ${city} today tonight this weekend`,
      `events site:facebook.com ${city} today this weekend`,
      `things to do ${city} this weekend`,
    ];

    const allResults = [];

    for (const query of queries) {
      try {
        const results = await this.search(query, {
          num: 10,
          dateRestrict: 'd30', // Only results from past 30 days
          ...options,
        });
        allResults.push(...results);
      } catch (error) {
        this.logger.warn(`Search query failed: ${query}`, error);
      }
    }

    // Deduplicate by URL
    const unique = Array.from(new Map(allResults.map((item) => [item.link, item])).values());

    return unique;
  }

  /**
   * Search with text query near location
   * @param {string} query - Search query
   * @param {string} city - City name
   * @returns {Promise<Array>} Search results
   */
  async searchNear(query, city) {
    const searchQuery = city ? `${query} in ${city}` : query;

    return this.search(searchQuery, { num: 10 });
  }
}

module.exports = GoogleSearchClient;
