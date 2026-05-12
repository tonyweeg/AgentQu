/**
 * Stock Data Fetcher Service
 *
 * SOLID Principles Applied:
 * - Single Responsibility: External API data fetching only
 * - Dependency Inversion: Depends on API client abstractions
 *
 * Handles:
 * - Fetching data from multiple APIs (Finnhub, Yahoo, FRED, Alpha Vantage)
 * - Data aggregation and normalization
 * - Caching coordination
 */

const FinnhubClient = require('../../api/FinnhubClient');
const YahooFinanceClient = require('../../api/YahooFinanceClient');
const FREDClient = require('../../api/FREDClient');
const AlphaVantageClient = require('../../api/AlphaVantageClient');
const StockRepository = require('../../repositories/StockRepository');
const { createLogger } = require('../../utils/logger');

class StockDataFetcherService {
  constructor() {
    this.finnhub = new FinnhubClient();
    this.yahoo = new YahooFinanceClient();
    this.fred = new FREDClient();
    this.alphaVantage = new AlphaVantageClient();
    this.stockRepo = new StockRepository();
    this.logger = createLogger('STOCK_DATA_FETCHER');
  }

  /**
   * Fetch comprehensive stock data
   * @param {string} symbol - Stock symbol
   * @param {boolean} includeCache - Check cache first
   * @returns {Promise<Object>} Complete stock data
   */
  async fetchStockData(symbol, includeCache = true) {
    const upperSymbol = symbol.toUpperCase();
    this.logger.info(`Fetching data for ${upperSymbol}`);

    // Check cache first
    if (includeCache) {
      const cached = await this.stockRepo.getCachedStock(upperSymbol);
      if (cached) {
        this.logger.debug(`Cache hit for ${upperSymbol}`);
        return cached;
      }
    }

    // Fetch from multiple sources in parallel
    const [quote, profile, metrics, earnings, priceTarget, recommendations, historical] = await Promise.all([
      this.yahoo.getQuote(upperSymbol),
      this.finnhub.getCompanyProfile(upperSymbol),
      this.finnhub.getBasicFinancials(upperSymbol),
      this.finnhub.getEarnings(upperSymbol),
      this.finnhub.getPriceTarget(upperSymbol),
      this.finnhub.getRecommendations(upperSymbol),
      this.yahoo.getHistoricalPrices(upperSymbol, '1y', '1d'),
    ]);

    // Merge Yahoo financial data
    const yahooFinancials = await this.yahoo.getFinancials(upperSymbol);

    const stockData = {
      symbol: upperSymbol,
      quote,
      profile: profile || { industry: quote?.shortName },
      metrics: this._mergeMetrics(metrics, yahooFinancials),
      earnings,
      priceTarget,
      recommendations,
      historical,
      lastUpdated: Date.now(),
    };

    // Cache the result (5 minutes for quotes)
    await this.stockRepo.cacheStock(upperSymbol, stockData, 300);

    this.logger.info(`Fetched data for ${upperSymbol}`, {
      hasQuote: !!quote,
      hasMetrics: !!metrics,
      hasEarnings: !!earnings,
    });

    return stockData;
  }

  /**
   * Fetch technical analysis data (uses Alpha Vantage - limited quota)
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Technical indicators
   */
  async fetchTechnicalData(symbol) {
    const upperSymbol = symbol.toUpperCase();
    this.logger.info(`Fetching technical data for ${upperSymbol}`);

    // Check quota
    const quota = this.alphaVantage.getQuotaStatus();
    if (quota.remaining < 4) {
      this.logger.warn('Alpha Vantage quota low - skipping technical analysis');
      return null;
    }

    return this.alphaVantage.getTechnicalAnalysis(upperSymbol);
  }

  /**
   * Fetch macro economic data
   * @returns {Promise<Object>} Macro overview
   */
  async fetchMacroData() {
    this.logger.info('Fetching macro data');

    if (!this.fred.isReady()) {
      this.logger.warn('FRED API not configured');
      return null;
    }

    const [macroOverview, sectorIndicators] = await Promise.all([
      this.fred.getMacroOverview(),
      this.fred.getSectorIndicators(),
    ]);

    return {
      ...macroOverview,
      ...sectorIndicators,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Fetch multiple stocks at once
   * @param {Array<string>} symbols - Stock symbols
   * @returns {Promise<Array>} Array of stock data
   */
  async fetchMultipleStocks(symbols) {
    this.logger.info(`Fetching ${symbols.length} stocks`);

    // Check cache for all symbols
    const cachedStocks = await this.stockRepo.getCachedStocks(symbols);
    const cachedSymbols = Object.keys(cachedStocks);
    const missingSymbols = symbols.filter((s) => !cachedSymbols.includes(s.toUpperCase()));

    this.logger.debug(`Cache: ${cachedSymbols.length} hit, ${missingSymbols.length} miss`);

    // Fetch missing symbols
    const fetchedStocks = await Promise.all(
      missingSymbols.map((symbol) => this.fetchStockData(symbol, false))
    );

    // Combine cached and fetched
    const allStocks = [
      ...Object.values(cachedStocks),
      ...fetchedStocks.filter(Boolean),
    ];

    return allStocks;
  }

  /**
   * Search for stocks
   * @param {string} query - Search query
   * @returns {Promise<Array>} Matching stocks
   */
  async searchStocks(query) {
    this.logger.info(`Searching for "${query}"`);

    const [finnhubResults, yahooResults] = await Promise.all([
      this.finnhub.searchSymbols(query),
      this.yahoo.search(query),
    ]);

    // Merge and deduplicate
    const resultMap = new Map();

    yahooResults.forEach((r) => {
      if (r.symbol) {
        resultMap.set(r.symbol, {
          symbol: r.symbol,
          name: r.longName || r.shortName,
          exchange: r.exchange,
          type: r.quoteType,
          industry: r.industry,
          sector: r.sector,
        });
      }
    });

    finnhubResults.forEach((r) => {
      if (r.symbol && !resultMap.has(r.symbol)) {
        resultMap.set(r.symbol, {
          symbol: r.symbol,
          name: r.description,
          type: r.type,
        });
      }
    });

    return Array.from(resultMap.values()).slice(0, 20);
  }

  /**
   * Get market overview
   * @returns {Promise<Object>} Market data
   */
  async getMarketOverview() {
    this.logger.info('Fetching market overview');

    const [gainers, losers, mostActive] = await Promise.all([
      this.yahoo.getMarketMovers('gainers'),
      this.yahoo.getMarketMovers('losers'),
      this.yahoo.getMarketMovers('mostactive'),
    ]);

    return {
      gainers: gainers.slice(0, 10),
      losers: losers.slice(0, 10),
      mostActive: mostActive.slice(0, 10),
      lastUpdated: Date.now(),
    };
  }

  /**
   * Get insider trading data
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Insider transactions
   */
  async fetchInsiderData(symbol) {
    return this.finnhub.getInsiderTransactions(symbol);
  }

  /**
   * Get historical price data for charts
   * @param {string} symbol - Stock symbol
   * @param {string} range - Time range ('1y', '6mo', '3mo', etc.)
   * @returns {Promise<Object>} Historical prices with OHLCV data
   */
  async fetchHistoricalPrices(symbol, range = '1y') {
    try {
      this.logger.info(`Fetching historical prices for ${symbol}`, { range });
      const data = await this.yahoo.getHistoricalPrices(symbol, range, '1d');
      return data;
    } catch (error) {
      this.logger.error(`Failed to fetch historical prices for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Fetch market indices (S&P 500, Dow, global markets, commodities)
   * @param {Array<string>} symbols - Index symbols
   * @returns {Promise<Array>} Index quotes
   */
  async fetchMarketIndices(symbols) {
    try {
      this.logger.info('Fetching market indices', { count: symbols.length });

      const quotes = await this.yahoo.getQuotes(symbols);

      // Map to simplified format
      const indices = quotes.map((q) => ({
        symbol: q.symbol,
        name: q.shortName || q.longName || q.symbol,
        price: q.regularMarketPrice || 0,
        change: q.regularMarketChange || 0,
        changePercent: q.regularMarketChangePercent || 0,
        previousClose: q.regularMarketPreviousClose,
        dayHigh: q.regularMarketDayHigh,
        dayLow: q.regularMarketDayLow,
        volume: q.regularMarketVolume,
      }));

      this.logger.info('Market indices fetched', { count: indices.length });

      return indices;
    } catch (error) {
      this.logger.error('Failed to fetch market indices', error);
      return [];
    }
  }

  /**
   * Get news for a stock
   * @param {string} symbol - Stock symbol
   * @param {number} days - Days to look back
   * @returns {Promise<Object>} News data
   */
  async fetchNews(symbol, days = 7) {
    return this.finnhub.getNews(symbol, days);
  }

  /**
   * Merge metrics from multiple sources
   * @private
   */
  _mergeMetrics(finnhubMetrics, yahooFinancials) {
    const fh = finnhubMetrics || {};
    const yf = yahooFinancials?.financialData || {};
    const ks = yahooFinancials?.keyStats || {};

    return {
      // Valuation
      peRatio: fh.peRatio || ks.trailingPE,
      peForward: fh.peForward || ks.forwardPE,
      pbRatio: fh.pbRatio || ks.priceToBook,
      psRatio: fh.psRatio,
      evEbitda: fh.evEbitda || ks.enterpriseToEbitda,
      pegRatio: fh.pegRatio || ks.pegRatio,

      // Profitability
      eps: fh.eps || ks.trailingEps,
      epsGrowth: fh.epsGrowth,
      revenueGrowth: yf.revenueGrowth,
      netMargin: fh.netMargin || yf.profitMargins,
      operatingMargin: fh.operatingMargin || yf.operatingMargins,
      grossMargins: yf.grossMargins,
      roe: fh.roe || yf.returnOnEquity,
      roa: fh.roa || yf.returnOnAssets,

      // Dividends
      dividendYield: fh.dividendYield,
      dividendPerShare: fh.dividendPerShare,
      payoutRatio: fh.payoutRatio,

      // Financial Health
      debtToEquity: fh.debtToEquity || yf.debtToEquity,
      currentRatio: fh.currentRatio || yf.currentRatio,
      quickRatio: fh.quickRatio || yf.quickRatio,
      totalCash: yf.totalCash,
      totalDebt: yf.totalDebt,
      freeCashflow: yf.freeCashflow,

      // Growth
      revenueGrowthQuarterly: fh.revenueGrowthQuarterly,
      epsGrowthQuarterly: fh.epsGrowthQuarterly,
      earningsGrowth: yf.earningsGrowth,

      // Risk
      beta: fh.beta || ks.beta,
      high52Week: fh.high52Week,
      low52Week: fh.low52Week,

      // Ownership
      shortPercentOfFloat: ks.shortPercentOfFloat,
      shortRatio: ks.shortRatio,
      heldPercentInsiders: ks.heldPercentInsiders,
      heldPercentInstitutions: ks.heldPercentInstitutions,
    };
  }
}

module.exports = StockDataFetcherService;
