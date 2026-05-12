/**
 * Environment Variable Validation
 *
 * Validates that all required environment variables are present
 * Runs at startup to fail-fast if configuration is incomplete
 */

const { createLogger } = require('../utils/logger');
const logger = createLogger('ENV_VALIDATOR');

/**
 * Required environment variables
 * Format: { name: string, description: string, required: boolean }
 */
const ENV_VARS = [
  // Google APIs (CRITICAL)
  {
    name: 'GOOGLE_PLACES_API_KEY',
    description: 'Google Places API key for venue discovery',
    required: true,
  },
  {
    name: 'GOOGLE_SEARCH_API_KEY',
    description: 'Google Custom Search API key for events',
    required: true,
  },
  {
    name: 'GOOGLE_SEARCH_ENGINE_ID',
    description: 'Google Custom Search Engine ID',
    required: true,
  },

  // Twitter API (IMPORTANT)
  {
    name: 'TWITTER_BEARER_TOKEN',
    description: 'Twitter API v2 Bearer Token for social data',
    required: true,
  },

  // Weather API (IMPORTANT)
  {
    name: 'OPENWEATHER_API_KEY',
    description: 'OpenWeather API key for weather data',
    required: false, // Optional feature
  },

  // Ticketmaster API (IMPORTANT)
  {
    name: 'TICKETMASTER_API_KEY',
    description: 'Ticketmaster Discovery API key for events',
    required: false, // Optional feature
  },
  {
    name: 'TICKETMASTER_AFFILIATE_ID',
    description: 'Ticketmaster affiliate ID for tracking',
    required: false,
  },

  // Firebase (Handled by firebase-admin, but good to check)
  {
    name: 'FIREBASE_CONFIG',
    description: 'Firebase project configuration',
    required: false, // Auto-provided by Firebase Functions
  },
];

/**
 * Validate environment variables
 * @param {Object} options - Validation options
 * @param {boolean} options.strict - Throw error on missing required vars (default: true)
 * @param {boolean} options.logMissing - Log missing optional vars (default: true)
 * @returns {Object} Validation results
 */
function validateEnvironment(options = {}) {
  const { strict = true, logMissing = true } = options;

  const results = {
    valid: true,
    missing: [],
    present: [],
    optional: [],
  };

  logger.info('Validating environment variables...');

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name];

    if (!value || value === 'placeholder' || value === 'REPLACE_ME' || value === 'YOUR_KEY_HERE') {
      if (envVar.required) {
        results.valid = false;
        results.missing.push(envVar);
        logger.error(`MISSING REQUIRED: ${envVar.name} - ${envVar.description}`);
      } else {
        results.optional.push(envVar);
        if (logMissing) {
          logger.warn(`Missing optional: ${envVar.name} - ${envVar.description}`);
        }
      }
    } else {
      results.present.push(envVar);
      // Log first 10 characters only for security
      const preview = value.substring(0, 10) + '...';
      logger.debug(`✓ ${envVar.name}: ${preview}`);
    }
  }

  // Summary
  logger.info('Environment validation summary:', {
    total: ENV_VARS.length,
    present: results.present.length,
    missing: results.missing.length,
    optional: results.optional.length,
    valid: results.valid,
  });

  if (!results.valid && strict) {
    const errorMessage = `Missing required environment variables:\n${results.missing
      .map((v) => `  - ${v.name}: ${v.description}`)
      .join('\n')}`;

    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  return results;
}

/**
 * Get environment info for debugging
 * @returns {Object} Environment information
 */
function getEnvironmentInfo() {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV || 'production',
    firebaseProject: process.env.GCLOUD_PROJECT || process.env.FIREBASE_CONFIG?.projectId,
    hasGooglePlaces: !!process.env.GOOGLE_PLACES_API_KEY,
    hasTwitter: !!process.env.TWITTER_BEARER_TOKEN,
    hasWeather: !!process.env.OPENWEATHER_API_KEY,
    hasTicketmaster: !!process.env.TICKETMASTER_API_KEY,
  };
}

/**
 * Validate specific environment variable exists
 * @param {string} name - Variable name
 * @throws {Error} If variable is missing
 */
function requireEnvVar(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable missing: ${name}`);
  }
  return value;
}

/**
 * Get environment variable with default
 * @param {string} name - Variable name
 * @param {string} defaultValue - Default value if not set
 * @returns {string} Environment variable value or default
 */
function getEnvVar(name, defaultValue = null) {
  return process.env[name] || defaultValue;
}

module.exports = {
  validateEnvironment,
  getEnvironmentInfo,
  requireEnvVar,
  getEnvVar,
  ENV_VARS,
};
