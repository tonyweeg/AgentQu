/**
 * Base API Client
 *
 * SOLID Principles Applied:
 * - Single Responsibility: HTTP communication only
 * - Open/Closed: Extensible without modification
 * - Dependency Inversion: Depends on axios interface
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Rate limiting
 * - Response caching (in-memory for function lifetime)
 * - Structured error handling
 *
 * Cache Design:
 * This class uses in-memory Map for caching, which is CORRECT for Cloud Functions:
 * - Cloud Functions are stateless and short-lived (seconds to minutes)
 * - In-memory cache persists for the function instance lifetime
 * - Multiple requests to same function instance benefit from cache
 * - No need for external cache (Firestore/Redis) which adds cost/complexity
 * - For persistent cross-function caching, use CacheRepository instead
 *
 * When to use each cache:
 * - BaseApiClient cache: Fast, instance-level, automatic (API responses)
 * - CacheRepository: Persistent, cross-function, manual (activity data)
 */

const axios = require('axios');
const { createLogger } = require('../utils/logger');
const appConfig = require('../config/app-config');

class BaseApiClient {
  /**
   * @param {Object} config - Client configuration
   * @param {string} config.name - Client name for logging
   * @param {string} config.baseURL - Base URL for API
   * @param {number} config.timeout - Request timeout in ms (optional, uses app config default)
   * @param {number} config.maxRetries - Max retry attempts (optional, uses app config default)
   * @param {number} config.cacheTTL - Cache TTL in seconds (optional, uses app config default)
   */
  constructor(config) {
    this.name = config.name || 'API';
    this.baseURL = config.baseURL || '';
    this.timeout = config.timeout || appConfig.api.timeout.default;
    this.maxRetries = config.maxRetries || appConfig.api.retries.maxAttempts;
    this.cacheTTL = config.cacheTTL || 300; // 5 minutes default (specific to each client)

    this.logger = createLogger(this.name);
    this.cache = new Map();
    this.rateLimitMap = new Map();

    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: config.headers || {},
    });
  }

  /**
   * Make HTTP request with retry logic
   * @param {Object} requestConfig - Axios request config
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise<Object>} Response data
   */
  async request(requestConfig, retryCount = 0) {
    try {
      const response = await this.client.request(requestConfig);
      return response.data;
    } catch (error) {
      // Log error
      this.logger.error(`Request failed (attempt ${retryCount + 1}/${this.maxRetries})`, error);

      // Check if should retry
      if (retryCount < this.maxRetries && this.shouldRetry(error)) {
        // Exponential backoff with configurable multiplier
        const delay = Math.pow(appConfig.api.retries.backoffMultiplier, retryCount) * appConfig.api.retries.initialDelay;
        this.logger.debug(`Retrying after ${delay}ms`);

        await this.sleep(delay);
        return this.request(requestConfig, retryCount + 1);
      }

      // Max retries exceeded or non-retryable error
      throw this.formatError(error);
    }
  }

  /**
   * GET request with caching
   * @param {string} url - URL path
   * @param {Object} params - Query parameters
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async get(url, params = {}, options = {}) {
    const cacheKey = this.getCacheKey('GET', url, params);

    // Check cache
    if (options.useCache !== false && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() < cached.expiresAt) {
        this.logger.debug(`Cache hit`, { url, params });
        return cached.data;
      }
      // Expired, remove from cache
      this.cache.delete(cacheKey);
    }

    // Check rate limit
    await this.checkRateLimit(url);

    // Make request
    this.logger.debug(`GET request`, { url, params });
    const data = await this.request({ method: 'GET', url, params });

    // Cache response
    if (options.useCache !== false) {
      this.cacheResponse(cacheKey, data, options.cacheTTL || this.cacheTTL);
    }

    return data;
  }

  /**
   * POST request
   * @param {string} url - URL path
   * @param {Object} data - Request body
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async post(url, data = {}, options = {}) {
    await this.checkRateLimit(url);

    this.logger.debug(`POST request`, { url });
    return this.request({ method: 'POST', url, data });
  }

  /**
   * PUT request
   * @param {string} url - URL path
   * @param {Object} data - Request body
   * @returns {Promise<Object>} Response data
   */
  async put(url, data = {}) {
    await this.checkRateLimit(url);

    this.logger.debug(`PUT request`, { url });
    return this.request({ method: 'PUT', url, data });
  }

  /**
   * DELETE request
   * @param {string} url - URL path
   * @returns {Promise<Object>} Response data
   */
  async delete(url) {
    await this.checkRateLimit(url);

    this.logger.debug(`DELETE request`, { url });
    return this.request({ method: 'DELETE', url });
  }

  /**
   * Generate cache key
   * @private
   */
  getCacheKey(method, url, params) {
    const paramsStr = JSON.stringify(params);
    return `${method}:${url}:${paramsStr}`;
  }

  /**
   * Cache response
   * @private
   */
  cacheResponse(key, data, ttlSeconds) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    this.logger.debug(`Cached response`, { key, ttlSeconds });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.logger.info(`Cache cleared`);
  }

  /**
   * Check rate limit
   * @private
   */
  async checkRateLimit(url) {
    const now = Date.now();
    const lastRequest = this.rateLimitMap.get(url) || 0;
    const minInterval = appConfig.api.rateLimit.minInterval;

    const timeSinceLastRequest = now - lastRequest;
    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      this.logger.debug(`Rate limit: waiting ${waitTime}ms`);
      await this.sleep(waitTime);
    }

    this.rateLimitMap.set(url, Date.now());
  }

  /**
   * Determine if error should be retried
   * @private
   */
  shouldRetry(error) {
    // Retry on network errors or 5xx server errors
    if (!error.response) return true; // Network error

    const status = error.response.status;
    return status >= 500 && status < 600; // Server error
  }

  /**
   * Format error for consistency
   * @private
   */
  formatError(error) {
    const formatted = {
      name: this.name,
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
    };

    return new Error(JSON.stringify(formatted));
  }

  /**
   * Sleep utility
   * @private
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

module.exports = BaseApiClient;
