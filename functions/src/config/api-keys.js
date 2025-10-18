/**
 * API Keys Configuration Module
 *
 * SOLID Principles Applied:
 * - Single Responsibility: API key management only
 * - Open/Closed: Easy to add new API keys without modifying existing code
 *
 * Reads API keys from environment variables (.env file)
 * Firebase requires uppercase env var names, but code uses camelCase
 */

/**
 * Map camelCase key names to uppercase env var names
 * Firebase .env validation requires uppercase variable names
 */
const KEY_MAPPINGS = {
  // Google API keys (camelCase -> SCREAMING_SNAKE_CASE)
  'googlePlaces': 'GOOGLE_PLACES_API_KEY',
  'googleSearch': 'GOOGLE_SEARCH_API_KEY',
  'googleSearchEngineId': 'GOOGLE_SEARCH_ENGINE_ID',
  'googleGeocoding': 'GOOGLE_GEOCODING_API_KEY',

  // Keys that are already in correct format
  'TWITTER_BEARER_TOKEN': 'TWITTER_BEARER_TOKEN',
  'OPEN_WEATHER_API_KEY': 'OPEN_WEATHER_API_KEY',
  'TICKETMASTER_API_KEY': 'TICKETMASTER_API_KEY',
  'TICKETMASTER_CONSUMER_SECRET': 'TICKETMASTER_CONSUMER_SECRET',
  'TICKETMASTER_AFFILIATE_ID': 'TICKETMASTER_AFFILIATE_ID',
  'TICKETMASTER_MARKET': 'TICKETMASTER_MARKET',
  'EVENTBRITE_PRIVATE_TOKEN': 'EVENTBRITE_PRIVATE_TOKEN',
};

/**
 * Get API key value from environment variables
 * @param {string} keyName - Name of the API key (camelCase or SCREAMING_SNAKE_CASE)
 * @returns {string} API key value
 */
function getApiKey(keyName) {
  // Map camelCase to uppercase if needed
  const envVarName = KEY_MAPPINGS[keyName] || keyName;
  const value = process.env[envVarName];

  if (!value || value.trim() === '') {
    throw new Error(
      `API key not configured: ${keyName} (env var: ${envVarName}). Please set it in functions/.env file`
    );
  }

  return value.trim();
}

/**
 * Check if API key is configured
 * @param {string} keyName - Name of the API key (camelCase or SCREAMING_SNAKE_CASE)
 * @returns {boolean}
 */
function isConfigured(keyName) {
  try {
    // Map camelCase to uppercase if needed
    const envVarName = KEY_MAPPINGS[keyName] || keyName;
    const value = process.env[envVarName];
    return Boolean(value && value.trim() !== '');
  } catch {
    return false;
  }
}

module.exports = {
  getApiKey,
  isConfigured,
};
