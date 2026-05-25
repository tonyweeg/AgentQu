/**
 * AgentQu Stocks Type Definitions
 */

// User Preferences
export interface UserPreferences {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  timeHorizon: 'short_term' | 'medium_term' | 'long_term';
  sectorAffinities: Record<string, number>;
}

// Stock Quote
export interface StockQuote {
  symbol: string;
  shortName: string;
  longName?: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  regularMarketOpen?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketPreviousClose?: number;
  marketCap: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  fiftyDayAverage: number;
  twoHundredDayAverage: number;
  trailingPE?: number;
  forwardPE?: number;
  dividendYield?: number;
}

// Stock Metrics
export interface StockMetrics {
  peRatio?: number;
  peForward?: number;
  pbRatio?: number;
  psRatio?: number;
  evEbitda?: number;
  pegRatio?: number;
  eps?: number;
  epsGrowth?: number;
  revenueGrowth?: number;
  netMargin?: number;
  operatingMargin?: number;
  roe?: number;
  roa?: number;
  dividendYield?: number;
  dividendPerShare?: number;
  payoutRatio?: number;
  debtToEquity?: number;
  currentRatio?: number;
  quickRatio?: number;
  beta?: number;
  freeCashflow?: number;
  shortPercentOfFloat?: number;
  heldPercentInstitutions?: number;
}

// Company Profile
export interface CompanyProfile {
  symbol: string;
  name: string;
  industry: string;
  sector?: string;
  country?: string;
  exchange?: string;
  website?: string;
  logo?: string;
}

// Earnings Data
export interface EarningsData {
  symbol: string;
  beatRate: number;
  averageSurprise: number;
  earnings: Array<{
    period: string;
    actual: number;
    estimate: number;
    surprise: number;
    surprisePercent: number;
  }>;
}

// Technical Indicators
export interface TechnicalData {
  rsi?: {
    latest: number;
    signal: {
      signal: string;
      label: string;
      action?: string;
    };
  };
  macd?: {
    latest: {
      macd: number;
      signal: number;
      histogram: number;
    };
    crossover: 'bullish' | 'bearish' | 'none';
    trend: 'bullish' | 'bearish';
  };
  bollinger?: {
    latest: {
      upper: number;
      middle: number;
      lower: number;
    };
    volatility: 'high' | 'normal' | 'low';
  };
  adx?: {
    latest: number;
    trendStrength: {
      strength: string;
      label: string;
    };
  };
}

// Score Breakdown
export interface ScoreBreakdown {
  base: number;
  valuation?: number;
  intrinsicvalue?: number;
  riskassessment?: number;
  earningsquality?: number;
  portfoliofit?: number;
  technicaltiming?: number;
  dividendquality?: number;
  competitiveposition?: number;
  statisticaledge?: number;
  macroalignment?: number;
  sectoraffinity?: number;
}

// Score Signals
export interface ScoreSignals {
  valuation?: string;
  intrinsicvalue?: string;
  riskassessment?: string;
  earningsquality?: string;
  portfoliofit?: string;
  technicaltiming?: string;
  dividendquality?: string;
  competitiveposition?: string;
  statisticaledge?: string;
  macroalignment?: string;
  sectoraffinity?: string;
}

// Recommendation
export interface Recommendation {
  action: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  label: string;
  color: string;
  description: string;
}

// Confidence
export interface Confidence {
  level: 'high' | 'medium' | 'low';
  score: number;
  label: string;
}

// Score Data
export interface ScoreData {
  symbol: string;
  total: number;
  maxPossible: number;
  percentile: number;
  breakdown: ScoreBreakdown;
  signals: ScoreSignals;
  recommendation: Recommendation;
  confidence: Confidence;
  topReasons: Array<{
    strategy: string;
    reasons: string[];
  }>;
}

// Analysis Module
export interface AnalysisModule {
  key: string;
  name: string;
  subtitle: string;
  score: number;
  signal: string;
  reasons: string[];
}

// Complete Stock Data
export interface Stock {
  symbol: string;
  quote: StockQuote;
  profile?: CompanyProfile;
  metrics?: StockMetrics;
  earnings?: EarningsData;
  technical?: TechnicalData;
  priceTarget?: {
    targetHigh: number;
    targetLow: number;
    targetMean: number;
    targetMedian: number;
  };
  recommendations?: {
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
    consensusScore: number;
  };
  score?: number;
  scoreData?: ScoreData;
  lastUpdated?: number;
}

// Watchlist Item
export interface WatchlistItem {
  symbol: string;
  name: string;
  addedAt: number;
  addedPrice: number;
  notes: string;
  currentPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  changeFromAdded?: number;
}

// Watchlist
export interface Watchlist {
  userId: string;
  stocks: WatchlistItem[];
  alerts: Array<{
    id: string;
    symbol: string;
    type: 'price_above' | 'price_below' | 'percent_change';
    value: number;
    active: boolean;
  }>;
}

// Portfolio Holding
export interface PortfolioHolding {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  sector: string;
  addedAt: number;
  currentPrice?: number;
  cost?: number;
  value?: number;
  profit?: number;
  profitPercent?: number;
  weight?: number;
}

// Portfolio Performance
export interface PortfolioPerformance {
  totalCost: number;
  totalValue: number;
  totalProfit: number;
  totalReturn: number;
  cashBalance: number;
  totalPortfolioValue: number;
  holdings: PortfolioHolding[];
  sectorWeights: Record<string, number>;
  holdingsCount: number;
}

// Portfolio
export interface Portfolio {
  userId: string;
  holdings: PortfolioHolding[];
  transactions: Array<{
    id: string;
    type: 'BUY' | 'SELL';
    symbol: string;
    shares: number;
    price: number;
    total: number;
    date: number;
    profit?: number;
  }>;
  cashBalance: number;
  totalInvested: number;
  preferences?: UserPreferences;
  performance?: PortfolioPerformance;
}

// Macro Data
export interface MacroData {
  macroScore: number;
  macroSignal: {
    signal: string;
    label: string;
    color: string;
  };
  interestRates?: {
    fedFunds: number;
    treasury2y: number;
    treasury10y: number;
    spread: number;
    yieldCurveInverted: boolean;
  };
  growth?: {
    gdpGrowth: number;
    unemployment: number;
    unemploymentTrend: string;
  };
  cyclePhase?: {
    phase: string;
    label: string;
  };
  sectorRecommendations?: {
    overweight: string[];
    underweight: string[];
  };
}

// Market Overview
export interface MarketOverview {
  gainers: Array<{
    symbol: string;
    shortName: string;
    regularMarketPrice: number;
    regularMarketChangePercent: number;
  }>;
  losers: Array<{
    symbol: string;
    shortName: string;
    regularMarketPrice: number;
    regularMarketChangePercent: number;
  }>;
  mostActive: Array<{
    symbol: string;
    shortName: string;
    regularMarketPrice: number;
    regularMarketVolume: number;
  }>;
  lastUpdated: number;
}

// API Response Types
export interface DiscoverResponse {
  success: boolean;
  stocks: Stock[];
  metadata: {
    mode?: string;
    totalAnalyzed: number;
    passedScreen: number;
    returned: number;
    queryTimeMs: number;
    macroScore?: number;
    macroSignal?: MacroData['macroSignal'];
  };
}

export interface AnalyzeResponse {
  success: boolean;
  stock: Stock;
  analysis: {
    score: ScoreData;
    explanation: {
      summary: string;
      recommendation: string;
      recommendationDescription: string;
      strengths: Array<{ strategy: string; score: number; maxScore: number; signal: string }>;
      weaknesses: Array<{ strategy: string; score: number; maxScore: number; signal: string }>;
      topReasons: Array<{ strategy: string; reasons: string[] }>;
    };
    modules: AnalysisModule[];
  };
  macro: MacroData;
  metadata: {
    queryTimeMs: number;
    lastUpdated: number;
  };
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange?: string;
  type?: string;
  industry?: string;
  sector?: string;
}

// View Types
export type ViewType = 'discover' | 'watchlist' | 'portfolio' | 'detail' | 'agntnrd';

// Screening Criteria
export interface ScreeningCriteria {
  minPE?: number;
  maxPE?: number;
  minDividendYield?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  maxBeta?: number;
  minROE?: number;
  maxDebtToEquity?: number;
  sectors?: string[];
}

// Analysis Focus
export type AnalysisFocus = 'value' | 'growth' | 'income' | 'momentum' | 'safety' | null;

// Discovery Mode
export type DiscoveryMode = 'trending' | 'bluechip' | 'gainers' | 'losers' | 'swami';
