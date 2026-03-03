import React, { memo } from 'react';
import { Stock } from '../lib/types';

interface StockCardProps {
  stock: Stock;
  onClick: (symbol: string) => void;
  onAddToWatchlist?: (symbol: string) => void;
  isInWatchlist?: boolean;
  showScore?: boolean;
}

/**
 * StockCard Component
 * Displays a stock with key metrics and score
 * Memoized for performance
 */
const StockCard: React.FC<StockCardProps> = memo(
  ({ stock, onClick, onAddToWatchlist, isInWatchlist = false, showScore = true }) => {
    const { quote, profile, scoreData } = stock;

    // Price change styling
    const priceChange = quote?.regularMarketChange || 0;
    const priceChangePercent = quote?.regularMarketChangePercent || 0;
    const isPositive = priceChange >= 0;
    const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
    const changeBg = isPositive ? 'bg-green-100' : 'bg-red-100';

    // Score styling
    const score = stock.score || scoreData?.total || 0;
    const maxScore = scoreData?.maxPossible || 305;
    const scorePercent = (score / maxScore) * 100;

    const getScoreColor = () => {
      if (scorePercent >= 70) return 'text-green-600';
      if (scorePercent >= 55) return 'text-green-500';
      if (scorePercent >= 45) return 'text-yellow-500';
      if (scorePercent >= 30) return 'text-orange-500';
      return 'text-red-500';
    };

    const getRecommendationBadge = () => {
      const rec = scoreData?.recommendation;
      if (!rec) return null;

      const colors: Record<string, string> = {
        STRONG_BUY: 'bg-green-600 text-white',
        BUY: 'bg-green-500 text-white',
        HOLD: 'bg-yellow-500 text-white',
        SELL: 'bg-orange-500 text-white',
        STRONG_SELL: 'bg-red-500 text-white',
      };

      return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[rec.action] || 'bg-gray-200'}`}>
          {rec.label}
        </span>
      );
    };

    return (
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onClick(stock.symbol)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{stock.symbol}</h3>
            <p className="text-sm text-gray-500 truncate max-w-[180px]">
              {profile?.name || quote?.shortName || stock.symbol}
            </p>
          </div>
          {showScore && getRecommendationBadge()}
        </div>

        {/* Price */}
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-2xl font-bold text-gray-900">
            ${quote?.regularMarketPrice?.toFixed(2) || '—'}
          </span>
          <span className={`text-sm font-medium ${changeBg} ${changeColor} px-2 py-0.5 rounded`}>
            {isPositive ? '+' : ''}
            {priceChangePercent.toFixed(2)}%
          </span>
        </div>

        {/* Score Bar */}
        {showScore && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-500">Score</span>
              <span className={`font-bold ${getScoreColor()}`}>
                {score}/{maxScore}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  scorePercent >= 70
                    ? 'bg-green-500'
                    : scorePercent >= 55
                    ? 'bg-green-400'
                    : scorePercent >= 45
                    ? 'bg-yellow-400'
                    : scorePercent >= 30
                    ? 'bg-orange-400'
                    : 'bg-red-400'
                }`}
                style={{ width: `${Math.min(scorePercent, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div>
            <span className="text-gray-500">P/E</span>
            <span className="ml-1 font-medium">
              {stock.metrics?.peRatio ? stock.metrics.peRatio.toFixed(1) : '—'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Mkt Cap</span>
            <span className="ml-1 font-medium">
              {quote?.marketCap ? formatMarketCap(quote.marketCap) : '—'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Div Yield</span>
            <span className="ml-1 font-medium">
              {stock.metrics?.dividendYield
                ? `${stock.metrics.dividendYield.toFixed(1)}%`
                : '—'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Beta</span>
            <span className="ml-1 font-medium">
              {stock.metrics?.beta ? stock.metrics.beta.toFixed(2) : '—'}
            </span>
          </div>
        </div>

        {/* Watchlist Button */}
        {onAddToWatchlist && (
          <button
            className={`w-full py-2 rounded text-sm font-medium transition-colors ${
              isInWatchlist
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onAddToWatchlist(stock.symbol);
            }}
          >
            {isInWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist'}
          </button>
        )}

        {/* Top Reason */}
        {scoreData?.topReasons?.[0]?.reasons?.[0] && (
          <p className="text-xs text-gray-500 mt-2 truncate">
            {scoreData.topReasons[0].reasons[0]}
          </p>
        )}
      </div>
    );
  }
);

// Format market cap to human readable
function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

StockCard.displayName = 'StockCard';

export default StockCard;
