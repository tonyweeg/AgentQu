import React, { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface CryptoModalProps {
  isOpen: boolean;
  onClose: () => void;
  indices: CryptoData[];
}

const CRYPTO_CONFIG: Record<string, { name: string; fullName: string; flag: string; color: string }> = {
  'BTC-USD': { name: 'BTC', fullName: 'Bitcoin', flag: '₿', color: 'orange' },
  'ETH-USD': { name: 'ETH', fullName: 'Ethereum', flag: '⟠', color: 'blue' },
  'SOL-USD': { name: 'SOL', fullName: 'Solana', flag: '◎', color: 'purple' },
  'XRP-USD': { name: 'XRP', fullName: 'XRP', flag: '✕', color: 'gray' },
  'DOGE-USD': { name: 'DOGE', fullName: 'Dogecoin', flag: '🐕', color: 'yellow' },
};

const CRYPTO_SYMBOLS = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'DOGE-USD'];

const CryptoModal: React.FC<CryptoModalProps> = ({ isOpen, onClose, indices }) => {
  const { isDark } = useTheme();

  const cryptos = useMemo(() => {
    return CRYPTO_SYMBOLS
      .map(symbol => indices.find(i => i.symbol === symbol))
      .filter((c): c is CryptoData => c !== undefined);
  }, [indices]);

  const btc = cryptos.find(c => c.symbol === 'BTC-USD');
  const eth = cryptos.find(c => c.symbol === 'ETH-USD');

  // Calculate total market sentiment
  const avgChange = cryptos.length > 0
    ? cryptos.reduce((sum, c) => sum + c.changePercent, 0) / cryptos.length
    : 0;
  const sentiment = avgChange > 2 ? 'bullish' : avgChange < -2 ? 'bearish' : 'neutral';

  // BTC Dominance proxy (simplified)
  const btcDominanceIndicator = btc && eth
    ? btc.changePercent > eth.changePercent ? 'BTC leading' : 'Alts outperforming'
    : null;

  // Generate dynamic narrative
  const generateNarrative = () => {
    if (!btc) return 'Crypto data unavailable.';

    const btcDirection = btc.changePercent > 0 ? 'higher' : 'lower';
    const altPerformance = eth
      ? eth.changePercent > btc.changePercent ? 'outpacing Bitcoin' : 'lagging Bitcoin'
      : 'mixed';

    const narratives = {
      bullish: `Cryptocurrency markets are showing strength with Bitcoin trading ${btcDirection} at $${btc.price.toLocaleString()}. Risk-on sentiment is driving capital into digital assets as altcoins are ${altPerformance}. Institutional flows and ETF activity remain key catalysts. Watch for resistance levels as momentum builds.`,
      bearish: `Cryptocurrency markets face selling pressure with Bitcoin trading ${btcDirection} at $${btc.price.toLocaleString()}. Risk-off sentiment and macro headwinds are weighing on digital assets. Altcoins are ${altPerformance}. Monitor support levels and funding rates for signs of capitulation or stabilization.`,
      neutral: `Cryptocurrency markets are consolidating with Bitcoin around $${btc.price.toLocaleString()}, trading ${btcDirection} in today's session. Altcoins are ${altPerformance} as traders await directional catalysts. ETF flows and regulatory developments remain in focus for the broader market.`,
    };

    return narratives[sentiment];
  };

  // Key market drivers
  const marketDrivers = [
    { factor: 'Bitcoin ETF Flows', impact: 'Spot ETF inflows/outflows drive institutional demand', icon: '📈' },
    { factor: 'Fed Policy & Rates', impact: 'Lower rates favor risk assets; higher rates pressure crypto', icon: '🏛️' },
    { factor: 'Halving Cycle', impact: 'Bitcoin supply reduction historically precedes bull markets', icon: '⛏️' },
    { factor: 'Regulatory News', impact: 'SEC actions, legislation, and global policy shape sentiment', icon: '⚖️' },
    { factor: 'Stablecoin Supply', impact: 'USDT/USDC market cap indicates sidelined capital ready to deploy', icon: '💵' },
    { factor: 'On-Chain Metrics', impact: 'Whale accumulation, exchange flows, and HODLer behavior', icon: '🔗' },
    { factor: 'DeFi & NFT Activity', impact: 'Ecosystem usage drives demand for ETH, SOL, and others', icon: '🎨' },
    { factor: 'Macro Risk Sentiment', impact: 'Equity correlation, dollar strength, and global liquidity', icon: '🌍' },
  ];

  // Format price based on magnitude
  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(4)}`;
  };

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
              <span className="text-2xl">₿</span>
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Cryptocurrency
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Top tokens by market cap
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
            {cryptos.map(crypto => {
              const config = CRYPTO_CONFIG[crypto.symbol];
              const isPositive = crypto.change >= 0;

              return (
                <div
                  key={crypto.symbol}
                  className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{config.flag}</span>
                    <div>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {config.name}
                      </span>
                      <span className={`text-xs ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {config.fullName}
                      </span>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatPrice(crypto.price)}
                  </div>
                  <div className={`flex items-center gap-2 mt-2 text-sm font-medium ${
                    isPositive
                      ? isDark ? 'text-green-400' : 'text-green-600'
                      : isDark ? 'text-red-400' : 'text-red-600'
                  }`}>
                    <span>{isPositive ? '▲' : '▼'}</span>
                    <span>{isPositive ? '+' : ''}{crypto.changePercent.toFixed(2)}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* BTC Dominance Indicator */}
          {btcDominanceIndicator && (
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-purple-900/20 border-purple-700/30' : 'bg-purple-50 border-purple-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>₿</span>
                  <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>vs</span>
                  <span>⟠</span>
                  <span className={`font-medium ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                    Market Leadership
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  btcDominanceIndicator === 'BTC leading'
                    ? isDark ? 'bg-orange-900/50 text-orange-400' : 'bg-orange-100 text-orange-700'
                    : isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700'
                }`}>
                  {btcDominanceIndicator}
                </span>
              </div>
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {btcDominanceIndicator === 'BTC leading'
                  ? 'Bitcoin outperforming alts - typical of early cycle or risk-off periods'
                  : 'Altcoins outperforming BTC - often signals risk-on rotation and alt season'}
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
            Data via Yahoo Finance. Prices may be delayed. Not financial advice. Crypto is highly volatile.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CryptoModal;
