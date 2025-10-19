/**
 * Composite Scorer
 *
 * Combines multiple scoring strategies into a single composite score
 * Follows the Composite and Strategy patterns
 *
 * SOLID Principles:
 * - Single Responsibility: Orchestrates scoring strategies
 * - Open/Closed: Add new strategies without modifying this class
 * - Dependency Inversion: Depends on ScoringStrategy abstraction
 */

const { createLogger } = require('../logger');
const appConfig = require('../../config/app-config');

const logger = createLogger('COMPOSITE_SCORER');

class CompositeScorer {
  /**
   * @param {number} baseScore - Base score awarded to all activities
   */
  constructor(baseScore = 100) {
    this.baseScore = baseScore;
    this.strategies = [];
  }

  /**
   * Add a scoring strategy
   *
   * @param {ScoringStrategy} strategy - Strategy to add
   * @returns {CompositeScorer} this (for chaining)
   */
  addStrategy(strategy) {
    this.strategies.push(strategy);
    return this;
  }

  /**
   * Remove a strategy by name
   *
   * @param {string} strategyName - Name of strategy to remove
   * @returns {CompositeScorer} this (for chaining)
   */
  removeStrategy(strategyName) {
    this.strategies = this.strategies.filter((s) => s.name !== strategyName);
    return this;
  }

  /**
   * Calculate composite score for an activity
   *
   * @param {Object} activity - Activity to score
   * @param {Object} context - Scoring context
   * @param {Object} context.userLocation - User's location {lat, lng}
   * @param {number} context.radius - Search radius in miles
   * @param {Object} context.userAffinities - User affinity scores by category
   * @param {Object} context.musicGenreAffinities - Music genre preferences
   * @param {boolean} context.isEVOwner - Whether user owns an EV
   * @returns {Object} Scoring result with total and breakdown
   */
  calculate(activity, context) {
    const breakdown = {
      base: this.baseScore,
    };

    let totalBonus = 0;

    // Calculate each strategy's score
    this.strategies.forEach((strategy) => {
      try {
        const score = strategy.calculate(activity, context);
        breakdown[strategy.name.toLowerCase()] = Math.round(score);
        totalBonus += score;
      } catch (error) {
        logger.error(`Strategy ${strategy.name} failed for activity ${activity.name}`, error);
        breakdown[strategy.name.toLowerCase()] = 0;
      }
    });

    const total = Math.round(this.baseScore + totalBonus);

    logger.debug(`Scored ${activity.name}`, {
      total,
      breakdown,
    });

    return {
      total,
      breakdown,
    };
  }

  /**
   * Calculate scores for multiple activities
   *
   * @param {Array} activities - Activities to score
   * @param {Object} context - Scoring context
   * @returns {Array} Activities with scores added
   */
  calculateBatch(activities, context) {
    logger.info(`Scoring ${activities.length} activities`);

    return activities.map((activity) => {
      const result = this.calculate(activity, context);

      return {
        ...activity,
        score: result.total,
        scoreBreakdown: result.breakdown,
      };
    });
  }

  /**
   * Get total maximum possible score
   *
   * @returns {number} Maximum score
   */
  getMaxScore() {
    const maxBonus = this.strategies.reduce((sum, strategy) => sum + strategy.maxPoints, 0);
    return this.baseScore + maxBonus;
  }

  /**
   * Get score breakdown showing max points for each component
   *
   * @returns {Object} Breakdown of max points by component
   */
  getScoreBreakdown() {
    const breakdown = {
      base: this.baseScore,
      total: this.baseScore,
    };

    this.strategies.forEach((strategy) => {
      breakdown[strategy.name.toLowerCase()] = strategy.maxPoints;
      breakdown.total += strategy.maxPoints;
    });

    return breakdown;
  }

  /**
   * Create default scorer with standard strategies
   *
   * Uses configuration from app-config.js for weights
   *
   * @static
   * @returns {CompositeScorer} Configured scorer
   */
  static createDefault() {
    const {
      DistanceScoringStrategy,
      RatingScoringStrategy,
      AffinityScoringStrategy,
      OpenNowScoringStrategy,
      FreeScoringStrategy,
      PopularityScoringStrategy,
      MusicGenreScoringStrategy,
      EVChargingBonusStrategy,
    } = require('./strategies');

    const weights = appConfig.scoring.weights;

    const scorer = new CompositeScorer(appConfig.scoring.baseScore);

    scorer
      .addStrategy(new DistanceScoringStrategy(weights.distance))
      .addStrategy(new RatingScoringStrategy(weights.rating))
      .addStrategy(new AffinityScoringStrategy(weights.affinity))
      .addStrategy(new OpenNowScoringStrategy(weights.openNow))
      .addStrategy(new FreeScoringStrategy(weights.freeEntry))
      .addStrategy(new PopularityScoringStrategy(weights.popularity))
      .addStrategy(new MusicGenreScoringStrategy(weights.musicGenre))
      .addStrategy(new EVChargingBonusStrategy(weights.evBonus));

    logger.info('Created default scorer', { maxScore: scorer.getMaxScore() });

    return scorer;
  }
}

module.exports = CompositeScorer;
