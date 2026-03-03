/**
 * FRED (Federal Reserve Economic Data) API Client
 *
 * SOLID Principles Applied:
 * - Single Responsibility: FRED macro data retrieval only
 * - Open/Closed: Extensible without modification
 * - Liskov Substitution: Extends BaseApiClient
 *
 * Data Provided:
 * - Federal Funds Rate
 * - Treasury Yields (2Y, 10Y, 30Y)
 * - Inflation (CPI, PCE)
 * - GDP Growth
 * - Unemployment Rate
 * - Consumer Confidence
 * - Leading Economic Indicators
 *
 * Rate Limit: 120 requests/minute (free tier)
 */

const BaseApiClient = require('./BaseApiClient');

class FREDClient extends BaseApiClient {
  constructor() {
    super({
      name: 'FRED',
      baseURL: 'https://api.stlouisfed.org/fred',
      timeout: 15000,
      maxRetries: 3,
      cacheTTL: 86400, // 24 hours for macro data (updates daily)
    });

    this.apiKey = process.env.FRED_API_KEY;
    if (!this.apiKey) {
      this.logger.warn('FRED_API_KEY not configured');
    }

    // Common FRED series IDs
    this.SERIES = {
      // Interest Rates
      FED_FUNDS: 'FEDFUNDS', // Federal Funds Rate
      TREASURY_2Y: 'DGS2', // 2-Year Treasury
      TREASURY_10Y: 'DGS10', // 10-Year Treasury
      TREASURY_30Y: 'DGS30', // 30-Year Treasury
      PRIME_RATE: 'DPRIME', // Bank Prime Rate

      // Inflation
      CPI: 'CPIAUCSL', // Consumer Price Index
      CPI_CORE: 'CPILFESL', // Core CPI (less food & energy)
      PCE: 'PCEPI', // Personal Consumption Expenditures
      BREAKEVEN_5Y: 'T5YIE', // 5-Year Breakeven Inflation

      // GDP & Growth
      GDP: 'GDP', // Gross Domestic Product
      GDP_REAL: 'GDPC1', // Real GDP
      GDP_GROWTH: 'A191RL1Q225SBEA', // Real GDP Growth Rate

      // Employment
      UNEMPLOYMENT: 'UNRATE', // Unemployment Rate
      NONFARM_PAYROLLS: 'PAYEMS', // Total Nonfarm Payrolls
      INITIAL_CLAIMS: 'ICSA', // Initial Jobless Claims

      // Consumer
      CONSUMER_SENTIMENT: 'UMCSENT', // U of M Consumer Sentiment
      RETAIL_SALES: 'RSAFS', // Retail Sales
      PERSONAL_INCOME: 'PI', // Personal Income

      // Business
      ISM_MANUFACTURING: 'MANEMP', // Manufacturing Employment
      INDUSTRIAL_PRODUCTION: 'INDPRO', // Industrial Production Index
      CAPACITY_UTILIZATION: 'TCU', // Total Capacity Utilization

      // Markets
      SP500: 'SP500', // S&P 500
      VIX: 'VIXCLS', // CBOE Volatility Index
      YIELD_CURVE: 'T10Y2Y', // 10Y-2Y Treasury Spread (Yield Curve)

      // Housing
      HOUSING_STARTS: 'HOUST', // Housing Starts
      CASE_SHILLER: 'CSUSHPINSA', // Case-Shiller Home Price Index
    };
  }

  /**
   * Check if client is ready
   * @returns {boolean}
   */
  isReady() {
    return !!this.apiKey;
  }

  /**
   * Get single series data
   * @param {string} seriesId - FRED series ID
   * @param {number} limit - Number of observations
   * @returns {Promise<Object>} Series data
   */
  async getSeries(seriesId, limit = 52) {
    if (!this.isReady()) {
      this.logger.warn('FRED API key not configured');
      return null;
    }

    try {
      const data = await this.get('/series/observations', {
        series_id: seriesId,
        api_key: this.apiKey,
        file_type: 'json',
        sort_order: 'desc',
        limit,
      });

      const observations = (data.observations || [])
        .filter((o) => o.value !== '.')
        .map((o) => ({
          date: o.date,
          value: parseFloat(o.value),
        }));

      const latest = observations[0];
      const previous = observations[1];
      const yearAgo = observations.find((o) => {
        const obsDate = new Date(o.date);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return obsDate <= oneYearAgo;
      });

      return {
        seriesId,
        latest: latest?.value,
        latestDate: latest?.date,
        previous: previous?.value,
        change: latest && previous ? latest.value - previous.value : null,
        changePercent: latest && previous ? ((latest.value - previous.value) / previous.value) * 100 : null,
        yearAgoValue: yearAgo?.value,
        yearOverYearChange: latest && yearAgo ? ((latest.value - yearAgo.value) / yearAgo.value) * 100 : null,
        observations: observations.slice(0, 12), // Last 12 observations
      };
    } catch (error) {
      this.logger.error(`Failed to get FRED series ${seriesId}`, error);
      return null;
    }
  }

  /**
   * Get comprehensive macro overview
   * @returns {Promise<Object>} Macro economic data
   */
  async getMacroOverview() {
    if (!this.isReady()) return null;

    try {
      const [fedFunds, treasury10y, treasury2y, unemployment, cpi, gdpGrowth, vix, yieldCurve, consumerSentiment] = await Promise.all([
        this.getSeries(this.SERIES.FED_FUNDS, 12),
        this.getSeries(this.SERIES.TREASURY_10Y, 52),
        this.getSeries(this.SERIES.TREASURY_2Y, 52),
        this.getSeries(this.SERIES.UNEMPLOYMENT, 24),
        this.getSeries(this.SERIES.CPI, 24),
        this.getSeries(this.SERIES.GDP_GROWTH, 8),
        this.getSeries(this.SERIES.VIX, 52),
        this.getSeries(this.SERIES.YIELD_CURVE, 52),
        this.getSeries(this.SERIES.CONSUMER_SENTIMENT, 12),
      ]);

      // Calculate macro health score (0-100)
      const macroScore = this._calculateMacroScore({
        fedFunds,
        unemployment,
        cpi,
        gdpGrowth,
        yieldCurve,
        vix,
        consumerSentiment,
      });

      return {
        interestRates: {
          fedFunds: fedFunds?.latest,
          treasury2y: treasury2y?.latest,
          treasury10y: treasury10y?.latest,
          spread: treasury10y && treasury2y ? treasury10y.latest - treasury2y.latest : null,
          yieldCurveInverted: yieldCurve?.latest < 0,
        },
        inflation: {
          cpi: cpi?.latest,
          cpiYoY: cpi?.yearOverYearChange,
          trend: cpi?.change > 0 ? 'rising' : 'falling',
        },
        growth: {
          gdpGrowth: gdpGrowth?.latest,
          unemployment: unemployment?.latest,
          unemploymentTrend: unemployment?.change < 0 ? 'improving' : 'worsening',
        },
        sentiment: {
          vix: vix?.latest,
          vixTrend: vix?.latest > 20 ? 'elevated' : 'normal',
          consumerSentiment: consumerSentiment?.latest,
        },
        macroScore,
        macroSignal: this._getMacroSignal(macroScore),
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get macro overview', error);
      return null;
    }
  }

  /**
   * Get sector rotation indicators
   * @returns {Promise<Object>} Sector indicators
   */
  async getSectorIndicators() {
    if (!this.isReady()) return null;

    try {
      const [yieldCurve, manufacturing, industrialProd, housingStarts, retailSales] = await Promise.all([
        this.getSeries(this.SERIES.YIELD_CURVE, 24),
        this.getSeries(this.SERIES.ISM_MANUFACTURING, 12),
        this.getSeries(this.SERIES.INDUSTRIAL_PRODUCTION, 12),
        this.getSeries(this.SERIES.HOUSING_STARTS, 12),
        this.getSeries(this.SERIES.RETAIL_SALES, 12),
      ]);

      // Determine economic cycle phase
      const cyclePhase = this._determineEconomicCycle({
        yieldCurve,
        industrialProd,
      });

      return {
        yieldCurve: {
          spread: yieldCurve?.latest,
          inverted: yieldCurve?.latest < 0,
          recessionSignal: yieldCurve?.observations?.filter((o) => o.value < 0).length >= 3,
        },
        sectors: {
          manufacturing: {
            value: manufacturing?.latest,
            trend: manufacturing?.change > 0 ? 'expanding' : 'contracting',
          },
          industrial: {
            value: industrialProd?.latest,
            growth: industrialProd?.changePercent,
          },
          housing: {
            value: housingStarts?.latest,
            trend: housingStarts?.change > 0 ? 'growing' : 'declining',
          },
          consumer: {
            retailSales: retailSales?.latest,
            growth: retailSales?.changePercent,
          },
        },
        cyclePhase,
        sectorRecommendations: this._getSectorRecommendations(cyclePhase),
      };
    } catch (error) {
      this.logger.error('Failed to get sector indicators', error);
      return null;
    }
  }

  /**
   * Calculate macro health score
   * @private
   */
  _calculateMacroScore(data) {
    let score = 50; // Base score

    // Unemployment: low is good
    if (data.unemployment?.latest) {
      const unemp = data.unemployment.latest;
      if (unemp < 4) score += 15;
      else if (unemp < 5) score += 10;
      else if (unemp < 6) score += 5;
      else if (unemp > 7) score -= 10;
    }

    // GDP Growth: positive is good
    if (data.gdpGrowth?.latest) {
      const gdp = data.gdpGrowth.latest;
      if (gdp > 3) score += 15;
      else if (gdp > 2) score += 10;
      else if (gdp > 0) score += 5;
      else score -= 15;
    }

    // Inflation: moderate is ideal (2-3%)
    if (data.cpi?.yearOverYearChange) {
      const inflation = data.cpi.yearOverYearChange;
      if (inflation >= 2 && inflation <= 3) score += 10;
      else if (inflation < 2) score += 5;
      else if (inflation > 4) score -= 10;
      else if (inflation > 6) score -= 20;
    }

    // VIX: low is good
    if (data.vix?.latest) {
      const vix = data.vix.latest;
      if (vix < 15) score += 10;
      else if (vix < 20) score += 5;
      else if (vix > 30) score -= 10;
      else if (vix > 40) score -= 20;
    }

    // Yield Curve: positive is good
    if (data.yieldCurve?.latest !== undefined) {
      if (data.yieldCurve.latest > 0.5) score += 10;
      else if (data.yieldCurve.latest > 0) score += 5;
      else score -= 15; // Inverted = recession warning
    }

    // Consumer Sentiment
    if (data.consumerSentiment?.latest) {
      const sentiment = data.consumerSentiment.latest;
      if (sentiment > 90) score += 10;
      else if (sentiment > 80) score += 5;
      else if (sentiment < 60) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get macro signal based on score
   * @private
   */
  _getMacroSignal(score) {
    if (score >= 75) return { signal: 'very_bullish', label: 'Strong Economy', color: 'green' };
    if (score >= 60) return { signal: 'bullish', label: 'Healthy Economy', color: 'lightgreen' };
    if (score >= 45) return { signal: 'neutral', label: 'Mixed Signals', color: 'yellow' };
    if (score >= 30) return { signal: 'bearish', label: 'Weakening Economy', color: 'orange' };
    return { signal: 'very_bearish', label: 'Recession Risk', color: 'red' };
  }

  /**
   * Determine economic cycle phase
   * @private
   */
  _determineEconomicCycle(data) {
    const yieldCurvePositive = data.yieldCurve?.latest > 0;
    const industrialGrowing = data.industrialProd?.changePercent > 0;

    if (yieldCurvePositive && industrialGrowing) {
      return { phase: 'expansion', label: 'Economic Expansion' };
    } else if (!yieldCurvePositive && industrialGrowing) {
      return { phase: 'late_cycle', label: 'Late Cycle' };
    } else if (!yieldCurvePositive && !industrialGrowing) {
      return { phase: 'contraction', label: 'Contraction/Recession' };
    } else {
      return { phase: 'recovery', label: 'Early Recovery' };
    }
  }

  /**
   * Get sector recommendations by cycle phase
   * @private
   */
  _getSectorRecommendations(cycle) {
    const recommendations = {
      expansion: {
        overweight: ['Technology', 'Industrials', 'Consumer Discretionary'],
        underweight: ['Utilities', 'Consumer Staples', 'Healthcare'],
      },
      late_cycle: {
        overweight: ['Energy', 'Materials', 'Healthcare'],
        underweight: ['Technology', 'Consumer Discretionary'],
      },
      contraction: {
        overweight: ['Consumer Staples', 'Utilities', 'Healthcare'],
        underweight: ['Financials', 'Industrials', 'Energy'],
      },
      recovery: {
        overweight: ['Financials', 'Consumer Discretionary', 'Real Estate'],
        underweight: ['Consumer Staples', 'Utilities'],
      },
    };

    return recommendations[cycle.phase] || recommendations.expansion;
  }
}

module.exports = FREDClient;
