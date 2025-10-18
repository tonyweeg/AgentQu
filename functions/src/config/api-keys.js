/**
 * API Keys Configuration Module
 *
 * SOLID Principles Applied:
 * - Single Responsibility: API key management only
 * - Open/Closed: Easy to add new API keys without modifying existing code
 */

const { defineString } = require('firebase-functions/params');

// Define all API keys as Firebase Functions config parameters
const apiKeys = {
  googlePlaces: defineString('GOOGLE_PLACES_API_KEY'),
  googleSearch: defineString('GOOGLE_SEARCH_API_KEY'),
  googleSearchEngineId: defineString('GOOGLE_SEARCH_ENGINE_ID'),
  googleGeocoding: defineString('GOOGLE_GEOCODING_API_KEY'),
  openWeather: defineString('OPENWEATHER_API_KEY'),
  eventbrite: defineString('EVENTBRITE_PRIVATE_TOKEN'),
  ticketmaster: defineString('TICKETMASTER_API_KEY'),
  twitter: defineString('TWITTER_BEARER_TOKEN'),
};

/**
 * Get API key value
 * @param {string} keyName - Name of the API key
 * @returns {string} API key value
 */
function getApiKey(keyName) {
  const key = apiKeys[keyName];
  if (!key) {
    throw new Error(`Unknown API key: ${keyName}`);
  }
  return key.value();
}

/**
 * Check if API key is configured
 * @param {string} keyName - Name of the API key
 * @returns {boolean}
 */
function isConfigured(keyName) {
  try {
    const value = getApiKey(keyName);
    return Boolean(value && value.trim() !== '');
  } catch {
    return false;
  }
}

module.exports = {
  getApiKey,
  isConfigured,
  keys: apiKeys,
};
