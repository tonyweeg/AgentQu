/**
 * Stock Service (Main Orchestrator)
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Stock discovery orchestration
 * - Dependency Inversion: Depends on fetcher and scoring service abstractions
 * - Open/Closed: Extensible through configuration
 *
 * Handles:
 * - Stock discovery orchestration
 * - Data fetching coordination
 * - Scoring and ranking
 * - User interactions (watchlist, portfolio)
 */

const StockDataFetcherService = require('./StockDataFetcherService');
const StockScoringService = require('./StockScoringService');
const WatchlistRepository = require('../../repositories/WatchlistRepository');
const PortfolioRepository = require('../../repositories/PortfolioRepository');
const { createLogger } = require('../../utils/logger');

class StockService {
  constructor() {
    this.dataFetcher = new StockDataFetcherService();
    this.scoringService = new StockScoringService();
    this.watchlistRepo = new WatchlistRepository();
    this.portfolioRepo = new PortfolioRepository();
    this.logger = createLogger('STOCK_SERVICE');
  }

  /**
   * Discover and rank stocks for a user
   * @param {Object} params - Discovery parameters
   * @param {string} params.userId - User ID for personalization
   * @param {Array<string>} params.symbols - Specific symbols to analyze
   * @param {Object} params.criteria - Screening criteria
   * @param {string} params.focus - Analysis focus (value, growth, etc.)
   * @param {number} params.limit - Max results
   * @returns {Promise<Object>} Discovery results
   */
  async discoverStocks(params = {}) {
    const startTime = Date.now();

    try {
      const {
        userId = null,
        symbols = [],
        criteria = {},
        focus = null,
        limit = 20,
      } = params;

      this.logger.info('Discovering stocks', { userId, symbolCount: symbols.length, focus });

      // If no symbols provided, use default popular stocks
      const targetSymbols = symbols.length > 0 ? symbols : await this._getDefaultSymbols();

      // Build scoring context (user preferences + macro data)
      const macroData = await this.dataFetcher.fetchMacroData();
      const context = await this.scoringService.buildUserContext(userId, macroData);

      // Fetch all stock data
      const stocks = await this.dataFetcher.fetchMultipleStocks(targetSymbols);

      // Apply screening criteria
      let filteredStocks = this.scoringService.screenStocks(stocks, criteria);

      // Score and rank stocks
      const scoredStocks = this.scoringService.scoreAndRankStocks(filteredStocks, context);

      // Apply limit
      const topStocks = scoredStocks.slice(0, limit);

      const queryTime = Date.now() - startTime;

      this.logger.info('Discovery complete', {
        totalAnalyzed: stocks.length,
        passedScreen: filteredStocks.length,
        returned: topStocks.length,
        queryTime,
      });

      return {
        success: true,
        stocks: topStocks,
        metadata: {
          totalAnalyzed: stocks.length,
          passedScreen: filteredStocks.length,
          returned: topStocks.length,
          queryTimeMs: queryTime,
          macroScore: macroData?.macroScore,
          macroSignal: macroData?.macroSignal,
        },
      };
    } catch (error) {
      this.logger.error('Discovery failed', error);
      throw error;
    }
  }

  /**
   * Analyze a single stock in depth
   * @param {string} symbol - Stock symbol
   * @param {string} userId - User ID for personalization
   * @returns {Promise<Object>} Complete analysis
   */
  async analyzeStock(symbol, userId = null) {
    const startTime = Date.now();

    try {
      this.logger.info(`Analyzing ${symbol}`, { userId });

      // Fetch comprehensive data
      const [stockData, technicalData, insiderData, newsData, macroData] = await Promise.all([
        this.dataFetcher.fetchStockData(symbol),
        this.dataFetcher.fetchTechnicalData(symbol),
        this.dataFetcher.fetchInsiderData(symbol),
        this.dataFetcher.fetchNews(symbol, 7),
        this.dataFetcher.fetchMacroData(),
      ]);

      // Add technical data to stock
      stockData.technical = technicalData;
      stockData.insider = insiderData;
      stockData.news = newsData;

      // Build context and score
      const context = await this.scoringService.buildUserContext(userId, macroData);
      const scoreData = this.scoringService.scoreStock(stockData, context);
      const explanation = this.scoringService.explainScore(scoreData);

      const queryTime = Date.now() - startTime;

      return {
        success: true,
        stock: stockData,
        analysis: {
          score: scoreData,
          explanation,
          modules: this._formatModules(scoreData),
        },
        macro: {
          score: macroData?.macroScore,
          signal: macroData?.macroSignal,
          cyclePhase: macroData?.cyclePhase,
        },
        metadata: {
          queryTimeMs: queryTime,
          lastUpdated: Date.now(),
        },
      };
    } catch (error) {
      this.logger.error(`Analysis failed for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Search for stocks
   * @param {string} query - Search query
   * @returns {Promise<Array>} Search results
   */
  async searchStocks(query) {
    return this.dataFetcher.searchStocks(query);
  }

  /**
   * Get market overview
   * @returns {Promise<Object>} Market data
   */
  async getMarketOverview() {
    const [marketData, macroData] = await Promise.all([
      this.dataFetcher.getMarketOverview(),
      this.dataFetcher.fetchMacroData(),
    ]);

    return {
      success: true,
      market: marketData,
      macro: macroData,
    };
  }

  /**
   * Get user's watchlist with current data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Watchlist with current prices
   */
  async getWatchlist(userId) {
    const watchlist = await this.watchlistRepo.getWatchlist(userId);

    if (!watchlist.stocks || watchlist.stocks.length === 0) {
      return {
        success: true,
        watchlist: {
          ...watchlist,
          stocks: [],
        },
      };
    }

    // Fetch current data for watchlist stocks
    const symbols = watchlist.stocks.map((s) => s.symbol);
    const stocksData = await this.dataFetcher.fetchMultipleStocks(symbols);

    // Merge with watchlist data
    const enrichedStocks = watchlist.stocks.map((wlStock) => {
      const currentData = stocksData.find((s) => s.symbol === wlStock.symbol);

      return {
        ...wlStock,
        currentPrice: currentData?.quote?.regularMarketPrice,
        priceChange: currentData?.quote?.regularMarketChange,
        priceChangePercent: currentData?.quote?.regularMarketChangePercent,
        changeFromAdded: wlStock.addedPrice
          ? ((currentData?.quote?.regularMarketPrice - wlStock.addedPrice) / wlStock.addedPrice) * 100
          : null,
      };
    });

    return {
      success: true,
      watchlist: {
        ...watchlist,
        stocks: enrichedStocks,
      },
    };
  }

  /**
   * Add stock to watchlist
   * @param {string} userId - User ID
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Updated watchlist
   */
  async addToWatchlist(userId, symbol) {
    // Get current stock data
    const stockData = await this.dataFetcher.fetchStockData(symbol);

    const stock = {
      symbol: symbol.toUpperCase(),
      name: stockData.profile?.name || stockData.quote?.shortName,
      price: stockData.quote?.regularMarketPrice,
    };

    return this.watchlistRepo.addStock(userId, stock);
  }

  /**
   * Remove stock from watchlist
   * @param {string} userId - User ID
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Updated watchlist
   */
  async removeFromWatchlist(userId, symbol) {
    return this.watchlistRepo.removeStock(userId, symbol);
  }

  /**
   * Get user's portfolio with performance
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Portfolio with performance
   */
  async getPortfolio(userId) {
    const portfolio = await this.portfolioRepo.getPortfolio(userId);

    if (!portfolio.holdings || portfolio.holdings.length === 0) {
      return {
        success: true,
        portfolio: {
          ...portfolio,
          performance: {
            totalCost: 0,
            totalValue: 0,
            totalProfit: 0,
            totalReturn: 0,
          },
        },
      };
    }

    // Fetch current prices
    const symbols = portfolio.holdings.map((h) => h.symbol);
    const stocksData = await this.dataFetcher.fetchMultipleStocks(symbols);

    // Build price map
    const currentPrices = {};
    stocksData.forEach((s) => {
      if (s.quote?.regularMarketPrice) {
        currentPrices[s.symbol] = s.quote.regularMarketPrice;
      }
    });

    // Calculate performance
    const performance = await this.portfolioRepo.calculatePerformance(userId, currentPrices);

    return {
      success: true,
      portfolio: {
        ...portfolio,
        performance,
      },
    };
  }

  /**
   * Add holding to portfolio
   * @param {string} userId - User ID
   * @param {Object} holding - Holding data
   * @returns {Promise<Object>} Updated portfolio
   */
  async addToPortfolio(userId, holding) {
    // Get current stock data for sector info
    const stockData = await this.dataFetcher.fetchStockData(holding.symbol);

    const enrichedHolding = {
      ...holding,
      name: holding.name || stockData.profile?.name || stockData.quote?.shortName,
      sector: holding.sector || stockData.profile?.industry,
    };

    return this.portfolioRepo.addHolding(userId, enrichedHolding);
  }

  /**
   * Sell holding from portfolio
   * @param {string} userId - User ID
   * @param {string} symbol - Stock symbol
   * @param {number} shares - Shares to sell
   * @param {number} price - Sell price
   * @returns {Promise<Object>} Updated portfolio
   */
  async sellFromPortfolio(userId, symbol, shares, price) {
    return this.portfolioRepo.sellHolding(userId, symbol, shares, price);
  }

  /**
   * Save user preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - Preferences to save
   * @returns {Promise<Object>} Updated portfolio
   */
  async saveUserPreferences(userId, preferences) {
    return this.portfolioRepo.saveUserPreferences(userId, preferences);
  }

  /**
   * Get user preferences
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User preferences
   */
  async getUserPreferences(userId) {
    return this.portfolioRepo.getUserPreferences(userId);
  }

  /**
   * Get default stock symbols for discovery
   * @private
   */
  async _getDefaultSymbols() {
    // Popular stocks across sectors
    return [
      // Technology
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA',
      // Finance
      'JPM', 'BAC', 'GS', 'V', 'MA',
      // Healthcare
      'JNJ', 'UNH', 'PFE', 'ABBV',
      // Consumer
      'WMT', 'PG', 'KO', 'PEP', 'MCD',
      // Industrial
      'CAT', 'HON', 'UPS',
      // Energy
      'XOM', 'CVX',
    ];
  }

  /**
   * Format score modules for display
   * @private
   */
  _formatModules(scoreData) {
    const modules = [];
    const strategies = [
      { key: 'valuation', name: 'Goldman Sachs Screener', subtitle: 'Valuation Analysis' },
      { key: 'intrinsicvalue', name: 'Morgan Stanley DCF', subtitle: 'Intrinsic Value' },
      { key: 'riskassessment', name: 'Bridgewater Risk', subtitle: 'Risk Assessment' },
      { key: 'earningsquality', name: 'JPMorgan Earnings', subtitle: 'Earnings Quality' },
      { key: 'portfoliofit', name: 'BlackRock Portfolio', subtitle: 'Portfolio Fit' },
      { key: 'technicaltiming', name: 'Citadel Technical', subtitle: 'Technical Timing' },
      { key: 'dividendquality', name: 'Harvard Dividend', subtitle: 'Dividend Quality' },
      { key: 'competitiveposition', name: 'Bain Competitive', subtitle: 'Competitive Position' },
      { key: 'statisticaledge', name: 'Renaissance Pattern', subtitle: 'Statistical Edge' },
      { key: 'macroalignment', name: 'McKinsey Macro', subtitle: 'Macro Alignment' },
    ];

    strategies.forEach((s) => {
      const score = scoreData.breakdown[s.key] || 0;
      const signal = scoreData.signals[s.key] || 'neutral';

      // Find reasons for this strategy
      const reasons = scoreData.topReasons.find((r) => r.strategy.toLowerCase() === s.key);

      modules.push({
        key: s.key,
        name: s.name,
        subtitle: s.subtitle,
        score,
        signal,
        reasons: reasons?.reasons || [],
      });
    });

    return modules;
  }
}

module.exports = StockService;
