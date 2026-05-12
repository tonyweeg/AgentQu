import React, { useEffect, useState, memo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import PreciousMetalsModal from './PreciousMetalsModal';
import OilModal from './OilModal';
import CryptoModal from './CryptoModal';

interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface MarketTickerProps {
  onRefresh?: () => void;
}

// Index symbols for Yahoo Finance
const INDEX_CONFIG: Record<string, { name: string; flag: string; category: 'us' | 'global' | 'commodity' | 'crypto' | 'fear' }> = {
  '^GSPC': { name: 'S&P 500', flag: '🇺🇸', category: 'us' },
  '^DJI': { name: 'Dow', flag: '🇺🇸', category: 'us' },
  '^IXIC': { name: 'Nasdaq', flag: '🇺🇸', category: 'us' },
  '^RUT': { name: 'Russell', flag: '🇺🇸', category: 'us' },
  '^VIX': { name: 'VIX', flag: '😨', category: 'fear' },
  '^FTSE': { name: 'FTSE', flag: '🇬🇧', category: 'global' },
  '^GDAXI': { name: 'DAX', flag: '🇩🇪', category: 'global' },
  '^N225': { name: 'Nikkei', flag: '🇯🇵', category: 'global' },
  '^HSI': { name: 'HSI', flag: '🇭🇰', category: 'global' },
  'GC=F': { name: 'Gold', flag: '🥇', category: 'commodity' },
  'SI=F': { name: 'Silver', flag: '🥈', category: 'commodity' },
  'PL=F': { name: 'Platinum', flag: '⚪', category: 'commodity' },
  'PA=F': { name: 'Palladium', flag: '🔘', category: 'commodity' },
  'HG=F': { name: 'Copper', flag: '🟤', category: 'commodity' },
  'CL=F': { name: 'Oil', flag: '🛢️', category: 'commodity' },
  'BTC-USD': { name: 'BTC', flag: '₿', category: 'crypto' },
  'ETH-USD': { name: 'ETH', flag: '⟠', category: 'crypto' },
  'SOL-USD': { name: 'SOL', flag: '◎', category: 'crypto' },
  'XRP-USD': { name: 'XRP', flag: '✕', category: 'crypto' },
  'DOGE-USD': { name: 'DOGE', flag: '🐕', category: 'crypto' },
};

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://us-central1-agentqu-platform.cloudfunctions.net';

/**
 * MarketTicker Component - Premium Financial Terminal Style
 * Supports Light/Dark Theme
 */
const MarketTicker: React.FC<MarketTickerProps> = memo(({ onRefresh }) => {
  const { isDark } = useTheme();
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showMetalsModal, setShowMetalsModal] = useState(false);
  const [showOilModal, setShowOilModal] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/getMarketIndices`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      if (data.success && data.indices) {
        setIndices(data.indices);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Market data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate market health (for Quick Stats Bar)
  const sp500 = indices.find(i => i.symbol === '^GSPC');
  const nasdaq = indices.find(i => i.symbol === '^IXIC');

  if (loading && indices.length === 0) {
    return (
      <div className={`bg-gradient-to-r ${isDark ? 'from-gray-900 via-gray-800 to-gray-900' : 'from-gray-100 via-gray-50 to-gray-100'}`}>
        <div className="h-24 animate-pulse flex items-center justify-center">
          <div className={`flex items-center gap-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
            <span>Loading markets...</span>
          </div>
        </div>
      </div>
    );
  }

  const getConfig = (symbol: string) => INDEX_CONFIG[symbol] || { name: symbol, flag: '📊', category: 'us' as const };

  return (
    <div className={`bg-gradient-to-r ${isDark ? 'from-gray-900 via-gray-800 to-gray-900 border-gray-700/50' : 'from-gray-100 via-white to-gray-100 border-gray-200'} border-b`}>
      {/* Main Ticker */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex items-stretch gap-0 min-w-max">
          {indices.map((index, i) => {
            const config = getConfig(index.symbol);
            const isPositive = index.change >= 0;
            const isVix = index.symbol === '^VIX';

            // For VIX, down is good (green), up is bad (red)
            const showGreen = isVix ? !isPositive : isPositive;

            return (
              <div
                key={index.symbol}
                className={`flex items-center gap-3 px-4 py-3 border-r transition-colors cursor-pointer group ${
                  isDark
                    ? 'border-gray-700/30 hover:bg-white/5'
                    : 'border-gray-200 hover:bg-gray-100'
                } ${i === 0 ? 'pl-4' : ''}`}
              >
                {/* Flag/Icon */}
                <span className="text-lg opacity-75 group-hover:opacity-100 transition-opacity">
                  {config.flag}
                </span>

                {/* Data */}
                <div className="flex flex-col">
                  <span className={`text-[10px] uppercase tracking-wider font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {config.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {index.price < 100
                        ? index.price.toFixed(2)
                        : index.price < 10000
                        ? index.price.toLocaleString(undefined, { maximumFractionDigits: 0 })
                        : (index.price / 1000).toFixed(1) + 'K'}
                    </span>
                    <span
                      className={`text-xs font-mono font-medium flex items-center gap-0.5 ${
                        showGreen
                          ? isDark ? 'text-green-400' : 'text-green-600'
                          : isDark ? 'text-red-400' : 'text-red-600'
                      }`}
                    >
                      <span className="text-[10px]">{showGreen ? '▲' : '▼'}</span>
                      {Math.abs(index.changePercent).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Last Updated */}
          {lastUpdated && (
            <div className={`flex items-center px-4 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className={`${isDark ? 'bg-black/20 border-gray-700/30' : 'bg-gray-50 border-gray-200'} border-t`}>
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-6 text-xs overflow-x-auto scrollbar-hide">
          {/* S&P Movement */}
          {sp500 && (
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>S&P:</span>
              <span className={sp500.change >= 0 ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-red-400' : 'text-red-600')}>
                {sp500.change >= 0 ? '+' : ''}{sp500.change.toFixed(2)} pts
              </span>
            </div>
          )}

          {/* Nasdaq Movement */}
          {nasdaq && (
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Nasdaq:</span>
              <span className={nasdaq.change >= 0 ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-red-400' : 'text-red-600')}>
                {nasdaq.change >= 0 ? '+' : ''}{nasdaq.change.toFixed(2)} pts
              </span>
            </div>
          )}

          {/* Precious Metals Section - Clickable */}
          <button
            onClick={() => setShowMetalsModal(true)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all cursor-pointer ${
              isDark
                ? 'bg-yellow-900/20 hover:bg-yellow-900/40 hover:ring-1 hover:ring-yellow-500/30'
                : 'bg-yellow-50 hover:bg-yellow-100 hover:ring-1 hover:ring-yellow-300'
            }`}
          >
            <span className="text-[10px]">🥇</span>
            {/* Gold */}
            {indices.find(i => i.symbol === 'GC=F') && (
              <div className="flex items-center gap-1 whitespace-nowrap">
                <span className={isDark ? 'text-yellow-400' : 'text-yellow-600'}>
                  ${indices.find(i => i.symbol === 'GC=F')?.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            )}
            <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>|</span>
            <span className="text-[10px]">🥈</span>
            {/* Silver */}
            {indices.find(i => i.symbol === 'SI=F') && (
              <div className="flex items-center gap-1 whitespace-nowrap">
                <span className={isDark ? 'text-gray-300' : 'text-gray-500'}>
                  ${indices.find(i => i.symbol === 'SI=F')?.price.toFixed(2)}
                </span>
              </div>
            )}
            <span className={`text-[8px] ml-1 ${isDark ? 'text-yellow-500/60' : 'text-yellow-600/60'}`}>▸</span>
          </button>

          {/* Oil - Clickable */}
          {indices.find(i => i.symbol === 'CL=F') && (
            <button
              onClick={() => setShowOilModal(true)}
              className={`flex items-center gap-2 whitespace-nowrap px-2 py-0.5 rounded transition-all cursor-pointer ${
                isDark
                  ? 'hover:bg-blue-900/30 hover:ring-1 hover:ring-blue-500/30'
                  : 'hover:bg-blue-50 hover:ring-1 hover:ring-blue-300'
              }`}
            >
              <span>🛢️</span>
              <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>
                ${indices.find(i => i.symbol === 'CL=F')?.price.toFixed(2)}
              </span>
              <span className={`text-[8px] ${isDark ? 'text-blue-500/60' : 'text-blue-600/60'}`}>▸</span>
            </button>
          )}

          {/* Crypto Section - Clickable */}
          <button
            onClick={() => setShowCryptoModal(true)}
            className={`flex items-center gap-2 px-2 py-0.5 rounded transition-all cursor-pointer ${
              isDark
                ? 'bg-purple-900/20 hover:bg-purple-900/40 hover:ring-1 hover:ring-purple-500/30'
                : 'bg-purple-50 hover:bg-purple-100 hover:ring-1 hover:ring-purple-300'
            }`}
          >
            <span className={`text-[10px] font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>CRYPTO</span>
            {/* BTC */}
            {indices.find(i => i.symbol === 'BTC-USD') && (
              <div className="flex items-center gap-1 whitespace-nowrap">
                <span className="text-[10px]">₿</span>
                <span className={isDark ? 'text-orange-400' : 'text-orange-600'}>
                  ${((indices.find(i => i.symbol === 'BTC-USD')?.price || 0) / 1000).toFixed(1)}K
                </span>
              </div>
            )}
            {/* ETH */}
            {indices.find(i => i.symbol === 'ETH-USD') && (
              <div className="flex items-center gap-1 whitespace-nowrap">
                <span className="text-[10px]">⟠</span>
                <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>
                  ${indices.find(i => i.symbol === 'ETH-USD')?.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            )}
            {/* SOL */}
            {indices.find(i => i.symbol === 'SOL-USD') && (
              <div className="flex items-center gap-1 whitespace-nowrap">
                <span className="text-[10px]">◎</span>
                <span className={isDark ? 'text-green-400' : 'text-green-600'}>
                  ${indices.find(i => i.symbol === 'SOL-USD')?.price.toFixed(0)}
                </span>
              </div>
            )}
            {/* XRP */}
            {indices.find(i => i.symbol === 'XRP-USD') && (
              <div className="flex items-center gap-1 whitespace-nowrap">
                <span className="text-[10px]">✕</span>
                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                  ${indices.find(i => i.symbol === 'XRP-USD')?.price.toFixed(2)}
                </span>
              </div>
            )}
            {/* DOGE */}
            {indices.find(i => i.symbol === 'DOGE-USD') && (
              <div className="flex items-center gap-1 whitespace-nowrap">
                <span className="text-[10px]">🐕</span>
                <span className={isDark ? 'text-yellow-400' : 'text-yellow-600'}>
                  ${indices.find(i => i.symbol === 'DOGE-USD')?.price.toFixed(3)}
                </span>
              </div>
            )}
            <span className={`text-[8px] ${isDark ? 'text-purple-500/60' : 'text-purple-600/60'}`}>▸</span>
          </button>
        </div>
      </div>

      {/* Precious Metals Modal */}
      <PreciousMetalsModal
        isOpen={showMetalsModal}
        onClose={() => setShowMetalsModal(false)}
        indices={indices}
      />

      {/* Oil Modal */}
      <OilModal
        isOpen={showOilModal}
        onClose={() => setShowOilModal(false)}
        indices={indices}
      />

      {/* Crypto Modal */}
      <CryptoModal
        isOpen={showCryptoModal}
        onClose={() => setShowCryptoModal(false)}
        indices={indices}
      />
    </div>
  );
});

MarketTicker.displayName = 'MarketTicker';

export default MarketTicker;
