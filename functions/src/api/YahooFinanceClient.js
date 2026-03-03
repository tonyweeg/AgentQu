/**
 * Yahoo Finance API Client
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Yahoo Finance data retrieval only
 * - Open/Closed: Extensible without modification
 * - Liskov Substitution: Extends BaseApiClient
 *
 * Data Provided:
 * - Real-time stock quotes
 * - Historical price data (OHLCV)
 * - Financial statements
 * - Options data
 * - Market summary
 *
 * Note: Uses unofficial Yahoo Finance API (no key required)
 * Rate limit: Be respectful (~100 req/min recommended)
 */

const BaseApiClient = require('./BaseApiClient');

class YahooFinanceClient extends BaseApiClient {
  constructor() {
    super({
      name: 'YAHOO_FINANCE',
      baseURL: 'https://query1.finance.yahoo.com/v8/finance',
      timeout: 15000,
      maxRetries: 3,
      cacheTTL: 300, // 5 minutes for price data
    });
  }

  /**
   * Always ready (no API key required)
   * @returns {boolean}
   */
  isReady() {
    return true;
  }

  /**
   * Get stock quote with extended data
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Quote data
   */
  async getQuote(symbol) {
    try {
      const url = `https://query1.finance.yahoo.com/v7/finance/quote`;
      const response = await this.client.get(url, {
        params: {
          symbols: symbol.toUpperCase(),
          modules: 'price,summaryDetail,financialData',
        },
      });

      const result = response.data?.quoteResponse?.result?.[0];
      if (!result) return null;

      return {
        symbol: result.symbol,
        shortName: result.shortName,
        longName: result.longName,
        // Price data
        regularMarketPrice: result.regularMarketPrice,
        regularMarketChange: result.regularMarketChange,
        regularMarketChangePercent: result.regularMarketChangePercent,
        regularMarketVolume: result.regularMarketVolume,
        regularMarketOpen: result.regularMarketOpen,
        regularMarketDayHigh: result.regularMarketDayHigh,
        regularMarketDayLow: result.regularMarketDayLow,
        regularMarketPreviousClose: result.regularMarketPreviousClose,
        // Market info
        marketCap: result.marketCap,
        exchange: result.exchange,
        quoteType: result.quoteType,
        currency: result.currency,
        // Extended hours
        preMarketPrice: result.preMarketPrice,
        preMarketChange: result.preMarketChange,
        postMarketPrice: result.postMarketPrice,
        postMarketChange: result.postMarketChange,
        // 52 week
        fiftyTwoWeekHigh: result.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: result.fiftyTwoWeekLow,
        fiftyTwoWeekHighChange: result.fiftyTwoWeekHighChange,
        fiftyTwoWeekHighChangePercent: result.fiftyTwoWeekHighChangePercent,
        fiftyTwoWeekLowChange: result.fiftyTwoWeekLowChange,
        fiftyTwoWeekLowChangePercent: result.fiftyTwoWeekLowChangePercent,
        // Averages
        fiftyDayAverage: result.fiftyDayAverage,
        twoHundredDayAverage: result.twoHundredDayAverage,
        fiftyDayAverageChange: result.fiftyDayAverageChange,
        twoHundredDayAverageChange: result.twoHundredDayAverageChange,
        // Trading info
        averageDailyVolume3Month: result.averageDailyVolume3Month,
        averageDailyVolume10Day: result.averageDailyVolume10Day,
        sharesOutstanding: result.sharesOutstanding,
        // Earnings
        trailingPE: result.trailingPE,
        forwardPE: result.forwardPE,
        epsTrailingTwelveMonths: result.epsTrailingTwelveMonths,
        epsForward: result.epsForward,
        epsCurrentYear: result.epsCurrentYear,
        // Dividends
        trailingAnnualDividendRate: result.trailingAnnualDividendRate,
        trailingAnnualDividendYield: result.trailingAnnualDividendYield,
        dividendDate: result.dividendDate,
        // Analyst
        targetMeanPrice: result.targetMeanPrice,
        numberOfAnalystOpinions: result.numberOfAnalystOpinions,
        // Book value
        bookValue: result.bookValue,
        priceToBook: result.priceToBook,
      };
    } catch (error) {
      this.logger.error(`Failed to get Yahoo quote for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Get multiple quotes at once
   * @param {Array<string>} symbols - Array of stock symbols
   * @returns {Promise<Array>} Array of quote data
   */
  async getQuotes(symbols) {
    try {
      const url = `https://query1.finance.yahoo.com/v7/finance/quote`;
      const response = await this.client.get(url, {
        params: {
          symbols: symbols.map((s) => s.toUpperCase()).join(','),
        },
      });

      const results = response.data?.quoteResponse?.result || [];
      return results.map((result) => ({
        symbol: result.symbol,
        shortName: result.shortName,
        regularMarketPrice: result.regularMarketPrice,
        regularMarketChange: result.regularMarketChange,
        regularMarketChangePercent: result.regularMarketChangePercent,
        regularMarketVolume: result.regularMarketVolume,
        marketCap: result.marketCap,
        fiftyTwoWeekHigh: result.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: result.fiftyTwoWeekLow,
        trailingPE: result.trailingPE,
        forwardPE: result.forwardPE,
        dividendYield: result.trailingAnnualDividendYield,
      }));
    } catch (error) {
      this.logger.error(`Failed to get Yahoo quotes for ${symbols.join(',')}`, error);
      return [];
    }
  }

  /**
   * Get historical price data
   * @param {string} symbol - Stock symbol
   * @param {string} range - Time range ('1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', 'max')
   * @param {string} interval - Data interval ('1m', '5m', '15m', '30m', '60m', '1d', '1wk', '1mo')
   * @returns {Promise<Object>} Historical price data
   */
  async getHistoricalPrices(symbol, range = '1y', interval = '1d') {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}`;
      const response = await this.client.get(url, {
        params: {
          range,
          interval,
          includePrePost: false,
        },
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) return null;

      const timestamps = result.timestamp || [];
      const quote = result.indicators?.quote?.[0] || {};
      const adjClose = result.indicators?.adjclose?.[0]?.adjclose || [];

      const prices = timestamps.map((ts, i) => ({
        date: new Date(ts * 1000).toISOString(),
        timestamp: ts * 1000,
        open: quote.open?.[i],
        high: quote.high?.[i],
        low: quote.low?.[i],
        close: quote.close?.[i],
        adjustedClose: adjClose[i],
        volume: quote.volume?.[i],
      }));

      // Calculate returns
      const returns = [];
      for (let i = 1; i < prices.length; i++) {
        if (prices[i].close && prices[i - 1].close) {
          returns.push((prices[i].close - prices[i - 1].close) / prices[i - 1].close);
        }
      }

      // Calculate volatility (standard deviation of returns)
      const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
      const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized

      return {
        symbol: symbol.toUpperCase(),
        range,
        interval,
        prices,
        stats: {
          high: Math.max(...prices.filter((p) => p.high).map((p) => p.high)),
          low: Math.min(...prices.filter((p) => p.low).map((p) => p.low)),
          avgVolume: prices.reduce((sum, p) => sum + (p.volume || 0), 0) / prices.length,
          volatility,
          returns: {
            '1d': this._calculateReturn(prices, 1),
            '1w': this._calculateReturn(prices, 5),
            '1m': this._calculateReturn(prices, 21),
            '3m': this._calculateReturn(prices, 63),
            '6m': this._calculateReturn(prices, 126),
            '1y': this._calculateReturn(prices, 252),
          },
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get historical prices for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Get detailed company financial data
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Financial data
   */
  async getFinancials(symbol) {
    try {
      const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol.toUpperCase()}`;
      const response = await this.client.get(url, {
        params: {
          modules: 'incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory,financialData,defaultKeyStatistics',
        },
      });

      const result = response.data?.quoteSummary?.result?.[0];
      if (!result) return null;

      const financialData = result.financialData || {};
      const keyStats = result.defaultKeyStatistics || {};

      return {
        symbol: symbol.toUpperCase(),
        financialData: {
          currentPrice: financialData.currentPrice?.raw,
          targetHighPrice: financialData.targetHighPrice?.raw,
          targetLowPrice: financialData.targetLowPrice?.raw,
          targetMeanPrice: financialData.targetMeanPrice?.raw,
          recommendationMean: financialData.recommendationMean?.raw,
          recommendationKey: financialData.recommendationKey,
          numberOfAnalystOpinions: financialData.numberOfAnalystOpinions?.raw,
          totalCash: financialData.totalCash?.raw,
          totalDebt: financialData.totalDebt?.raw,
          totalRevenue: financialData.totalRevenue?.raw,
          ebitda: financialData.ebitda?.raw,
          operatingCashflow: financialData.operatingCashflow?.raw,
          freeCashflow: financialData.freeCashflow?.raw,
          debtToEquity: financialData.debtToEquity?.raw,
          currentRatio: financialData.currentRatio?.raw,
          quickRatio: financialData.quickRatio?.raw,
          returnOnAssets: financialData.returnOnAssets?.raw,
          returnOnEquity: financialData.returnOnEquity?.raw,
          grossMargins: financialData.grossMargins?.raw,
          operatingMargins: financialData.operatingMargins?.raw,
          profitMargins: financialData.profitMargins?.raw,
          revenueGrowth: financialData.revenueGrowth?.raw,
          earningsGrowth: financialData.earningsGrowth?.raw,
        },
        keyStats: {
          beta: keyStats.beta?.raw,
          forwardPE: keyStats.forwardPE?.raw,
          trailingEps: keyStats.trailingEps?.raw,
          forwardEps: keyStats.forwardEps?.raw,
          pegRatio: keyStats.pegRatio?.raw,
          enterpriseValue: keyStats.enterpriseValue?.raw,
          enterpriseToRevenue: keyStats.enterpriseToRevenue?.raw,
          enterpriseToEbitda: keyStats.enterpriseToEbitda?.raw,
          bookValue: keyStats.bookValue?.raw,
          priceToBook: keyStats.priceToBook?.raw,
          sharesOutstanding: keyStats.sharesOutstanding?.raw,
          sharesShort: keyStats.sharesShort?.raw,
          shortRatio: keyStats.shortRatio?.raw,
          shortPercentOfFloat: keyStats.shortPercentOfFloat?.raw,
          heldPercentInsiders: keyStats.heldPercentInsiders?.raw,
          heldPercentInstitutions: keyStats.heldPercentInstitutions?.raw,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get financials for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Get market movers (gainers, losers, most active)
   * @param {string} type - 'gainers', 'losers', or 'mostactive'
   * @returns {Promise<Array>} Market movers
   */
  async getMarketMovers(type = 'mostactive') {
    try {
      const url = `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved`;
      const response = await this.client.get(url, {
        params: {
          scrIds: `day_${type}`,
          count: 25,
        },
      });

      const results = response.data?.finance?.result?.[0]?.quotes || [];
      return results.map((q) => ({
        symbol: q.symbol,
        shortName: q.shortName,
        regularMarketPrice: q.regularMarketPrice,
        regularMarketChange: q.regularMarketChange,
        regularMarketChangePercent: q.regularMarketChangePercent,
        regularMarketVolume: q.regularMarketVolume,
        marketCap: q.marketCap,
      }));
    } catch (error) {
      this.logger.error(`Failed to get market movers (${type})`, error);
      return [];
    }
  }

  /**
   * Search for symbols
   * @param {string} query - Search query
   * @returns {Promise<Array>} Matching symbols
   */
  async search(query) {
    try {
      const url = `https://query1.finance.yahoo.com/v1/finance/search`;
      const response = await this.client.get(url, {
        params: {
          q: query,
          quotesCount: 10,
          newsCount: 0,
        },
      });

      const quotes = response.data?.quotes || [];
      return quotes.map((q) => ({
        symbol: q.symbol,
        shortName: q.shortname,
        longName: q.longname,
        exchange: q.exchange,
        quoteType: q.quoteType,
        industry: q.industry,
        sector: q.sector,
      }));
    } catch (error) {
      this.logger.error(`Failed to search for "${query}"`, error);
      return [];
    }
  }

  /**
   * Calculate return over a period
   * @private
   */
  _calculateReturn(prices, days) {
    if (prices.length < days + 1) return null;
    const current = prices[prices.length - 1].close;
    const past = prices[prices.length - 1 - days]?.close;
    if (!current || !past) return null;
    return ((current - past) / past) * 100;
  }
}

module.exports = YahooFinanceClient;
