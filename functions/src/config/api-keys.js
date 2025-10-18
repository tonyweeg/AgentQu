/**
 * API Keys Configuration Module
 *
 * SOLID Principles Applied:
 * - Single Responsibility: API key management only
 * - Open/Closed: Easy to add new API keys without modifying existing code
 *
 * Reads API keys from environment variables (.env file)
 * Firebase automatically loads .env files in the functions directory
 */

/**
 * Get API key value from environment variables
 * @param {string} keyName - Name of the API key (e.g., 'GOOGLE_PLACES_API_KEY')
 * @returns {string} API key value
 */
function getApiKey(keyName) {
  const value = process.env[keyName];

  if (!value || value.trim() === '') {
    throw new Error(
      `API key not configured: ${keyName}. Please set it in functions/.env file`
    );
  }

  return value.trim();
}

/**
 * Check if API key is configured
 * @param {string} keyName - Name of the API key
 * @returns {boolean}
 */
function isConfigured(keyName) {
  try {
    const value = process.env[keyName];
    return Boolean(value && value.trim() !== '');
  } catch {
    return false;
  }
}

module.exports = {
  getApiKey,
  isConfigured,
};
