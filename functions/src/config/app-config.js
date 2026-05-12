/**
 * Application Configuration
 *
 * Centralized configuration for all hard-coded values
 * Supports environment-based overrides for dev/staging/prod
 */

module.exports = {
  /**
   * API Configuration
   */
  api: {
    // Request timeouts (milliseconds)
    timeout: {
      default: parseInt(process.env.API_TIMEOUT) || 10000, // 10 seconds
      places: parseInt(process.env.API_TIMEOUT_PLACES) || 15000, // 15 seconds
      twitter: parseInt(process.env.API_TIMEOUT_TWITTER) || 12000, // 12 seconds
      ticketmaster: parseInt(process.env.API_TIMEOUT_TICKETMASTER) || 10000,
      weather: parseInt(process.env.API_TIMEOUT_WEATHER) || 8000,
    },

    // Retry configuration
    retries: {
      maxAttempts: parseInt(process.env.API_MAX_RETRIES) || 3,
      initialDelay: parseInt(process.env.API_RETRY_DELAY) || 1000, // 1 second
      backoffMultiplier: parseFloat(process.env.API_RETRY_BACKOFF) || 2, // Exponential: 1s, 2s, 4s
    },

    // Rate limiting (milliseconds between requests to same endpoint)
    rateLimit: {
      minInterval: parseInt(process.env.API_RATE_LIMIT) || 100, // 100ms
      perEndpoint: true,
    },
  },

  /**
   * Cache Configuration
   */
  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false', // Default true

    // TTL values (seconds)
    ttl: {
      places: parseInt(process.env.CACHE_TTL_PLACES) || 3600, // 1 hour
      twitter: parseInt(process.env.CACHE_TTL_TWITTER) || 1800, // 30 min
      ticketmaster: parseInt(process.env.CACHE_TTL_TICKETMASTER) || 7200, // 2 hours
      weather: parseInt(process.env.CACHE_TTL_WEATHER) || 1800, // 30 min
      geocoding: parseInt(process.env.CACHE_TTL_GEOCODING) || 86400, // 24 hours
      vibeIndex: parseInt(process.env.CACHE_TTL_VIBE) || 3600, // 1 hour
    },

    // Cache size limits (entries)
    maxSize: {
      places: parseInt(process.env.CACHE_MAX_PLACES) || 1000,
      twitter: parseInt(process.env.CACHE_MAX_TWITTER) || 500,
      weather: parseInt(process.env.CACHE_MAX_WEATHER) || 200,
    },
  },

  /**
   * Discovery Configuration
   */
  discovery: {
    // Default search parameters
    defaults: {
      radius: parseFloat(process.env.DEFAULT_RADIUS) || 10, // miles
      maxResults: parseInt(process.env.DEFAULT_MAX_RESULTS) || 50,
      minScore: parseInt(process.env.MIN_SCORE) || 50,
    },

    // Limits
    limits: {
      maxRadius: parseFloat(process.env.MAX_RADIUS) || 50, // miles
      minRadius: parseFloat(process.env.MIN_RADIUS) || 0.5, // miles
      maxResults: parseInt(process.env.MAX_RESULTS_LIMIT) || 100,
    },

    // Feature toggles
    features: {
      enablePlaces: process.env.ENABLE_PLACES !== 'false',
      enableCustomSearch: process.env.ENABLE_CUSTOM_SEARCH !== 'false',
      enableTicketmaster: process.env.ENABLE_TICKETMASTER !== 'false',
      enableTwitter: process.env.ENABLE_TWITTER !== 'false',
      enableWeather: process.env.ENABLE_WEATHER !== 'false',
    },
  },

  /**
   * Scoring Configuration
   */
  scoring: {
    // Base score (always applied)
    baseScore: parseInt(process.env.SCORE_BASE) || 100,

    // Score component weights (max bonus points)
    weights: {
      distance: parseInt(process.env.SCORE_WEIGHT_DISTANCE) || 30,
      rating: parseInt(process.env.SCORE_WEIGHT_RATING) || 20,
      openNow: parseInt(process.env.SCORE_WEIGHT_OPEN_NOW) || 10,
      freeEntry: parseInt(process.env.SCORE_WEIGHT_FREE) || 5,
      popularity: parseInt(process.env.SCORE_WEIGHT_POPULARITY) || 15,
      affinity: parseInt(process.env.SCORE_WEIGHT_AFFINITY) || 40,
      musicGenre: parseInt(process.env.SCORE_WEIGHT_MUSIC) || 20,
      restaurantGenre: parseInt(process.env.SCORE_WEIGHT_RESTAURANT) || 20,
      evBonus: parseInt(process.env.SCORE_WEIGHT_EV_BONUS) || 20,
    },

    // Affinity thresholds
    affinity: {
      minThreshold: parseInt(process.env.AFFINITY_MIN_THRESHOLD) || 0,
      musicGenreFilterThreshold: parseInt(process.env.MUSIC_FILTER_THRESHOLD) || 10,
      restaurantGenreFilterThreshold: parseInt(process.env.RESTAURANT_FILTER_THRESHOLD) || 10,
    },
  },

  /**
   * External API Limits
   */
  apiLimits: {
    // Google Places
    places: {
      maxResultsPerQuery: parseInt(process.env.PLACES_MAX_RESULTS) || 60,
      maxNearbyRadius: parseInt(process.env.PLACES_MAX_RADIUS) || 50000, // meters
    },

    // Google Custom Search
    customSearch: {
      maxResultsPerQuery: parseInt(process.env.SEARCH_MAX_RESULTS) || 10,
      dailyLimit: parseInt(process.env.SEARCH_DAILY_LIMIT) || 100,
    },

    // Twitter
    twitter: {
      maxResultsPerQuery: parseInt(process.env.TWITTER_MAX_RESULTS) || 100,
      maxSearchRadius: parseInt(process.env.TWITTER_MAX_RADIUS) || 25, // miles
    },

    // Ticketmaster
    ticketmaster: {
      maxResultsPerQuery: parseInt(process.env.TICKETMASTER_MAX_RESULTS) || 50,
      defaultRadius: parseInt(process.env.TICKETMASTER_RADIUS) || 25, // miles
      daysAhead: parseInt(process.env.TICKETMASTER_DAYS_AHEAD) || 30,
    },

    // Weather
    weather: {
      forecastDays: parseInt(process.env.WEATHER_FORECAST_DAYS) || 7,
    },
  },

  /**
   * Logging Configuration
   */
  logging: {
    level: process.env.LOG_LEVEL || 'info', // debug, info, warn, error
    structured: process.env.LOG_STRUCTURED !== 'false',
    includeTimestamp: process.env.LOG_TIMESTAMP !== 'false',
    colorize: process.env.LOG_COLORIZE !== 'false',
  },

  /**
   * Performance Configuration
   */
  performance: {
    // Parallel request limits
    concurrency: {
      maxParallelApiCalls: parseInt(process.env.MAX_PARALLEL_API_CALLS) || 5,
      maxBatchSize: parseInt(process.env.MAX_BATCH_SIZE) || 500,
    },

    // Timeout limits
    functionTimeout: parseInt(process.env.FUNCTION_TIMEOUT) || 540, // 9 minutes (Firebase max)
  },

  /**
   * Feature Flags
   */
  features: {
    enableCaching: process.env.FEATURE_CACHING !== 'false',
    enableMetrics: process.env.FEATURE_METRICS === 'true',
    enableDebugMode: process.env.DEBUG === 'true',
    enableExperimentalFeatures: process.env.EXPERIMENTAL === 'true',
  },

  /**
   * Environment Info
   */
  environment: {
    name: process.env.ENVIRONMENT || 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
  },
};
