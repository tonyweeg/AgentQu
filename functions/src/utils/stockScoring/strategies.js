/**
 * Stock Scoring Strategies - 10 Wall Street Analysis Frameworks + User Preference
 *
 * Each strategy implements a different investment analysis methodology
 * inspired by major Wall Street firms and academic research.
 */

const StockScoringStrategy = require('./StockScoringStrategy');

/**
 * 1. Goldman Sachs Style Screener - Valuation Focus
 *
 * Evaluates: P/E ratio, P/B ratio, PEG ratio, EV/EBITDA
 * Philosophy: Buy quality companies at reasonable prices
 */
class ValuationScoringStrategy extends StockScoringStrategy {
  constructor(maxPoints = 25) {
    super('Valuation', maxPoints, 'Goldman Sachs Style - Value screening based on P/E, P/B, PEG, EV/EBITDA');
  }

  calculate(stock, context) {
    let score = 0;
    const reasons = [];

    // P/E Ratio (lower is better, but not too low)
    if (stock.metrics?.peRatio) {
      const pe = stock.metrics.peRatio;
      if (pe > 0 && pe < 10) {
        score += 5;
        reasons.push('Low P/E (possibly undervalued or value trap)');
      } else if (pe >= 10 && pe <= 20) {
        score += 7;
        reasons.push('Reasonable P/E ratio');
      } else if (pe > 20 && pe <= 30) {
        score += 4;
        reasons.push('Moderate P/E (growth stock)');
      } else if (pe > 30) {
        score += 2;
        reasons.push('High P/E (expensive)');
      }
    }

    // P/B Ratio
    if (stock.metrics?.pbRatio) {
      const pb = stock.metrics.pbRatio;
      if (pb > 0 && pb < 1.5) {
        score += 5;
        reasons.push('Low P/B (asset value)');
      } else if (pb >= 1.5 && pb <= 3) {
        score += 4;
        reasons.push('Fair P/B ratio');
      } else {
        score += 2;
        reasons.push('High P/B');
      }
    }

    // PEG Ratio (P/E to Growth)
    if (stock.metrics?.pegRatio) {
      const peg = stock.metrics.pegRatio;
      if (peg > 0 && peg < 1) {
        score += 7;
        reasons.push('Excellent PEG < 1 (undervalued growth)');
      } else if (peg >= 1 && peg <= 2) {
        score += 5;
        reasons.push('Reasonable PEG ratio');
      } else {
        score += 2;
        reasons.push('High PEG ratio');
      }
    }

    // EV/EBITDA
    if (stock.metrics?.evEbitda) {
      const evEbitda = stock.metrics.evEbitda;
      if (evEbitda > 0 && evEbitda < 10) {
        score += 6;
        reasons.push('Attractive EV/EBITDA');
      } else if (evEbitda >= 10 && evEbitda <= 15) {
        score += 4;
        reasons.push('Fair EV/EBITDA');
      } else {
        score += 2;
        reasons.push('Expensive EV/EBITDA');
      }
    }

    const finalScore = Math.min(score, this.maxPoints);
    this.logScore(stock.symbol, finalScore, { reasons });

    return {
      points: finalScore,
      maxPoints: this.maxPoints,
      reasons,
      signal: finalScore >= 20 ? 'undervalued' : finalScore >= 15 ? 'fair' : 'expensive',
    };
  }
}

/**
 * 2. Morgan Stanley Style DCF - Intrinsic Value
 *
 * Evaluates: Cash flow, growth rate, discount rate
 * Philosophy: Calculate what a stock is truly worth
 */
class IntrinsicValueScoringStrategy extends StockScoringStrategy {
  constructor(maxPoints = 25) {
    super('IntrinsicValue', maxPoints, 'Morgan Stanley Style - DCF-inspired intrinsic value estimation');
  }

  calculate(stock, context) {
    let score = 0;
    const reasons = [];

    // Free Cash Flow Yield
    if (stock.metrics?.freeCashflow && stock.quote?.marketCap) {
      const fcfYield = (stock.metrics.freeCashflow / stock.quote.marketCap) * 100;
      if (fcfYield > 8) {
        score += 8;
        reasons.push(`Strong FCF yield (${fcfYield.toFixed(1)}%)`);
      } else if (fcfYield > 4) {
        score += 5;
        reasons.push(`Decent FCF yield (${fcfYield.toFixed(1)}%)`);
      } else if (fcfYield > 0) {
        score += 3;
        reasons.push('Positive FCF');
      }
    }

    // Price vs Target (upside potential)
    if (stock.priceTarget?.targetMean && stock.quote?.regularMarketPrice) {
      const currentPrice = stock.quote.regularMarketPrice;
      const upside = ((stock.priceTarget.targetMean - currentPrice) / currentPrice) * 100;

      if (upside > 30) {
        score += 8;
        reasons.push(`High upside potential (${upside.toFixed(0)}%)`);
      } else if (upside > 15) {
        score += 6;
        reasons.push(`Good upside potential (${upside.toFixed(0)}%)`);
      } else if (upside > 0) {
        score += 3;
        reasons.push(`Some upside (${upside.toFixed(0)}%)`);
      } else {
        reasons.push(`Trading above target (${upside.toFixed(0)}%)`);
      }
    }

    // Earnings Growth
    if (stock.metrics?.epsGrowth) {
      const growth = stock.metrics.epsGrowth;
      if (growth > 20) {
        score += 6;
        reasons.push('Strong earnings growth');
      } else if (growth > 10) {
        score += 4;
        reasons.push('Solid earnings growth');
      } else if (growth > 0) {
        score += 2;
        reasons.push('Positive earnings growth');
      }
    }

    // Revenue Growth
    if (stock.metrics?.revenueGrowth) {
      const growth = stock.metrics.revenueGrowth * 100;
      if (growth > 15) {
        score += 3;
        reasons.push('Strong revenue growth');
      } else if (growth > 5) {
        score += 2;
        reasons.push('Moderate revenue growth');
      }
    }

    const finalScore = Math.min(score, this.maxPoints);
    this.logScore(stock.symbol, finalScore, { reasons });

    return {
      points: finalScore,
      maxPoints: this.maxPoints,
      reasons,
      signal: finalScore >= 18 ? 'undervalued' : finalScore >= 12 ? 'fair' : 'overvalued',
    };
  }
}

/**
 * 3. Bridgewater Style - Risk Assessment
 *
 * Evaluates: Beta, volatility, debt levels, correlation
 * Philosophy: Understand and manage risk systematically
 */
class RiskAssessmentScoringStrategy extends StockScoringStrategy {
  constructor(maxPoints = 20) {
    super('RiskAssessment', maxPoints, 'Bridgewater Style - Systematic risk analysis');
  }

  calculate(stock, context) {
    let score = this.maxPoints; // Start high, deduct for risk
    const reasons = [];

    // Beta (market sensitivity)
    if (stock.metrics?.beta) {
      const beta = stock.metrics.beta;
      if (beta < 0.8) {
        score -= 2;
        reasons.push('Low beta (defensive)');
      } else if (beta >= 0.8 && beta <= 1.2) {
        reasons.push('Moderate beta');
      } else if (beta > 1.5) {
        score -= 5;
        reasons.push('High beta (volatile)');
      } else {
        score -= 3;
        reasons.push('Above-average beta');
      }
    }

    // Debt to Equity
    if (stock.metrics?.debtToEquity) {
      const dte = stock.metrics.debtToEquity;
      if (dte < 0.3) {
        reasons.push('Very low debt');
      } else if (dte <= 1) {
        score -= 2;
        reasons.push('Manageable debt');
      } else if (dte <= 2) {
        score -= 5;
        reasons.push('High debt levels');
      } else {
        score -= 8;
        reasons.push('Excessive debt');
      }
    }

    // Current Ratio (liquidity)
    if (stock.metrics?.currentRatio) {
      const cr = stock.metrics.currentRatio;
      if (cr >= 2) {
        reasons.push('Strong liquidity');
      } else if (cr >= 1.5) {
        score -= 1;
        reasons.push('Adequate liquidity');
      } else if (cr >= 1) {
        score -= 3;
        reasons.push('Tight liquidity');
      } else {
        score -= 5;
        reasons.push('Liquidity concern');
      }
    }

    // Historical Volatility
    if (stock.historical?.stats?.volatility) {
      const vol = stock.historical.stats.volatility * 100;
      if (vol < 20) {
        reasons.push('Low volatility');
      } else if (vol <= 35) {
        score -= 2;
        reasons.push('Moderate volatility');
      } else {
        score -= 5;
        reasons.push('High volatility');
      }
    }

    const finalScore = Math.max(0, Math.min(score, this.maxPoints));
    this.logScore(stock.symbol, finalScore, { reasons });

    return {
      points: finalScore,
      maxPoints: this.maxPoints,
      reasons,
      signal: finalScore >= 15 ? 'low_risk' : finalScore >= 10 ? 'moderate_risk' : 'high_risk',
    };
  }
}

/**
 * 4. JPMorgan Style - Earnings Quality
 *
 * Evaluates: EPS beats, earnings consistency, accrual quality
 * Philosophy: Quality earnings predict future performance
 */
class EarningsQualityScoringStrategy extends StockScoringStrategy {
  constructor(maxPoints = 20) {
    super('EarningsQuality', maxPoints, 'JPMorgan Style - Earnings quality and consistency');
  }

  calculate(stock, context) {
    let score = 0;
    const reasons = [];

    // Earnings Beat Rate
    if (stock.earnings?.beatRate) {
      const beatRate = stock.earnings.beatRate;
      if (beatRate >= 80) {
        score += 7;
        reasons.push(`Excellent beat rate (${beatRate.toFixed(0)}%)`);
      } else if (beatRate >= 60) {
        score += 5;
        reasons.push(`Good beat rate (${beatRate.toFixed(0)}%)`);
      } else if (beatRate >= 40) {
        score += 3;
        reasons.push('Average beat rate');
      } else {
        score += 1;
        reasons.push('Poor beat rate');
      }
    }

    // Average Surprise
    if (stock.earnings?.averageSurprise) {
      const surprise = stock.earnings.averageSurprise;
      if (surprise > 10) {
        score += 5;
        reasons.push('Strong positive surprises');
      } else if (surprise > 5) {
        score += 4;
        reasons.push('Positive surprises');
      } else if (surprise > 0) {
        score += 2;
        reasons.push('Slight positive surprises');
      }
    }

    // Profit Margins
    if (stock.metrics?.netMargin) {
      const margin = stock.metrics.netMargin;
      if (margin > 20) {
        score += 5;
        reasons.push('High profit margins');
      } else if (margin > 10) {
        score += 3;
        reasons.push('Healthy margins');
      } else if (margin > 5) {
        score += 2;
        reasons.push('Thin margins');
      }
    }

    // ROE (Return on Equity)
    if (stock.metrics?.roe) {
      const roe = stock.metrics.roe;
      if (roe > 20) {
        score += 3;
        reasons.push('Excellent ROE');
      } else if (roe > 15) {
        score += 2;
        reasons.push('Good ROE');
      }
    }

    const finalScore = Math.min(score, this.maxPoints);
    this.logScore(stock.symbol, finalScore, { reasons });

    return {
      points: finalScore,
      maxPoints: this.maxPoints,
      reasons,
      signal: finalScore >= 15 ? 'high_quality' : finalScore >= 10 ? 'average_quality' : 'low_quality',
    };
  }
}

/**
 * 5. BlackRock Style - Portfolio Fit
 *
 * Evaluates: Correlation, sector exposure, diversification benefit
 * Philosophy: Build better portfolios through smart allocation
 */
class PortfolioFitScoringStrategy extends StockScoringStrategy {
  constructor(maxPoints = 15) {
    super('PortfolioFit', maxPoints, 'BlackRock Style - Portfolio construction and fit');
  }

  calculate(stock, context) {
    let score = 0;
    const reasons = [];

    // Market Cap Category
    if (stock.quote?.marketCap) {
      const marketCap = stock.quote.marketCap;
      if (marketCap > 200e9) {
        score += 4;
        reasons.push('Mega-cap (stable, liquid)');
      } else if (marketCap > 10e9) {
        score += 5;
        reasons.push('Large-cap (quality, liquid)');
      } else if (marketCap > 2e9) {
        score += 4;
        reasons.push('Mid-cap (growth potential)');
      } else {
        score += 2;
        reasons.push('Small-cap (higher risk)');
      }
    }

    // Sector Diversification Benefit
    if (stock.profile?.industry && context.portfolio) {
      const sectorWeight = context.portfolio.sectorWeights?.[stock.profile.industry] || 0;
      if (sectorWeight < 10) {
        score += 5;
        reasons.push('Adds sector diversification');
      } else if (sectorWeight < 20) {
        score += 3;
        reasons.push('Moderate sector exposure');
      } else {
        score += 1;
        reasons.push('Concentrated sector');
      }
    } else {
      score += 3; // Neutral if no portfolio context
    }

    // Beta contribution (for portfolio balance)
    if (stock.metrics?.beta) {
      const beta = stock.metrics.beta;
      if (beta >= 0.9 && beta <= 1.1) {
        score += 3;
        reasons.push('Market-tracking beta');
      } else if (beta < 0.8) {
        score += 2;
        reasons.push('Defensive addition');
      }
    }

    // Liquidity (trading volume)
    if (stock.quote?.averageDailyVolume3Month) {
      const avgVol = stock.quote.averageDailyVolume3Month;
      if (avgVol > 5000000) {
        score += 2;
        reasons.push('Highly liquid');
      } else if (avgVol > 1000000) {
        score += 1;
        reasons.push('Adequate liquidity');
      }
    }

    const finalScore = Math.min(score, this.maxPoints);
    this.logScore(stock.symbol, finalScore, { reasons });

    return {
      points: finalScore,
      maxPoints: this.maxPoints,
      reasons,
      signal: finalScore >= 12 ? 'excellent_fit' : finalScore >= 8 ? 'good_fit' : 'poor_fit',
    };
  }
}

/**
 * 6. Citadel Style - Technical Timing
 *
 * Evaluates: RSI, MACD, moving averages, support/resistance
 * Philosophy: Time entries and exits using technical analysis
 */
class TechnicalTimingScoringStrategy extends StockScoringStrategy {
  constructor(maxPoints = 20) {
    super('TechnicalTiming', maxPoints, 'Citadel Style - Technical analysis and timing');
  }

  calculate(stock, context) {
    let score = 0;
    const reasons = [];

    // RSI
    if (stock.technical?.rsi?.latest) {
      const rsi = stock.technical.rsi.latest;
      if (rsi < 30) {
        score += 6;
        reasons.push(`RSI oversold (${rsi.toFixed(0)})`);
      } else if (rsi >= 30 && rsi <= 50) {
        score += 4;
        reasons.push('RSI showing potential');
      } else if (rsi >= 50 && rsi <= 70) {
        score += 3;
        reasons.push('RSI neutral-bullish');
      } else {
        score += 1;
        reasons.push(`RSI overbought (${rsi.toFixed(0)})`);
      }
    }

    // MACD
    if (stock.technical?.macd) {
      if (stock.technical.macd.crossover === 'bullish') {
        score += 6;
        reasons.push('MACD bullish crossover');
      } else if (stock.technical.macd.crossover === 'bearish') {
        score += 1;
        reasons.push('MACD bearish crossover');
      } else if (stock.technical.macd.trend === 'bullish') {
        score += 4;
        reasons.push('MACD positive');
      } else {
        score += 2;
        reasons.push('MACD negative');
      }
    }

    // Moving Average Position
    if (stock.quote?.regularMarketPrice && stock.quote?.fiftyDayAverage && stock.quote?.twoHundredDayAverage) {
      const price = stock.quote.regularMarketPrice;
      const sma50 = stock.quote.fiftyDayAverage;
      const sma200 = stock.quote.twoHundredDayAverage;

      if (price > sma50 && sma50 > sma200) {
        score += 5;
        reasons.push('Above 50 & 200 MA (uptrend)');
      } else if (price > sma50) {
        score += 3;
        reasons.push('Above 50 MA');
      } else if (price < sma200) {
        score += 1;
        reasons.push('Below 200 MA (downtrend)');
      } else {
        score += 2;
      }
    }

    // ADX (Trend Strength)
    if (stock.technical?.adx?.latest) {
      const adx = stock.technical.adx.latest;
      if (adx > 25) {
        score += 3;
        reasons.push('Strong trend (ADX)');
      } else {
        score += 1;
        reasons.push('Weak trend');
      }
    }

    const finalScore = Math.min(score, this.maxPoints);
    this.logScore(stock.symbol, finalScore, { reasons });

    return {
      points: finalScore,
      maxPoints: this.maxPoints,
      reasons,
      signal: finalScore >= 15 ? 'strong_buy' : finalScore >= 10 ? 'buy' : finalScore >= 6 ? 'hold' : 'sell',
    };
  }
}

/**
 * 7. Harvard Endowment Style - Dividend Quality
 *
 * Evaluates: Dividend yield, payout ratio, dividend growth, dividend safety
 * Philosophy: Sustainable dividends compound wealth
 */
class DividendQualityScoringStrategy extends StockScoringStrategy {
  constructor(maxPoints = 15) {
    super('DividendQuality', maxPoints, 'Harvard Endowment Style - Dividend sustainability and growth');
  }

  calculate(stock, context) {
    let score = 0;
    const reasons = [];

    // Dividend Yield
    if (stock.metrics?.dividendYield) {
      const yield_ = stock.metrics.dividendYield;
      if (yield_ > 4) {
        score += 4;
        reasons.push(`High yield (${yield_.toFixed(1)}%)`);
      } else if (yield_ > 2) {
        score += 5;
        reasons.push(`Solid yield (${yield_.toFixed(1)}%)`);
      } else if (yield_ > 0) {
        score += 3;
        reasons.push(`Modest yield (${yield_.toFixed(1)}%)`);
      } else {
        reasons.push('No dividend');
      }
    }

    // Payout Ratio (sustainability)
    if (stock.metrics?.payoutRatio) {
      const payout = stock.metrics.payoutRatio;
      if (payout > 0 && payout < 50) {
        score += 5;
        reasons.push('Sustainable payout ratio');
      } else if (payout >= 50 && payout <= 75) {
        score += 3;
        reasons.push('Moderate payout ratio');
      } else if (payout > 75 && payout <= 100) {
        score += 1;
        reasons.push('High payout ratio');
      } else if (payout > 100) {
        score -= 2;
        reasons.push('Unsustainable payout');
      }
    }

    // Free Cash Flow Coverage
    if (stock.metrics?.freeCashflow && stock.metrics?.dividendPerShare && stock.quote?.sharesOutstanding) {
      const dividendTotal = stock.metrics.dividendPerShare * stock.quote.sharesOutstanding;
      const fcfCoverage = stock.metrics.freeCashflow / dividendTotal;

      if (fcfCoverage > 2) {
        score += 4;
        reasons.push('Strong FCF dividend coverage');
      } else if (fcfCoverage > 1.5) {
        score += 3;
        reasons.push('Adequate FCF coverage');
      } else if (fcfCoverage > 1) {
        score += 1;
        reasons.push('Tight FCF coverage');
      }
    }

    // Dividend Growth (if available)
    if (stock.dividendGrowth5Y) {
      const growth = stock.dividendGrowth5Y;
      if (growth > 10) {
        score += 2;
        reasons.push('Strong dividend growth');
      } else if (growth > 5) {
        score += 1;
        reasons.push('Steady dividend growth');
      }
    }

    const finalScore = Math.max(0, Math.min(score, this.maxPoints));
    this.logScore(stock.symbol, finalScore, { reasons });

    return {
      points: finalScore,
      maxPoints: this.maxPoints,
      reasons,
      signal: finalScore >= 12 ? 'dividend_champion' : finalScore >= 8 ? 'dividend_solid' : 'dividend_weak',
    };
  }
}

/**
 * 8. Bain Consulting Style - Competitive Position
 *
 * Evaluates: Market share, industry position, moat indicators
 * Philosophy: Durable competitive advantages create value
 */
class CompetitivePositionScoringStrategy extends StockScoringStrategy {
  constructor(maxPoints = 15) {
    super('CompetitivePosition', maxPoints, 'Bain Style - Competitive moat and market position');
  }

  calculate(stock, context) {
    let score = 0;
    const reasons = [];

    // Market Cap as Moat Proxy
    if (stock.quote?.marketCap) {
      const marketCap = stock.quote.marketCap;
      if (marketCap > 500e9) {
        score += 5;
        reasons.push('Industry leader');
      } else if (marketCap > 100e9) {
        score += 4;
        reasons.push('Major player');
      } else if (marketCap > 50e9) {
        score += 3;
        reasons.push('Established player');
      } else {
        score += 1;
        reasons.push('Smaller competitor');
      }
    }

    // Gross Margin (pricing power)
    if (stock.metrics?.grossMargins) {
      const margin = stock.metrics.grossMargins * 100;
      if (margin > 60) {
        score += 4;
        reasons.push('Strong pricing power');
      } else if (margin > 40) {
        score += 3;
        reasons.push('Good gross margins');
      } else if (margin > 25) {
        score += 2;
        reasons.push('Moderate margins');
      }
    }

    // Operating Margin (efficiency)
    if (stock.metrics?.operatingMargin) {
      const opMargin = stock.metrics.operatingMargin;
      if (opMargin > 25) {
        score += 3;
        reasons.push('Excellent operating efficiency');
      } else if (opMargin > 15) {
        score += 2;
        reasons.push('Good operating efficiency');
      }
    }

    // ROE (capital efficiency)
    if (stock.metrics?.roe) {
      const roe = stock.metrics.roe;
      if (roe > 20) {
        score += 3;
        reasons.push('High return on equity');
      } else if (roe > 15) {
        score += 2;
        reasons.push('Solid ROE');
      }
    }

    const finalScore = Math.min(score, this.maxPoints);
    this.logScore(stock.symbol, finalScore, { reasons });

    return {
      points: finalScore,
      maxPoints: this.maxPoints,
      reasons,
      signal: finalScore >= 12 ? 'wide_moat' : finalScore >= 8 ? 'narrow_moat' : 'no_moat',
    };
  }
}

/**
 * 9. Renaissance Technologies Style - Statistical Edge
 *
 * Evaluates: Price patterns, anomalies, mean reversion potential
 * Philosophy: Find statistical edges in price behavior
 */
class StatisticalEdgeScoringStrategy extends StockScoringStrategy {
  constructor(maxPoints = 15) {
    super('StatisticalEdge', maxPoints, 'Renaissance Style - Statistical patterns and anomalies');
  }

  calculate(stock, context) {
    let score = 0;
    const reasons = [];

    // 52-Week Position (mean reversion potential)
    if (stock.quote?.regularMarketPrice && stock.quote?.fiftyTwoWeekHigh && stock.quote?.fiftyTwoWeekLow) {
      const price = stock.quote.regularMarketPrice;
      const high = stock.quote.fiftyTwoWeekHigh;
      const low = stock.quote.fiftyTwoWeekLow;
      const range = high - low;
      const position = range > 0 ? ((price - low) / range) * 100 : 50;

      if (position < 20) {
        score += 5;
        reasons.push('Near 52-week low (mean reversion)');
      } else if (position < 40) {
        score += 4;
        reasons.push('Lower half of range');
      } else if (position > 90) {
        score += 1;
        reasons.push('Near 52-week high');
      } else {
        score += 3;
        reasons.push('Mid-range position');
      }
    }

    // Short Interest (squeeze potential)
    if (stock.metrics?.shortPercentOfFloat) {
      const shortPercent = stock.metrics.shortPercentOfFloat * 100;
      if (shortPercent > 20) {
        score += 4;
        reasons.push('High short interest (squeeze potential)');
      } else if (shortPercent > 10) {
        score += 2;
        reasons.push('Elevated short interest');
      } else {
        score += 1;
        reasons.push('Normal short interest');
      }
    }

    // Institutional Ownership
    if (stock.metrics?.heldPercentInstitutions) {
      const instOwn = stock.metrics.heldPercentInstitutions * 100;
      if (instOwn > 60 && instOwn < 90) {
        score += 3;
        reasons.push('Good institutional ownership');
      } else if (instOwn < 30) {
        score += 1;
        reasons.push('Low institutional interest');
      }
    }

    // Volume Anomaly (unusual activity)
    if (stock.quote?.regularMarketVolume && stock.quote?.averageDailyVolume3Month) {
      const volRatio = stock.quote.regularMarketVolume / stock.quote.averageDailyVolume3Month;
      if (volRatio > 2) {
        score += 3;
        reasons.push('Unusual volume (2x+ average)');
      } else if (volRatio > 1.5) {
        score += 2;
        reasons.push('Above-average volume');
      }
    }

    const finalScore = Math.min(score, this.maxPoints);
    this.logScore(stock.symbol, finalScore, { reasons });

    return {
      points: finalScore,
      maxPoints: this.maxPoints,
      reasons,
      signal: finalScore >= 11 ? 'statistical_opportunity' : finalScore >= 7 ? 'neutral' : 'no_edge',
    };
  }
}

/**
 * 10. McKinsey Style - Macro Alignment
 *
 * Evaluates: Economic cycle fit, sector rotation, macro sensitivity
 * Philosophy: Align investments with macro conditions
 */
class MacroAlignmentScoringStrategy extends StockScoringStrategy {
  constructor(maxPoints = 15) {
    super('MacroAlignment', maxPoints, 'McKinsey Style - Macro economic alignment');
  }

  calculate(stock, context) {
    let score = 0;
    const reasons = [];

    const macro = context.macroData;
    const sector = stock.profile?.industry?.toLowerCase() || '';

    // Cycle Phase Alignment
    if (macro?.cyclePhase) {
      const phase = macro.cyclePhase.phase;
      const recommendations = macro.sectorRecommendations || {};

      // Check if stock's sector is recommended for current phase
      const overweight = (recommendations.overweight || []).map((s) => s.toLowerCase());
      const underweight = (recommendations.underweight || []).map((s) => s.toLowerCase());

      if (overweight.some((s) => sector.includes(s))) {
        score += 5;
        reasons.push(`Sector favored in ${phase}`);
      } else if (underweight.some((s) => sector.includes(s))) {
        score += 1;
        reasons.push(`Sector unfavored in ${phase}`);
      } else {
        score += 3;
        reasons.push('Neutral sector positioning');
      }
    } else {
      score += 3; // Neutral if no macro context
    }

    // Interest Rate Sensitivity
    if (macro?.interestRates?.fedFunds && stock.metrics?.beta) {
      const rates = macro.interestRates.fedFunds;

      // Financials benefit from higher rates
      if (sector.includes('financial') || sector.includes('bank')) {
        if (rates > 4) {
          score += 4;
          reasons.push('Financials benefit from high rates');
        } else {
          score += 2;
        }
      }
      // REITs hurt by higher rates
      else if (sector.includes('real estate') || sector.includes('reit')) {
        if (rates > 5) {
          score += 1;
          reasons.push('REITs pressured by high rates');
        } else {
          score += 3;
        }
      }
      // Growth stocks hurt by higher rates
      else if (stock.metrics.beta > 1.2 && rates > 5) {
        score += 2;
        reasons.push('High rates pressure growth stocks');
      } else {
        score += 3;
      }
    } else {
      score += 3;
    }

    // VIX / Market Sentiment
    if (macro?.sentiment?.vix) {
      const vix = macro.sentiment.vix;
      const beta = stock.metrics?.beta || 1;

      if (vix < 15 && beta > 1) {
        score += 4;
        reasons.push('Low VIX favors risk-on');
      } else if (vix > 25 && beta < 1) {
        score += 4;
        reasons.push('Defensive in high VIX');
      } else if (vix > 30) {
        score += 2;
        reasons.push('Elevated market fear');
      } else {
        score += 3;
      }
    }

    // Economic Growth Alignment
    if (macro?.growth?.gdpGrowth) {
      const gdp = macro.growth.gdpGrowth;
      const cyclical = ['consumer discretionary', 'industrial', 'material', 'energy'].some((s) => sector.includes(s));

      if (gdp > 2.5 && cyclical) {
        score += 3;
        reasons.push('Cyclical aligned with growth');
      } else if (gdp < 1 && !cyclical) {
        score += 3;
        reasons.push('Defensive aligned with slow growth');
      } else {
        score += 2;
      }
    }

    const finalScore = Math.min(score, this.maxPoints);
    this.logScore(stock.symbol, finalScore, { reasons });

    return {
      points: finalScore,
      maxPoints: this.maxPoints,
      reasons,
      signal: finalScore >= 12 ? 'macro_aligned' : finalScore >= 8 ? 'neutral' : 'macro_headwind',
    };
  }
}

/**
 * Bonus: Sector Affinity Strategy - User Preferences
 *
 * Evaluates: Match between stock sector and user preferences
 * Philosophy: Personalized recommendations based on user interests
 */
class SectorAffinityScoringStrategy extends StockScoringStrategy {
  constructor(maxPoints = 20) {
    super('SectorAffinity', maxPoints, 'User sector preference matching');
  }

  calculate(stock, context) {
    let score = 0;
    const reasons = [];

    const userAffinities = context.userPreferences?.sectorAffinities || {};
    const sector = stock.profile?.industry || '';
    const sectorLower = sector.toLowerCase();

    // Check user sector preferences
    if (Object.keys(userAffinities).length > 0) {
      const matchedAffinity = Object.entries(userAffinities).find(([key]) =>
        sectorLower.includes(key.toLowerCase())
      );

      if (matchedAffinity) {
        const [sectorName, affinityScore] = matchedAffinity;
        const normalizedAffinity = this.normalize(affinityScore, 100);
        score = this.scaleToPoints(normalizedAffinity);
        reasons.push(`Matches ${sectorName} preference (${affinityScore}%)`);
      } else {
        score = this.maxPoints * 0.5; // Neutral for unmatched sectors
        reasons.push('Sector not in preferences');
      }
    } else {
      score = this.maxPoints * 0.5; // Neutral if no preferences set
      reasons.push('No sector preferences set');
    }

    // Risk Tolerance Alignment
    if (context.userPreferences?.riskTolerance && stock.metrics?.beta) {
      const riskTolerance = context.userPreferences.riskTolerance;
      const beta = stock.metrics.beta;

      if (riskTolerance === 'conservative' && beta < 1) {
        score += 3;
        reasons.push('Low beta matches conservative risk');
      } else if (riskTolerance === 'aggressive' && beta > 1.2) {
        score += 3;
        reasons.push('High beta matches aggressive risk');
      } else if (riskTolerance === 'moderate' && beta >= 0.8 && beta <= 1.2) {
        score += 2;
        reasons.push('Beta matches moderate risk');
      }
    }

    // Time Horizon Alignment
    if (context.userPreferences?.timeHorizon) {
      const horizon = context.userPreferences.timeHorizon;
      const hasDividend = stock.metrics?.dividendYield > 0;

      if (horizon === 'long_term' && hasDividend) {
        score += 2;
        reasons.push('Dividend fits long-term');
      } else if (horizon === 'short_term' && stock.quote?.averageDailyVolume3Month > 2000000) {
        score += 2;
        reasons.push('High liquidity for short-term');
      }
    }

    const finalScore = Math.min(score, this.maxPoints);
    this.logScore(stock.symbol, finalScore, { reasons });

    return {
      points: finalScore,
      maxPoints: this.maxPoints,
      reasons,
      signal: finalScore >= 15 ? 'perfect_fit' : finalScore >= 10 ? 'good_fit' : 'neutral_fit',
    };
  }
}

module.exports = {
  ValuationScoringStrategy,
  IntrinsicValueScoringStrategy,
  RiskAssessmentScoringStrategy,
  EarningsQualityScoringStrategy,
  PortfolioFitScoringStrategy,
  TechnicalTimingScoringStrategy,
  DividendQualityScoringStrategy,
  CompetitivePositionScoringStrategy,
  StatisticalEdgeScoringStrategy,
  MacroAlignmentScoringStrategy,
  SectorAffinityScoringStrategy,
};
