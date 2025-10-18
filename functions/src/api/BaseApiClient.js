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
 * - Response caching
 * - Structured error handling
 */

const axios = require('axios');
const { createLogger } = require('../utils/logger');

class BaseApiClient {
  /**
   * @param {Object} config - Client configuration
   * @param {string} config.name - Client name for logging
   * @param {string} config.baseURL - Base URL for API
   * @param {number} config.timeout - Request timeout in ms
   * @param {number} config.maxRetries - Max retry attempts
   * @param {number} config.cacheTTL - Cache TTL in seconds
   */
  constructor(config) {
    this.name = config.name || 'API';
    this.baseURL = config.baseURL || '';
    this.timeout = config.timeout || 10000;
    this.maxRetries = config.maxRetries || 3;
    this.cacheTTL = config.cacheTTL || 300; // 5 minutes default

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
        // Exponential backoff: 1s, 2s, 4s, 8s...
        const delay = Math.pow(2, retryCount) * 1000;
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
    const minInterval = 100; // Minimum 100ms between requests to same endpoint

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
