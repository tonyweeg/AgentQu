/**
 * Twitter API v2 Client
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Twitter API integration only
 * - Open/Closed: Extends BaseApiClient without modification
 * - Dependency Inversion: Depends on BaseApiClient interface
 */

const BaseApiClient = require('./BaseApiClient');
const { getApiKey } = require('../config/api-keys');

class TwitterClient extends BaseApiClient {
  constructor() {
    const bearerToken = getApiKey('TWITTER_BEARER_TOKEN');

    super('https://api.twitter.com/2', {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
      },
    });

    // Twitter has strict rate limits (450 requests per 15 min window)
    this.rateLimitWindow = 15 * 60 * 1000; // 15 minutes
    this.maxRequestsPerWindow = 450;
    this.requestTimestamps = [];

    // Cache TTL for Twitter searches (5 minutes - short for fresh content)
    this.cacheTTL = 5 * 60 * 1000;
  }

  /**
   * Search recent tweets (last 7 days)
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} Search results with tweets and metadata
   */
  async searchRecent(params) {
    const {
      query,
      maxResults = 100,
      startTime = null,
      tweetFields = 'created_at,public_metrics,entities,author_id',
      expansions = 'author_id,geo.place_id',
      userFields = 'username,name,profile_image_url',
      placeFields = 'full_name,geo,place_type',
    } = params;

    // Rate limit check
    this.enforceRateLimit();

    const response = await this.get('/tweets/search/recent', {
      params: {
        query,
        max_results: Math.min(maxResults, 100), // Twitter API limit
        ...(startTime && { start_time: startTime }),
        'tweet.fields': tweetFields,
        'expansions': expansions,
        'user.fields': userFields,
        'place.fields': placeFields,
      },
    });

    // Track rate limit info from headers
    this.trackRateLimit(response.headers);

    return {
      tweets: response.data || [],
      includes: response.includes || {},
      meta: response.meta || {},
    };
  }

  /**
   * Build query for events with hashtags
   * @param {Array<string>} hashtags - Hashtags to search
   * @returns {string} Twitter query string
   */
  buildEventQuery(hashtags) {
    const eventKeywords = '(event OR festival OR concert OR exhibit OR fair OR market OR show OR happening OR tonight OR weekend)';
    const hashtagQuery = hashtags.map(tag => `#${tag.replace(/_/g, '')}`).join(' OR ');

    return `${eventKeywords} (${hashtagQuery}) -is:retweet -is:reply`;
  }

  /**
   * Build query for location-based search
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radiusMiles - Search radius in miles
   * @returns {string} Twitter query string
   */
  buildLocationQuery(lat, lng, radiusMiles) {
    const radiusKm = radiusMiles * 1.60934; // Convert to km
    return `point_radius:[${lng} ${lat} ${radiusKm}km] -is:retweet -is:reply`;
  }

  /**
   * Build query for city/state mentions
   * @param {string} cityName - City name
   * @param {string} stateName - State name
   * @returns {string} Twitter query string
   */
  buildLocationNameQuery(cityName, stateName) {
    const parts = [];
    if (cityName) parts.push(`"${cityName}"`);
    if (stateName) parts.push(`"${stateName}"`);

    const locationQuery = parts.join(' OR ');
    return `(${locationQuery}) -is:retweet -is:reply`;
  }

  /**
   * Enforce rate limiting
   * @private
   */
  enforceRateLimit() {
    const now = Date.now();

    // Remove timestamps outside the current window
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.rateLimitWindow
    );

    // Check if we're at the limit
    if (this.requestTimestamps.length >= this.maxRequestsPerWindow) {
      const oldestRequest = this.requestTimestamps[0];
      const waitTime = this.rateLimitWindow - (now - oldestRequest);

      this.logger.warn('Rate limit reached, waiting', { waitTimeMs: waitTime });
      throw new Error(`Rate limit reached. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    // Track this request
    this.requestTimestamps.push(now);
  }

  /**
   * Track rate limit info from response headers
   * @private
   */
  trackRateLimit(headers) {
    const limit = parseInt(headers['x-rate-limit-limit']) || null;
    const remaining = parseInt(headers['x-rate-limit-remaining']) || null;
    const reset = parseInt(headers['x-rate-limit-reset']) || null;
    const resetTime = reset ? new Date(reset * 1000).toISOString() : null;

    if (remaining !== null) {
      this.logger.info('Twitter rate limit status', {
        remaining,
        limit,
        resetTime,
      });
    }
  }
}

module.exports = TwitterClient;
