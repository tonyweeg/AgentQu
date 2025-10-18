/**
 * Input Validation Utilities
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Input validation only
 * - Fail-fast: Validate early, throw descriptive errors
 */

const profanityFilter = require('leo-profanity');

/**
 * Validate coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @throws {Error} If coordinates are invalid
 */
function validateCoordinates(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new Error('Coordinates must be numbers');
  }
  if (lat < -90 || lat > 90) {
    throw new Error('Latitude must be between -90 and 90');
  }
  if (lng < -180 || lng > 180) {
    throw new Error('Longitude must be between -180 and 180');
  }
}

/**
 * Validate radius
 * @param {number} radius - Radius in miles
 * @throws {Error} If radius is invalid
 */
function validateRadius(radius) {
  if (typeof radius !== 'number' || radius <= 0) {
    throw new Error('Radius must be a positive number');
  }
  if (radius > 100) {
    throw new Error('Radius cannot exceed 100 miles');
  }
}

/**
 * Validate and sanitize text input
 * @param {string} text - Input text
 * @param {Object} options - Validation options
 * @param {number} options.maxLength - Maximum length
 * @param {boolean} options.required - Is required
 * @param {boolean} options.checkProfanity - Check for profanity
 * @returns {string} Sanitized text
 * @throws {Error} If validation fails
 */
function validateText(text, options = {}) {
  const { maxLength = 1000, required = false, checkProfanity = true } = options;

  if (required && (!text || text.trim() === '')) {
    throw new Error('Text is required');
  }

  if (!text) return '';

  const trimmed = text.trim();

  if (trimmed.length > maxLength) {
    throw new Error(`Text exceeds maximum length of ${maxLength} characters`);
  }

  if (checkProfanity && profanityFilter.check(trimmed)) {
    throw new Error('Text contains inappropriate language');
  }

  return trimmed;
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate user ID
 * @param {string} userId - User ID
 * @throws {Error} If user ID is invalid
 */
function validateUserId(userId) {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID');
  }
}

/**
 * Validate activity ID
 * @param {string} activityId - Activity ID
 * @throws {Error} If activity ID is invalid
 */
function validateActivityId(activityId) {
  if (!activityId || typeof activityId !== 'string' || activityId.trim() === '') {
    throw new Error('Invalid activity ID');
  }
}

/**
 * Validate rating (1-5 stars)
 * @param {number} rating - Rating value
 * @throws {Error} If rating is invalid
 */
function validateRating(rating) {
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }
}

/**
 * Validate date timestamp
 * @param {number} timestamp - Unix timestamp
 * @throws {Error} If timestamp is invalid
 */
function validateTimestamp(timestamp) {
  if (typeof timestamp !== 'number' || timestamp < 0) {
    throw new Error('Invalid timestamp');
  }
  // Check if timestamp is reasonable (not too far in past or future)
  const now = Date.now();
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
  const oneYearFromNow = now + 365 * 24 * 60 * 60 * 1000;

  if (timestamp < oneYearAgo || timestamp > oneYearFromNow) {
    throw new Error('Timestamp out of reasonable range');
  }
}

/**
 * Sanitize object for Firestore (remove undefined values)
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
function sanitizeForFirestore(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        sanitized[key] = sanitizeForFirestore(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
  });
  return sanitized;
}

module.exports = {
  validateCoordinates,
  validateRadius,
  validateText,
  isValidEmail,
  validateUserId,
  validateActivityId,
  validateRating,
  validateTimestamp,
  sanitizeForFirestore,
};
