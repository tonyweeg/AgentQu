import React, { useState, useEffect } from 'react';
import { Stock, ScreeningCriteria, AnalysisFocus, DiscoveryMode } from '../lib/types';
import StockCard from './StockCard';

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
 * Main view for stock discovery
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFocus, setSelectedFocus] = useState<AnalysisFocus>(null);
  const [selectedMode, setSelectedMode] = useState<DiscoveryMode>('trending');
  const [showFilters, setShowFilters] = useState(false);
  const [criteria, setCriteria] = useState<ScreeningCriteria>({});

  // Mode tabs - dynamic + blue chip
  const modeTabs: Array<{ value: DiscoveryMode; label: string; icon: string }> = [
    { value: 'trending', label: 'Trending', icon: '🔥' },
    { value: 'gainers', label: 'Gainers', icon: '📈' },
    { value: 'losers', label: 'Losers', icon: '📉' },
    { value: 'bluechip', label: 'Blue Chip', icon: '💎' },
  ];

  // Initial load - intentionally only runs on mount
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AgentQu Stocks</h1>
              <p className="text-sm text-gray-500">AI-Powered Stock Recommendations</p>
            </div>

            {/* Macro Indicator */}
            {macroScore !== undefined && macroSignal && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Market:</span>
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    macroSignal.signal === 'very_bullish'
                      ? 'bg-green-100 text-green-700'
                      : macroSignal.signal === 'bullish'
                      ? 'bg-green-50 text-green-600'
                      : macroSignal.signal === 'neutral'
                      ? 'bg-yellow-50 text-yellow-700'
                      : macroSignal.signal === 'bearish'
                      ? 'bg-orange-50 text-orange-600'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {macroSignal.label}
                </span>
              </div>
            )}
          </div>

          {/* Discovery Mode Selector */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {modeTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleModeChange(tab.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                  selectedMode === tab.value
                    ? tab.value === 'bluechip'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="mt-3 relative">
            <input
              type="text"
              placeholder="Search stocks (e.g., AAPL, Apple)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  onClearSearch();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto z-20">
                {searchResults.map((result) => (
                  <button
                    key={result.symbol}
                    onClick={() => handleSearchSelect(result.symbol)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span className="font-medium">{result.symbol}</span>
                    <span className="text-sm text-gray-500 truncate max-w-[200px]">
                      {result.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Focus Tabs */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {focusTabs.map((tab) => (
              <button
                key={tab.value || 'all'}
                onClick={() => handleFocusChange(tab.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedFocus === tab.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              🔍 Filters
            </button>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
            >
              {loading ? '⏳' : '🔄'} Refresh
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Max P/E</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={criteria.maxPE || ''}
                    onChange={(e) =>
                      setCriteria({ ...criteria, maxPE: e.target.value ? Number(e.target.value) : undefined })
                    }
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Min Dividend %</label>
                  <input
                    type="number"
                    placeholder="2"
                    value={criteria.minDividendYield || ''}
                    onChange={(e) =>
                      setCriteria({
                        ...criteria,
                        minDividendYield: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Max Beta</label>
                  <input
                    type="number"
                    placeholder="1.5"
                    step="0.1"
                    value={criteria.maxBeta || ''}
                    onChange={(e) =>
                      setCriteria({ ...criteria, maxBeta: e.target.value ? Number(e.target.value) : undefined })
                    }
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Min ROE %</label>
                  <input
                    type="number"
                    placeholder="15"
                    value={criteria.minROE || ''}
                    onChange={(e) =>
                      setCriteria({ ...criteria, minROE: e.target.value ? Number(e.target.value) : undefined })
                    }
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setCriteria({});
                    onDiscover(undefined, {}, selectedFocus, 20, selectedMode);
                  }}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    onDiscover(undefined, criteria, selectedFocus, 20, selectedMode);
                    setShowFilters(false);
                  }}
                  className="px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 text-sm text-red-600 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && stocks.length === 0 && (
          <div className="text-center py-12">
            <div className="animate-spin text-4xl mb-4">📊</div>
            <p className="text-gray-600">Analyzing stocks with AI...</p>
            <p className="text-sm text-gray-400 mt-1">Running 10 Wall Street analysis frameworks</p>
          </div>
        )}

        {/* Stock Grid */}
        {stocks.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                Showing {stocks.length} {modeTabs.find(t => t.value === selectedMode)?.label || 'stocks'}
                {selectedFocus && ` • ${selectedFocus.charAt(0).toUpperCase() + selectedFocus.slice(1)} focus`}
              </p>
              {loading && <span className="text-sm text-gray-400">Updating...</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {stocks.map((stock) => (
                <StockCard
                  key={stock.symbol}
                  stock={stock}
                  onClick={onStockSelect}
                  onAddToWatchlist={onAddToWatchlist}
                  isInWatchlist={isInWatchlist(stock.symbol)}
                  showScore={true}
                />
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && stocks.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">📈</p>
            <p className="text-gray-600">No stocks found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
