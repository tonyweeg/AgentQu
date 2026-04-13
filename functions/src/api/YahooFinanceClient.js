/**
 * Yahoo Finance Client
 * Uses yahoo-finance2 npm package for reliable stock data
 */

const YahooFinance = require('yahoo-finance2').default;
const { createLogger } = require('../utils/logger');

const logger = createLogger('YAHOO_FINANCE');

class YahooFinanceClient {
  constructor() {
    // yahoo-finance2 v3.x requires instantiation
    this.yf = new YahooFinance();
    logger.info('YahooFinanceClient initialized');
  }

  /**
   * Always ready
   */
  isReady() {
    return true;
  }

  /**
   * Get quote for a single symbol
   */
  async getQuote(symbol) {
    try {
      const upperSymbol = symbol.toUpperCase();
      logger.info('Fetching quote', { symbol: upperSymbol });

      // Debug: Log what yahoo-finance2 returns
      const quote = await this.yf.quote(upperSymbol);
      logger.info('Yahoo quote response', {
        symbol: upperSymbol,
        hasQuote: !!quote,
        quoteType: quote?.quoteType,
        price: quote?.regularMarketPrice
      });

      if (!quote) {
        logger.warn('No quote returned from Yahoo', { symbol: upperSymbol });
        return null;
      }

      return {
        symbol: quote.symbol,
        shortName: quote.shortName,
        longName: quote.longName,
        regularMarketPrice: quote.regularMarketPrice,
        regularMarketChange: quote.regularMarketChange,
        regularMarketChangePercent: quote.regularMarketChangePercent,
        regularMarketVolume: quote.regularMarketVolume,
        regularMarketDayHigh: quote.regularMarketDayHigh,
        regularMarketDayLow: quote.regularMarketDayLow,
        regularMarketOpen: quote.regularMarketOpen,
        regularMarketPreviousClose: quote.regularMarketPreviousClose,
        marketCap: quote.marketCap,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
        fiftyDayAverage: quote.fiftyDayAverage,
        twoHundredDayAverage: quote.twoHundredDayAverage,
        trailingPE: quote.trailingPE,
        forwardPE: quote.forwardPE,
        trailingAnnualDividendYield: quote.trailingAnnualDividendYield,
        dividendYield: quote.dividendYield,
        beta: quote.beta,
        averageDailyVolume3Month: quote.averageDailyVolume3Month,
        exchange: quote.exchange,
        quoteType: quote.quoteType,
        epsTrailingTwelveMonths: quote.epsTrailingTwelveMonths,
        bookValue: quote.bookValue,
        priceToBook: quote.priceToBook,
      };
    } catch (error) {
      logger.error('Failed to fetch quote', {
        symbol,
        errorMessage: error.message,
        errorName: error.name,
        errorStack: error.stack?.substring(0, 500)
      });
      return null;
    }
  }

  /**
   * Get quotes for multiple symbols
   */
  async getQuotes(symbols) {
    try {
      logger.info('Fetching quotes', { count: symbols.length });
      const results = await Promise.all(
        symbols.map(s => this.getQuote(s))
      );
      return results.filter(q => q !== null);
    } catch (error) {
      logger.error('Failed to fetch quotes', { error: error.message });
      return [];
    }
  }

  /**
   * Get historical prices using chart() API (historical() is deprecated)
   */
  async getHistoricalPrices(symbol, range = '1y', interval = '1d') {
    try {
      logger.info('Fetching historical via chart()', { symbol, range });

      // Convert range to date strings for chart() API
      const periodMap = {
        '1d': 1,
        '5d': 5,
        '1mo': 30,
        '3mo': 90,
        '6mo': 180,
        '1y': 365,
        '2y': 730,
      };

      const days = periodMap[range] || 365;
      const period2 = new Date();
      const period1 = new Date();
      period1.setDate(period1.getDate() - days);

      // Format as YYYY-MM-DD strings
      const formatDate = (d) => d.toISOString().split('T')[0];

      const result = await this.yf.chart(symbol.toUpperCase(), {
        period1: formatDate(period1),
        period2: formatDate(period2),
        interval,
      });

      if (!result || !result.quotes || result.quotes.length === 0) {
        logger.warn('No chart data returned', { symbol });
        return null;
      }

      const prices = result.quotes.map(item => ({
        date: item.date?.toISOString?.() || new Date(item.date).toISOString(),
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
        adjClose: item.adjclose,
      })).filter(p => p.date && p.close); // Filter out invalid entries

      logger.info('Chart data fetched', { symbol, count: prices.length });

      // Calculate returns
      const returns = [];
      for (let i = 1; i < prices.length; i++) {
        if (prices[i].close && prices[i - 1].close) {
          returns.push((prices[i].close - prices[i - 1].close) / prices[i - 1].close);
        }
      }

      // Volatility
      const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
      const variance = returns.length > 0 ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length : 0;
      const volatility = Math.sqrt(variance) * Math.sqrt(252);

      return {
        symbol: symbol.toUpperCase(),
        range,
        interval,
        prices,
        stats: {
          high: Math.max(...prices.filter(p => p.high).map(p => p.high)),
          low: Math.min(...prices.filter(p => p.low).map(p => p.low)),
          avgVolume: prices.reduce((sum, p) => sum + (p.volume || 0), 0) / prices.length,
          volatility,
        },
      };
    } catch (error) {
      logger.error('Failed to fetch historical', { symbol, error: error.message });
      return null;
    }
  }

  /**
   * Get detailed financials via quoteSummary
   */
  async getFinancials(symbol) {
    try {
      logger.info('Fetching financials', { symbol });

      const result = await this.yf.quoteSummary(symbol.toUpperCase(), {
        modules: ['summaryDetail', 'defaultKeyStatistics', 'financialData'],
      });

      if (!result) return null;

      const summary = result.summaryDetail || {};
      const stats = result.defaultKeyStatistics || {};
      const financials = result.financialData || {};

      return {
        symbol: symbol.toUpperCase(),
        financialData: {
          currentPrice: financials.currentPrice,
          targetHighPrice: financials.targetHighPrice,
          targetLowPrice: financials.targetLowPrice,
          targetMeanPrice: financials.targetMeanPrice,
          recommendationMean: financials.recommendationMean,
          recommendationKey: financials.recommendationKey,
          numberOfAnalystOpinions: financials.numberOfAnalystOpinions,
          totalCash: financials.totalCash,
          totalDebt: financials.totalDebt,
          totalRevenue: financials.totalRevenue,
          ebitda: financials.ebitda,
          operatingCashflow: financials.operatingCashflow,
          freeCashflow: financials.freeCashflow,
          debtToEquity: financials.debtToEquity,
          currentRatio: financials.currentRatio,
          quickRatio: financials.quickRatio,
          returnOnAssets: financials.returnOnAssets,
          returnOnEquity: financials.returnOnEquity,
          grossMargins: financials.grossMargins,
          operatingMargins: financials.operatingMargins,
          profitMargins: financials.profitMargins,
          revenueGrowth: financials.revenueGrowth,
          earningsGrowth: financials.earningsGrowth,
        },
        keyStats: {
          beta: stats.beta,
          forwardPE: stats.forwardPE,
          trailingEps: stats.trailingEps,
          forwardEps: stats.forwardEps,
          pegRatio: stats.pegRatio,
          enterpriseValue: stats.enterpriseValue,
          enterpriseToRevenue: stats.enterpriseToRevenue,
          enterpriseToEbitda: stats.enterpriseToEbitda,
          bookValue: stats.bookValue,
          priceToBook: stats.priceToBook,
          sharesOutstanding: stats.sharesOutstanding,
          sharesShort: stats.sharesShort,
          shortRatio: stats.shortRatio,
          shortPercentOfFloat: stats.shortPercentOfFloat,
          heldPercentInsiders: stats.heldPercentInsiders,
          heldPercentInstitutions: stats.heldPercentInstitutions,
        },
        summaryDetail: {
          dividendYield: summary.dividendYield,
          dividendRate: summary.dividendRate,
          payoutRatio: summary.payoutRatio,
          trailingPE: summary.trailingPE,
          forwardPE: summary.forwardPE,
          priceToSalesTrailing12Months: summary.priceToSalesTrailing12Months,
          fiftyTwoWeekHigh: summary.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: summary.fiftyTwoWeekLow,
          fiftyDayAverage: summary.fiftyDayAverage,
          twoHundredDayAverage: summary.twoHundredDayAverage,
          marketCap: summary.marketCap,
          beta: summary.beta,
        },
      };
    } catch (error) {
      logger.error('Failed to fetch financials', { symbol, error: error.message });
      return null;
    }
  }

  /**
   * Search for symbols
   */
  async search(query) {
    try {
      logger.info('Searching', { query });
      const results = await this.yf.search(query);

      return (results.quotes || [])
        .filter(q => q.quoteType === 'EQUITY')
        .slice(0, 10)
        .map(q => ({
          symbol: q.symbol,
          shortName: q.shortname,
          longName: q.longname,
          exchange: q.exchange,
          quoteType: q.quoteType,
        }));
    } catch (error) {
      logger.error('Search failed', { query, error: error.message });
      return [];
    }
  }

  /**
   * Get market movers by type
   * @param {string} type - 'gainers', 'losers', or 'mostactive' (default)
   */
  async getMarketMovers(type = 'mostactive') {
    try {
      logger.info('Fetching market movers', { type });

      let results;
      let quotes = [];

      if (type === 'gainers') {
        // Use screener for day gainers (dailyGainers is deprecated)
        results = await this.yf.screener({ scrIds: 'day_gainers', count: 20 });
        quotes = results.quotes || [];
      } else if (type === 'losers') {
        // Use screener for day losers (dailyLosers is deprecated)
        results = await this.yf.screener({ scrIds: 'day_losers', count: 20 });
        quotes = results.quotes || [];
      } else {
        // Default: most active
        results = await this.yf.screener({ scrIds: 'most_actives', count: 20 });
        quotes = results.quotes || [];
      }

      logger.info('Market movers fetched', { type, count: quotes.length });

      // Screener returns full quote data, map to our format
      return quotes.slice(0, 20).map(q => ({
        symbol: q.symbol,
        shortName: q.shortName,
        longName: q.longName,
        regularMarketPrice: q.regularMarketPrice,
        regularMarketChange: q.regularMarketChange,
        regularMarketChangePercent: q.regularMarketChangePercent,
        regularMarketVolume: q.regularMarketVolume,
        regularMarketDayHigh: q.regularMarketDayHigh,
        regularMarketDayLow: q.regularMarketDayLow,
        regularMarketOpen: q.regularMarketOpen,
        regularMarketPreviousClose: q.regularMarketPreviousClose,
        marketCap: q.marketCap,
        fiftyTwoWeekHigh: q.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: q.fiftyTwoWeekLow,
        fiftyDayAverage: q.fiftyDayAverage,
        twoHundredDayAverage: q.twoHundredDayAverage,
        trailingPE: q.trailingPE,
        forwardPE: q.forwardPE,
        trailingAnnualDividendYield: q.trailingAnnualDividendYield,
        dividendYield: q.dividendYield,
        averageDailyVolume3Month: q.averageDailyVolume3Month,
        exchange: q.exchange,
        quoteType: q.quoteType,
        epsTrailingTwelveMonths: q.epsTrailingTwelveMonths,
        bookValue: q.bookValue,
        priceToBook: q.priceToBook,
      }));
    } catch (error) {
      logger.error('Failed to fetch market movers', { type, error: error.message });
      return [];
    }
  }
}

module.exports = YahooFinanceClient;
