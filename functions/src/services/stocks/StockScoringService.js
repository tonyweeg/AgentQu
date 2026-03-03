/**
 * Stock Scoring Service
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Stock scoring orchestration only
 * - Dependency Inversion: Depends on scoring strategy abstractions
 *
 * Handles:
 * - Scoring stock data using 11 strategies
 * - Building scoring context from user data and macro
 * - Ranking and filtering stocks
 */

const { StockCompositeScorer } = require('../../utils/stockScoring');
const PortfolioRepository = require('../../repositories/PortfolioRepository');
const { createLogger } = require('../../utils/logger');

class StockScoringService {
  constructor() {
    this.portfolioRepo = new PortfolioRepository();
    this.logger = createLogger('STOCK_SCORING_SERVICE');
  }

  /**
   * Score a single stock
   * @param {Object} stock - Stock data from fetcher
   * @param {Object} context - Scoring context
   * @returns {Object} Scored stock with breakdown
   */
  scoreStock(stock, context = {}) {
    const scorer = StockCompositeScorer.createDefault();
    return scorer.calculate(stock, context);
  }

  /**
   * Score a single stock with focused analysis
   * @param {Object} stock - Stock data
   * @param {string} focus - 'value', 'growth', 'income', 'momentum', 'safety'
   * @param {Object} context - Scoring context
   * @returns {Object} Scored stock
   */
  scoreStockFocused(stock, focus, context = {}) {
    const scorer = StockCompositeScorer.createFocused(focus);
    return scorer.calculate(stock, context);
  }

  /**
   * Score multiple stocks and rank them
   * @param {Array} stocks - Array of stock data
   * @param {Object} context - Scoring context
   * @returns {Array} Scored and ranked stocks
   */
  scoreAndRankStocks(stocks, context = {}) {
    const scorer = StockCompositeScorer.createDefault();
    return scorer.calculateBatch(stocks, context);
  }

  /**
   * Build scoring context for a user
   * @param {string} userId - User ID
   * @param {Object} macroData - FRED macro data
   * @returns {Promise<Object>} Complete scoring context
   */
  async buildUserContext(userId, macroData = null) {
    const context = {
      macroData: macroData || {},
      userPreferences: {},
      portfolio: null,
    };

    if (userId) {
      try {
        // Get user preferences
        const preferences = await this.portfolioRepo.getUserPreferences(userId);
        context.userPreferences = preferences;

        // Get portfolio for portfolio fit analysis
        const portfolio = await this.portfolioRepo.getPortfolio(userId);
        if (portfolio && portfolio.holdings.length > 0) {
          // Calculate sector weights
          const sectorWeights = {};
          portfolio.holdings.forEach((h) => {
            const sector = h.sector || 'Unknown';
            sectorWeights[sector] = (sectorWeights[sector] || 0) + 1;
          });

          // Normalize to percentages
          const total = Object.values(sectorWeights).reduce((a, b) => a + b, 0);
          Object.keys(sectorWeights).forEach((sector) => {
            sectorWeights[sector] = (sectorWeights[sector] / total) * 100;
          });

          context.portfolio = {
            holdings: portfolio.holdings,
            sectorWeights,
          };
        }
      } catch (error) {
        this.logger.error('Failed to build user context', error);
      }
    }

    return context;
  }

  /**
   * Screen stocks based on criteria
   * @param {Array} stocks - Stocks to screen
   * @param {Object} criteria - Screening criteria
   * @returns {Array} Stocks passing criteria
   */
  screenStocks(stocks, criteria = {}) {
    let filtered = [...stocks];

    // P/E ratio filter
    if (criteria.maxPE) {
      filtered = filtered.filter(
        (s) => s.metrics?.peRatio && s.metrics.peRatio > 0 && s.metrics.peRatio <= criteria.maxPE
      );
    }

    if (criteria.minPE) {
      filtered = filtered.filter(
        (s) => s.metrics?.peRatio && s.metrics.peRatio >= criteria.minPE
      );
    }

    // Dividend yield filter
    if (criteria.minDividendYield) {
      filtered = filtered.filter(
        (s) => s.metrics?.dividendYield && s.metrics.dividendYield >= criteria.minDividendYield
      );
    }

    // Market cap filter
    if (criteria.minMarketCap) {
      filtered = filtered.filter(
        (s) => s.quote?.marketCap && s.quote.marketCap >= criteria.minMarketCap
      );
    }

    if (criteria.maxMarketCap) {
      filtered = filtered.filter(
        (s) => s.quote?.marketCap && s.quote.marketCap <= criteria.maxMarketCap
      );
    }

    // Beta filter
    if (criteria.maxBeta) {
      filtered = filtered.filter(
        (s) => s.metrics?.beta && s.metrics.beta <= criteria.maxBeta
      );
    }

    // ROE filter
    if (criteria.minROE) {
      filtered = filtered.filter(
        (s) => s.metrics?.roe && s.metrics.roe >= criteria.minROE
      );
    }

    // Debt to equity filter
    if (criteria.maxDebtToEquity) {
      filtered = filtered.filter(
        (s) => !s.metrics?.debtToEquity || s.metrics.debtToEquity <= criteria.maxDebtToEquity
      );
    }

    // Sector filter
    if (criteria.sectors && criteria.sectors.length > 0) {
      const sectors = criteria.sectors.map((s) => s.toLowerCase());
      filtered = filtered.filter(
        (s) => s.profile?.industry && sectors.some((sector) =>
          s.profile.industry.toLowerCase().includes(sector)
        )
      );
    }

    this.logger.info(`Screened stocks: ${stocks.length} -> ${filtered.length}`, { criteria });

    return filtered;
  }

  /**
   * Get top stocks by category
   * @param {Array} scoredStocks - Already scored stocks
   * @param {number} count - Number per category
   * @returns {Object} Stocks by category
   */
  getTopStocksByCategory(scoredStocks, count = 5) {
    // Sort by total score
    const sorted = [...scoredStocks].sort((a, b) => b.score - a.score);

    // Get top overall
    const topOverall = sorted.slice(0, count);

    // Get top by individual strategy scores
    const topByStrategy = {};

    ['valuation', 'intrinsicvalue', 'riskassessment', 'earningsquality', 'technicaltiming', 'dividendquality'].forEach((strategy) => {
      const sortedByStrategy = [...scoredStocks].sort((a, b) => {
        const scoreA = a.scoreData?.breakdown?.[strategy] || 0;
        const scoreB = b.scoreData?.breakdown?.[strategy] || 0;
        return scoreB - scoreA;
      });
      topByStrategy[strategy] = sortedByStrategy.slice(0, count);
    });

    return {
      topOverall,
      topValue: topByStrategy.valuation,
      topGrowth: topByStrategy.earningsquality,
      topIncome: topByStrategy.dividendquality,
      topMomentum: topByStrategy.technicaltiming,
      topSafety: topByStrategy.riskassessment,
    };
  }

  /**
   * Get score explanation for a stock
   * @param {Object} scoreData - Scoring result
   * @returns {Object} Human-readable explanation
   */
  explainScore(scoreData) {
    const { total, maxPossible, percentile, breakdown, signals, recommendation, topReasons } = scoreData;

    // Determine strengths and weaknesses
    const avgScore = total / Object.keys(breakdown).length;

    const strengths = [];
    const weaknesses = [];

    Object.entries(breakdown).forEach(([strategy, score]) => {
      if (strategy === 'base') return;

      const strategyMax = this._getStrategyMax(strategy);
      const strategyPercent = (score / strategyMax) * 100;

      if (strategyPercent >= 70) {
        strengths.push({
          strategy: this._formatStrategyName(strategy),
          score,
          maxScore: strategyMax,
          signal: signals[strategy],
        });
      } else if (strategyPercent < 40) {
        weaknesses.push({
          strategy: this._formatStrategyName(strategy),
          score,
          maxScore: strategyMax,
          signal: signals[strategy],
        });
      }
    });

    return {
      summary: `Score: ${total}/${maxPossible} (${percentile}th percentile)`,
      recommendation: recommendation.label,
      recommendationDescription: recommendation.description,
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 3),
      topReasons: topReasons.slice(0, 5),
    };
  }

  /**
   * Get strategy max score (default values)
   * @private
   */
  _getStrategyMax(strategy) {
    const maxScores = {
      valuation: 25,
      intrinsicvalue: 25,
      riskassessment: 20,
      earningsquality: 20,
      portfoliofit: 15,
      technicaltiming: 20,
      dividendquality: 15,
      competitiveposition: 15,
      statisticaledge: 15,
      macroalignment: 15,
      sectoraffinity: 20,
    };
    return maxScores[strategy] || 15;
  }

  /**
   * Format strategy name for display
   * @private
   */
  _formatStrategyName(strategy) {
    const names = {
      valuation: 'Valuation (Goldman)',
      intrinsicvalue: 'Intrinsic Value (Morgan Stanley)',
      riskassessment: 'Risk Assessment (Bridgewater)',
      earningsquality: 'Earnings Quality (JPMorgan)',
      portfoliofit: 'Portfolio Fit (BlackRock)',
      technicaltiming: 'Technical Timing (Citadel)',
      dividendquality: 'Dividend Quality (Harvard)',
      competitiveposition: 'Competitive Position (Bain)',
      statisticaledge: 'Statistical Edge (Renaissance)',
      macroalignment: 'Macro Alignment (McKinsey)',
      sectoraffinity: 'Sector Preference',
    };
    return names[strategy] || strategy;
  }
}

module.exports = StockScoringService;
