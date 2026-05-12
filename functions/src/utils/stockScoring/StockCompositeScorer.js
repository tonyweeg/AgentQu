/**
 * Stock Composite Scorer
 *
 * Combines all 11 scoring strategies into a unified score
 * Follows the Composite and Strategy patterns
 *
 * SOLID Principles:
 * - Single Responsibility: Orchestrates scoring strategies
 * - Open/Closed: Add new strategies without modifying this class
 * - Dependency Inversion: Depends on StockScoringStrategy abstraction
 *
 * Total Range: 100 (base) + 205 (strategies) = 305 max points
 */

const { createLogger } = require('../logger');

const logger = createLogger('STOCK_COMPOSITE_SCORER');

class StockCompositeScorer {
  /**
   * @param {number} baseScore - Base score awarded to all stocks
   */
  constructor(baseScore = 100) {
    this.baseScore = baseScore;
    this.strategies = [];
  }

  /**
   * Add a scoring strategy
   *
   * @param {StockScoringStrategy} strategy - Strategy to add
   * @returns {StockCompositeScorer} this (for chaining)
   */
  addStrategy(strategy) {
    this.strategies.push(strategy);
    return this;
  }

  /**
   * Remove a strategy by name
   *
   * @param {string} strategyName - Name of strategy to remove
   * @returns {StockCompositeScorer} this (for chaining)
   */
  removeStrategy(strategyName) {
    this.strategies = this.strategies.filter((s) => s.name !== strategyName);
    return this;
  }

  /**
   * Calculate composite score for a stock
   *
   * @param {Object} stock - Stock data with metrics
   * @param {Object} context - Scoring context
   * @param {Object} context.userPreferences - User risk tolerance, sectors, time horizon
   * @param {Object} context.macroData - FRED macro economic data
   * @param {Object} context.portfolio - User's current portfolio for fit analysis
   * @returns {Object} Scoring result with total, breakdown, and recommendations
   */
  calculate(stock, context = {}) {
    const breakdown = {
      base: this.baseScore,
    };

    const signals = {};
    const allReasons = [];
    let totalBonus = 0;

    // Calculate each strategy's score
    this.strategies.forEach((strategy) => {
      try {
        const result = strategy.calculate(stock, context);
        const score = result.points || 0;

        breakdown[strategy.name.toLowerCase()] = score;
        signals[strategy.name.toLowerCase()] = result.signal;
        totalBonus += score;

        // Collect top reasons
        if (result.reasons && result.reasons.length > 0) {
          allReasons.push({
            strategy: strategy.name,
            reasons: result.reasons.slice(0, 2), // Top 2 reasons per strategy
          });
        }
      } catch (error) {
        logger.error(`Strategy ${strategy.name} failed for stock ${stock.symbol}`, error);
        breakdown[strategy.name.toLowerCase()] = 0;
        signals[strategy.name.toLowerCase()] = 'error';
      }
    });

    const total = Math.round(this.baseScore + totalBonus);
    const maxPossible = this.getMaxScore();
    const percentile = Math.round((total / maxPossible) * 100);

    // Determine overall recommendation
    const recommendation = this._getRecommendation(total, maxPossible, signals);

    // Calculate confidence based on signal alignment
    const confidence = this._calculateConfidence(signals);

    logger.debug(`Scored ${stock.symbol}`, {
      total,
      maxPossible,
      percentile,
      recommendation: recommendation.action,
    });

    return {
      symbol: stock.symbol,
      total,
      maxPossible,
      percentile,
      breakdown,
      signals,
      recommendation,
      confidence,
      topReasons: allReasons,
    };
  }

  /**
   * Calculate scores for multiple stocks
   *
   * @param {Array} stocks - Stocks to score
   * @param {Object} context - Scoring context
   * @returns {Array} Stocks with scores added and sorted
   */
  calculateBatch(stocks, context = {}) {
    logger.info(`Scoring ${stocks.length} stocks`);

    const scored = stocks.map((stock) => {
      const result = this.calculate(stock, context);
      return {
        ...stock,
        score: result.total,
        scoreData: result,
      };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    return scored;
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
   * Get strategy descriptions for UI
   *
   * @returns {Array} Strategy metadata
   */
  getStrategyDescriptions() {
    return this.strategies.map((strategy) => strategy.getMetadata());
  }

  /**
   * Determine overall recommendation
   * @private
   */
  _getRecommendation(total, maxPossible, signals) {
    const percentile = (total / maxPossible) * 100;

    // Count bullish vs bearish signals
    let bullishCount = 0;
    let bearishCount = 0;

    Object.values(signals).forEach((signal) => {
      if (
        ['undervalued', 'low_risk', 'high_quality', 'strong_buy', 'buy', 'macro_aligned', 'perfect_fit', 'wide_moat', 'statistical_opportunity', 'dividend_champion'].includes(
          signal
        )
      ) {
        bullishCount++;
      } else if (['overvalued', 'high_risk', 'low_quality', 'sell', 'strong_sell', 'macro_headwind', 'no_moat', 'poor_fit'].includes(signal)) {
        bearishCount++;
      }
    });

    if (percentile >= 70 && bullishCount >= 6) {
      return {
        action: 'STRONG_BUY',
        label: 'Strong Buy',
        color: 'green',
        description: 'Multiple bullish signals align',
      };
    } else if (percentile >= 60 && bullishCount >= 4) {
      return {
        action: 'BUY',
        label: 'Buy',
        color: 'lightgreen',
        description: 'Favorable risk/reward',
      };
    } else if (percentile >= 45 || (bullishCount > bearishCount && percentile >= 40)) {
      return {
        action: 'HOLD',
        label: 'Hold',
        color: 'yellow',
        description: 'Mixed signals - monitor',
      };
    } else if (percentile >= 30) {
      return {
        action: 'SELL',
        label: 'Sell',
        color: 'orange',
        description: 'Unfavorable conditions',
      };
    } else {
      return {
        action: 'STRONG_SELL',
        label: 'Strong Sell',
        color: 'red',
        description: 'Multiple red flags',
      };
    }
  }

  /**
   * Calculate confidence level based on signal alignment
   * @private
   */
  _calculateConfidence(signals) {
    const signalValues = Object.values(signals);
    const total = signalValues.length;

    // Count how many signals agree (same direction)
    const bullish = signalValues.filter((s) =>
      ['undervalued', 'low_risk', 'high_quality', 'strong_buy', 'buy', 'macro_aligned', 'perfect_fit', 'wide_moat', 'excellent_fit', 'dividend_champion'].includes(s)
    ).length;

    const bearish = signalValues.filter((s) =>
      ['overvalued', 'high_risk', 'low_quality', 'sell', 'strong_sell', 'macro_headwind', 'no_moat', 'poor_fit'].includes(s)
    ).length;

    const aligned = Math.max(bullish, bearish);
    const alignmentRate = aligned / total;

    if (alignmentRate >= 0.7) {
      return { level: 'high', score: 90, label: 'High confidence' };
    } else if (alignmentRate >= 0.5) {
      return { level: 'medium', score: 70, label: 'Medium confidence' };
    } else {
      return { level: 'low', score: 50, label: 'Mixed signals - low confidence' };
    }
  }

  /**
   * Create default scorer with all strategies
   *
   * @static
   * @returns {StockCompositeScorer} Configured scorer
   */
  static createDefault() {
    const {
      ValuationScoringStrategy,
      IntrinsicValueScoringStrategy,
      RiskAssessmentScoringStrategy,
      EarningsQualityScoringStrategy,
      PortfolioFitScoringStrategy,
      TechnicalTimingScoringStrategy,
      DividendQualityScoringStrategy,
      CompetitivePositionScoringStrategy,
      StatisticalEdgeScoringStrategy,
      MacroAlignmentScoringStrategy,
      SectorAffinityScoringStrategy,
    } = require('./strategies');

    const scorer = new StockCompositeScorer(100);

    scorer
      // Core Valuation (50 points)
      .addStrategy(new ValuationScoringStrategy(25))
      .addStrategy(new IntrinsicValueScoringStrategy(25))
      // Risk & Quality (40 points)
      .addStrategy(new RiskAssessmentScoringStrategy(20))
      .addStrategy(new EarningsQualityScoringStrategy(20))
      // Technical & Timing (35 points)
      .addStrategy(new TechnicalTimingScoringStrategy(20))
      .addStrategy(new StatisticalEdgeScoringStrategy(15))
      // Strategic Position (30 points)
      .addStrategy(new CompetitivePositionScoringStrategy(15))
      .addStrategy(new PortfolioFitScoringStrategy(15))
      // Income & Growth (30 points)
      .addStrategy(new DividendQualityScoringStrategy(15))
      .addStrategy(new MacroAlignmentScoringStrategy(15))
      // User Preference (20 points)
      .addStrategy(new SectorAffinityScoringStrategy(20));

    logger.info('Created stock scorer', { maxScore: scorer.getMaxScore() });

    return scorer;
  }

  /**
   * Create a focused scorer for specific analysis type
   *
   * @param {string} focus - 'value', 'growth', 'income', 'momentum', 'safety'
   * @returns {StockCompositeScorer} Focused scorer
   */
  static createFocused(focus) {
    const {
      ValuationScoringStrategy,
      IntrinsicValueScoringStrategy,
      RiskAssessmentScoringStrategy,
      EarningsQualityScoringStrategy,
      PortfolioFitScoringStrategy,
      TechnicalTimingScoringStrategy,
      DividendQualityScoringStrategy,
      CompetitivePositionScoringStrategy,
      StatisticalEdgeScoringStrategy,
      MacroAlignmentScoringStrategy,
    } = require('./strategies');

    const scorer = new StockCompositeScorer(100);

    switch (focus) {
      case 'value':
        scorer
          .addStrategy(new ValuationScoringStrategy(40))
          .addStrategy(new IntrinsicValueScoringStrategy(35))
          .addStrategy(new RiskAssessmentScoringStrategy(15))
          .addStrategy(new DividendQualityScoringStrategy(10));
        break;

      case 'growth':
        scorer
          .addStrategy(new EarningsQualityScoringStrategy(35))
          .addStrategy(new IntrinsicValueScoringStrategy(30))
          .addStrategy(new CompetitivePositionScoringStrategy(20))
          .addStrategy(new TechnicalTimingScoringStrategy(15));
        break;

      case 'income':
        scorer
          .addStrategy(new DividendQualityScoringStrategy(40))
          .addStrategy(new RiskAssessmentScoringStrategy(25))
          .addStrategy(new CompetitivePositionScoringStrategy(20))
          .addStrategy(new ValuationScoringStrategy(15));
        break;

      case 'momentum':
        scorer
          .addStrategy(new TechnicalTimingScoringStrategy(40))
          .addStrategy(new StatisticalEdgeScoringStrategy(30))
          .addStrategy(new EarningsQualityScoringStrategy(20))
          .addStrategy(new MacroAlignmentScoringStrategy(10));
        break;

      case 'safety':
        scorer
          .addStrategy(new RiskAssessmentScoringStrategy(40))
          .addStrategy(new DividendQualityScoringStrategy(25))
          .addStrategy(new CompetitivePositionScoringStrategy(20))
          .addStrategy(new PortfolioFitScoringStrategy(15));
        break;

      default:
        return StockCompositeScorer.createDefault();
    }

    logger.info(`Created ${focus} scorer`, { maxScore: scorer.getMaxScore() });
    return scorer;
  }
}

module.exports = StockCompositeScorer;
