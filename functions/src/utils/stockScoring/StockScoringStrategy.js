/**
 * Stock Scoring Strategy Base Class
 *
 * SOLID Principles:
 * - Single Responsibility: Each strategy calculates one analysis dimension
 * - Open/Closed: Add new strategies without modifying existing ones
 * - Liskov Substitution: All strategies are interchangeable
 * - Interface Segregation: Simple, focused interface
 *
 * Inspired by Wall Street Analysis Frameworks:
 * 1. Goldman Sachs Screener (Valuation)
 * 2. Morgan Stanley DCF (Intrinsic Value)
 * 3. Bridgewater Risk (Risk Assessment)
 * 4. JPMorgan Earnings (Earnings Quality)
 * 5. BlackRock Portfolio (Portfolio Fit)
 * 6. Citadel Technical (Technical Timing)
 * 7. Harvard Dividend (Dividend Quality)
 * 8. Bain Competitive (Competitive Position)
 * 9. Renaissance Pattern (Statistical Edge)
 * 10. McKinsey Macro (Macro Alignment)
 * + Sector Affinity (User Preferences)
 */

const { createLogger } = require('../logger');

const logger = createLogger('STOCK_SCORING_STRATEGY');

class StockScoringStrategy {
  /**
   * @param {string} name - Strategy name for logging
   * @param {number} maxPoints - Maximum points this strategy can award
   * @param {string} description - Human-readable description
   */
  constructor(name, maxPoints, description = '') {
    this.name = name;
    this.maxPoints = maxPoints;
    this.description = description;
  }

  /**
   * Calculate score for a stock
   *
   * @param {Object} stock - Stock data with metrics
   * @param {Object} context - Scoring context (user preferences, market data)
   * @returns {Object} Score result with points and reasoning
   * @abstract
   */
  calculate(stock, context) {
    throw new Error(`${this.name}: calculate() must be implemented by subclass`);
  }

  /**
   * Normalize a value to 0-1 range
   * @protected
   */
  normalize(value, max = 100) {
    if (value === null || value === undefined) return 0.5;
    return Math.max(0, Math.min(1, value / max));
  }

  /**
   * Scale a normalized value to points
   * @protected
   */
  scaleToPoints(normalizedValue) {
    return Math.round(normalizedValue * this.maxPoints);
  }

  /**
   * Calculate percentile rank
   * @protected
   */
  percentileRank(value, benchmarks) {
    if (!benchmarks || benchmarks.length === 0) return 50;
    const sorted = [...benchmarks].sort((a, b) => a - b);
    const index = sorted.findIndex((b) => value <= b);
    if (index === -1) return 100;
    return Math.round((index / sorted.length) * 100);
  }

  /**
   * Log scoring details for debugging
   * @protected
   */
  logScore(stockSymbol, score, details = {}) {
    logger.debug(`${this.name} scored ${stockSymbol}`, {
      score,
      maxPoints: this.maxPoints,
      ...details,
    });
  }

  /**
   * Get strategy metadata
   */
  getMetadata() {
    return {
      name: this.name,
      maxPoints: this.maxPoints,
      description: this.description,
    };
  }
}

module.exports = StockScoringStrategy;
