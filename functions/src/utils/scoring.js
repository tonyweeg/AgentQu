/**
 * Scoring Utilities
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Scoring calculations only
 * - Pure Functions: No side effects, fully testable
 * - Open/Closed: Easy to extend scoring logic
 */

const { mapMusicGenre, mapRestaurantGenre } = require('./mappings');
const { calculateDistanceBonus } = require('./distance');
const {
  KNOWN_CHAINS,
  HEALTHY_FOOD_INDICATORS,
  MUSIC_GENRE_FILTER_THRESHOLD,
  RESTAURANT_GENRE_FILTER_THRESHOLD,
} = require('../config/constants');

/**
 * Generate affinity signature from user affinities for cache keys
 * @param {Object} affinities - User affinities
 * @returns {string} Affinity signature
 */
function generateAffinitySignature(affinities) {
  if (!affinities) return 'default';

  const topAffinities = Object.entries(affinities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, score]) => `${cat}:${Math.round(score * 10)}`)
    .join('_');

  return topAffinities || 'default';
}

/**
 * Calculate affinity-based score for an activity
 * @param {string[]} activityCategories - Activity categories
 * @param {Object} userAffinities - User affinity scores
 * @returns {number} Score 0-1
 */
function calculateAffinityScore(activityCategories, userAffinities) {
  if (!userAffinities || !activityCategories || activityCategories.length === 0) {
    return 0.5; // Neutral score
  }

  let totalScore = 0;
  let matchCount = 0;

  activityCategories.forEach((category) => {
    if (userAffinities[category] !== undefined) {
      totalScore += userAffinities[category];
      matchCount++;
    }
  });

  // If no matches, return slight preference for variety
  if (matchCount === 0) return 0.4;

  // Average affinity score (0-100 → 0-1)
  return totalScore / matchCount / 100;
}

/**
 * Calculate music genre affinity score for an event
 * @param {string[]} musicGenres - Ticketmaster genre names
 * @param {Object} musicGenreAffinities - User genre affinities (0-100)
 * @returns {number|null} Score 0-100, or null if not applicable
 */
function calculateMusicGenreAffinityScore(musicGenres, musicGenreAffinities) {
  if (!musicGenres || musicGenres.length === 0 || !musicGenreAffinities) {
    return null;
  }

  let totalScore = 0;
  let matchCount = 0;

  musicGenres.forEach((tmGenre) => {
    const genreId = mapMusicGenre(tmGenre);
    if (genreId && musicGenreAffinities[genreId] !== undefined) {
      totalScore += musicGenreAffinities[genreId];
      matchCount++;
    }
  });

  // If no matches, return neutral score
  if (matchCount === 0) return 50;

  return Math.round(totalScore / matchCount);
}

/**
 * Calculate restaurant genre affinity score
 * @param {string[]} restaurantCategories - Restaurant categories
 * @param {Object} restaurantGenreAffinities - User genre affinities (0-100)
 * @returns {number|null} Score 0-100, or null if not applicable
 */
function calculateRestaurantGenreAffinityScore(restaurantCategories, restaurantGenreAffinities) {
  if (!restaurantCategories || restaurantCategories.length === 0 || !restaurantGenreAffinities) {
    return null;
  }

  let totalScore = 0;
  let matchCount = 0;

  const categoriesLower = restaurantCategories.map((c) => (c || '').toLowerCase());

  categoriesLower.forEach((category) => {
    const genreId = mapRestaurantGenre(category);
    if (genreId && restaurantGenreAffinities[genreId] !== undefined) {
      totalScore += restaurantGenreAffinities[genreId];
      matchCount++;
    }
  });

  // If no matches, return neutral score
  if (matchCount === 0) return 50;

  return Math.round(totalScore / matchCount);
}

/**
 * Check if place is a known chain
 * @param {string} placeName - Name of the place
 * @returns {boolean}
 */
function isKnownChain(placeName) {
  const nameLower = (placeName || '').toLowerCase();
  return KNOWN_CHAINS.some((chain) => nameLower.includes(chain));
}

/**
 * Check if place is a big box store
 * @param {string} placeName - Name of the place
 * @returns {boolean}
 */
function isBigBoxStore(placeName) {
  const nameLower = (placeName || '').toLowerCase();
  const bigBoxStores = [
    'walmart',
    'target',
    'costco',
    "sam's club",
    'sams club',
    "bj's wholesale",
    'bjs wholesale',
  ];
  return bigBoxStores.some((store) => nameLower.includes(store));
}

/**
 * Check if place is a healthy food option
 * @param {string} placeName - Name of the place
 * @param {string[]} placeTypes - Place types
 * @returns {boolean}
 */
function isHealthyFood(placeName, placeTypes = []) {
  const nameLower = (placeName || '').toLowerCase();
  const typesLower = placeTypes.map((t) => (t || '').toLowerCase());

  const nameMatch = HEALTHY_FOOD_INDICATORS.some((indicator) => nameLower.includes(indicator));

  const typeMatch = HEALTHY_FOOD_INDICATORS.some((indicator) =>
    typesLower.some((type) => type.includes(indicator))
  );

  return nameMatch || typeMatch;
}

/**
 * Calculate final composite score for an activity
 * @param {Object} activity - Activity object
 * @param {number} userLat - User latitude
 * @param {number} userLng - User longitude
 * @param {Object} userAffinities - User category affinities
 * @param {Object} musicGenreAffinities - User music genre affinities
 * @param {Object} restaurantGenreAffinities - User restaurant genre affinities
 * @returns {Object} Score breakdown
 */
function calculateFinalScore(
  activity,
  userLat,
  userLng,
  userAffinities,
  musicGenreAffinities,
  restaurantGenreAffinities
) {
  let baseScore = 100;

  // Distance factor (0-30 points)
  const distanceBonus = calculateDistanceBonus(activity.distance || 0);
  baseScore += distanceBonus;

  // Rating factor (0-20 points)
  if (activity.ratings?.agentQuRating) {
    baseScore += (activity.ratings.agentQuRating / 5) * 20;
  } else if (activity.ratings?.googleRating) {
    baseScore += (activity.ratings.googleRating / 5) * 15;
  }

  // Open now bonus (10 points)
  if (activity.schedule?.isOpen24Hours || activity.openNow) {
    baseScore += 10;
  }

  // Free activities bonus (5 points)
  if (activity.details?.priceLevel === 0) {
    baseScore += 5;
  }

  // Popularity factor (0-15 points)
  if (activity.ratings?.voteScore > 0) {
    baseScore += Math.min(15, activity.ratings.voteScore);
  }

  // Category affinity factor (0-40 points) - BIGGEST WEIGHT
  const affinityScore = calculateAffinityScore(activity.categories, userAffinities);
  const affinityPoints = affinityScore * 40;
  baseScore += affinityPoints;

  // Music genre affinity bonus (0-20 points)
  let genreAffinityPoints = 0;
  if (activity.type === 'event' && activity.musicGenres && musicGenreAffinities) {
    const genreScore = calculateMusicGenreAffinityScore(activity.musicGenres, musicGenreAffinities);
    if (genreScore !== null) {
      genreAffinityPoints = (genreScore / 100) * 20;
      baseScore += genreAffinityPoints;
    }
  }

  // Restaurant genre affinity bonus (0-15 points)
  let restaurantAffinityPoints = 0;
  if (activity.categories && restaurantGenreAffinities) {
    const restaurantScore = calculateRestaurantGenreAffinityScore(
      activity.categories,
      restaurantGenreAffinities
    );
    if (restaurantScore !== null) {
      restaurantAffinityPoints = (restaurantScore / 100) * 15;
      baseScore += restaurantAffinityPoints;
    }
  }

  // Healthy food bonus (20 points)
  let healthyFoodBonus = 0;
  if (isHealthyFood(activity.name, activity.placeTypes || [])) {
    healthyFoodBonus = 20;
    baseScore += healthyFoodBonus;
  }

  // Chain penalty (-10 points)
  let chainPenalty = 0;
  if (isKnownChain(activity.name)) {
    chainPenalty = -10;
    baseScore += chainPenalty;
  }

  // Big box store penalty (-40 points)
  let bigBoxPenalty = 0;
  if (isBigBoxStore(activity.name)) {
    bigBoxPenalty = -40;
    baseScore += bigBoxPenalty;
  }

  return {
    finalScore: Math.max(0, Math.round(baseScore)),
    baseScore: Math.round(
      baseScore -
        affinityPoints -
        genreAffinityPoints -
        restaurantAffinityPoints -
        healthyFoodBonus -
        chainPenalty -
        bigBoxPenalty
    ),
    affinityScore: Math.round(affinityPoints),
    genreAffinityScore: Math.round(genreAffinityPoints),
    restaurantAffinityScore: Math.round(restaurantAffinityPoints),
    healthyFoodBonus: Math.round(healthyFoodBonus),
    chainPenalty: Math.round(chainPenalty),
    bigBoxPenalty: Math.round(bigBoxPenalty),
  };
}

/**
 * Filter activities below music genre threshold
 * @param {Object} activity - Activity object
 * @param {Object} musicGenreAffinities - User genre affinities
 * @returns {boolean} True if activity should be kept
 */
function passesMusicGenreFilter(activity, musicGenreAffinities) {
  if (!activity.musicGenres || !musicGenreAffinities) {
    return true; // Not a music event, keep it
  }

  const genreScore = calculateMusicGenreAffinityScore(activity.musicGenres, musicGenreAffinities);
  return genreScore === null || genreScore >= MUSIC_GENRE_FILTER_THRESHOLD;
}

/**
 * Filter restaurants below genre threshold
 * @param {Object} activity - Activity object
 * @param {Object} restaurantGenreAffinities - User genre affinities
 * @returns {boolean} True if activity should be kept
 */
function passesRestaurantGenreFilter(activity, restaurantGenreAffinities) {
  if (!activity.categories || !restaurantGenreAffinities) {
    return true; // Not a restaurant, keep it
  }

  const restaurantScore = calculateRestaurantGenreAffinityScore(
    activity.categories,
    restaurantGenreAffinities
  );
  return restaurantScore === null || restaurantScore >= RESTAURANT_GENRE_FILTER_THRESHOLD;
}

module.exports = {
  generateAffinitySignature,
  calculateAffinityScore,
  calculateMusicGenreAffinityScore,
  calculateRestaurantGenreAffinityScore,
  calculateFinalScore,
  isKnownChain,
  isBigBoxStore,
  isHealthyFood,
  passesMusicGenreFilter,
  passesRestaurantGenreFilter,
};
