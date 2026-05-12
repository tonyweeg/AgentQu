import React, { memo } from 'react';

interface PriceTargetProps {
  currentPrice: number;
  targetLow: number;
  targetMean: number;
  targetHigh: number;
  compact?: boolean;
}

/**
 * PriceTargetIndicator Component
 * Visual display of analyst price targets vs current price
 */
const PriceTargetIndicator: React.FC<PriceTargetProps> = memo(({
  currentPrice,
  targetLow,
  targetMean,
  targetHigh,
  compact = false,
}) => {
  // Calculate position of current price on the target range
  const range = targetHigh - targetLow;
  const currentPosition = range > 0 ? ((currentPrice - targetLow) / range) * 100 : 50;
  const meanPosition = range > 0 ? ((targetMean - targetLow) / range) * 100 : 50;

  // Calculate upside/downside
  const upsidePercent = ((targetMean - currentPrice) / currentPrice) * 100;
  const isUpside = upsidePercent > 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Target:</span>
        <span className={`text-xs font-medium ${isUpside ? 'text-green-600' : 'text-red-600'}`}>
          ${targetMean.toFixed(0)} ({isUpside ? '+' : ''}{upsidePercent.toFixed(0)}%)
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Analyst Price Target</span>
        <span className={`text-sm font-bold ${isUpside ? 'text-green-600' : 'text-red-600'}`}>
          {isUpside ? '▲' : '▼'} {Math.abs(upsidePercent).toFixed(1)}% {isUpside ? 'upside' : 'downside'}
        </span>
      </div>

      {/* Visual Range Bar */}
      <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
        {/* Low to High gradient */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200"
          style={{ width: '100%' }}
        />

        {/* Mean target marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-blue-600"
          style={{ left: `${Math.min(Math.max(meanPosition, 5), 95)}%` }}
        >
          <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs text-blue-600 font-medium whitespace-nowrap">
            ${targetMean.toFixed(0)}
          </div>
        </div>

        {/* Current price marker */}
        <div
          className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-800 rounded-full border-2 border-white shadow-lg"
          style={{ left: `calc(${Math.min(Math.max(currentPosition, 2), 98)}% - 8px)` }}
        >
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-800 font-bold whitespace-nowrap">
            ${currentPrice.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-6 text-xs text-gray-500">
        <span>Low: ${targetLow.toFixed(0)}</span>
        <span>High: ${targetHigh.toFixed(0)}</span>
      </div>
    </div>
  );
});

PriceTargetIndicator.displayName = 'PriceTargetIndicator';

export default PriceTargetIndicator;
