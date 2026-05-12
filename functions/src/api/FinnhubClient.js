/**
 * Finnhub API Client
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Finnhub API communication only
 * - Open/Closed: Extensible without modification
 * - Liskov Substitution: Extends BaseApiClient
 *
 * Data Provided:
 * - Stock fundamentals (P/E, P/B, EPS, etc.)
 * - Company profiles
 * - Earnings data
 * - Insider transactions
 * - News sentiment
 *
 * Rate Limit: 60 requests/minute (free tier)
 */

const BaseApiClient = require('./BaseApiClient');

class FinnhubClient extends BaseApiClient {
  constructor() {
    super({
      name: 'FINNHUB',
      baseURL: 'https://finnhub.io/api/v1',
      timeout: 15000,
      maxRetries: 3,
      cacheTTL: 3600, // 1 hour for fundamentals
    });

    this.apiKey = process.env.FINNHUB_API_KEY;
    if (!this.apiKey) {
      this.logger.warn('FINNHUB_API_KEY not configured');
    }
  }

  /**
   * Check if client is ready
   * @returns {boolean}
   */
  isReady() {
    return !!this.apiKey;
  }

  /**
   * Get stock quote (real-time price data)
   * @param {string} symbol - Stock symbol (e.g., 'AAPL')
   * @returns {Promise<Object>} Quote data
   */
  async getQuote(symbol) {
    if (!this.isReady()) {
      this.logger.warn('Finnhub API key not configured');
      return null;
    }

    try {
      const data = await this.get('/quote', {
        symbol: symbol.toUpperCase(),
        token: this.apiKey,
      });

      return {
        symbol: symbol.toUpperCase(),
        currentPrice: data.c,
        change: data.d,
        changePercent: data.dp,
        high: data.h,
        low: data.l,
        open: data.o,
        previousClose: data.pc,
        timestamp: data.t * 1000, // Convert to ms
      };
    } catch (error) {
      this.logger.error(`Failed to get quote for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Get company profile
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Company profile
   */
  async getCompanyProfile(symbol) {
    if (!this.isReady()) return null;

    try {
      const data = await this.get('/stock/profile2', {
        symbol: symbol.toUpperCase(),
        token: this.apiKey,
      });

      return {
        symbol: symbol.toUpperCase(),
        name: data.name,
        country: data.country,
        currency: data.currency,
        exchange: data.exchange,
        industry: data.finnhubIndustry,
        ipo: data.ipo,
        logo: data.logo,
        marketCap: data.marketCapitalization * 1000000, // Convert to dollars
        sharesOutstanding: data.shareOutstanding * 1000000,
        phone: data.phone,
        website: data.weburl,
        ticker: data.ticker,
      };
    } catch (error) {
      this.logger.error(`Failed to get profile for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Get basic financials (key metrics)
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Financial metrics
   */
  async getBasicFinancials(symbol) {
    if (!this.isReady()) return null;

    try {
      const data = await this.get('/stock/metric', {
        symbol: symbol.toUpperCase(),
        metric: 'all',
        token: this.apiKey,
      });

      const metrics = data.metric || {};

      return {
        symbol: symbol.toUpperCase(),
        // Valuation
        peRatio: metrics['peBasicExclExtraTTM'],
        peForward: metrics['forwardPE'],
        pbRatio: metrics['pbQuarterly'],
        psRatio: metrics['psTTM'],
        evEbitda: metrics['enterpriseValueEBITDATTM'],
        pegRatio: metrics['pegRatio'],
        // Profitability
        eps: metrics['epsBasicExclExtraItemsTTM'],
        epsGrowth: metrics['epsGrowth5Y'],
        revenueGrowth: metrics['revenueGrowth5Y'],
        netMargin: metrics['netProfitMarginTTM'],
        operatingMargin: metrics['operatingMarginTTM'],
        roe: metrics['roeTTM'],
        roa: metrics['roaTTM'],
        // Dividends
        dividendYield: metrics['dividendYieldIndicatedAnnual'],
        dividendPerShare: metrics['dividendPerShareAnnual'],
        payoutRatio: metrics['payoutRatioTTM'],
        // Financial Health
        debtToEquity: metrics['totalDebtToEquityQuarterly'],
        currentRatio: metrics['currentRatioQuarterly'],
        quickRatio: metrics['quickRatioQuarterly'],
        // Growth
        revenueGrowthQuarterly: metrics['revenueGrowthQuarterlyYoy'],
        epsGrowthQuarterly: metrics['epsGrowthQuarterlyYoy'],
        // Price
        beta: metrics['beta'],
        high52Week: metrics['52WeekHigh'],
        low52Week: metrics['52WeekLow'],
        priceToHigh: metrics['52WeekHighDate'],
        priceToLow: metrics['52WeekLowDate'],
      };
    } catch (error) {
      this.logger.error(`Failed to get financials for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Get earnings calendar and history
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Earnings data
   */
  async getEarnings(symbol) {
    if (!this.isReady()) return null;

    try {
      const data = await this.get('/stock/earnings', {
        symbol: symbol.toUpperCase(),
        token: this.apiKey,
      });

      // Process earnings history
      const earnings = (data || []).map((e) => ({
        period: e.period,
        actual: e.actual,
        estimate: e.estimate,
        surprise: e.surprise,
        surprisePercent: e.surprisePercent,
      }));

      // Calculate beat rate
      const beats = earnings.filter((e) => e.surprise > 0).length;
      const total = earnings.length;
      const beatRate = total > 0 ? (beats / total) * 100 : null;

      return {
        symbol: symbol.toUpperCase(),
        earnings,
        beatRate,
        averageSurprise:
          earnings.length > 0
            ? earnings.reduce((sum, e) => sum + (e.surprisePercent || 0), 0) / earnings.length
            : null,
      };
    } catch (error) {
      this.logger.error(`Failed to get earnings for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Get insider transactions
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Insider transaction data
   */
  async getInsiderTransactions(symbol) {
    if (!this.isReady()) return null;

    try {
      const data = await this.get('/stock/insider-transactions', {
        symbol: symbol.toUpperCase(),
        token: this.apiKey,
      });

      const transactions = (data.data || []).slice(0, 20).map((t) => ({
        name: t.name,
        share: t.share,
        change: t.change,
        transactionDate: t.transactionDate,
        transactionCode: t.transactionCode,
        transactionPrice: t.transactionPrice,
        filingDate: t.filingDate,
      }));

      // Calculate net insider sentiment
      const buyVolume = transactions.filter((t) => t.change > 0).reduce((sum, t) => sum + t.change, 0);
      const sellVolume = transactions.filter((t) => t.change < 0).reduce((sum, t) => sum + Math.abs(t.change), 0);
      const netSentiment = buyVolume - sellVolume;

      return {
        symbol: symbol.toUpperCase(),
        transactions,
        buyVolume,
        sellVolume,
        netSentiment,
        insiderScore: buyVolume > sellVolume ? 'bullish' : buyVolume < sellVolume ? 'bearish' : 'neutral',
      };
    } catch (error) {
      this.logger.error(`Failed to get insider transactions for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Get company news with sentiment
   * @param {string} symbol - Stock symbol
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} News with sentiment
   */
  async getNews(symbol, days = 7) {
    if (!this.isReady()) return null;

    try {
      const toDate = new Date();
      const fromDate = new Date(toDate.getTime() - days * 24 * 60 * 60 * 1000);

      const data = await this.get('/company-news', {
        symbol: symbol.toUpperCase(),
        from: fromDate.toISOString().split('T')[0],
        to: toDate.toISOString().split('T')[0],
        token: this.apiKey,
      });

      const news = (data || []).slice(0, 10).map((n) => ({
        headline: n.headline,
        summary: n.summary,
        source: n.source,
        url: n.url,
        datetime: n.datetime * 1000,
        category: n.category,
        image: n.image,
      }));

      return {
        symbol: symbol.toUpperCase(),
        news,
        count: news.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get news for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Get recommendation trends
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Analyst recommendations
   */
  async getRecommendations(symbol) {
    if (!this.isReady()) return null;

    try {
      const data = await this.get('/stock/recommendation', {
        symbol: symbol.toUpperCase(),
        token: this.apiKey,
      });

      const latest = data[0] || {};

      return {
        symbol: symbol.toUpperCase(),
        period: latest.period,
        strongBuy: latest.strongBuy || 0,
        buy: latest.buy || 0,
        hold: latest.hold || 0,
        sell: latest.sell || 0,
        strongSell: latest.strongSell || 0,
        total: (latest.strongBuy || 0) + (latest.buy || 0) + (latest.hold || 0) + (latest.sell || 0) + (latest.strongSell || 0),
        consensusScore: this._calculateConsensusScore(latest),
      };
    } catch (error) {
      this.logger.error(`Failed to get recommendations for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Get price targets
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Price target data
   */
  async getPriceTarget(symbol) {
    if (!this.isReady()) return null;

    try {
      const data = await this.get('/stock/price-target', {
        symbol: symbol.toUpperCase(),
        token: this.apiKey,
      });

      return {
        symbol: symbol.toUpperCase(),
        targetHigh: data.targetHigh,
        targetLow: data.targetLow,
        targetMean: data.targetMean,
        targetMedian: data.targetMedian,
        lastUpdated: data.lastUpdated,
      };
    } catch (error) {
      this.logger.error(`Failed to get price target for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Search for symbols
   * @param {string} query - Search query
   * @returns {Promise<Array>} Matching symbols
   */
  async searchSymbols(query) {
    if (!this.isReady()) return [];

    try {
      const data = await this.get('/search', {
        q: query,
        token: this.apiKey,
      });

      return (data.result || []).map((r) => ({
        symbol: r.symbol,
        description: r.description,
        type: r.type,
        displaySymbol: r.displaySymbol,
      }));
    } catch (error) {
      this.logger.error(`Failed to search symbols for "${query}"`, error);
      return [];
    }
  }

  /**
   * Calculate consensus score from recommendations
   * @private
   */
  _calculateConsensusScore(rec) {
    const total = rec.strongBuy + rec.buy + rec.hold + rec.sell + rec.strongSell;
    if (total === 0) return 0;

    // Weighted score: strongBuy=5, buy=4, hold=3, sell=2, strongSell=1
    const weighted = rec.strongBuy * 5 + rec.buy * 4 + rec.hold * 3 + rec.sell * 2 + rec.strongSell * 1;
    return (weighted / total - 1) * 25; // Scale to 0-100
  }
}

module.exports = FinnhubClient;
