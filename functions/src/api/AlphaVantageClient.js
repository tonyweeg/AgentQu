/**
 * Alpha Vantage API Client
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Technical analysis data only
 * - Open/Closed: Extensible without modification
 * - Liskov Substitution: Extends BaseApiClient
 *
 * Data Provided:
 * - Technical Indicators (RSI, MACD, Bollinger Bands, etc.)
 * - Intraday price data
 * - Daily adjusted prices
 *
 * Rate Limit: 25 requests/day (free tier) - USE SPARINGLY
 */

const BaseApiClient = require('./BaseApiClient');

class AlphaVantageClient extends BaseApiClient {
  constructor() {
    super({
      name: 'ALPHA_VANTAGE',
      baseURL: 'https://www.alphavantage.co/query',
      timeout: 15000,
      maxRetries: 2,
      cacheTTL: 900, // 15 minutes (use sparingly due to rate limits)
    });

    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!this.apiKey) {
      this.logger.warn('ALPHA_VANTAGE_API_KEY not configured');
    }

    // Track daily usage (25 req/day limit)
    this.dailyUsage = 0;
    this.usageResetDate = new Date().toDateString();
  }

  /**
   * Check if client is ready and has quota
   * @returns {boolean}
   */
  isReady() {
    // Reset usage counter if new day
    const today = new Date().toDateString();
    if (today !== this.usageResetDate) {
      this.dailyUsage = 0;
      this.usageResetDate = today;
    }

    return !!this.apiKey && this.dailyUsage < 25;
  }

  /**
   * Track API usage
   * @private
   */
  _trackUsage() {
    this.dailyUsage++;
    this.logger.debug(`Alpha Vantage usage: ${this.dailyUsage}/25 today`);
  }

  /**
   * Get RSI (Relative Strength Index)
   * @param {string} symbol - Stock symbol
   * @param {string} interval - Time interval ('daily', 'weekly', '60min', etc.)
   * @param {number} timePeriod - RSI period (default 14)
   * @returns {Promise<Object>} RSI data
   */
  async getRSI(symbol, interval = 'daily', timePeriod = 14) {
    if (!this.isReady()) {
      this.logger.warn('Alpha Vantage not available (no key or quota exceeded)');
      return null;
    }

    try {
      this._trackUsage();
      const data = await this.get('', {
        function: 'RSI',
        symbol: symbol.toUpperCase(),
        interval,
        time_period: timePeriod,
        series_type: 'close',
        apikey: this.apiKey,
      });

      const rsiKey = `Technical Analysis: RSI`;
      const rsiData = data[rsiKey];
      if (!rsiData) return null;

      const entries = Object.entries(rsiData).slice(0, 10);
      const values = entries.map(([date, val]) => ({
        date,
        rsi: parseFloat(val.RSI),
      }));

      const latest = values[0];

      return {
        symbol: symbol.toUpperCase(),
        indicator: 'RSI',
        period: timePeriod,
        latest: latest?.rsi,
        latestDate: latest?.date,
        signal: this._getRSISignal(latest?.rsi),
        history: values,
      };
    } catch (error) {
      this.logger.error(`Failed to get RSI for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Get MACD (Moving Average Convergence Divergence)
   * @param {string} symbol - Stock symbol
   * @param {string} interval - Time interval
   * @returns {Promise<Object>} MACD data
   */
  async getMACD(symbol, interval = 'daily') {
    if (!this.isReady()) return null;

    try {
      this._trackUsage();
      const data = await this.get('', {
        function: 'MACD',
        symbol: symbol.toUpperCase(),
        interval,
        series_type: 'close',
        apikey: this.apiKey,
      });

      const macdKey = `Technical Analysis: MACD`;
      const macdData = data[macdKey];
      if (!macdData) return null;

      const entries = Object.entries(macdData).slice(0, 10);
      const values = entries.map(([date, val]) => ({
        date,
        macd: parseFloat(val.MACD),
        signal: parseFloat(val.MACD_Signal),
        histogram: parseFloat(val.MACD_Hist),
      }));

      const latest = values[0];
      const previous = values[1];

      // Detect crossover
      let crossover = 'none';
      if (latest && previous) {
        if (latest.macd > latest.signal && previous.macd <= previous.signal) {
          crossover = 'bullish'; // Golden cross
        } else if (latest.macd < latest.signal && previous.macd >= previous.signal) {
          crossover = 'bearish'; // Death cross
        }
      }

      return {
        symbol: symbol.toUpperCase(),
        indicator: 'MACD',
        latest: {
          macd: latest?.macd,
          signal: latest?.signal,
          histogram: latest?.histogram,
        },
        latestDate: latest?.date,
        crossover,
        trend: latest?.histogram > 0 ? 'bullish' : 'bearish',
        momentum: latest?.histogram > previous?.histogram ? 'strengthening' : 'weakening',
        history: values,
      };
    } catch (error) {
      this.logger.error(`Failed to get MACD for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Get Bollinger Bands
   * @param {string} symbol - Stock symbol
   * @param {string} interval - Time interval
   * @param {number} timePeriod - Period (default 20)
   * @returns {Promise<Object>} Bollinger Bands data
   */
  async getBollingerBands(symbol, interval = 'daily', timePeriod = 20) {
    if (!this.isReady()) return null;

    try {
      this._trackUsage();
      const data = await this.get('', {
        function: 'BBANDS',
        symbol: symbol.toUpperCase(),
        interval,
        time_period: timePeriod,
        series_type: 'close',
        nbdevup: 2,
        nbdevdn: 2,
        apikey: this.apiKey,
      });

      const bbKey = `Technical Analysis: BBANDS`;
      const bbData = data[bbKey];
      if (!bbData) return null;

      const entries = Object.entries(bbData).slice(0, 10);
      const values = entries.map(([date, val]) => ({
        date,
        upper: parseFloat(val['Real Upper Band']),
        middle: parseFloat(val['Real Middle Band']),
        lower: parseFloat(val['Real Lower Band']),
      }));

      const latest = values[0];
      const bandWidth = latest ? ((latest.upper - latest.lower) / latest.middle) * 100 : null;

      return {
        symbol: symbol.toUpperCase(),
        indicator: 'Bollinger Bands',
        period: timePeriod,
        latest: {
          upper: latest?.upper,
          middle: latest?.middle,
          lower: latest?.lower,
        },
        latestDate: latest?.date,
        bandWidth,
        volatility: bandWidth > 4 ? 'high' : bandWidth > 2 ? 'normal' : 'low',
        history: values,
      };
    } catch (error) {
      this.logger.error(`Failed to get Bollinger Bands for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Get SMA (Simple Moving Average)
   * @param {string} symbol - Stock symbol
   * @param {string} interval - Time interval
   * @param {number} timePeriod - Period (e.g., 20, 50, 200)
   * @returns {Promise<Object>} SMA data
   */
  async getSMA(symbol, interval = 'daily', timePeriod = 50) {
    if (!this.isReady()) return null;

    try {
      this._trackUsage();
      const data = await this.get('', {
        function: 'SMA',
        symbol: symbol.toUpperCase(),
        interval,
        time_period: timePeriod,
        series_type: 'close',
        apikey: this.apiKey,
      });

      const smaKey = `Technical Analysis: SMA`;
      const smaData = data[smaKey];
      if (!smaData) return null;

      const entries = Object.entries(smaData).slice(0, 10);
      const values = entries.map(([date, val]) => ({
        date,
        sma: parseFloat(val.SMA),
      }));

      return {
        symbol: symbol.toUpperCase(),
        indicator: `SMA${timePeriod}`,
        period: timePeriod,
        latest: values[0]?.sma,
        latestDate: values[0]?.date,
        history: values,
      };
    } catch (error) {
      this.logger.error(`Failed to get SMA for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Get EMA (Exponential Moving Average)
   * @param {string} symbol - Stock symbol
   * @param {string} interval - Time interval
   * @param {number} timePeriod - Period
   * @returns {Promise<Object>} EMA data
   */
  async getEMA(symbol, interval = 'daily', timePeriod = 20) {
    if (!this.isReady()) return null;

    try {
      this._trackUsage();
      const data = await this.get('', {
        function: 'EMA',
        symbol: symbol.toUpperCase(),
        interval,
        time_period: timePeriod,
        series_type: 'close',
        apikey: this.apiKey,
      });

      const emaKey = `Technical Analysis: EMA`;
      const emaData = data[emaKey];
      if (!emaData) return null;

      const entries = Object.entries(emaData).slice(0, 10);
      const values = entries.map(([date, val]) => ({
        date,
        ema: parseFloat(val.EMA),
      }));

      return {
        symbol: symbol.toUpperCase(),
        indicator: `EMA${timePeriod}`,
        period: timePeriod,
        latest: values[0]?.ema,
        latestDate: values[0]?.date,
        history: values,
      };
    } catch (error) {
      this.logger.error(`Failed to get EMA for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Get ADX (Average Directional Index) - Trend Strength
   * @param {string} symbol - Stock symbol
   * @param {string} interval - Time interval
   * @param {number} timePeriod - Period (default 14)
   * @returns {Promise<Object>} ADX data
   */
  async getADX(symbol, interval = 'daily', timePeriod = 14) {
    if (!this.isReady()) return null;

    try {
      this._trackUsage();
      const data = await this.get('', {
        function: 'ADX',
        symbol: symbol.toUpperCase(),
        interval,
        time_period: timePeriod,
        apikey: this.apiKey,
      });

      const adxKey = `Technical Analysis: ADX`;
      const adxData = data[adxKey];
      if (!adxData) return null;

      const entries = Object.entries(adxData).slice(0, 10);
      const values = entries.map(([date, val]) => ({
        date,
        adx: parseFloat(val.ADX),
      }));

      const latest = values[0]?.adx;

      return {
        symbol: symbol.toUpperCase(),
        indicator: 'ADX',
        period: timePeriod,
        latest,
        latestDate: values[0]?.date,
        trendStrength: this._getADXStrength(latest),
        history: values,
      };
    } catch (error) {
      this.logger.error(`Failed to get ADX for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Get comprehensive technical analysis (uses multiple API calls)
   * WARNING: Uses 4 API calls - use sparingly!
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Complete technical analysis
   */
  async getTechnicalAnalysis(symbol) {
    if (!this.isReady()) {
      this.logger.warn('Alpha Vantage quota low or unavailable');
      return null;
    }

    try {
      // Get multiple indicators in parallel (4 API calls)
      const [rsi, macd, bollinger, adx] = await Promise.all([
        this.getRSI(symbol),
        this.getMACD(symbol),
        this.getBollingerBands(symbol),
        this.getADX(symbol),
      ]);

      // Calculate composite technical score
      const technicalScore = this._calculateTechnicalScore({ rsi, macd, bollinger, adx });

      return {
        symbol: symbol.toUpperCase(),
        rsi,
        macd,
        bollinger,
        adx,
        technicalScore,
        technicalSignal: this._getTechnicalSignal(technicalScore),
        quotaRemaining: 25 - this.dailyUsage,
      };
    } catch (error) {
      this.logger.error(`Failed to get technical analysis for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Get remaining API quota
   * @returns {Object} Quota information
   */
  getQuotaStatus() {
    return {
      dailyLimit: 25,
      used: this.dailyUsage,
      remaining: 25 - this.dailyUsage,
      resetDate: this.usageResetDate,
    };
  }

  /**
   * Get RSI signal interpretation
   * @private
   */
  _getRSISignal(rsi) {
    if (rsi === null || rsi === undefined) return { signal: 'unknown', label: 'No Data' };
    if (rsi >= 70) return { signal: 'overbought', label: 'Overbought', action: 'Consider selling' };
    if (rsi >= 60) return { signal: 'bullish', label: 'Bullish', action: 'Hold/Monitor' };
    if (rsi >= 40) return { signal: 'neutral', label: 'Neutral', action: 'No action' };
    if (rsi >= 30) return { signal: 'bearish', label: 'Bearish', action: 'Hold/Monitor' };
    return { signal: 'oversold', label: 'Oversold', action: 'Consider buying' };
  }

  /**
   * Get ADX trend strength
   * @private
   */
  _getADXStrength(adx) {
    if (adx === null || adx === undefined) return { strength: 'unknown', label: 'No Data' };
    if (adx >= 50) return { strength: 'very_strong', label: 'Very Strong Trend' };
    if (adx >= 25) return { strength: 'strong', label: 'Strong Trend' };
    if (adx >= 20) return { strength: 'developing', label: 'Developing Trend' };
    return { strength: 'weak', label: 'Weak/No Trend' };
  }

  /**
   * Calculate composite technical score
   * @private
   */
  _calculateTechnicalScore(indicators) {
    let score = 50; // Base neutral score

    // RSI contribution
    if (indicators.rsi?.latest) {
      const rsi = indicators.rsi.latest;
      if (rsi < 30) score += 15; // Oversold = bullish
      else if (rsi > 70) score -= 15; // Overbought = bearish
      else if (rsi > 50) score += 5;
      else score -= 5;
    }

    // MACD contribution
    if (indicators.macd) {
      if (indicators.macd.crossover === 'bullish') score += 15;
      else if (indicators.macd.crossover === 'bearish') score -= 15;

      if (indicators.macd.momentum === 'strengthening') {
        score += indicators.macd.trend === 'bullish' ? 10 : -10;
      }
    }

    // Bollinger Bands contribution
    if (indicators.bollinger?.volatility === 'low') {
      score += 5; // Low volatility often precedes breakout
    }

    // ADX contribution (trend strength)
    if (indicators.adx?.trendStrength?.strength === 'strong' || indicators.adx?.trendStrength?.strength === 'very_strong') {
      score += 5; // Strong trend is tradeable
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get technical signal from score
   * @private
   */
  _getTechnicalSignal(score) {
    if (score >= 70) return { signal: 'strong_buy', label: 'Strong Buy', color: 'green' };
    if (score >= 55) return { signal: 'buy', label: 'Buy', color: 'lightgreen' };
    if (score >= 45) return { signal: 'hold', label: 'Hold', color: 'yellow' };
    if (score >= 30) return { signal: 'sell', label: 'Sell', color: 'orange' };
    return { signal: 'strong_sell', label: 'Strong Sell', color: 'red' };
  }
}

module.exports = AlphaVantageClient;
