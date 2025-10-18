/**
 * Distance Calculation Utilities
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Geospatial calculations only
 * - Pure Functions: No side effects, testable
 */

const geohash = require('ngeohash');
const { EARTH_RADIUS_MILES, GEOHASH_PRECISION, GEOHASH_PRECISE } = require('../config/constants');

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number}
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - First point latitude
 * @param {number} lng1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lng2 - Second point longitude
 * @returns {number} Distance in miles
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MILES * c;
}

/**
 * Encode coordinates to geohash
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} precision - Geohash precision (default: 7)
 * @returns {string} Geohash string
 */
function encodeGeohash(lat, lng, precision = GEOHASH_PRECISION) {
  return geohash.encode(lat, lng, precision);
}

/**
 * Decode geohash to coordinates
 * @param {string} hash - Geohash string
 * @returns {{latitude: number, longitude: number}}
 */
function decodeGeohash(hash) {
  return geohash.decode(hash);
}

/**
 * Calculate distance bonus for scoring
 * @param {number} distance - Distance in miles
 * @returns {number} Bonus points (0-30)
 */
function calculateDistanceBonus(distance) {
  if (distance <= 1) return 30;
  if (distance <= 3) return 20;
  if (distance <= 5) return 10;
  if (distance <= 10) return 5;
  return Math.max(0, 5 - (distance - 10) * 2); // Penalty for far distances
}

module.exports = {
  calculateDistance,
  encodeGeohash,
  decodeGeohash,
  calculateDistanceBonus,
  toRadians,
};
