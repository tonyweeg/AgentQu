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
   * @param {string} params.mode - Discovery mode: 'trending', 'bluechip', 'gainers', 'losers'
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
        mode = 'trending', // Default to dynamic trending
        limit = 20,
      } = params;

      this.logger.info('Discovering stocks', { userId, symbolCount: symbols.length, focus, mode });

      // Get symbols based on mode
      let targetSymbols;
      if (symbols.length > 0) {
        targetSymbols = symbols;
      } else {
        targetSymbols = await this._getSymbolsByMode(mode);
      }

      // Build scoring context (user preferences + macro data)
      const macroData = await this.dataFetcher.fetchMacroData();
      const context = await this.scoringService.buildUserContext(userId, macroData);

      // Fetch all stock data
      const stocks = await this.dataFetcher.fetchMultipleStocks(targetSymbols);

      // Apply screening criteria
      let filteredStocks = this.scoringService.screenStocks(stocks, criteria);

      // Score stocks (always calculate scores for analysis)
      const scoredStocks = this.scoringService.scoreAndRankStocks(filteredStocks, context);

      // Sort based on mode - gainers/losers should sort by % change, not score
      let sortedStocks;
      if (mode === 'gainers') {
        // Sort by biggest gain (highest positive %)
        sortedStocks = [...scoredStocks].sort((a, b) => {
          const changeA = a.quote?.regularMarketChangePercent || 0;
          const changeB = b.quote?.regularMarketChangePercent || 0;
          return changeB - changeA; // Descending (biggest gainers first)
        });
        this.logger.info('Sorted gainers by % change', {
          top3: sortedStocks.slice(0, 3).map(s => `${s.symbol}: ${s.quote?.regularMarketChangePercent?.toFixed(2)}%`)
        });
      } else if (mode === 'losers') {
        // Sort by biggest loss (most negative %)
        sortedStocks = [...scoredStocks].sort((a, b) => {
          const changeA = a.quote?.regularMarketChangePercent || 0;
          const changeB = b.quote?.regularMarketChangePercent || 0;
          return changeA - changeB; // Ascending (biggest losers first - most negative)
        });
        this.logger.info('Sorted losers by % change', {
          top3: sortedStocks.slice(0, 3).map(s => `${s.symbol}: ${s.quote?.regularMarketChangePercent?.toFixed(2)}%`)
        });
      } else if (mode === 'trending') {
        // Sort by volume (most actively traded)
        sortedStocks = [...scoredStocks].sort((a, b) => {
          const volA = a.quote?.regularMarketVolume || 0;
          const volB = b.quote?.regularMarketVolume || 0;
          return volB - volA; // Descending (highest volume first)
        });
        this.logger.info('Sorted trending by volume', {
          top3: sortedStocks.slice(0, 3).map(s => `${s.symbol}: ${(s.quote?.regularMarketVolume / 1000000).toFixed(1)}M vol`)
        });
      } else if (mode === 'swami') {
        // SWAMI: Early Entry - Find diamonds in the rough
        // Decent AI score + negative/flat price action = potential opportunity
        // Also factor in proximity to 52-week low (closer = better entry)
        sortedStocks = [...scoredStocks]
          .map(s => {
            const score = s.score || s.scoreData?.total || 0;
            const maxScore = s.scoreData?.maxPossible || 305;
            const scorePercent = score / maxScore;

            // Price change factor: negative change = higher opportunity
            const priceChange = s.quote?.regularMarketChangePercent || 0;
            const priceOpportunity = priceChange <= 0 ? (1 + Math.abs(priceChange) / 10) : (1 / (1 + priceChange / 10));

            // 52-week position: closer to low = better entry
            const price = s.quote?.regularMarketPrice || 0;
            const low52 = s.quote?.fiftyTwoWeekLow || price;
            const high52 = s.quote?.fiftyTwoWeekHigh || price;
            const range52 = high52 - low52;
            const position52 = range52 > 0 ? (price - low52) / range52 : 0.5;
            const lowProximityBonus = 1 + (1 - position52); // Closer to low = higher bonus

            // Recommendation bonus: BUY/STRONG_BUY get extra weight
            const rec = s.scoreData?.recommendation?.action;
            const recBonus = rec === 'STRONG_BUY' ? 1.5 : rec === 'BUY' ? 1.3 : rec === 'HOLD' ? 1.0 : 0.7;

            // Combined Swami score
            s.swamiScore = scorePercent * priceOpportunity * lowProximityBonus * recBonus;
            s.swamiInsight = {
              aiScore: Math.round(scorePercent * 100),
              priceChange: priceChange.toFixed(2),
              from52Low: Math.round(position52 * 100),
              opportunityScore: Math.round(s.swamiScore * 100),
              recommendation: rec || 'N/A'
            };

            return s;
          })
          // Filter: must have decent AI score (at least 50%) and be down or flat today
          .filter(s => {
            const scorePercent = (s.score || s.scoreData?.total || 0) / (s.scoreData?.maxPossible || 305);
            const priceChange = s.quote?.regularMarketChangePercent || 0;
            // Decent fundamentals AND price hasn't run up
            return scorePercent >= 0.50 && priceChange <= 2;
          })
          .sort((a, b) => (b.swamiScore || 0) - (a.swamiScore || 0));

        this.logger.info('Sorted swami by opportunity score', {
          found: sortedStocks.length,
          top3: sortedStocks.slice(0, 3).map(s =>
            `${s.symbol}: swami=${s.swamiInsight?.opportunityScore}, AI=${s.swamiInsight?.aiScore}%, chg=${s.swamiInsight?.priceChange}%, rec=${s.swamiInsight?.recommendation}`
          )
        });
      } else {
        // Default (bluechip, etc.) - sort by AI score
        sortedStocks = scoredStocks;
      }

      // Apply limit
      const topStocks = sortedStocks.slice(0, limit);

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
          mode,
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

      // Fetch comprehensive data including historical for charts
      const [stockData, technicalData, insiderData, newsData, macroData, historicalData] = await Promise.all([
        this.dataFetcher.fetchStockData(symbol),
        this.dataFetcher.fetchTechnicalData(symbol),
        this.dataFetcher.fetchInsiderData(symbol),
        this.dataFetcher.fetchNews(symbol, 7),
        this.dataFetcher.fetchMacroData(),
        this.dataFetcher.fetchHistoricalPrices(symbol, '1y'),
      ]);

      // Add technical data to stock
      stockData.technical = technicalData;
      stockData.insider = insiderData;
      stockData.news = newsData;
      stockData.historical = historicalData;

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
   * Get market indices (S&P 500, Dow, Nasdaq, global markets, commodities)
   * @param {Array<string>} symbols - Index symbols to fetch
   * @returns {Promise<Array>} Index quotes
   */
  async getMarketIndices(symbols) {
    try {
      this.logger.info('Fetching market indices', { count: symbols.length });

      const indices = await this.dataFetcher.fetchMarketIndices(symbols);

      this.logger.info('Market indices fetched', { returned: indices.length });

      return indices;
    } catch (error) {
      this.logger.error('Failed to fetch market indices', error);
      return [];
    }
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
   * Get symbols based on discovery mode
   * @private
   */
  async _getSymbolsByMode(mode) {
    switch (mode) {
      case 'bluechip':
        return this._getBlueChipSymbols();

      case 'gainers':
        return this._getDynamicSymbols('gainers');

      case 'losers':
        return this._getDynamicSymbols('losers');

      case 'swami':
        // Swami needs a broad pool to find hidden gems
        // Combine blue chips + trending + losers for best coverage
        const blueChips = this._getBlueChipSymbols();
        const dynamic = await this._getDynamicSymbols('losers'); // Losers often have early entry opportunities
        const trending = await this._getDynamicSymbols('trending');
        const combined = [...new Set([...blueChips, ...dynamic, ...trending])];
        this.logger.info(`Swami pool: ${combined.length} symbols`);
        return combined;

      case 'trending':
      default:
        return this._getDynamicSymbols('trending');
    }
  }

  /**
   * Get dynamic symbols from Yahoo Finance (trending, gainers, losers)
   * @private
   */
  async _getDynamicSymbols(type) {
    try {
      this.logger.info(`Fetching dynamic symbols: ${type}`);

      const marketData = await this.dataFetcher.getMarketOverview();

      let symbols = [];

      if (type === 'gainers' && marketData.gainers?.length > 0) {
        symbols = marketData.gainers.map(s => s.symbol).filter(Boolean);
        this.logger.info(`Got ${symbols.length} gainers: ${symbols.slice(0, 5).join(', ')}...`);
      } else if (type === 'losers' && marketData.losers?.length > 0) {
        symbols = marketData.losers.map(s => s.symbol).filter(Boolean);
        this.logger.info(`Got ${symbols.length} losers: ${symbols.slice(0, 5).join(', ')}...`);
      } else if (marketData.mostActive?.length > 0) {
        // Trending = most active
        symbols = marketData.mostActive.map(s => s.symbol).filter(Boolean);
        this.logger.info(`Got ${symbols.length} most active: ${symbols.slice(0, 5).join(', ')}...`);
      }

      // Return ONLY the dynamic symbols if we have enough (no blue chip mixing!)
      if (symbols.length >= 10) {
        this.logger.info(`Returning ${symbols.length} pure ${type} symbols (no blue chips mixed in)`);
        return symbols.slice(0, 30);
      }

      // Only add blue chips if we don't have enough dynamic symbols
      if (symbols.length > 0 && symbols.length < 10) {
        const blueChips = this._getBlueChipSymbols().slice(0, 10 - symbols.length);
        const combined = [...symbols, ...blueChips.filter(s => !symbols.includes(s))];
        this.logger.info(`Padded ${symbols.length} ${type} with ${blueChips.length} blue chips = ${combined.length} total`);
        return combined.slice(0, 30);
      }

      // Fallback to blue chips if dynamic fetch fails completely
      this.logger.warn(`No dynamic symbols for ${type}, falling back to blue chips`);
      return this._getBlueChipSymbols();
    } catch (error) {
      this.logger.error(`Failed to fetch dynamic symbols: ${type}`, error);
      return this._getBlueChipSymbols();
    }
  }

  /**
   * Get blue chip stock symbols (classic stable stocks)
   * @private
   */
  _getBlueChipSymbols() {
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

  /**
   * Save investment profile (AgntNrd)
   * @param {string} userId - User ID
   * @param {Object} profile - Investment profile data
   * @returns {Promise<Object>} Saved profile
   */
  async saveInvestmentProfile(userId, profile) {
    try {
      this.logger.info('Saving investment profile', { userId, amount: profile.amount });

      const admin = require('firebase-admin');
      const db = admin.firestore();

      const profileData = {
        ...profile,
        userId,
        createdAt: profile.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      await db
        .collection('users')
        .doc(userId)
        .collection('investmentProfile')
        .doc('current')
        .set(profileData, { merge: true });

      this.logger.info('Investment profile saved successfully', { userId });

      return profileData;
    } catch (error) {
      this.logger.error('Failed to save investment profile', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get investment profile (AgntNrd)
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Investment profile or null
   */
  async getInvestmentProfile(userId) {
    try {
      this.logger.info('Getting investment profile', { userId });

      const admin = require('firebase-admin');
      const db = admin.firestore();

      const doc = await db
        .collection('users')
        .doc(userId)
        .collection('investmentProfile')
        .doc('current')
        .get();

      if (!doc.exists) {
        this.logger.info('No investment profile found', { userId });
        return null;
      }

      const profile = doc.data();
      this.logger.info('Investment profile retrieved', { userId, amount: profile.amount });

      return profile;
    } catch (error) {
      this.logger.error('Failed to get investment profile', { userId, error: error.message });
      throw error;
    }
  }
}

module.exports = StockService;
