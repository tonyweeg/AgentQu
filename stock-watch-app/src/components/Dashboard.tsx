import React, { useState, useEffect } from 'react';
import { Stock, ScreeningCriteria, AnalysisFocus, DiscoveryMode } from '../lib/types';
import { useTheme } from '../contexts/ThemeContext';
import StockCard from './StockCard';
import SwamiCard from './SwamiCard';
import MarketTicker from './MarketTicker';
import FrameworksGuide from './FrameworksGuide';

interface DashboardProps {
  userId: string | null;
  stocks: Stock[];
  loading: boolean;
  error: string | null;
  macroScore?: number;
  macroSignal?: { signal: string; label: string; color: string };
  onDiscover: (
    symbols?: string[],
    criteria?: ScreeningCriteria,
    focus?: AnalysisFocus,
    limit?: number,
    mode?: DiscoveryMode
  ) => void;
  onStockSelect: (symbol: string) => void;
  onAddToWatchlist: (symbol: string) => void;
  isInWatchlist: (symbol: string) => boolean;
  onSearch: (query: string) => void;
  searchResults: Array<{ symbol: string; name: string }>;
  onClearSearch: () => void;
}

/**
 * Dashboard Component
 * Main view for stock discovery - Supports Light/Dark Theme
 */
const Dashboard: React.FC<DashboardProps> = ({
  userId,
  stocks,
  loading,
  error,
  macroScore,
  macroSignal,
  onDiscover,
  onStockSelect,
  onAddToWatchlist,
  isInWatchlist,
  onSearch,
  searchResults,
  onClearSearch,
}) => {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFocus, setSelectedFocus] = useState<AnalysisFocus>(null);
  const [selectedMode, setSelectedMode] = useState<DiscoveryMode>('trending');
  const [showFilters, setShowFilters] = useState(false);
  const [showFrameworksGuide, setShowFrameworksGuide] = useState(false);
  const [criteria, setCriteria] = useState<ScreeningCriteria>({});

  // Mode tabs
  const modeTabs: Array<{ value: DiscoveryMode; label: string; icon: React.ReactNode; activeClass: string }> = [
    { value: 'trending', label: 'Trending', activeClass: 'from-orange-500 to-amber-500', icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
      </svg>
    )},
    { value: 'gainers', label: 'Gainers', activeClass: 'from-emerald-500 to-green-500', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    )},
    { value: 'losers', label: 'Losers', activeClass: 'from-red-500 to-rose-500', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    )},
    { value: 'bluechip', label: 'Blue Chip', activeClass: 'from-indigo-500 to-purple-500', icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    )},
    { value: 'swami', label: 'Swami', activeClass: 'from-violet-500 to-fuchsia-500', icon: (
      <span className="text-sm">🔮</span>
    )},
  ];

  // Initial load
  useEffect(() => {
    if (stocks.length === 0 && !loading) {
      onDiscover(undefined, criteria, selectedFocus, 20, selectedMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search handler with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        onSearch(searchQuery);
      } else {
        onClearSearch();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, onSearch, onClearSearch]);

  // Focus tabs
  const focusTabs: Array<{ value: AnalysisFocus; label: string }> = [
    { value: null, label: 'All' },
    { value: 'value', label: 'Value' },
    { value: 'growth', label: 'Growth' },
    { value: 'income', label: 'Income' },
    { value: 'momentum', label: 'Momentum' },
    { value: 'safety', label: 'Safety' },
  ];

  const handleFocusChange = (focus: AnalysisFocus) => {
    setSelectedFocus(focus);
    onDiscover(undefined, criteria, focus, 20, selectedMode);
  };

  const handleModeChange = (mode: DiscoveryMode) => {
    setSelectedMode(mode);
    onDiscover(undefined, criteria, selectedFocus, 20, mode);
  };

  const handleSearchSelect = (symbol: string) => {
    setSearchQuery('');
    onClearSearch();
    onStockSelect(symbol);
  };

  const handleRefresh = () => {
    onDiscover(undefined, criteria, selectedFocus, 20, selectedMode);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
      {/* Market Ticker */}
      <MarketTicker />

      {/* Controls Section */}
      <div className={`backdrop-blur-xl border-b ${
        isDark ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Discovery Mode Selector */}
          <div className="flex items-center gap-3 overflow-x-auto pb-3 scrollbar-hide">
            <div className={`flex items-center rounded-xl p-1 border ${
              isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-gray-100 border-gray-200'
            }`}>
              {modeTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => handleModeChange(tab.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    selectedMode === tab.value
                      ? `bg-gradient-to-r ${tab.activeClass} text-white shadow-lg`
                      : isDark
                        ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Macro Indicator */}
            {macroScore !== undefined && macroSignal && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                macroSignal.signal === 'very_bullish' || macroSignal.signal === 'bullish'
                  ? isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-green-50 border-green-200 text-green-700'
                  : macroSignal.signal === 'neutral'
                  ? isDark ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                  : isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Market:</span>
                <span className="text-sm font-medium">{macroSignal.label}</span>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search stocks (e.g., AAPL, Apple)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-10 py-3 border rounded-xl transition-all ${
                isDark
                  ? 'bg-slate-800/50 border-slate-700/50 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); onClearSearch(); }}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all ${
                  isDark ? 'text-slate-500 hover:text-white hover:bg-slate-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className={`absolute top-full left-0 right-0 border rounded-xl shadow-2xl mt-2 max-h-64 overflow-y-auto z-20 ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
              }`}>
                {searchResults.map((result) => (
                  <button
                    key={result.symbol}
                    onClick={() => handleSearchSelect(result.symbol)}
                    className={`w-full px-4 py-3 text-left flex items-center justify-between transition-colors first:rounded-t-xl last:rounded-b-xl ${
                      isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{result.symbol}</span>
                    <span className={`text-sm truncate max-w-[200px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      {result.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Focus Tabs & Actions */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {focusTabs.map((tab) => (
              <button
                key={tab.value || 'all'}
                onClick={() => handleFocusChange(tab.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
                  selectedFocus === tab.value
                    ? isDark
                      ? 'bg-slate-700 text-white border-slate-600'
                      : 'bg-blue-600 text-white border-blue-600'
                    : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800/50 border-transparent'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <div className={`w-px h-6 mx-2 ${isDark ? 'bg-slate-700' : 'bg-gray-300'}`}></div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
                showFilters
                  ? isDark
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-blue-50 text-blue-600 border-blue-200'
                  : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/50 border-transparent'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border-transparent'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-transparent disabled:opacity-50 transition-all duration-200 ${
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Loading...' : 'Refresh'}
            </button>

            {/* How We Score Button */}
            <button
              onClick={() => setShowFrameworksGuide(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/50 border-slate-700/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border-gray-200'
              }`}
              title="Learn how we score stocks"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">How We Score</span>
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className={`mt-4 p-4 rounded-xl border ${
              isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className={`block text-xs mb-1.5 uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Max P/E</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={criteria.maxPE || ''}
                    onChange={(e) => setCriteria({ ...criteria, maxPE: e.target.value ? Number(e.target.value) : undefined })}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDark
                        ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs mb-1.5 uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Min Dividend %</label>
                  <input
                    type="number"
                    placeholder="2"
                    value={criteria.minDividendYield || ''}
                    onChange={(e) => setCriteria({ ...criteria, minDividendYield: e.target.value ? Number(e.target.value) : undefined })}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDark
                        ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs mb-1.5 uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Max Beta</label>
                  <input
                    type="number"
                    placeholder="1.5"
                    step="0.1"
                    value={criteria.maxBeta || ''}
                    onChange={(e) => setCriteria({ ...criteria, maxBeta: e.target.value ? Number(e.target.value) : undefined })}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDark
                        ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs mb-1.5 uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Min ROE %</label>
                  <input
                    type="number"
                    placeholder="15"
                    value={criteria.minROE || ''}
                    onChange={(e) => setCriteria({ ...criteria, minROE: e.target.value ? Number(e.target.value) : undefined })}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDark
                        ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => { setCriteria({}); onDiscover(undefined, {}, selectedFocus, 20, selectedMode); }}
                  className={`px-4 py-2 text-sm transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Clear
                </button>
                <button
                  onClick={() => { onDiscover(undefined, criteria, selectedFocus, 20, selectedMode); setShowFilters(false); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDark ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Error State */}
        {error && (
          <div className={`px-4 py-3 rounded-xl mb-6 ${
            isDark ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <p className="font-medium">Error</p>
            <p className="text-sm opacity-80">{error}</p>
            <button onClick={handleRefresh} className="mt-2 text-sm underline hover:no-underline">
              Try again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && stocks.length === 0 && (
          <div className="text-center py-16">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
              <svg className={`w-8 h-8 animate-spin ${isDark ? 'text-emerald-400' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className={`font-medium ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Analyzing stocks with AI...</p>
            <button
              onClick={() => setShowFrameworksGuide(true)}
              className={`text-sm mt-1 underline decoration-dotted underline-offset-2 hover:decoration-solid transition-all ${
                isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Running 10 Wall Street analysis frameworks
            </button>
          </div>
        )}

        {/* Swami Mode Header */}
        {selectedMode === 'swami' && stocks.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#1a1033] via-[#2d1f4e] to-[#1a2744] border border-amber-900/30 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl" />

            <div className="relative flex items-center gap-4">
              <div className="text-4xl">🔮</div>
              <div>
                <h2 className="text-xl font-bold text-amber-100 flex items-center gap-2">
                  Swami's Vision
                  <span className="text-amber-500/60 text-sm">✦</span>
                </h2>
                <p className="text-sm text-violet-300/70">
                  Early entry opportunities • Strong fundamentals, favorable entry points
                </p>
              </div>
            </div>

            {/* Legend */}
            <div className="relative mt-4 flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-teal-400" />
                <span className="text-teal-300/80">Near 52w Low = Better Entry</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-amber-300/80">Higher Score = Stronger Signal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-violet-400" />
                <span className="text-violet-300/80">AI Score = Fundamental Quality</span>
              </div>
            </div>
          </div>
        )}

        {/* Stock Grid */}
        {stocks.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className={`text-sm ${
                selectedMode === 'swami'
                  ? 'text-violet-300/70'
                  : isDark ? 'text-slate-400' : 'text-gray-500'
              }`}>
                {selectedMode === 'swami' ? (
                  <>Showing {stocks.length} early entry opportunities</>
                ) : (
                  <>
                    Showing {stocks.length} {modeTabs.find(t => t.value === selectedMode)?.label || 'stocks'}
                    {selectedFocus && ` • ${selectedFocus.charAt(0).toUpperCase() + selectedFocus.slice(1)} focus`}
                  </>
                )}
              </p>
              {loading && (
                <span className={`flex items-center gap-2 text-sm ${
                  selectedMode === 'swami'
                    ? 'text-amber-400/60'
                    : isDark ? 'text-slate-500' : 'text-gray-400'
                }`}>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {selectedMode === 'swami' ? 'Consulting the oracle...' : 'Updating...'}
                </span>
              )}
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${
              selectedMode === 'swami' ? 'xl:grid-cols-3' : 'xl:grid-cols-4'
            }`}>
              {stocks.map((stock) => (
                selectedMode === 'swami' ? (
                  <SwamiCard
                    key={stock.symbol}
                    stock={stock}
                    onClick={onStockSelect}
                    onAddToWatchlist={onAddToWatchlist}
                    isInWatchlist={isInWatchlist(stock.symbol)}
                  />
                ) : (
                  <StockCard
                    key={stock.symbol}
                    stock={stock}
                    onClick={onStockSelect}
                    onAddToWatchlist={onAddToWatchlist}
                    isInWatchlist={isInWatchlist(stock.symbol)}
                    showScore={true}
                  />
                )
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && stocks.length === 0 && !error && (
          <div className="text-center py-16">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
              <svg className={`w-8 h-8 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className={`font-medium ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>No stocks found</p>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Try adjusting your filters</p>
          </div>
        )}
      </main>

      {/* Frameworks Guide Modal */}
      {showFrameworksGuide && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowFrameworksGuide(false)}
          />
          <div className="relative min-h-screen flex items-start justify-center p-4 pt-8">
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
              <FrameworksGuide onClose={() => setShowFrameworksGuide(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
