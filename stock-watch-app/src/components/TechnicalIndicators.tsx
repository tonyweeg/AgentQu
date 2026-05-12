import React, { memo } from 'react';
import { TechnicalData } from '../lib/types';

interface TechnicalIndicatorsProps {
  technical: TechnicalData;
  compact?: boolean;
}

/**
 * TechnicalIndicators Component
 * Displays RSI, MACD, Bollinger Bands, ADX
 */
const TechnicalIndicators: React.FC<TechnicalIndicatorsProps> = memo(({
  technical,
  compact = false,
}) => {
  const { rsi, macd, bollinger, adx } = technical;

  // RSI gauge rendering
  const renderRSIGauge = () => {
    if (!rsi) return null;

    const value = rsi.latest;
    const signal = rsi.signal;

    // RSI zones: 0-30 oversold (green buy), 30-70 neutral, 70-100 overbought (red sell)
    const getZoneColor = () => {
      if (value <= 30) return 'text-green-600';
      if (value >= 70) return 'text-red-600';
      return 'text-yellow-600';
    };

    if (compact) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">RSI</span>
          <span className={`text-xs font-bold ${getZoneColor()}`}>{value.toFixed(0)}</span>
        </div>
      );
    }

    return (
      <div className="p-3 bg-white border rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">RSI (14)</span>
          <span className={`text-lg font-bold ${getZoneColor()}`}>{value.toFixed(1)}</span>
        </div>

        {/* RSI Bar */}
        <div className="relative h-3 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-full">
          <div
            className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-gray-800 rounded-full border-2 border-white shadow"
            style={{ left: `calc(${Math.min(Math.max(value, 0), 100)}% - 6px)` }}
          />
          {/* Zone markers */}
          <div className="absolute top-full mt-1 flex justify-between w-full text-xs text-gray-400">
            <span>Oversold</span>
            <span>Neutral</span>
            <span>Overbought</span>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-600">
          <span className={`px-2 py-0.5 rounded ${
            signal.signal === 'oversold' ? 'bg-green-100 text-green-700' :
            signal.signal === 'overbought' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {signal.label}
          </span>
        </div>
      </div>
    );
  };

  // MACD rendering
  const renderMACD = () => {
    if (!macd) return null;

    const { latest, crossover, trend } = macd;
    const isBullish = trend === 'bullish';

    if (compact) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">MACD</span>
          <span className={`text-xs font-bold ${isBullish ? 'text-green-600' : 'text-red-600'}`}>
            {isBullish ? '▲' : '▼'}
          </span>
        </div>
      );
    }

    return (
      <div className="p-3 bg-white border rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">MACD</span>
          <span className={`text-sm font-bold ${isBullish ? 'text-green-600' : 'text-red-600'}`}>
            {isBullish ? '▲ Bullish' : '▼ Bearish'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="text-gray-500">MACD</div>
            <div className={`font-medium ${latest.macd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {latest.macd.toFixed(2)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">Signal</div>
            <div className="font-medium">{latest.signal.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">Histogram</div>
            <div className={`font-medium ${latest.histogram >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {latest.histogram.toFixed(2)}
            </div>
          </div>
        </div>

        {crossover !== 'none' && (
          <div className={`mt-2 text-xs px-2 py-1 rounded text-center ${
            crossover === 'bullish' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {crossover === 'bullish' ? '✓ Bullish Crossover' : '✗ Bearish Crossover'}
          </div>
        )}
      </div>
    );
  };

  // Bollinger Bands rendering
  const renderBollinger = () => {
    if (!bollinger) return null;

    const { latest, volatility } = bollinger;

    if (compact) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Vol</span>
          <span className={`text-xs font-bold ${
            volatility === 'high' ? 'text-red-600' :
            volatility === 'low' ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {volatility}
          </span>
        </div>
      );
    }

    return (
      <div className="p-3 bg-white border rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Bollinger Bands</span>
          <span className={`text-xs px-2 py-0.5 rounded ${
            volatility === 'high' ? 'bg-red-100 text-red-700' :
            volatility === 'low' ? 'bg-green-100 text-green-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {volatility} volatility
          </span>
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Upper</span>
            <span className="font-medium text-red-600">${latest.upper.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Middle</span>
            <span className="font-medium">${latest.middle.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Lower</span>
            <span className="font-medium text-green-600">${latest.lower.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  };

  // ADX rendering
  const renderADX = () => {
    if (!adx) return null;

    const { latest, trendStrength } = adx;

    if (compact) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Trend</span>
          <span className="text-xs font-bold">{trendStrength.label}</span>
        </div>
      );
    }

    return (
      <div className="p-3 bg-white border rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">ADX (Trend)</span>
          <span className="text-lg font-bold">{latest.toFixed(1)}</span>
        </div>

        <div className={`text-xs px-2 py-1 rounded text-center ${
          trendStrength.strength === 'strong' ? 'bg-blue-100 text-blue-700' :
          trendStrength.strength === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {trendStrength.label}
        </div>
      </div>
    );
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-3">
        {renderRSIGauge()}
        {renderMACD()}
        {renderBollinger()}
        {renderADX()}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-700">Technical Indicators</h4>
      <div className="grid grid-cols-2 gap-3">
        {renderRSIGauge()}
        {renderMACD()}
        {renderBollinger()}
        {renderADX()}
      </div>
    </div>
  );
});

TechnicalIndicators.displayName = 'TechnicalIndicators';

export default TechnicalIndicators;
