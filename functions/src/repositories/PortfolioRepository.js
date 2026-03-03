/**
 * Portfolio Repository
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Portfolio persistence only
 * - Open/Closed: Extends BaseRepository without modification
 *
 * Handles:
 * - User portfolios
 * - Holdings (stocks owned)
 * - Transactions history
 * - Performance tracking
 */

const BaseRepository = require('./BaseRepository');

class PortfolioRepository extends BaseRepository {
  constructor() {
    super('portfolios');
  }

  /**
   * Get user's portfolio
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Portfolio with holdings
   */
  async getPortfolio(userId) {
    const portfolio = await this.getById(userId);

    if (!portfolio) {
      // Create default portfolio
      return this.create(userId, {
        userId,
        holdings: [],
        transactions: [],
        cashBalance: 0,
        totalInvested: 0,
      });
    }

    return portfolio;
  }

  /**
   * Add holding to portfolio
   * @param {string} userId - User ID
   * @param {Object} holding - Holding to add
   * @returns {Promise<Object>} Updated portfolio
   */
  async addHolding(userId, holding) {
    const portfolio = await this.getPortfolio(userId);

    const existingIndex = portfolio.holdings.findIndex(
      (h) => h.symbol === holding.symbol.toUpperCase()
    );

    const holdingEntry = {
      symbol: holding.symbol.toUpperCase(),
      name: holding.name,
      shares: holding.shares,
      avgCost: holding.avgCost,
      sector: holding.sector || 'Unknown',
      addedAt: Date.now(),
    };

    if (existingIndex >= 0) {
      // Update existing - average cost calculation
      const existing = portfolio.holdings[existingIndex];
      const totalShares = existing.shares + holding.shares;
      const totalCost = existing.shares * existing.avgCost + holding.shares * holding.avgCost;
      const newAvgCost = totalCost / totalShares;

      portfolio.holdings[existingIndex] = {
        ...existing,
        shares: totalShares,
        avgCost: newAvgCost,
      };
    } else {
      portfolio.holdings.push(holdingEntry);
    }

    // Record transaction
    const transaction = {
      id: `${holding.symbol}-${Date.now()}`,
      type: 'BUY',
      symbol: holding.symbol.toUpperCase(),
      shares: holding.shares,
      price: holding.avgCost,
      total: holding.shares * holding.avgCost,
      date: Date.now(),
    };

    portfolio.transactions = portfolio.transactions || [];
    portfolio.transactions.unshift(transaction); // Most recent first

    // Update total invested
    portfolio.totalInvested = (portfolio.totalInvested || 0) + transaction.total;

    await this.update(userId, {
      holdings: portfolio.holdings,
      transactions: portfolio.transactions.slice(0, 100), // Keep last 100
      totalInvested: portfolio.totalInvested,
    });

    this.logger.info(`Added ${holding.shares} shares of ${holding.symbol}`, { userId });

    return portfolio;
  }

  /**
   * Sell holding from portfolio
   * @param {string} userId - User ID
   * @param {string} symbol - Stock symbol
   * @param {number} shares - Number of shares to sell
   * @param {number} price - Sell price per share
   * @returns {Promise<Object>} Updated portfolio
   */
  async sellHolding(userId, symbol, shares, price) {
    const portfolio = await this.getPortfolio(userId);

    const holdingIndex = portfolio.holdings.findIndex(
      (h) => h.symbol === symbol.toUpperCase()
    );

    if (holdingIndex < 0) {
      throw new Error(`No holding found for ${symbol}`);
    }

    const holding = portfolio.holdings[holdingIndex];

    if (shares > holding.shares) {
      throw new Error(`Cannot sell ${shares} shares, only own ${holding.shares}`);
    }

    const remainingShares = holding.shares - shares;

    if (remainingShares === 0) {
      // Remove holding completely
      portfolio.holdings.splice(holdingIndex, 1);
    } else {
      portfolio.holdings[holdingIndex].shares = remainingShares;
    }

    // Record transaction
    const transaction = {
      id: `${symbol}-${Date.now()}`,
      type: 'SELL',
      symbol: symbol.toUpperCase(),
      shares,
      price,
      total: shares * price,
      costBasis: shares * holding.avgCost,
      profit: shares * (price - holding.avgCost),
      date: Date.now(),
    };

    portfolio.transactions = portfolio.transactions || [];
    portfolio.transactions.unshift(transaction);

    // Update cash balance
    portfolio.cashBalance = (portfolio.cashBalance || 0) + transaction.total;

    await this.update(userId, {
      holdings: portfolio.holdings,
      transactions: portfolio.transactions.slice(0, 100),
      cashBalance: portfolio.cashBalance,
    });

    this.logger.info(`Sold ${shares} shares of ${symbol}`, { userId, profit: transaction.profit });

    return portfolio;
  }

  /**
   * Calculate portfolio performance
   * @param {string} userId - User ID
   * @param {Object} currentPrices - Map of symbol -> current price
   * @returns {Promise<Object>} Performance metrics
   */
  async calculatePerformance(userId, currentPrices) {
    const portfolio = await this.getPortfolio(userId);

    let totalCost = 0;
    let totalValue = 0;
    const holdingsWithPerformance = [];

    portfolio.holdings.forEach((holding) => {
      const currentPrice = currentPrices[holding.symbol];
      if (!currentPrice) return;

      const cost = holding.shares * holding.avgCost;
      const value = holding.shares * currentPrice;
      const profit = value - cost;
      const profitPercent = (profit / cost) * 100;

      totalCost += cost;
      totalValue += value;

      holdingsWithPerformance.push({
        ...holding,
        currentPrice,
        cost,
        value,
        profit,
        profitPercent,
        weight: 0, // Calculated after totals
      });
    });

    // Calculate weights
    holdingsWithPerformance.forEach((h) => {
      h.weight = totalValue > 0 ? (h.value / totalValue) * 100 : 0;
    });

    // Calculate sector weights
    const sectorWeights = {};
    holdingsWithPerformance.forEach((h) => {
      const sector = h.sector || 'Unknown';
      sectorWeights[sector] = (sectorWeights[sector] || 0) + h.weight;
    });

    const totalProfit = totalValue - totalCost;
    const totalReturn = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    return {
      totalCost,
      totalValue,
      totalProfit,
      totalReturn,
      cashBalance: portfolio.cashBalance || 0,
      totalPortfolioValue: totalValue + (portfolio.cashBalance || 0),
      holdings: holdingsWithPerformance,
      sectorWeights,
      holdingsCount: holdingsWithPerformance.length,
    };
  }

  /**
   * Get transaction history
   * @param {string} userId - User ID
   * @param {number} limit - Number of transactions
   * @returns {Promise<Array>} Transactions
   */
  async getTransactions(userId, limit = 50) {
    const portfolio = await this.getPortfolio(userId);
    return (portfolio.transactions || []).slice(0, limit);
  }

  /**
   * Get user preferences
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User preferences
   */
  async getUserPreferences(userId) {
    const portfolio = await this.getPortfolio(userId);
    return portfolio.preferences || {
      riskTolerance: 'moderate',
      timeHorizon: 'medium_term',
      sectorAffinities: {},
    };
  }

  /**
   * Save user preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - Preferences to save
   * @returns {Promise<Object>} Updated portfolio
   */
  async saveUserPreferences(userId, preferences) {
    await this.merge(userId, { preferences });
    this.logger.info(`Saved preferences for user`, { userId });
    return this.getPortfolio(userId);
  }
}

module.exports = PortfolioRepository;
