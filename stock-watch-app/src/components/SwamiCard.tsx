import React, { memo } from 'react';
import { Stock } from '../lib/types';

interface SwamiInsight {
  aiScore: number;
  priceChange: string;
  from52Low: number;
  opportunityScore: number;
  recommendation: string;
}

interface SwamiCardProps {
  stock: Stock & { swamiInsight?: SwamiInsight; swamiScore?: number };
  onClick: (symbol: string) => void;
  onAddToWatchlist?: (symbol: string) => void;
  isInWatchlist?: boolean;
}

/**
 * SwamiCard - Moroccan/Arabian Nights themed stock card
 * For early entry opportunities
 */
const SwamiCard: React.FC<SwamiCardProps> = memo(
  ({ stock, onClick, onAddToWatchlist, isInWatchlist = false }) => {
    const { quote, profile, swamiInsight, swamiScore } = stock;

    const priceChange = quote?.regularMarketChange || 0;
    const priceChangePercent = quote?.regularMarketChangePercent || 0;
    const isPositive = priceChange >= 0;

    // Opportunity level based on swami score
    const getOpportunityLevel = () => {
      const score = swamiInsight?.opportunityScore || 0;
      if (score >= 120) return { label: 'Exceptional', color: 'text-amber-300', glow: 'shadow-amber-500/30' };
      if (score >= 100) return { label: 'Strong', color: 'text-teal-300', glow: 'shadow-teal-500/30' };
      if (score >= 80) return { label: 'Good', color: 'text-violet-300', glow: 'shadow-violet-500/30' };
      return { label: 'Moderate', color: 'text-rose-300', glow: 'shadow-rose-500/30' };
    };

    const opportunity = getOpportunityLevel();

    // 52-week position visualization
    const position52 = swamiInsight?.from52Low || 50;

    return (
      <div
        className={`
          relative overflow-hidden rounded-2xl cursor-pointer
          bg-gradient-to-br from-[#1a1033] via-[#2d1f4e] to-[#1a2744]
          border border-amber-900/30
          hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-900/20
          transition-all duration-300 group
        `}
        onClick={() => onClick(stock.symbol)}
      >
        {/* Moroccan Pattern Overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23d4af37' stroke-width='0.5'/%3E%3Ccircle cx='30' cy='30' r='10' fill='none' stroke='%23d4af37' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '30px 30px'
          }}
        />

        {/* Glowing orb effect */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-500" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl" />

        <div className="relative p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xl text-amber-100 group-hover:text-amber-300 transition-colors">
                  {stock.symbol}
                </h3>
                <span className="text-amber-500/60">✦</span>
              </div>
              <p className="text-sm text-violet-300/70 truncate max-w-[140px]">
                {profile?.name || quote?.shortName || stock.symbol}
              </p>
            </div>

            {/* Swami Score Badge */}
            <div className={`px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-900/40 to-amber-800/20 border border-amber-500/30 ${opportunity.glow} shadow-lg`}>
              <div className="flex items-center gap-1.5">
                <span className="text-lg">🔮</span>
                <span className={`font-bold text-sm ${opportunity.color}`}>
                  {swamiInsight?.opportunityScore || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-2xl font-bold font-mono text-white">
              ${quote?.regularMarketPrice?.toFixed(2) || '—'}
            </span>
            <span className={`text-sm font-mono font-semibold px-2 py-1 rounded-lg ${
              isPositive
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              {isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%
            </span>
          </div>

          {/* Swami Insights */}
          <div className="space-y-3">
            {/* 52-Week Position Bar */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] uppercase tracking-wider text-violet-400/60">52-Week Range</span>
                <span className="text-[10px] text-amber-400/80">{position52}% from low</span>
              </div>
              <div className="h-2 bg-violet-950/50 rounded-full overflow-hidden relative">
                {/* Low zone (green/good entry) */}
                <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-teal-600/30 to-transparent" />
                {/* High zone (red/late entry) */}
                <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-rose-600/30 to-transparent" />
                {/* Position indicator */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-amber-400 rounded-full shadow-lg shadow-amber-500/50 border-2 border-amber-200"
                  style={{ left: `calc(${position52}% - 6px)` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-teal-400/60">52w Low</span>
                <span className="text-[9px] text-rose-400/60">52w High</span>
              </div>
            </div>

            {/* Insight Grid */}
            <div className="grid grid-cols-3 gap-2">
              {/* AI Score */}
              <div className="bg-violet-950/40 rounded-lg p-2 border border-violet-500/20">
                <div className="text-[9px] uppercase tracking-wider text-violet-400/60 mb-0.5">AI Score</div>
                <div className="text-lg font-bold text-violet-300">{swamiInsight?.aiScore || 0}%</div>
              </div>

              {/* Entry Signal */}
              <div className="bg-teal-950/40 rounded-lg p-2 border border-teal-500/20">
                <div className="text-[9px] uppercase tracking-wider text-teal-400/60 mb-0.5">Entry</div>
                <div className={`text-lg font-bold ${
                  position52 <= 30 ? 'text-teal-300' : position52 <= 60 ? 'text-amber-300' : 'text-rose-300'
                }`}>
                  {position52 <= 30 ? '◉ Low' : position52 <= 60 ? '◐ Mid' : '○ High'}
                </div>
              </div>

              {/* Opportunity */}
              <div className="bg-amber-950/40 rounded-lg p-2 border border-amber-500/20">
                <div className="text-[9px] uppercase tracking-wider text-amber-400/60 mb-0.5">Signal</div>
                <div className={`text-sm font-bold ${opportunity.color}`}>{opportunity.label}</div>
              </div>
            </div>

            {/* Why Swami Picked This */}
            <div className="bg-gradient-to-r from-violet-950/50 to-amber-950/30 rounded-lg p-3 border border-amber-500/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-400">✧</span>
                <span className="text-[10px] uppercase tracking-wider text-amber-400/80 font-semibold">
                  Swami's Insight
                </span>
              </div>
              <p className="text-xs text-violet-200/80 leading-relaxed">
                {position52 <= 30 ? (
                  <>Near 52-week lows with <span className="text-teal-300">{swamiInsight?.aiScore}% AI score</span>.
                  Price down <span className="text-rose-300">{swamiInsight?.priceChange}%</span> today.
                  <span className="text-amber-300"> Potential early entry.</span></>
                ) : position52 <= 60 ? (
                  <>Mid-range entry with solid <span className="text-teal-300">{swamiInsight?.aiScore}% fundamentals</span>.
                  Today's move: <span className={parseFloat(swamiInsight?.priceChange || '0') < 0 ? 'text-rose-300' : 'text-teal-300'}>{swamiInsight?.priceChange}%</span>.
                  <span className="text-amber-300"> Watch for pullbacks.</span></>
                ) : (
                  <>Extended from lows but <span className="text-teal-300">{swamiInsight?.aiScore}% quality score</span>.
                  <span className="text-amber-300"> Consider waiting for better entry.</span></>
                )}
              </p>
            </div>
          </div>

          {/* Watchlist Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToWatchlist?.(stock.symbol);
            }}
            className={`w-full mt-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              isInWatchlist
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-violet-500/10 text-violet-300 border border-violet-500/20 hover:bg-violet-500/20 hover:border-violet-500/40'
            }`}
          >
            {isInWatchlist ? (
              <>
                <span>✓</span>
                <span>Watching</span>
              </>
            ) : (
              <>
                <span>+</span>
                <span>Add to Watchlist</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }
);

SwamiCard.displayName = 'SwamiCard';

export default SwamiCard;
