import React, { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface OilModalProps {
  isOpen: boolean;
  onClose: () => void;
  indices: MarketData[];
}

const OilModal: React.FC<OilModalProps> = ({ isOpen, onClose, indices }) => {
  const { isDark } = useTheme();

  const oil = useMemo(() => indices.find(i => i.symbol === 'CL=F'), [indices]);

  // Determine market sentiment based on change
  const sentiment = oil
    ? oil.changePercent > 1 ? 'bullish'
    : oil.changePercent < -1 ? 'bearish'
    : 'neutral'
    : 'neutral';

  // Price level analysis
  const priceLevel = oil
    ? oil.price > 90 ? 'elevated'
    : oil.price > 70 ? 'moderate'
    : oil.price > 50 ? 'subdued'
    : 'depressed'
    : 'unknown';

  // Generate dynamic narrative
  const generateNarrative = () => {
    if (!oil) return 'Oil data unavailable.';

    const direction = oil.changePercent > 0 ? 'higher' : 'lower';
    const magnitude = Math.abs(oil.changePercent) > 2 ? 'sharply' : Math.abs(oil.changePercent) > 1 ? 'notably' : 'modestly';

    const narratives = {
      bullish: `Crude oil is trading ${magnitude} ${direction} at $${oil.price.toFixed(2)} per barrel. Supply concerns and geopolitical tensions are supporting prices. OPEC+ production decisions remain a key focus as markets assess global demand dynamics. Energy stocks may see tailwinds from current price action.`,
      bearish: `Crude oil is under pressure, trading ${magnitude} ${direction} at $${oil.price.toFixed(2)} per barrel. Demand concerns and inventory builds are weighing on sentiment. Traders are monitoring economic data for signs of consumption trends. Energy sector weakness may persist if current dynamics continue.`,
      neutral: `Crude oil is consolidating around $${oil.price.toFixed(2)} per barrel, trading ${magnitude} ${direction} in today's session. Markets are balancing supply-side factors against demand uncertainty. Watch for OPEC+ commentary and inventory data for directional cues.`,
    };

    return narratives[sentiment];
  };

  // Key market drivers
  const marketDrivers = [
    { factor: 'OPEC+ Policy', impact: 'Production cuts or increases directly affect global supply and prices', icon: '🛢️' },
    { factor: 'Geopolitical Risk', impact: 'Middle East tensions, Russia sanctions, and shipping disruptions', icon: '🌍' },
    { factor: 'US Inventory Data', impact: 'Weekly EIA reports drive short-term price movements', icon: '📊' },
    { factor: 'China Demand', impact: 'World\'s largest importer - economic health impacts global demand', icon: '🇨🇳' },
    { factor: 'Dollar Strength', impact: 'Oil priced in USD - stronger dollar pressures prices for foreign buyers', icon: '💵' },
    { factor: 'Refinery Activity', impact: 'Seasonal maintenance, capacity utilization affects product supply', icon: '🏭' },
    { factor: 'Strategic Reserves', impact: 'SPR releases or builds signal government price management', icon: '🏛️' },
    { factor: 'Energy Transition', impact: 'Long-term demand outlook shaped by EV adoption and renewables', icon: '⚡' },
  ];

  // Price context
  const priceContext = {
    elevated: { label: 'ELEVATED', color: 'red', description: 'Above $90 - High inflation risk, consumer pressure' },
    moderate: { label: 'MODERATE', color: 'yellow', description: '$70-90 - Balanced for producers and consumers' },
    subdued: { label: 'SUBDUED', color: 'green', description: '$50-70 - Consumer friendly, producer stress' },
    depressed: { label: 'DEPRESSED', color: 'blue', description: 'Below $50 - Production cuts likely' },
    unknown: { label: 'N/A', color: 'gray', description: 'Data unavailable' },
  };

  const currentContext = priceContext[priceLevel];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
        isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 px-6 py-4 border-b ${
          isDark ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'
        } backdrop-blur-sm`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛢️</span>
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Crude Oil
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  WTI Crude Futures (CL=F)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Main Price Display */}
          {oil && (
            <div className={`p-6 rounded-xl border text-center ${
              isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className={`text-5xl font-bold font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ${oil.price.toFixed(2)}
              </div>
              <div className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                per barrel
              </div>
              <div className={`flex items-center justify-center gap-3 mt-3 text-lg font-medium ${
                oil.change >= 0
                  ? isDark ? 'text-green-400' : 'text-green-600'
                  : isDark ? 'text-red-400' : 'text-red-600'
              }`}>
                <span>{oil.change >= 0 ? '▲' : '▼'}</span>
                <span>{oil.change >= 0 ? '+' : ''}{oil.change.toFixed(2)}</span>
                <span>({oil.change >= 0 ? '+' : ''}{oil.changePercent.toFixed(2)}%)</span>
              </div>
            </div>
          )}

          {/* Price Level Indicator */}
          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-blue-900/20 border-blue-700/30' : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>📈</span>
                <span className={`font-medium ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                  Price Level
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                currentContext.color === 'red'
                  ? isDark ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700'
                  : currentContext.color === 'yellow'
                  ? isDark ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                  : currentContext.color === 'green'
                  ? isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'
                  : isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700'
              }`}>
                {currentContext.label}
              </span>
            </div>
            <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {currentContext.description}
            </p>
          </div>

          {/* Market Narrative */}
          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📊</span>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Market Analysis
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                sentiment === 'bullish'
                  ? isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'
                  : sentiment === 'bearish'
                  ? isDark ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700'
                  : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
              }`}>
                {sentiment.toUpperCase()}
              </span>
            </div>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {generateNarrative()}
            </p>
          </div>

          {/* Market Drivers */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⚡</span>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Key Market Drivers
              </h3>
            </div>
            <div className="grid gap-2">
              {marketDrivers.map((driver, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-gray-800/30 border-gray-700/50 hover:border-gray-600'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{driver.icon}</span>
                    <div>
                      <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {driver.factor}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {driver.impact}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Data from NYMEX WTI Crude futures. Prices delayed. Not financial advice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OilModal;
