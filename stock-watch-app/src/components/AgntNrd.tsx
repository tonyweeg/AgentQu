import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import MarketTicker from './MarketTicker';

/**
 * Investment Options - Mutual Funds, ETFs, Stocks, and Precious Metals
 */
const INVESTMENT_OPTIONS = {
  // Fidelity Mutual Funds
  FXAIX: {
    ticker: 'FXAIX',
    name: 'Fidelity 500 Index Fund',
    category: 'US Large Cap',
    type: 'mutual_fund',
    expenseRatio: 0.015,
    description: 'Tracks the S&P 500 index - 500 largest US companies',
    risk: 'medium-high',
    color: '#3B82F6', // blue
  },
  FSKAX: {
    ticker: 'FSKAX',
    name: 'Fidelity Total Market Index Fund',
    category: 'US Total Market',
    type: 'mutual_fund',
    expenseRatio: 0.015,
    description: 'Entire US stock market including small, mid, and large caps',
    risk: 'medium-high',
    color: '#8B5CF6', // purple
  },
  FTIHX: {
    ticker: 'FTIHX',
    name: 'Fidelity Total International Index Fund',
    category: 'International',
    type: 'mutual_fund',
    expenseRatio: 0.06,
    description: 'Developed and emerging international markets',
    risk: 'medium-high',
    color: '#10B981', // emerald
  },
  FXNAX: {
    ticker: 'FXNAX',
    name: 'Fidelity US Bond Index Fund',
    category: 'Bonds',
    type: 'mutual_fund',
    expenseRatio: 0.025,
    description: 'US investment-grade bonds for stability and income',
    risk: 'low',
    color: '#F59E0B', // amber
  },

  // ETFs
  VOO: {
    ticker: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    category: 'US Large Cap ETF',
    type: 'etf',
    expenseRatio: 0.03,
    description: 'Low-cost S&P 500 ETF, trades like a stock',
    risk: 'medium-high',
    color: '#06B6D4', // cyan
  },
  VTI: {
    ticker: 'VTI',
    name: 'Vanguard Total Stock Market ETF',
    category: 'US Total Market ETF',
    type: 'etf',
    expenseRatio: 0.03,
    description: 'Total US stock market exposure in ETF form',
    risk: 'medium-high',
    color: '#6366F1', // indigo
  },
  VXUS: {
    ticker: 'VXUS',
    name: 'Vanguard Total International Stock ETF',
    category: 'International ETF',
    type: 'etf',
    expenseRatio: 0.07,
    description: 'International developed and emerging markets ETF',
    risk: 'medium-high',
    color: '#14B8A6', // teal
  },
  BND: {
    ticker: 'BND',
    name: 'Vanguard Total Bond Market ETF',
    category: 'Bonds ETF',
    type: 'etf',
    expenseRatio: 0.03,
    description: 'Broad US investment-grade bond market ETF',
    risk: 'low',
    color: '#F97316', // orange
  },
  QQQ: {
    ticker: 'QQQ',
    name: 'Invesco QQQ Trust (Nasdaq 100)',
    category: 'Tech/Growth ETF',
    type: 'etf',
    expenseRatio: 0.20,
    description: 'Top 100 non-financial Nasdaq stocks, tech-heavy',
    risk: 'high',
    color: '#EC4899', // pink
  },
  SCHD: {
    ticker: 'SCHD',
    name: 'Schwab US Dividend Equity ETF',
    category: 'Dividend ETF',
    type: 'etf',
    expenseRatio: 0.06,
    description: 'High-quality dividend-paying US stocks',
    risk: 'medium',
    color: '#84CC16', // lime
  },

  // Precious Metals ETFs
  GLD: {
    ticker: 'GLD',
    name: 'SPDR Gold Shares',
    category: 'Gold',
    type: 'precious_metal',
    expenseRatio: 0.40,
    description: 'Physical gold bullion ETF - inflation hedge',
    risk: 'medium',
    color: '#EAB308', // yellow (gold)
  },
  IAU: {
    ticker: 'IAU',
    name: 'iShares Gold Trust',
    category: 'Gold',
    type: 'precious_metal',
    expenseRatio: 0.25,
    description: 'Lower-cost gold ETF alternative',
    risk: 'medium',
    color: '#CA8A04', // yellow-600
  },
  SLV: {
    ticker: 'SLV',
    name: 'iShares Silver Trust',
    category: 'Silver',
    type: 'precious_metal',
    expenseRatio: 0.50,
    description: 'Physical silver bullion ETF',
    risk: 'medium-high',
    color: '#9CA3AF', // gray (silver)
  },

  // Individual Stocks (Blue Chips)
  AAPL: {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    category: 'Tech Stock',
    type: 'stock',
    expenseRatio: 0,
    description: 'Consumer electronics, software, and services giant',
    risk: 'medium-high',
    color: '#000000', // black
  },
  MSFT: {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    category: 'Tech Stock',
    type: 'stock',
    expenseRatio: 0,
    description: 'Software, cloud computing, and AI leader',
    risk: 'medium-high',
    color: '#00A4EF', // microsoft blue
  },
  GOOGL: {
    ticker: 'GOOGL',
    name: 'Alphabet Inc. (Google)',
    category: 'Tech Stock',
    type: 'stock',
    expenseRatio: 0,
    description: 'Search, advertising, cloud, and AI powerhouse',
    risk: 'medium-high',
    color: '#4285F4', // google blue
  },
  BRK_B: {
    ticker: 'BRK.B',
    name: 'Berkshire Hathaway Inc.',
    category: 'Conglomerate',
    type: 'stock',
    expenseRatio: 0,
    description: "Warren Buffett's diversified holding company",
    risk: 'medium',
    color: '#1E3A5F', // navy
  },
  JNJ: {
    ticker: 'JNJ',
    name: 'Johnson & Johnson',
    category: 'Healthcare Stock',
    type: 'stock',
    expenseRatio: 0,
    description: 'Diversified healthcare and consumer products',
    risk: 'low-medium',
    color: '#D11F2E', // J&J red
  },
};

// Type for investment options
type InvestmentTicker = keyof typeof INVESTMENT_OPTIONS;

// Sparkline time period type
type SparklinePeriod = '1W' | '1M' | '3M' | '6M' | '1Y';

// Historical data cache type
interface HistoricalDataCache {
  [ticker: string]: {
    data: SparklineDataPoint[];
    lastFetched: number;
  };
}

interface SparklineDataPoint {
  date: string;
  close: number;
}

/**
 * Generate personalized reasoning for why a fund was recommended
 */
function generateFundReasoning(
  ticker: string,
  fundInfo: typeof INVESTMENT_OPTIONS[keyof typeof INVESTMENT_OPTIONS],
  profile: {
    yearsToRetirement: number;
    riskTolerance: number;
    fundPreference: AllocationPreference;
    preciousMetals: PreciousMetalsOption;
    individualStocks: StocksOption;
  }
): string[] {
  const reasons: string[] = [];
  const { yearsToRetirement, riskTolerance, fundPreference } = profile;

  // Timeline-based reasoning
  if (yearsToRetirement > 20) {
    if (fundInfo.risk === 'medium-high' || fundInfo.risk === 'high') {
      reasons.push(`With ${yearsToRetirement} years until retirement, you have time to ride out market volatility for higher growth potential.`);
    }
  } else if (yearsToRetirement <= 10) {
    if (fundInfo.risk === 'low' || fundInfo.risk === 'low-medium') {
      reasons.push(`With only ${yearsToRetirement} years to retirement, capital preservation becomes more important.`);
    }
  }

  // Risk-based reasoning
  if (riskTolerance >= 7 && (fundInfo.risk === 'high' || fundInfo.risk === 'medium-high')) {
    reasons.push('Matches your higher risk tolerance for potentially greater returns.');
  } else if (riskTolerance <= 4 && fundInfo.risk === 'low') {
    reasons.push('Aligns with your conservative risk profile for stability.');
  }

  // Type-specific reasoning
  switch (fundInfo.type) {
    case 'mutual_fund':
      reasons.push('Fidelity mutual funds offer automatic dividend reinvestment and no trading commissions.');
      if (fundInfo.expenseRatio < 0.03) {
        reasons.push(`Ultra-low expense ratio of ${(fundInfo.expenseRatio * 100).toFixed(3)}% keeps more money working for you.`);
      }
      break;
    case 'etf':
      reasons.push('ETFs provide intraday liquidity and typically lower expense ratios.');
      if (ticker === 'QQQ') {
        reasons.push('Concentrated tech exposure for growth-oriented investors.');
      } else if (ticker === 'SCHD') {
        reasons.push('Dividend focus provides income while maintaining equity exposure.');
      }
      break;
    case 'precious_metal':
      reasons.push('Precious metals serve as an inflation hedge and portfolio diversifier.');
      if (ticker === 'GLD') {
        reasons.push('Gold historically performs well during economic uncertainty.');
      } else if (ticker === 'SLV') {
        reasons.push('Silver offers both industrial demand and precious metal characteristics.');
      }
      break;
    case 'stock':
      reasons.push('Blue-chip individual stocks offer direct ownership and potential for outperformance.');
      if (ticker === 'AAPL' || ticker === 'MSFT' || ticker === 'GOOGL') {
        reasons.push('Tech leaders with strong cash flows and market positions.');
      } else if (ticker === 'BRK.B') {
        reasons.push('Diversified conglomerate managed by legendary investor Warren Buffett.');
      } else if (ticker === 'JNJ') {
        reasons.push('Defensive healthcare stock with 60+ years of dividend increases.');
      }
      break;
  }

  // Category-specific reasoning
  if (fundInfo.category.includes('S&P 500') || fundInfo.category.includes('Large Cap')) {
    reasons.push('S&P 500 exposure captures ~80% of US market capitalization.');
  } else if (fundInfo.category.includes('Total Market')) {
    reasons.push('Total market coverage includes small and mid-caps for broader diversification.');
  } else if (fundInfo.category.includes('International')) {
    reasons.push('International exposure reduces US-only risk and captures global growth.');
  } else if (fundInfo.category.includes('Bond')) {
    reasons.push('Bonds provide portfolio ballast and steady income during market downturns.');
  }

  return reasons.slice(0, 3); // Return top 3 reasons
}

/**
 * Sparkline Component - Mini trend chart
 */
const Sparkline: React.FC<{
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  isDark: boolean;
  showChange?: boolean;
}> = memo(({ data, width = 100, height = 30, color, isDark, showChange = true }) => {
  if (!data || data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${isDark ? 'text-slate-600' : 'text-gray-300'}`}
        style={{ width, height }}
      >
        <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z"/>
        </svg>
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Normalize data to fit within height
  const normalizedData = data.map(value =>
    height - 4 - ((value - min) / range) * (height - 8)
  );

  // Calculate percentage change
  const startValue = data[0];
  const endValue = data[data.length - 1];
  const changePercent = ((endValue - startValue) / startValue) * 100;
  const isPositive = changePercent >= 0;

  // Determine line color
  const lineColor = color || (isPositive
    ? (isDark ? '#10B981' : '#059669')  // green
    : (isDark ? '#EF4444' : '#DC2626')); // red

  // Create SVG path
  const stepX = width / (data.length - 1);
  const pathData = normalizedData.reduce((acc, y, i) => {
    const x = i * stepX;
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  return (
    <div className="flex items-center gap-2">
      <svg width={width} height={height} className="overflow-visible">
        {/* Background area */}
        <defs>
          <linearGradient id={`gradient-${data.length}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path
          d={`${pathData} L ${width} ${height} L 0 ${height} Z`}
          fill={`url(#gradient-${data.length})`}
        />

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={lineColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* End point dot */}
        <circle
          cx={width}
          cy={normalizedData[normalizedData.length - 1]}
          r="2.5"
          fill={lineColor}
        />
      </svg>

      {showChange && (
        <span className={`text-xs font-mono font-semibold ${
          isPositive
            ? (isDark ? 'text-emerald-400' : 'text-emerald-600')
            : (isDark ? 'text-red-400' : 'text-red-600')
        }`}>
          {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
        </span>
      )}
    </div>
  );
});

Sparkline.displayName = 'Sparkline';

/**
 * Period Selector Component
 */
const PeriodSelector: React.FC<{
  selected: SparklinePeriod;
  onChange: (period: SparklinePeriod) => void;
  isDark: boolean;
}> = memo(({ selected, onChange, isDark }) => {
  const periods: SparklinePeriod[] = ['1W', '1M', '3M', '6M', '1Y'];

  return (
    <div className="flex gap-1">
      {periods.map((period) => (
        <button
          key={period}
          onClick={() => onChange(period)}
          className={`px-2 py-1 rounded text-xs font-medium transition-all ${
            selected === period
              ? 'bg-emerald-500 text-white'
              : isDark
                ? 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {period}
        </button>
      ))}
    </div>
  );
});

PeriodSelector.displayName = 'PeriodSelector';

/**
 * Fund Allocation Card - Expandable with details
 */
const FundAllocationCard: React.FC<{
  fund: {
    ticker: string;
    name: string;
    category: string;
    type: string;
    percentage: number;
    amount: number;
    color: string;
  };
  reasons: string[];
  sparklineData: number[];
  selectedPeriod: SparklinePeriod;
  onPeriodChange: (period: SparklinePeriod) => void;
  isExpanded: boolean;
  onToggle: () => void;
  isDark: boolean;
  formatCurrency: (value: number) => string;
  onTickerClick?: (ticker: string) => void;
  isLoadingSparkline?: boolean;
}> = memo(({
  fund,
  reasons,
  sparklineData,
  selectedPeriod,
  onPeriodChange,
  isExpanded,
  onToggle,
  isDark,
  formatCurrency,
  onTickerClick,
  isLoadingSparkline
}) => {
  const fundKey = fund.ticker.replace('.', '_') as keyof typeof INVESTMENT_OPTIONS;
  const fundInfo = INVESTMENT_OPTIONS[fundKey];

  const handleTickerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTickerClick?.(fund.ticker);
  };

  return (
    <div
      className={`rounded-xl border transition-all cursor-pointer ${
        isExpanded
          ? isDark
            ? 'bg-slate-800 border-emerald-500/50'
            : 'bg-white border-emerald-500/50 shadow-lg'
          : isDark
            ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Header - Always visible */}
      <div
        className="flex items-center justify-between p-4"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: fund.color }}
          />
          <div>
            <button
              onClick={handleTickerClick}
              className={`font-semibold hover:underline ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
              {fund.ticker}
            </button>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {fund.category}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Mini sparkline in header when collapsed */}
          {!isExpanded && sparklineData.length > 0 && (
            <div className="hidden sm:block">
              <Sparkline
                data={sparklineData}
                width={60}
                height={20}
                isDark={isDark}
                showChange={false}
              />
            </div>
          )}

          <div className="text-right">
            <p className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(fund.amount)}
            </p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {fund.percentage}%
            </p>
          </div>

          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''} ${
              isDark ? 'text-slate-400' : 'text-gray-400'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className={`px-4 pb-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          {/* Fund Details */}
          <div className="pt-4 pb-3">
            <p className={`text-sm font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {fundInfo?.name || fund.name}
            </p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {fundInfo?.description}
            </p>

            {/* Fund meta info */}
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                fund.type === 'stock' ? 'bg-purple-500/20 text-purple-400' :
                fund.type === 'precious_metal' ? 'bg-yellow-500/20 text-yellow-400' :
                fund.type === 'etf' ? 'bg-cyan-500/20 text-cyan-400' :
                isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
              }`}>
                {fund.type.replace('_', ' ').toUpperCase()}
              </span>
              {fundInfo?.expenseRatio !== undefined && fundInfo.expenseRatio > 0 && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                  isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600'
                }`}>
                  {(fundInfo.expenseRatio * 100).toFixed(2)}% ER
                </span>
              )}
              {fundInfo?.risk && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                  fundInfo.risk === 'low' ? 'bg-green-500/20 text-green-400' :
                  fundInfo.risk === 'low-medium' ? 'bg-lime-500/20 text-lime-400' :
                  fundInfo.risk === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  fundInfo.risk === 'medium-high' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {fundInfo.risk.toUpperCase()} RISK
                </span>
              )}
            </div>
          </div>

          {/* Sparkline Chart */}
          <div className={`p-3 rounded-lg mb-3 ${isDark ? 'bg-slate-900/50' : 'bg-gray-100'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Price Trend
              </span>
              <PeriodSelector
                selected={selectedPeriod}
                onChange={onPeriodChange}
                isDark={isDark}
              />
            </div>
            {isLoadingSparkline ? (
              <div className="flex items-center justify-center h-10">
                <svg className={`w-5 h-5 animate-spin ${isDark ? 'text-slate-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : (
              <Sparkline
                data={sparklineData}
                width={200}
                height={40}
                isDark={isDark}
              />
            )}
          </div>

          {/* Why This Fund - Reasoning */}
          <div>
            <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
              isDark ? 'text-slate-400' : 'text-gray-500'
            }`}>
              Why This Investment
            </h4>
            <ul className="space-y-2">
              {reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                    {reason}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
});

FundAllocationCard.displayName = 'FundAllocationCard';

// Allocation preference type
type AllocationPreference = 'mutual_funds' | 'etfs' | 'mixed';

// Include precious metals option
type PreciousMetalsOption = 'none' | 'small' | 'moderate';

// Include individual stocks option
type StocksOption = 'none' | 'small' | 'moderate';

/**
 * Investment Profile Interface
 */
export interface InvestmentProfile {
  amount: number;
  yearsToRetirement: number;
  riskTolerance: number; // 1-10
  fundPreference: AllocationPreference;
  preciousMetals: PreciousMetalsOption;
  individualStocks: StocksOption;
  allocation?: AllocationResult;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Allocation Result Interface
 */
interface AllocationResult {
  allocations: Array<{
    ticker: string;
    name: string;
    category: string;
    type: string;
    percentage: number;
    amount: number;
    color: string;
  }>;
  stockPercentage: number;
  bondPercentage: number;
  preciousMetalsPercentage: number;
  individualStocksPercentage: number;
  riskLevel: string;
  strategy: string;
}

/**
 * Calculate portfolio allocation based on inputs
 */
function calculateAllocation(
  amount: number,
  yearsToRetirement: number,
  riskTolerance: number,
  fundPreference: AllocationPreference,
  preciousMetals: PreciousMetalsOption,
  individualStocks: StocksOption
): AllocationResult {
  // Calculate precious metals and individual stocks percentages first
  const preciousMetalsPct = preciousMetals === 'moderate' ? 10 : preciousMetals === 'small' ? 5 : 0;
  const individualStocksPct = individualStocks === 'moderate' ? 15 : individualStocks === 'small' ? 8 : 0;

  // Remaining allocation after alternatives
  const remainingPct = 100 - preciousMetalsPct - individualStocksPct;

  // Base stock allocation using modified "100 - age" rule within remaining
  const baseStockAllocation = Math.min(95, Math.max(20, yearsToRetirement * 2.5 + riskTolerance * 3));
  const riskAdjustment = (riskTolerance - 5) * 3;
  const rawStockPct = Math.min(95, Math.max(20, baseStockAllocation + riskAdjustment));

  // Apply to remaining percentage
  const stockPercentage = Math.round((rawStockPct / 100) * remainingPct);
  const bondPercentage = remainingPct - stockPercentage;

  // Determine risk level label
  let riskLevel: string;
  let strategy: string;
  const effectiveStockExposure = stockPercentage + individualStocksPct;

  if (effectiveStockExposure >= 80) {
    riskLevel = 'Aggressive Growth';
    strategy = 'Maximum growth potential with high volatility tolerance';
  } else if (effectiveStockExposure >= 65) {
    riskLevel = 'Growth';
    strategy = 'Strong growth focus with moderate volatility';
  } else if (effectiveStockExposure >= 50) {
    riskLevel = 'Balanced';
    strategy = 'Balanced approach between growth and stability';
  } else if (effectiveStockExposure >= 35) {
    riskLevel = 'Conservative Growth';
    strategy = 'Modest growth with emphasis on capital preservation';
  } else {
    riskLevel = 'Conservative';
    strategy = 'Capital preservation with income focus';
  }

  // Add diversification notes
  if (preciousMetalsPct > 0) {
    strategy += ' with inflation hedge';
  }
  if (individualStocksPct > 0) {
    strategy += ' and individual stock exposure';
  }

  const allocations: AllocationResult['allocations'] = [];

  // Select fund tickers based on preference
  const useLargeCapTicker = fundPreference === 'etfs' ? 'VOO' : fundPreference === 'mixed' ? 'VOO' : 'FXAIX';
  const useTotalMarketTicker = fundPreference === 'etfs' ? 'VTI' : 'FSKAX';
  const useIntlTicker = fundPreference === 'etfs' ? 'VXUS' : 'FTIHX';
  const useBondTicker = fundPreference === 'etfs' ? 'BND' : 'FXNAX';

  // Distribute stock allocation among equity funds
  // Large Cap (S&P 500): 50% of stocks
  // Total Market: 25% of stocks
  // International: 25% of stocks
  const largeCapPct = Math.round(stockPercentage * 0.50);
  const totalMarketPct = Math.round(stockPercentage * 0.25);
  const intlPct = stockPercentage - largeCapPct - totalMarketPct;

  if (largeCapPct > 0) {
    const fund = INVESTMENT_OPTIONS[useLargeCapTicker as InvestmentTicker];
    allocations.push({
      ticker: fund.ticker,
      name: fund.name,
      category: fund.category,
      type: fund.type,
      percentage: largeCapPct,
      amount: Math.round(amount * largeCapPct / 100),
      color: fund.color,
    });
  }

  if (totalMarketPct > 0) {
    const fund = INVESTMENT_OPTIONS[useTotalMarketTicker as InvestmentTicker];
    allocations.push({
      ticker: fund.ticker,
      name: fund.name,
      category: fund.category,
      type: fund.type,
      percentage: totalMarketPct,
      amount: Math.round(amount * totalMarketPct / 100),
      color: fund.color,
    });
  }

  if (intlPct > 0) {
    const fund = INVESTMENT_OPTIONS[useIntlTicker as InvestmentTicker];
    allocations.push({
      ticker: fund.ticker,
      name: fund.name,
      category: fund.category,
      type: fund.type,
      percentage: intlPct,
      amount: Math.round(amount * intlPct / 100),
      color: fund.color,
    });
  }

  if (bondPercentage > 0) {
    const fund = INVESTMENT_OPTIONS[useBondTicker as InvestmentTicker];
    allocations.push({
      ticker: fund.ticker,
      name: fund.name,
      category: fund.category,
      type: fund.type,
      percentage: bondPercentage,
      amount: Math.round(amount * bondPercentage / 100),
      color: fund.color,
    });
  }

  // Add precious metals
  if (preciousMetalsPct > 0) {
    // Split between gold (70%) and silver (30%)
    const goldPct = Math.round(preciousMetalsPct * 0.7);
    const silverPct = preciousMetalsPct - goldPct;

    if (goldPct > 0) {
      const goldFund = INVESTMENT_OPTIONS.GLD;
      allocations.push({
        ticker: goldFund.ticker,
        name: goldFund.name,
        category: goldFund.category,
        type: goldFund.type,
        percentage: goldPct,
        amount: Math.round(amount * goldPct / 100),
        color: goldFund.color,
      });
    }

    if (silverPct > 0) {
      const silverFund = INVESTMENT_OPTIONS.SLV;
      allocations.push({
        ticker: silverFund.ticker,
        name: silverFund.name,
        category: silverFund.category,
        type: silverFund.type,
        percentage: silverPct,
        amount: Math.round(amount * silverPct / 100),
        color: silverFund.color,
      });
    }
  }

  // Add individual stocks
  if (individualStocksPct > 0) {
    // Diversified stock picks based on risk tolerance
    const stockPicks = riskTolerance >= 7
      ? ['AAPL', 'MSFT', 'GOOGL'] // More tech-heavy for aggressive
      : riskTolerance >= 4
        ? ['AAPL', 'MSFT', 'BRK_B'] // Balanced
        : ['JNJ', 'BRK_B', 'MSFT']; // More defensive

    const perStockPct = Math.round(individualStocksPct / stockPicks.length);
    let remainder = individualStocksPct - (perStockPct * stockPicks.length);

    stockPicks.forEach((ticker, idx) => {
      const stock = INVESTMENT_OPTIONS[ticker as InvestmentTicker];
      const thisPct = idx === 0 ? perStockPct + remainder : perStockPct;
      if (thisPct > 0) {
        allocations.push({
          ticker: stock.ticker,
          name: stock.name,
          category: stock.category,
          type: stock.type,
          percentage: thisPct,
          amount: Math.round(amount * thisPct / 100),
          color: stock.color,
        });
      }
    });
  }

  return {
    allocations: allocations.filter(a => a.percentage > 0),
    stockPercentage: Math.round(stockPercentage),
    bondPercentage: Math.round(bondPercentage),
    preciousMetalsPercentage: preciousMetalsPct,
    individualStocksPercentage: individualStocksPct,
    riskLevel,
    strategy,
  };
}

/**
 * Enhanced Pie Chart Component with Legend
 */
const PieChart: React.FC<{
  allocations: AllocationResult['allocations'];
  isDark: boolean;
  totalAmount: number;
  formatCurrency: (value: number) => string;
}> = memo(({ allocations, isDark, totalAmount, formatCurrency }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const total = allocations.reduce((sum, a) => sum + a.percentage, 0);

  // Sort allocations by percentage descending for better visualization
  const sortedAllocations = [...allocations].sort((a, b) => b.percentage - a.percentage);

  // Create donut chart paths
  const createArcPath = (startPercent: number, endPercent: number, radius: number, innerRadius: number) => {
    const startAngle = (startPercent / 100) * 360 - 90;
    const endAngle = (endPercent / 100) * 360 - 90;

    const startRadOuter = (startAngle * Math.PI) / 180;
    const endRadOuter = (endAngle * Math.PI) / 180;
    const startRadInner = (startAngle * Math.PI) / 180;
    const endRadInner = (endAngle * Math.PI) / 180;

    const cx = 100;
    const cy = 100;

    const x1Outer = cx + radius * Math.cos(startRadOuter);
    const y1Outer = cy + radius * Math.sin(startRadOuter);
    const x2Outer = cx + radius * Math.cos(endRadOuter);
    const y2Outer = cy + radius * Math.sin(endRadOuter);

    const x1Inner = cx + innerRadius * Math.cos(endRadInner);
    const y1Inner = cy + innerRadius * Math.sin(endRadInner);
    const x2Inner = cx + innerRadius * Math.cos(startRadInner);
    const y2Inner = cy + innerRadius * Math.sin(startRadInner);

    const largeArc = (endPercent - startPercent) > 50 ? 1 : 0;

    return `M ${x1Outer} ${y1Outer}
            A ${radius} ${radius} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}
            L ${x1Inner} ${y1Inner}
            A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2Inner} ${y2Inner}
            Z`;
  };

  let cumulativePercent = 0;
  const segments = sortedAllocations.map((allocation, index) => {
    const startPercent = cumulativePercent;
    cumulativePercent += allocation.percentage;
    return {
      ...allocation,
      startPercent,
      endPercent: cumulativePercent,
      index,
    };
  });

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      {/* Donut Chart */}
      <div className="relative">
        <svg viewBox="0 0 200 200" className="w-48 h-48 md:w-56 md:h-56">
          {segments.map((segment, index) => {
            const isHovered = hoveredIndex === index;
            const outerRadius = isHovered ? 88 : 85;
            const innerRadius = 55;

            return (
              <path
                key={segment.ticker}
                d={createArcPath(segment.startPercent, segment.endPercent, outerRadius, innerRadius)}
                fill={segment.color}
                stroke={isDark ? '#0f172a' : '#ffffff'}
                strokeWidth="2"
                className="transition-all duration-200 cursor-pointer"
                style={{
                  filter: isHovered ? 'brightness(1.15)' : 'none',
                  transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                  transformOrigin: 'center',
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
          {/* Center info */}
          <circle cx="100" cy="100" r="50" fill={isDark ? '#0f172a' : '#ffffff'} />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {hoveredIndex !== null ? (
              <>
                <div className="text-lg font-bold">{segments[hoveredIndex].percentage}%</div>
                <div className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  {segments[hoveredIndex].ticker}
                </div>
              </>
            ) : (
              <>
                <div className="text-lg md:text-xl font-bold">{formatCurrency(totalAmount)}</div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Total</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 w-full lg:w-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
          {sortedAllocations.map((allocation, index) => (
            <div
              key={allocation.ticker}
              className={`flex items-center gap-3 p-2 rounded-lg transition-all cursor-pointer ${
                hoveredIndex === index
                  ? isDark
                    ? 'bg-slate-800'
                    : 'bg-gray-100'
                  : ''
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className="w-4 h-4 rounded-sm flex-shrink-0"
                style={{ backgroundColor: allocation.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-mono font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {allocation.ticker}
                  </span>
                  <span className={`font-mono text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {allocation.percentage}%
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {allocation.category}
                  </span>
                  <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {formatCurrency(allocation.amount)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

PieChart.displayName = 'PieChart';

/**
 * Risk Slider Component
 */
const RiskSlider: React.FC<{
  value: number;
  onChange: (value: number) => void;
  isDark: boolean;
}> = memo(({ value, onChange, isDark }) => {
  const getRiskLabel = (val: number) => {
    if (val <= 2) return { label: 'Very Conservative', emoji: '🛡️' };
    if (val <= 4) return { label: 'Conservative', emoji: '🏦' };
    if (val <= 6) return { label: 'Moderate', emoji: '⚖️' };
    if (val <= 8) return { label: 'Growth', emoji: '📈' };
    return { label: 'Aggressive', emoji: '🚀' };
  };

  const riskInfo = getRiskLabel(value);
  const percentage = ((value - 1) / 9) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <span className={`text-3xl`}>{riskInfo.emoji}</span>
        <span className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {riskInfo.label}
        </span>
        <span className={`text-2xl font-bold font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
          {value}/10
        </span>
      </div>

      <div className="relative">
        {/* Track */}
        <div className="h-3 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 opacity-30" />

        {/* Active Track */}
        <div
          className="absolute top-0 h-3 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
          style={{ width: `${percentage}%` }}
        />

        {/* Slider Input */}
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute top-0 w-full h-3 opacity-0 cursor-pointer"
        />

        {/* Thumb */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full shadow-lg border-2 transition-all ${
            isDark
              ? 'bg-white border-slate-600'
              : 'bg-white border-gray-300'
          }`}
          style={{ left: `calc(${percentage}% - 12px)` }}
        />
      </div>

      {/* Scale Labels */}
      <div className="flex justify-between mt-2">
        <span className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>Conservative</span>
        <span className={`text-xs ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>Moderate</span>
        <span className={`text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>Aggressive</span>
      </div>
    </div>
  );
});

RiskSlider.displayName = 'RiskSlider';

/**
 * Step Indicator Component - Mobile First
 */
const StepIndicator: React.FC<{ currentStep: number; totalSteps: number; isDark: boolean }> = memo(({ currentStep, totalSteps, isDark }) => {
  const steps = [
    { label: 'Amount', shortLabel: '$', icon: '💰' },
    { label: 'Timeline', shortLabel: '⏰', icon: '📅' },
    { label: 'Risk', shortLabel: '📊', icon: '📊' },
    { label: 'Type', shortLabel: '📁', icon: '📁' },
    { label: 'Extras', shortLabel: '✨', icon: '✨' },
    { label: 'Results', shortLabel: '🎯', icon: '🎯' },
  ];

  return (
    <div className="mb-6 md:mb-8">
      {/* Mobile: Progress bar with step count */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
            Step {currentStep} of {totalSteps}
          </span>
          <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            {steps[currentStep - 1]?.label}
          </span>
        </div>
        <div className={`h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
        {/* Step icons row on mobile */}
        <div className="flex justify-between mt-3 px-1">
          {steps.map((step, index) => (
            <div
              key={step.label}
              className={`text-lg transition-all ${
                index + 1 <= currentStep ? 'opacity-100 scale-110' : 'opacity-40 scale-100'
              }`}
            >
              {step.icon}
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: Full step indicator */}
      <div className="hidden md:flex items-center justify-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-semibold transition-all ${
                index + 1 <= currentStep
                  ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg'
                  : isDark
                    ? 'bg-slate-700 text-slate-400'
                    : 'bg-gray-200 text-gray-400'
              }`}>
                {index + 1 < currentStep ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm">{step.icon}</span>
                )}
              </div>
              <span className={`text-xs mt-1 hidden lg:block ${
                index + 1 <= currentStep
                  ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                  : isDark ? 'text-slate-500' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-6 lg:w-10 h-0.5 mx-1 lg:mx-2 ${
                index + 1 < currentStep
                  ? 'bg-emerald-500'
                  : isDark ? 'bg-slate-700' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
});

StepIndicator.displayName = 'StepIndicator';

/**
 * Option Card Component - Mobile First
 */
const OptionCard: React.FC<{
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  icon: string;
  isDark: boolean;
}> = memo(({ selected, onClick, title, description, icon, isDark }) => (
  <button
    onClick={onClick}
    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
      selected
        ? 'border-emerald-500 bg-emerald-500/10'
        : isDark
          ? 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
          : 'border-gray-200 bg-white hover:border-gray-300'
    }`}
  >
    <div className="flex items-start gap-3">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</p>
        <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{description}</p>
      </div>
      {selected && (
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  </button>
));

OptionCard.displayName = 'OptionCard';

/**
 * AgntNrd Props
 */
interface AgntNrdProps {
  userId: string | null;
  onSaveProfile?: (profile: InvestmentProfile) => Promise<void>;
  existingProfile?: InvestmentProfile | null;
}

const TOTAL_STEPS = 6;

/**
 * AgntNrd - Investment Advisor Wizard
 * Guides users through investment planning and recommends fund allocations
 * Mobile-first design with expanded investment options
 */
const AgntNrd: React.FC<AgntNrdProps> = ({ userId, onSaveProfile, existingProfile }) => {
  const { isDark } = useTheme();

  // Wizard State
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(existingProfile?.amount || 10000);
  const [yearsToRetirement, setYearsToRetirement] = useState(existingProfile?.yearsToRetirement || 25);
  const [riskTolerance, setRiskTolerance] = useState(existingProfile?.riskTolerance || 5);
  const [fundPreference, setFundPreference] = useState<AllocationPreference>(existingProfile?.fundPreference || 'mutual_funds');
  const [preciousMetals, setPreciousMetals] = useState<PreciousMetalsOption>(existingProfile?.preciousMetals || 'none');
  const [individualStocks, setIndividualStocks] = useState<StocksOption>(existingProfile?.individualStocks || 'none');
  const [allocation, setAllocation] = useState<AllocationResult | null>(existingProfile?.allocation || null);
  const [saving, setSaving] = useState(false);
  const [amountInput, setAmountInput] = useState(formatCurrency(existingProfile?.amount || 10000));

  // Results Step State - Expandable cards and sparklines
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<SparklinePeriod>('1M');
  const [sparklineData, setSparklineData] = useState<Record<string, number[]>>({});
  const [loadingSparklines, setLoadingSparklines] = useState<Record<string, boolean>>({});

  // What-If Scenario State
  const [whatIfYearlyContribution, setWhatIfYearlyContribution] = useState<number>(0);
  const [whatIfYears, setWhatIfYears] = useState<number | null>(null);
  const [whatIfStarting, setWhatIfStarting] = useState<number | null>(null);
  const [showWhatIf, setShowWhatIf] = useState<boolean>(false);

  // Fetch sparkline data for all tickers when entering results
  useEffect(() => {
    if (step === TOTAL_STEPS && allocation) {
      const fetchSparklineData = async () => {
        const tickers = allocation.allocations.map(a => a.ticker);

        // Generate mock data for now - in production this would fetch real historical data
        const mockData: Record<string, number[]> = {};

        for (const ticker of tickers) {
          setLoadingSparklines(prev => ({ ...prev, [ticker]: true }));

          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

          // Generate realistic-looking mock price data
          const fundKey = ticker.replace('.', '_') as keyof typeof INVESTMENT_OPTIONS;
          const fundInfo = INVESTMENT_OPTIONS[fundKey];
          const basePrice = fundInfo?.type === 'stock' ? 150 + Math.random() * 100 : 50 + Math.random() * 30;
          const volatility = fundInfo?.risk === 'high' ? 0.03 : fundInfo?.risk === 'medium-high' ? 0.02 : 0.01;

          // Create price series based on selected period
          const dataPoints = selectedPeriod === '1W' ? 7 : selectedPeriod === '1M' ? 20 : selectedPeriod === '3M' ? 60 : selectedPeriod === '6M' ? 120 : 252;
          const prices: number[] = [];
          let currentPrice = basePrice;

          for (let i = 0; i < dataPoints; i++) {
            // Random walk with drift
            const change = (Math.random() - 0.48) * volatility * currentPrice;
            currentPrice = Math.max(currentPrice + change, basePrice * 0.7);
            prices.push(Number(currentPrice.toFixed(2)));
          }

          mockData[ticker] = prices;
          setLoadingSparklines(prev => ({ ...prev, [ticker]: false }));
        }

        setSparklineData(mockData);
      };

      fetchSparklineData();
    }
  }, [step, allocation, selectedPeriod]);

  // Generate reasons for each fund
  const fundReasons = useMemo(() => {
    if (!allocation) return {};

    const reasons: Record<string, string[]> = {};
    const profile = {
      yearsToRetirement,
      riskTolerance,
      fundPreference,
      preciousMetals,
      individualStocks,
    };

    for (const fund of allocation.allocations) {
      const fundKey = fund.ticker.replace('.', '_') as keyof typeof INVESTMENT_OPTIONS;
      const fundInfo = INVESTMENT_OPTIONS[fundKey];
      if (fundInfo) {
        reasons[fund.ticker] = generateFundReasoning(fund.ticker, fundInfo, profile);
      }
    }

    return reasons;
  }, [allocation, yearsToRetirement, riskTolerance, fundPreference, preciousMetals, individualStocks]);

  // Handle ticker click - could navigate to detail page
  const handleTickerClick = useCallback((ticker: string) => {
    console.log('AGNTNRD_DEBUG: Ticker clicked:', ticker);
    // In production, this could navigate to stock detail view
    // For now, just toggle expansion
    setExpandedTicker(prev => prev === ticker ? null : ticker);
  }, []);

  // Handle period change - refetch data for new period
  const handlePeriodChange = useCallback((period: SparklinePeriod) => {
    setSelectedPeriod(period);
  }, []);

  // Format currency for display
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  // Parse currency input
  function parseCurrency(value: string): number {
    const cleaned = value.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  }

  // Handle amount input change
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setAmountInput(raw);
    const parsed = parseCurrency(raw);
    if (parsed > 0) {
      setAmount(parsed);
    }
  }, []);

  // Format on blur
  const handleAmountBlur = useCallback(() => {
    setAmountInput(formatCurrency(amount));
  }, [amount]);

  // Calculate allocation when reaching results step
  useEffect(() => {
    if (step === TOTAL_STEPS) {
      const result = calculateAllocation(
        amount,
        yearsToRetirement,
        riskTolerance,
        fundPreference,
        preciousMetals,
        individualStocks
      );
      setAllocation(result);
    }
  }, [step, amount, yearsToRetirement, riskTolerance, fundPreference, preciousMetals, individualStocks]);

  // Navigation
  const nextStep = useCallback(() => {
    if (step < TOTAL_STEPS) setStep(s => s + 1);
  }, [step]);

  const prevStep = useCallback(() => {
    if (step > 1) setStep(s => s - 1);
  }, [step]);

  const restart = useCallback(() => {
    setStep(1);
    setAmount(10000);
    setYearsToRetirement(25);
    setRiskTolerance(5);
    setFundPreference('mutual_funds');
    setPreciousMetals('none');
    setIndividualStocks('none');
    setAllocation(null);
    setAmountInput(formatCurrency(10000));
  }, []);

  // Save profile
  const handleSave = useCallback(async () => {
    if (!onSaveProfile || !allocation) return;

    setSaving(true);
    try {
      await onSaveProfile({
        amount,
        yearsToRetirement,
        riskTolerance,
        fundPreference,
        preciousMetals,
        individualStocks,
        allocation,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  }, [onSaveProfile, amount, yearsToRetirement, riskTolerance, fundPreference, preciousMetals, individualStocks, allocation]);

  // Validation - all steps valid by default except step 1 needs minimum amount
  const canProceed = step === 1 ? amount >= 100 : true;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
      {/* Market Ticker Strip */}
      <MarketTicker />

      {/* Main Content */}
      <div className="p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
              <img
                src="https://agentqu-platform.web.app/agentqu-glyph.png"
                alt="AgentQu"
                className="w-16 h-16 object-contain"
                style={{ filter: isDark ? 'invert(1)' : 'none' }}
              />
            </div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              AgntNrd
            </h1>
            <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Your AI Investment Advisor
            </p>
          </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} isDark={isDark} />

        {/* Step Content */}
        <div className={`rounded-2xl p-6 md:p-8 backdrop-blur border ${
          isDark
            ? 'bg-slate-900/80 border-slate-700/50'
            : 'bg-white border-gray-200 shadow-xl'
        }`}>

          {/* Step 1: Investment Amount */}
          {step === 1 && (
            <div className="text-center">
              <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                How much do you have to invest?
              </h2>
              <p className={`mb-8 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Enter your total investment amount
              </p>

              <div className="relative max-w-xs mx-auto">
                <input
                  type="text"
                  value={amountInput}
                  onChange={handleAmountChange}
                  onBlur={handleAmountBlur}
                  onFocus={() => setAmountInput(amount.toString())}
                  className={`w-full text-center text-3xl font-bold py-4 px-6 rounded-xl border-2 transition-all ${
                    isDark
                      ? 'bg-slate-800 border-slate-600 text-white focus:border-emerald-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-emerald-500'
                  }`}
                  placeholder="$10,000"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {[5000, 10000, 25000, 50000, 100000].map((val) => (
                  <button
                    key={val}
                    onClick={() => {
                      setAmount(val);
                      setAmountInput(formatCurrency(val));
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      amount === val
                        ? 'bg-emerald-500 text-white'
                        : isDark
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {formatCurrency(val)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Years to Retirement */}
          {step === 2 && (
            <div className="text-center">
              <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                When do you plan to retire?
              </h2>
              <p className={`mb-8 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Your investment timeline affects allocation strategy
              </p>

              <div className="text-center mb-6">
                <span className={`text-6xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {yearsToRetirement}
                </span>
                <span className={`text-2xl ml-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  years
                </span>
              </div>

              <div className="max-w-md mx-auto">
                <input
                  type="range"
                  min="1"
                  max="40"
                  value={yearsToRetirement}
                  onChange={(e) => setYearsToRetirement(parseInt(e.target.value))}
                  className="w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: isDark
                      ? `linear-gradient(to right, #ef4444 0%, #eab308 50%, #22c55e 100%)`
                      : `linear-gradient(to right, #ef4444 0%, #eab308 50%, #22c55e 100%)`,
                  }}
                />
                <div className="flex justify-between mt-2">
                  <span className={`text-xs ${isDark ? 'text-red-400' : 'text-red-500'}`}>1 yr</span>
                  <span className={`text-xs ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>20 yrs</span>
                  <span className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>40 yrs</span>
                </div>
              </div>

              <p className={`mt-6 text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                {yearsToRetirement <= 5 && "Short timeline - we'll prioritize stability"}
                {yearsToRetirement > 5 && yearsToRetirement <= 15 && "Medium timeline - balanced growth and security"}
                {yearsToRetirement > 15 && yearsToRetirement <= 25 && "Good runway - room for growth-focused strategy"}
                {yearsToRetirement > 25 && "Long horizon - maximum growth potential"}
              </p>
            </div>
          )}

          {/* Step 3: Risk Tolerance */}
          {step === 3 && (
            <div className="text-center">
              <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                What's your risk tolerance?
              </h2>
              <p className={`mb-8 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                How comfortable are you with market volatility?
              </p>

              <div className="max-w-md mx-auto">
                <RiskSlider
                  value={riskTolerance}
                  onChange={setRiskTolerance}
                  isDark={isDark}
                />
              </div>

              <div className={`mt-8 p-4 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  {riskTolerance <= 3 && (
                    <>
                      <strong>Conservative:</strong> You prefer stability over growth.
                      We'll recommend more bonds and less stock exposure.
                    </>
                  )}
                  {riskTolerance > 3 && riskTolerance <= 6 && (
                    <>
                      <strong>Moderate:</strong> You want growth but can handle some ups and downs.
                      We'll balance stocks and bonds for steady progress.
                    </>
                  )}
                  {riskTolerance > 6 && riskTolerance <= 8 && (
                    <>
                      <strong>Growth:</strong> You're comfortable with volatility for better returns.
                      We'll emphasize stock funds with some bond cushion.
                    </>
                  )}
                  {riskTolerance > 8 && (
                    <>
                      <strong>Aggressive:</strong> You're all-in on growth and can stomach big swings.
                      Maximum stock allocation incoming!
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Fund Type Preference */}
          {step === 4 && (
            <div>
              <div className="text-center mb-6">
                <h2 className={`text-lg md:text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  What type of investments do you prefer?
                </h2>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Choose your preferred investment vehicle
                </p>
              </div>

              <div className="space-y-3">
                <OptionCard
                  selected={fundPreference === 'mutual_funds'}
                  onClick={() => setFundPreference('mutual_funds')}
                  title="Mutual Funds (Fidelity)"
                  description="Traditional funds with automatic reinvestment. Great for Fidelity account holders."
                  icon="📊"
                  isDark={isDark}
                />
                <OptionCard
                  selected={fundPreference === 'etfs'}
                  onClick={() => setFundPreference('etfs')}
                  title="ETFs"
                  description="Trade like stocks, lower expense ratios. Vanguard, Schwab, and more."
                  icon="📈"
                  isDark={isDark}
                />
                <OptionCard
                  selected={fundPreference === 'mixed'}
                  onClick={() => setFundPreference('mixed')}
                  title="Mixed (Best of Both)"
                  description="Combine mutual funds and ETFs for maximum flexibility."
                  icon="🎯"
                  isDark={isDark}
                />
              </div>

              <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-gray-100'}`}>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  💡 <strong>Tip:</strong> Mutual funds are great for automatic investing. ETFs offer more flexibility and often lower fees.
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Additional Options (Precious Metals & Stocks) */}
          {step === 5 && (
            <div>
              <div className="text-center mb-6">
                <h2 className={`text-lg md:text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Want to add some extras?
                </h2>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Diversify with precious metals and individual stocks
                </p>
              </div>

              {/* Precious Metals Section */}
              <div className="mb-6">
                <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  🪙 Precious Metals (Gold & Silver)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => setPreciousMetals('none')}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      preciousMetals === 'none'
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : isDark
                          ? 'border-slate-600 bg-slate-800/50'
                          : 'border-gray-200 bg-white'
                    }`}
                  >
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>None</p>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>0%</p>
                  </button>
                  <button
                    onClick={() => setPreciousMetals('small')}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      preciousMetals === 'small'
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : isDark
                          ? 'border-slate-600 bg-slate-800/50'
                          : 'border-gray-200 bg-white'
                    }`}
                  >
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Small</p>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>5%</p>
                  </button>
                  <button
                    onClick={() => setPreciousMetals('moderate')}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      preciousMetals === 'moderate'
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : isDark
                          ? 'border-slate-600 bg-slate-800/50'
                          : 'border-gray-200 bg-white'
                    }`}
                  >
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Moderate</p>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>10%</p>
                  </button>
                </div>
                <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  Gold (GLD) & Silver (SLV) ETFs as inflation hedge
                </p>
              </div>

              {/* Individual Stocks Section */}
              <div>
                <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  🏢 Individual Stocks (Blue Chips)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => setIndividualStocks('none')}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      individualStocks === 'none'
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : isDark
                          ? 'border-slate-600 bg-slate-800/50'
                          : 'border-gray-200 bg-white'
                    }`}
                  >
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>None</p>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>0%</p>
                  </button>
                  <button
                    onClick={() => setIndividualStocks('small')}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      individualStocks === 'small'
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : isDark
                          ? 'border-slate-600 bg-slate-800/50'
                          : 'border-gray-200 bg-white'
                    }`}
                  >
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Small</p>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>8%</p>
                  </button>
                  <button
                    onClick={() => setIndividualStocks('moderate')}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      individualStocks === 'moderate'
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : isDark
                          ? 'border-slate-600 bg-slate-800/50'
                          : 'border-gray-200 bg-white'
                    }`}
                  >
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Moderate</p>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>15%</p>
                  </button>
                </div>
                <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  Hand-picked stocks based on your risk profile (AAPL, MSFT, GOOGL, BRK.B, JNJ)
                </p>
              </div>

              <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-gray-100'}`}>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  💡 <strong>Tip:</strong> Index funds provide diversification. Add individual stocks only if you want more control.
                </p>
              </div>
            </div>
          )}

          {/* Step 6: Results */}
          {step === 6 && allocation && (
            <div>
              {/* Interactive Hero Projection Card with What-Ifs */}
              {(() => {
                // Use what-if values or defaults
                const effectiveStarting = whatIfStarting ?? amount;
                const effectiveYears = whatIfYears ?? yearsToRetirement;
                const yearlyContribution = whatIfYearlyContribution;

                // Calculate projected values based on risk and timeline
                const stockRatio = (allocation.stockPercentage + allocation.individualStocksPercentage) / 100;
                const bondRatio = allocation.bondPercentage / 100;
                const metalRatio = allocation.preciousMetalsPercentage / 100;

                // Historical average returns (conservative estimates)
                const stockReturn = 0.10; // 10% for stocks
                const bondReturn = 0.04;  // 4% for bonds
                const metalReturn = 0.05; // 5% for precious metals

                const blendedReturn = (stockRatio * stockReturn) + (bondRatio * bondReturn) + (metalRatio * metalReturn);

                // Compound growth with annual contributions (Future Value of Annuity formula)
                // FV = P(1+r)^n + PMT * [((1+r)^n - 1) / r]
                const compoundedPrincipal = effectiveStarting * Math.pow(1 + blendedReturn, effectiveYears);
                const futureValueContributions = yearlyContribution > 0
                  ? yearlyContribution * ((Math.pow(1 + blendedReturn, effectiveYears) - 1) / blendedReturn)
                  : 0;
                const projectedValue = compoundedPrincipal + futureValueContributions;

                const totalContributed = effectiveStarting + (yearlyContribution * effectiveYears);
                const totalGain = projectedValue - totalContributed;
                const gainPercent = totalContributed > 0 ? ((projectedValue - totalContributed) / totalContributed) * 100 : 0;

                // Base scenario (without what-ifs)
                const baseProjected = amount * Math.pow(1 + blendedReturn, yearsToRetirement);
                const whatIfDifference = projectedValue - baseProjected;
                const hasWhatIfChanges = whatIfStarting !== null || whatIfYears !== null || yearlyContribution > 0;

                // Conservative and optimistic scenarios
                const conservativeReturn = blendedReturn * 0.6;
                const optimisticReturn = blendedReturn * 1.4;
                const conservativeValue = effectiveStarting * Math.pow(1 + conservativeReturn, effectiveYears) +
                  (yearlyContribution > 0 ? yearlyContribution * ((Math.pow(1 + conservativeReturn, effectiveYears) - 1) / conservativeReturn) : 0);
                const optimisticValue = effectiveStarting * Math.pow(1 + optimisticReturn, effectiveYears) +
                  (yearlyContribution > 0 ? yearlyContribution * ((Math.pow(1 + optimisticReturn, effectiveYears) - 1) / optimisticReturn) : 0);

                return (
                  <div className={`mb-6 rounded-2xl border-2 overflow-hidden ${
                    isDark
                      ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-emerald-500/30'
                      : 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'
                  }`}>
                    {/* Main Projection Display */}
                    <div className="p-6">
                      {/* Investment Amount and Projected Value */}
                      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                        <div className="text-center md:text-left">
                          <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            {hasWhatIfChanges ? 'What If Starting' : 'Investing Today'}
                          </p>
                          <p className={`text-2xl md:text-3xl font-bold font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(effectiveStarting)}
                          </p>
                          {yearlyContribution > 0 && (
                            <p className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                              +{formatCurrency(yearlyContribution)}/yr
                            </p>
                          )}
                        </div>

                        {/* Arrow Animation */}
                        <div className={`hidden md:flex items-center gap-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          <div className="w-12 h-0.5 bg-current opacity-30" />
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <span className="text-sm font-bold bg-current/10 px-2 py-1 rounded">{effectiveYears} yrs</span>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <div className="w-12 h-0.5 bg-current opacity-30" />
                        </div>

                        <div className="text-center md:text-right">
                          <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            Projected in {effectiveYears} Years
                          </p>
                          <p className={`text-3xl md:text-4xl font-bold font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {formatCurrency(Math.round(projectedValue))}
                          </p>
                          {hasWhatIfChanges && whatIfDifference !== 0 && (
                            <p className={`text-sm font-mono ${whatIfDifference > 0 ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
                              {whatIfDifference > 0 ? '+' : ''}{formatCurrency(Math.round(whatIfDifference))} vs base
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Gain Stats */}
                      <div className={`flex flex-wrap justify-center gap-4 p-4 rounded-xl mb-4 ${
                        isDark ? 'bg-slate-900/50' : 'bg-white/60'
                      }`}>
                        <div className="text-center">
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Total Gain</p>
                          <p className={`text-lg font-bold font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            +{formatCurrency(Math.round(totalGain))}
                          </p>
                        </div>
                        <div className={`w-px ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
                        <div className="text-center">
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Return</p>
                          <p className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            +{gainPercent.toFixed(0)}%
                          </p>
                        </div>
                        <div className={`w-px ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
                        <div className="text-center">
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Avg. Annual</p>
                          <p className={`text-lg font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                            {(blendedReturn * 100).toFixed(1)}%
                          </p>
                        </div>
                        {yearlyContribution > 0 && (
                          <>
                            <div className={`w-px ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
                            <div className="text-center">
                              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Total Invested</p>
                              <p className={`text-lg font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                                {formatCurrency(Math.round(totalContributed))}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Scenario Range */}
                      <div className="relative pt-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                            Conservative: {formatCurrency(Math.round(conservativeValue))}
                          </span>
                          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                            Optimistic: {formatCurrency(Math.round(optimisticValue))}
                          </span>
                        </div>
                        <div className={`h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-emerald-600"
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* What-If Toggle */}
                    <button
                      onClick={() => setShowWhatIf(!showWhatIf)}
                      className={`w-full py-3 px-6 flex items-center justify-center gap-2 transition-all ${
                        showWhatIf
                          ? isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                          : isDark ? 'bg-slate-800/50 text-slate-400 hover:text-slate-300' : 'bg-gray-100 text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span className="font-medium">What If...?</span>
                      <svg className={`w-4 h-4 transition-transform ${showWhatIf ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* What-If Controls */}
                    {showWhatIf && (
                      <div className={`p-6 border-t ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-gray-200 bg-white/50'}`}>
                        <div className="space-y-5">
                          {/* Yearly Contribution */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                                Add yearly contribution
                              </label>
                              <span className={`font-mono font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                                {formatCurrency(whatIfYearlyContribution)}/yr
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="50000"
                              step="1000"
                              value={whatIfYearlyContribution}
                              onChange={(e) => setWhatIfYearlyContribution(parseInt(e.target.value))}
                              className="w-full h-2 rounded-full appearance-none cursor-pointer"
                              style={{
                                background: `linear-gradient(to right, ${isDark ? '#a855f7' : '#9333ea'} ${(whatIfYearlyContribution / 50000) * 100}%, ${isDark ? '#334155' : '#e5e7eb'} ${(whatIfYearlyContribution / 50000) * 100}%)`
                              }}
                            />
                            <div className="flex justify-between mt-1">
                              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>$0</span>
                              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>$50k/yr</span>
                            </div>
                          </div>

                          {/* What-If Years */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                                What if I had {whatIfYears ?? yearsToRetirement} years?
                              </label>
                              <span className={`font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                                {whatIfYears ?? yearsToRetirement} yrs
                              </span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="40"
                              value={whatIfYears ?? yearsToRetirement}
                              onChange={(e) => setWhatIfYears(parseInt(e.target.value))}
                              className="w-full h-2 rounded-full appearance-none cursor-pointer"
                              style={{
                                background: `linear-gradient(to right, ${isDark ? '#22d3ee' : '#06b6d4'} ${((whatIfYears ?? yearsToRetirement) / 40) * 100}%, ${isDark ? '#334155' : '#e5e7eb'} ${((whatIfYears ?? yearsToRetirement) / 40) * 100}%)`
                              }}
                            />
                            <div className="flex justify-between mt-1">
                              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>1 yr</span>
                              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>40 yrs</span>
                            </div>
                          </div>

                          {/* What-If Starting Amount */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                                What if I started with...
                              </label>
                              <span className={`font-mono font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                {formatCurrency(whatIfStarting ?? amount)}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="1000"
                              max="500000"
                              step="1000"
                              value={whatIfStarting ?? amount}
                              onChange={(e) => setWhatIfStarting(parseInt(e.target.value))}
                              className="w-full h-2 rounded-full appearance-none cursor-pointer"
                              style={{
                                background: `linear-gradient(to right, ${isDark ? '#fbbf24' : '#f59e0b'} ${((whatIfStarting ?? amount) / 500000) * 100}%, ${isDark ? '#334155' : '#e5e7eb'} ${((whatIfStarting ?? amount) / 500000) * 100}%)`
                              }}
                            />
                            <div className="flex justify-between mt-1">
                              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>$1k</span>
                              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>$500k</span>
                            </div>
                          </div>

                          {/* Reset Button */}
                          {hasWhatIfChanges && (
                            <button
                              onClick={() => {
                                setWhatIfYearlyContribution(0);
                                setWhatIfYears(null);
                                setWhatIfStarting(null);
                              }}
                              className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                                isDark
                                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              Reset to Original Plan
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Strategy Badge */}
              <div className="text-center mb-6">
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                  allocation.stockPercentage + allocation.individualStocksPercentage >= 70
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : allocation.stockPercentage >= 50
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {allocation.riskLevel} Strategy
                </span>
                <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                  {allocation.strategy}
                </p>
              </div>

              {/* Enhanced Pie Chart with Legend */}
              <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                <PieChart
                  allocations={allocation.allocations}
                  isDark={isDark}
                  totalAmount={amount}
                  formatCurrency={formatCurrency}
                />
              </div>

              {/* Allocation Split Summary - Mobile Optimized */}
              <div className="flex flex-wrap justify-center gap-3 md:gap-6 mb-6">
                <div className="text-center min-w-[60px]">
                  <div className={`text-xl md:text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {allocation.stockPercentage}%
                  </div>
                  <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Index Funds</div>
                </div>
                <div className={`w-px hidden sm:block ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
                <div className="text-center min-w-[60px]">
                  <div className={`text-xl md:text-2xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                    {allocation.bondPercentage}%
                  </div>
                  <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Bonds</div>
                </div>
                {allocation.preciousMetalsPercentage > 0 && (
                  <>
                    <div className={`w-px hidden sm:block ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
                    <div className="text-center min-w-[60px]">
                      <div className={`text-xl md:text-2xl font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                        {allocation.preciousMetalsPercentage}%
                      </div>
                      <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Metals</div>
                    </div>
                  </>
                )}
                {allocation.individualStocksPercentage > 0 && (
                  <>
                    <div className={`w-px hidden sm:block ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
                    <div className="text-center min-w-[60px]">
                      <div className={`text-xl md:text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                        {allocation.individualStocksPercentage}%
                      </div>
                      <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Stocks</div>
                    </div>
                  </>
                )}
              </div>

              {/* Interactive Fund Cards with Sparklines */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    Tap for Details
                  </h3>
                  <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                    {allocation.allocations.length} holdings
                  </span>
                </div>

                {allocation.allocations.map((fund) => (
                  <FundAllocationCard
                    key={fund.ticker}
                    fund={fund}
                    reasons={fundReasons[fund.ticker] || []}
                    sparklineData={sparklineData[fund.ticker] || []}
                    selectedPeriod={selectedPeriod}
                    onPeriodChange={handlePeriodChange}
                    isExpanded={expandedTicker === fund.ticker}
                    onToggle={() => setExpandedTicker(prev => prev === fund.ticker ? null : fund.ticker)}
                    isDark={isDark}
                    formatCurrency={formatCurrency}
                    onTickerClick={handleTickerClick}
                    isLoadingSparkline={loadingSparklines[fund.ticker]}
                  />
                ))}
              </div>

              {/* Disclaimer */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'
              }`}>
                <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                  <strong>Disclaimer:</strong> This is educational guidance, not financial advice.
                  Past performance doesn't guarantee future results. Consider consulting a financial advisor.
                  Sparkline data shown is for illustration purposes only.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button
                onClick={prevStep}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  isDark
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <button
                onClick={nextStep}
                disabled={!canProceed}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl font-medium transition-all ${
                  canProceed
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg hover:shadow-xl'
                    : isDark
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={restart}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                    isDark
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Start Over
                </button>
                {onSaveProfile && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    {saving ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Plan
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function for risk label
function getRiskLabel(val: number): string {
  if (val <= 2) return 'very conservative';
  if (val <= 4) return 'conservative';
  if (val <= 6) return 'moderate';
  if (val <= 8) return 'growth';
  return 'aggressive';
}

export default AgntNrd;
