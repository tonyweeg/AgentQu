import React, { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface MetalData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface PreciousMetalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  indices: MetalData[];
}

const METAL_CONFIG: Record<string, { name: string; flag: string; unit: string; color: string }> = {
  'GC=F': { name: 'Gold', flag: '🥇', unit: '/oz', color: 'yellow' },
  'SI=F': { name: 'Silver', flag: '🥈', unit: '/oz', color: 'gray' },
  'PL=F': { name: 'Platinum', flag: '⚪', unit: '/oz', color: 'slate' },
  'PA=F': { name: 'Palladium', flag: '🔘', unit: '/oz', color: 'zinc' },
  'HG=F': { name: 'Copper', flag: '🟤', unit: '/lb', color: 'orange' },
};

const METAL_SYMBOLS = ['GC=F', 'SI=F', 'PL=F', 'PA=F', 'HG=F'];

const PreciousMetalsModal: React.FC<PreciousMetalsModalProps> = ({ isOpen, onClose, indices }) => {
  const { isDark } = useTheme();

  const metals = useMemo(() => {
    return METAL_SYMBOLS
      .map(symbol => indices.find(i => i.symbol === symbol))
      .filter((m): m is MetalData => m !== undefined);
  }, [indices]);

  const gold = metals.find(m => m.symbol === 'GC=F');
  const silver = metals.find(m => m.symbol === 'SI=F');

  // Calculate Gold/Silver ratio
  const goldSilverRatio = gold && silver ? (gold.price / silver.price).toFixed(1) : null;

  // Determine market sentiment based on changes
  const avgChange = metals.reduce((sum, m) => sum + m.changePercent, 0) / metals.length;
  const sentiment = avgChange > 0.5 ? 'bullish' : avgChange < -0.5 ? 'bearish' : 'neutral';

  // Generate dynamic narrative
  const generateNarrative = () => {
    const goldMove = gold ? (gold.changePercent > 0 ? 'higher' : 'lower') : 'steady';
    const silverMove = silver ? (silver.changePercent > 0 ? 'advancing' : 'retreating') : 'holding';

    const narratives = {
      bullish: `Precious metals are showing strength today with gold trading ${goldMove} and silver ${silverMove}. Safe-haven demand appears elevated as investors seek protection against economic uncertainty. The Gold/Silver ratio at ${goldSilverRatio} suggests ${Number(goldSilverRatio) > 80 ? 'silver may be undervalued relative to gold' : Number(goldSilverRatio) < 70 ? 'gold is relatively expensive' : 'balanced precious metals pricing'}.`,
      bearish: `Precious metals face headwinds today with gold trading ${goldMove} and silver ${silverMove}. Risk-on sentiment and dollar strength may be pressuring the complex. Watch for support levels as traders reassess positioning.`,
      neutral: `Precious metals are consolidating in today's session with gold trading ${goldMove} and silver ${silverMove}. Markets await key economic data and Fed commentary for directional cues. The Gold/Silver ratio at ${goldSilverRatio} remains within historical norms.`,
    };

    return narratives[sentiment];
  };

  // Key market drivers
  const marketDrivers = [
    { factor: 'Fed Policy', impact: 'Rate expectations influence opportunity cost of holding non-yielding assets', icon: '🏛️' },
    { factor: 'Dollar Strength', impact: 'Inverse relationship - stronger USD typically pressures metals priced in dollars', icon: '💵' },
    { factor: 'Inflation Data', impact: 'CPI/PPI readings drive inflation hedge demand for gold and silver', icon: '📈' },
    { factor: 'Geopolitical Risk', impact: 'Global tensions increase safe-haven flows into precious metals', icon: '🌍' },
    { factor: 'Industrial Demand', impact: 'Silver, platinum, palladium see demand from EVs, solar, and electronics', icon: '🏭' },
    { factor: 'Central Bank Buying', impact: 'Global central banks continue accumulating gold reserves', icon: '🏦' },
  ];

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
              <span className="text-2xl">🥇</span>
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Precious Metals
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Live prices and market analysis
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
          {/* Prices Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {metals.map(metal => {
              const config = METAL_CONFIG[metal.symbol];
              const isPositive = metal.change >= 0;

              return (
                <div
                  key={metal.symbol}
                  className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{config.flag}</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {config.name}
                    </span>
                  </div>
                  <div className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    ${metal.price.toLocaleString(undefined, {
                      minimumFractionDigits: metal.price < 100 ? 2 : 0,
                      maximumFractionDigits: metal.price < 100 ? 2 : 0
                    })}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {config.unit}
                  </div>
                  <div className={`flex items-center gap-2 mt-2 text-sm font-medium ${
                    isPositive
                      ? isDark ? 'text-green-400' : 'text-green-600'
                      : isDark ? 'text-red-400' : 'text-red-600'
                  }`}>
                    <span>{isPositive ? '▲' : '▼'}</span>
                    <span>{isPositive ? '+' : ''}{metal.change.toFixed(2)}</span>
                    <span>({isPositive ? '+' : ''}{metal.changePercent.toFixed(2)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gold/Silver Ratio */}
          {goldSilverRatio && (
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-yellow-900/20 border-yellow-700/30' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>🥇</span>
                  <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>/</span>
                  <span>🥈</span>
                  <span className={`font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                    Gold/Silver Ratio
                  </span>
                </div>
                <span className={`text-2xl font-bold font-mono ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                  {goldSilverRatio}
                </span>
              </div>
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Historical average: ~60-70 | Above 80 suggests silver may be undervalued
              </p>
            </div>
          )}

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
            Data from COMEX futures. Prices delayed. Not financial advice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PreciousMetalsModal;
