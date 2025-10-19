/**
 * Scoring Strategy Pattern
 *
 * Base class for all scoring strategies. Each strategy calculates a specific
 * component of the activity score (distance, rating, affinity, etc.)
 *
 * SOLID Principles:
 * - Single Responsibility: Each strategy calculates one score component
 * - Open/Closed: Easily add new strategies without modifying existing ones
 * - Liskov Substitution: All strategies are interchangeable
 * - Interface Segregation: Simple, focused interface
 */

const { createLogger } = require('../logger');

const logger = createLogger('SCORING_STRATEGY');

/**
 * Base Scoring Strategy
 *
 * All concrete scoring strategies must extend this class
 */
class ScoringStrategy {
  /**
   * @param {string} name - Strategy name for logging
   * @param {number} maxPoints - Maximum points this strategy can award
   */
  constructor(name, maxPoints) {
    this.name = name;
    this.maxPoints = maxPoints;
  }

  /**
   * Calculate score for an activity
   *
   * @param {Object} activity - Activity to score
   * @param {Object} context - Scoring context (user location, preferences, etc.)
   * @returns {number} Score (0 to maxPoints)
   * @abstract
   */
  calculate(activity, context) {
    throw new Error(`${this.name}: calculate() must be implemented by subclass`);
  }

  /**
   * Normalize a score to 0-1 range
   * @protected
   */
  normalize(score, max = this.maxPoints) {
    return Math.max(0, Math.min(1, score / max));
  }

  /**
   * Log scoring details for debugging
   * @protected
   */
  logScore(activityName, score, details = {}) {
    logger.debug(`${this.name} scored ${activityName}`, {
      score,
      maxPoints: this.maxPoints,
      ...details,
    });
  }
}

module.exports = ScoringStrategy;
