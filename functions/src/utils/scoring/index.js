/**
 * Scoring Module
 *
 * Strategy pattern-based scoring system for activities
 *
 * Usage:
 * ```javascript
 * const { CompositeScorer } = require('./utils/scoring');
 *
 * const scorer = CompositeScorer.createDefault();
 * const result = scorer.calculate(activity, context);
 * console.log(result.total); // 145
 * console.log(result.breakdown); // { base: 100, distance: 25, rating: 15, ... }
 * ```
 */

const ScoringStrategy = require('./ScoringStrategy');
const CompositeScorer = require('./CompositeScorer');
const strategies = require('./strategies');

// Export all strategies
const {
  DistanceScoringStrategy,
  RatingScoringStrategy,
  AffinityScoringStrategy,
  OpenNowScoringStrategy,
  FreeScoringStrategy,
  PopularityScoringStrategy,
  MusicGenreScoringStrategy,
  EVChargingBonusStrategy,
} = strategies;

// Export backward-compatible functions (delegates to strategies)
const { createLogger } = require('../logger');
const logger = createLogger('SCORING');

/**
 * Calculate final score for an activity (backward compatible)
 *
 * @deprecated Use CompositeScorer instead
 * @param {Object} activity - Activity to score
 * @param {Object} context - Scoring context
 * @returns {number} Final score
 */
function calculateFinalScore(activity, context) {
  const scorer = CompositeScorer.createDefault();
  const result = scorer.calculate(activity, context);
  return result.total;
}

/**
 * Calculate affinity score (backward compatible)
 *
 * @deprecated Use AffinityScoringStrategy instead
 */
function calculateAffinityScore(activityCategories, userAffinities) {
  const strategy = new AffinityScoringStrategy();
  const activity = { categories: activityCategories };
  const context = { userAffinities };
  return strategy.calculate(activity, context);
}

module.exports = {
  // Core classes
  ScoringStrategy,
  CompositeScorer,

  // Concrete strategies
  DistanceScoringStrategy,
  RatingScoringStrategy,
  AffinityScoringStrategy,
  OpenNowScoringStrategy,
  FreeScoringStrategy,
  PopularityScoringStrategy,
  MusicGenreScoringStrategy,
  EVChargingBonusStrategy,

  // Backward compatibility functions
  calculateFinalScore,
  calculateAffinityScore,
};
