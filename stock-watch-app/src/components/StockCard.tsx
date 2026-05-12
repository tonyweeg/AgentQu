import React, { memo, useState } from 'react';
import { Stock } from '../lib/types';
import { useTheme } from '../contexts/ThemeContext';

interface StockCardProps {
  stock: Stock;
  onClick: (symbol: string) => void;
  onAddToWatchlist?: (symbol: string) => void;
  isInWatchlist?: boolean;
  showScore?: boolean;
}

/**
 * StockCard Component - Supports Light/Dark Theme
 * Memoized for performance
 */
// Strategy display info
const strategyInfo: Record<string, { name: string; icon: string; max: number }> = {
  valuation: { name: 'Value', icon: '📊', max: 25 },
  intrinsicvalue: { name: 'Intrinsic', icon: '💎', max: 25 },
  riskassessment: { name: 'Risk', icon: '🛡️', max: 20 },
  earningsquality: { name: 'Earnings', icon: '📈', max: 20 },
  portfoliofit: { name: 'Fit', icon: '🎯', max: 15 },
  technicaltiming: { name: 'Timing', icon: '⚡', max: 20 },
  dividendquality: { name: 'Dividend', icon: '💰', max: 15 },
  competitiveposition: { name: 'Moat', icon: '🏰', max: 15 },
  statisticaledge: { name: 'Stats', icon: '🔮', max: 15 },
  macroalignment: { name: 'Macro', icon: '🌍', max: 15 },
  sectoraffinity: { name: 'Sector', icon: '🎪', max: 20 },
};

const StockCard: React.FC<StockCardProps> = memo(
  ({ stock, onClick, onAddToWatchlist, isInWatchlist = false, showScore = true }) => {
    const { isDark } = useTheme();
    const [showScoreTooltip, setShowScoreTooltip] = useState(false);
    const { quote, profile, scoreData } = stock;

    // Price change styling
    const priceChange = quote?.regularMarketChange || 0;
    const priceChangePercent = quote?.regularMarketChangePercent || 0;
    const isPositive = priceChange >= 0;

    // Score styling
    const score = stock.score || scoreData?.total || 0;
    const maxScore = scoreData?.maxPossible || 305;
    const scorePercent = (score / maxScore) * 100;

    const getScoreColor = () => {
      if (scorePercent >= 70) return isDark ? 'text-emerald-400' : 'text-green-600';
      if (scorePercent >= 55) return isDark ? 'text-green-400' : 'text-green-500';
      if (scorePercent >= 45) return isDark ? 'text-yellow-400' : 'text-yellow-600';
      if (scorePercent >= 30) return isDark ? 'text-orange-400' : 'text-orange-500';
      return isDark ? 'text-red-400' : 'text-red-500';
    };

    const getScoreBarColor = () => {
      if (scorePercent >= 70) return 'bg-gradient-to-r from-emerald-500 to-green-400';
      if (scorePercent >= 55) return 'bg-gradient-to-r from-green-500 to-emerald-400';
      if (scorePercent >= 45) return 'bg-gradient-to-r from-yellow-500 to-amber-400';
      if (scorePercent >= 30) return 'bg-gradient-to-r from-orange-500 to-amber-500';
      return 'bg-gradient-to-r from-red-500 to-rose-400';
    };

    const getRecommendationBadge = () => {
      const rec = scoreData?.recommendation;
      if (!rec) return null;

      const colors: Record<string, { dark: string; light: string }> = {
        STRONG_BUY: { dark: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', light: 'bg-green-100 text-green-700 border-green-200' },
        BUY: { dark: 'bg-green-500/20 text-green-400 border-green-500/30', light: 'bg-green-50 text-green-600 border-green-100' },
        HOLD: { dark: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', light: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
        SELL: { dark: 'bg-orange-500/20 text-orange-400 border-orange-500/30', light: 'bg-orange-50 text-orange-600 border-orange-100' },
        STRONG_SELL: { dark: 'bg-red-500/20 text-red-400 border-red-500/30', light: 'bg-red-100 text-red-700 border-red-200' },
      };

      const colorClass = colors[rec.action] || { dark: 'bg-slate-700 text-slate-400', light: 'bg-gray-100 text-gray-600' };

      return (
        <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${isDark ? colorClass.dark : colorClass.light}`}>
          {rec.label}
        </span>
      );
    };

    return (
      <div
        className={`backdrop-blur border rounded-xl p-4 cursor-pointer transition-all duration-200 group ${
          isDark
            ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
            : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md'
        }`}
        onClick={() => onClick(stock.symbol)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className={`font-bold text-lg transition-colors ${
              isDark ? 'text-white group-hover:text-emerald-400' : 'text-gray-900 group-hover:text-blue-600'
            }`}>
              {stock.symbol}
            </h3>
            <p className={`text-sm truncate max-w-[160px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {profile?.name || quote?.shortName || stock.symbol}
            </p>
          </div>
          {showScore && getRecommendationBadge()}
        </div>

        {/* Price */}
        <div className="flex items-baseline justify-between mb-4">
          <span className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
            ${quote?.regularMarketPrice?.toFixed(2) || '—'}
          </span>
          <span className={`text-sm font-mono font-semibold px-2 py-1 rounded-lg ${
            isPositive
              ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-green-100 text-green-700'
              : isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
          }`}>
            {isPositive ? '+' : ''}
            {priceChangePercent.toFixed(2)}%
          </span>
        </div>

        {/* Score Bar with Tooltip */}
        {showScore && (
          <div
            className="mb-4 relative"
            onMouseEnter={() => setShowScoreTooltip(true)}
            onMouseLeave={() => setShowScoreTooltip(false)}
          >
            <div className="flex items-center justify-between text-sm mb-1.5 cursor-help">
              <span className={`text-xs uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>AI Score</span>
              <span className={`font-mono font-semibold ${getScoreColor()}`}>
                {score}/{maxScore}
              </span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700/50' : 'bg-gray-200'}`}>
              <div
                className={`h-full transition-all duration-500 ${getScoreBarColor()}`}
                style={{ width: `${Math.min(scorePercent, 100)}%` }}
              />
            </div>

            {/* Score Breakdown Tooltip */}
            {showScoreTooltip && scoreData?.breakdown && (
              <div
                className={`absolute top-full left-0 mt-2 w-full p-2 rounded-lg shadow-xl z-50 ${
                  isDark ? 'bg-slate-700 border border-slate-600' : 'bg-white border border-gray-200'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {Object.entries(scoreData.breakdown)
                    .filter(([key]) => key !== 'base')
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 6)
                    .map(([strategy, pts]) => {
                      const info = strategyInfo[strategy.toLowerCase()] || { name: strategy, icon: '•', max: 20 };
                      const pct = ((pts as number) / info.max) * 100;
                      return (
                        <div key={strategy} className="flex items-center gap-1 text-[10px]">
                          <span>{info.icon}</span>
                          <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>{info.name}</span>
                          <span className={`ml-auto font-mono ${
                            pct >= 70 ? (isDark ? 'text-green-400' : 'text-green-600') :
                            pct >= 40 ? (isDark ? 'text-yellow-400' : 'text-yellow-600') :
                            (isDark ? 'text-red-400' : 'text-red-600')
                          }`}>
                            {pts as number}/{info.max}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div className="flex justify-between">
            <span className={isDark ? 'text-slate-500' : 'text-gray-400'}>P/E</span>
            <span className={`font-mono ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              {stock.metrics?.peRatio ? stock.metrics.peRatio.toFixed(1) : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={isDark ? 'text-slate-500' : 'text-gray-400'}>Mkt Cap</span>
            <span className={`font-mono ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              {quote?.marketCap ? formatMarketCap(quote.marketCap) : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={isDark ? 'text-slate-500' : 'text-gray-400'}>Div Yield</span>
            <span className={`font-mono ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              {stock.metrics?.dividendYield ? `${stock.metrics.dividendYield.toFixed(1)}%` : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={isDark ? 'text-slate-500' : 'text-gray-400'}>Beta</span>
            <span className={`font-mono ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              {stock.metrics?.beta ? stock.metrics.beta.toFixed(2) : '—'}
            </span>
          </div>
        </div>

        {/* Watchlist Button */}
        {onAddToWatchlist && (
          <button
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isInWatchlist
                ? isDark
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : isDark
                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onAddToWatchlist(stock.symbol);
            }}
          >
            {isInWatchlist ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                In Watchlist
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add to Watchlist
              </span>
            )}
          </button>
        )}

        {/* Top Reason */}
        {scoreData?.topReasons?.[0]?.reasons?.[0] && (
          <p className={`text-xs mt-3 truncate border-t pt-3 ${
            isDark ? 'text-slate-500 border-slate-700/50' : 'text-gray-400 border-gray-100'
          }`}>
            {scoreData.topReasons[0].reasons[0]}
          </p>
        )}
      </div>
    );
  }
);

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

StockCard.displayName = 'StockCard';

export default StockCard;
