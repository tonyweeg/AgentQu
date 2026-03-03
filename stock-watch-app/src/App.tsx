import React, { useState, useCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import { useStockDiscovery } from './hooks/useStockDiscovery';
import { usePortfolio } from './hooks/usePortfolio';
import Dashboard from './components/Dashboard';
import { ViewType, ScreeningCriteria, AnalysisFocus } from './lib/types';
import './App.css';

/**
 * AgentQu Stocks - Main Application
 *
 * AI-Powered Stock Trading Suggestions
 * Using 10 Wall Street Analysis Frameworks
 */
function App() {
  // Auth
  const { loading: authLoading, isAuthenticated, userId, signIn, signUp, signOut } = useAuth();

  // Stock Discovery
  const {
    stocks,
    loading: discoveryLoading,
    error: discoveryError,
    metadata,
    selectedStock,
    searchResults,
    discoverStocks,
    analyzeStock,
    searchStocks,
    clearSelectedStock,
    clearSearch,
  } = useStockDiscovery(userId);

  // Portfolio
  const {
    portfolio,
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
  } = usePortfolio(userId);

  // View state
  const [currentView, setCurrentView] = useState<ViewType>('discover');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  // Handlers
  const handleStockSelect = useCallback(
    async (symbol: string) => {
      await analyzeStock(symbol);
      setCurrentView('detail');
    },
    [analyzeStock]
  );

  const handleDiscover = useCallback(
    async (
      symbols?: string[],
      criteria?: ScreeningCriteria,
      focus?: AnalysisFocus,
      limit?: number
    ) => {
      await discoverStocks(symbols, criteria, focus, limit);
    },
    [discoverStocks]
  );

  const handleWatchlistToggle = useCallback(
    async (symbol: string) => {
      if (isInWatchlist(symbol)) {
        await removeFromWatchlist(symbol);
      } else {
        await addToWatchlist(symbol);
      }
    },
    [isInWatchlist, addToWatchlist, removeFromWatchlist]
  );

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    try {
      if (isSignUp) {
        await signUp(authEmail, authPassword);
      } else {
        await signIn(authEmail, authPassword);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      setAuthError(message);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin text-5xl mb-4">📈</div>
          <p className="text-gray-600">Loading AgentQu Stocks...</p>
        </div>
      </div>
    );
  }

  // Auth screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-lg shadow p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">AgentQu Stocks</h1>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {authError && (
              <p className="text-red-600 text-sm">{authError}</p>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700"
            >
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:underline"
            >
              {isSignUp ? 'Have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Stock Detail View
  if (currentView === 'detail' && selectedStock) {
    const { stock, analysis } = selectedStock;

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => {
                clearSelectedStock();
                setCurrentView('discover');
              }}
              className="text-blue-600 hover:underline"
            >
              ← Back
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleWatchlistToggle(stock.symbol)}
                className={`px-3 py-1 rounded text-sm ${
                  isInWatchlist(stock.symbol)
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-blue-50 text-blue-600'
                }`}
              >
                {isInWatchlist(stock.symbol) ? '✓ Watching' : '+ Watch'}
              </button>
              <button
                onClick={signOut}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          {/* Stock Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold">{stock.symbol}</h1>
                <p className="text-gray-500">{stock.profile?.name || stock.quote?.shortName}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">${stock.quote?.regularMarketPrice?.toFixed(2)}</p>
                <p
                  className={`text-lg ${
                    (stock.quote?.regularMarketChange || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {(stock.quote?.regularMarketChange || 0) >= 0 ? '+' : ''}
                  {stock.quote?.regularMarketChange?.toFixed(2)} (
                  {stock.quote?.regularMarketChangePercent?.toFixed(2)}%)
                </p>
              </div>
            </div>

            {/* Score Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">AI Score</span>
                <span className="text-2xl font-bold">
                  {analysis.score.total}/{analysis.score.maxPossible}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Recommendation</span>
                <span
                  className={`px-3 py-1 rounded font-medium ${
                    analysis.score.recommendation.action === 'STRONG_BUY'
                      ? 'bg-green-600 text-white'
                      : analysis.score.recommendation.action === 'BUY'
                      ? 'bg-green-500 text-white'
                      : analysis.score.recommendation.action === 'HOLD'
                      ? 'bg-yellow-500 text-white'
                      : analysis.score.recommendation.action === 'SELL'
                      ? 'bg-orange-500 text-white'
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {analysis.score.recommendation.label}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{analysis.score.recommendation.description}</p>
            </div>
          </div>

          {/* Analysis Modules */}
          <h2 className="text-xl font-bold mb-4">Analysis Modules (10 Wall Street Frameworks)</h2>
          <div className="grid gap-4">
            {analysis.modules.map((module) => (
              <div key={module.key} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{module.name}</h3>
                    <p className="text-sm text-gray-500">{module.subtitle}</p>
                  </div>
                  <span className="text-xl font-bold">{module.score}</span>
                </div>
                {module.reasons.length > 0 && (
                  <ul className="text-sm text-gray-600 mt-2 space-y-1">
                    {module.reasons.map((reason, i) => (
                      <li key={i}>• {reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Key Metrics */}
          <h2 className="text-xl font-bold mt-8 mb-4">Key Metrics</h2>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">P/E Ratio</p>
                <p className="font-bold">{stock.metrics?.peRatio?.toFixed(1) || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Market Cap</p>
                <p className="font-bold">
                  {stock.quote?.marketCap ? formatMarketCap(stock.quote.marketCap) : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Dividend Yield</p>
                <p className="font-bold">
                  {stock.metrics?.dividendYield ? `${stock.metrics.dividendYield.toFixed(2)}%` : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Beta</p>
                <p className="font-bold">{stock.metrics?.beta?.toFixed(2) || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ROE</p>
                <p className="font-bold">
                  {stock.metrics?.roe ? `${(stock.metrics.roe * 100).toFixed(1)}%` : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Debt/Equity</p>
                <p className="font-bold">{stock.metrics?.debtToEquity?.toFixed(2) || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">52W High</p>
                <p className="font-bold">${stock.quote?.fiftyTwoWeekHigh?.toFixed(2) || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">52W Low</p>
                <p className="font-bold">${stock.quote?.fiftyTwoWeekLow?.toFixed(2) || '—'}</p>
              </div>
            </div>
          </div>

          {/* Technical Analysis */}
          {stock.technical && (
            <>
              <h2 className="text-xl font-bold mt-8 mb-4">Technical Analysis</h2>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stock.technical.rsi && (
                    <div>
                      <p className="text-sm text-gray-500">RSI (14)</p>
                      <p className="font-bold">{stock.technical.rsi.latest.toFixed(0)}</p>
                      <p className="text-xs text-gray-500">{stock.technical.rsi.signal.label}</p>
                    </div>
                  )}
                  {stock.technical.macd && (
                    <div>
                      <p className="text-sm text-gray-500">MACD</p>
                      <p className="font-bold">{stock.technical.macd.crossover}</p>
                      <p className="text-xs text-gray-500">Trend: {stock.technical.macd.trend}</p>
                    </div>
                  )}
                  {stock.technical.adx && (
                    <div>
                      <p className="text-sm text-gray-500">ADX</p>
                      <p className="font-bold">{stock.technical.adx.latest.toFixed(0)}</p>
                      <p className="text-xs text-gray-500">{stock.technical.adx.trendStrength.label}</p>
                    </div>
                  )}
                  {stock.technical.bollinger && (
                    <div>
                      <p className="text-sm text-gray-500">Volatility</p>
                      <p className="font-bold">{stock.technical.bollinger.volatility}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    );
  }

  // Main Dashboard View
  return (
    <>
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 fixed bottom-0 left-0 right-0 z-20 md:relative">
        <div className="max-w-7xl mx-auto flex justify-around py-3">
          <button
            onClick={() => setCurrentView('discover')}
            className={`flex flex-col items-center ${
              currentView === 'discover' ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <span className="text-2xl">📊</span>
            <span className="text-xs">Discover</span>
          </button>
          <button
            onClick={() => setCurrentView('watchlist')}
            className={`flex flex-col items-center ${
              currentView === 'watchlist' ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <span className="text-2xl">👁️</span>
            <span className="text-xs">Watchlist</span>
          </button>
          <button
            onClick={() => setCurrentView('portfolio')}
            className={`flex flex-col items-center ${
              currentView === 'portfolio' ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <span className="text-2xl">💼</span>
            <span className="text-xs">Portfolio</span>
          </button>
          <button
            onClick={signOut}
            className="flex flex-col items-center text-gray-500"
          >
            <span className="text-2xl">👤</span>
            <span className="text-xs">Account</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pb-20 md:pb-0">
        {currentView === 'discover' && (
          <Dashboard
            userId={userId}
            stocks={stocks}
            loading={discoveryLoading}
            error={discoveryError}
            macroScore={metadata?.macroScore}
            macroSignal={metadata?.macroSignal}
            onDiscover={handleDiscover}
            onStockSelect={handleStockSelect}
            onAddToWatchlist={handleWatchlistToggle}
            isInWatchlist={isInWatchlist}
            onSearch={searchStocks}
            searchResults={searchResults}
            onClearSearch={clearSearch}
          />
        )}

        {currentView === 'watchlist' && (
          <div className="min-h-screen bg-gray-50 p-4">
            <h1 className="text-2xl font-bold mb-4">Watchlist</h1>
            {watchlist?.stocks && watchlist.stocks.length > 0 ? (
              <div className="space-y-4">
                {watchlist.stocks.map((item) => (
                  <div
                    key={item.symbol}
                    className="bg-white rounded-lg p-4 shadow-sm cursor-pointer"
                    onClick={() => handleStockSelect(item.symbol)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold">{item.symbol}</p>
                        <p className="text-sm text-gray-500">{item.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${item.currentPrice?.toFixed(2) || '—'}</p>
                        <p
                          className={`text-sm ${
                            (item.changeFromAdded || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {item.changeFromAdded != null
                            ? `${item.changeFromAdded >= 0 ? '+' : ''}${item.changeFromAdded.toFixed(2)}%`
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-4xl mb-4">👁️</p>
                <p className="text-gray-600">No stocks in watchlist</p>
                <p className="text-sm text-gray-400">Add stocks from the Discover tab</p>
              </div>
            )}
          </div>
        )}

        {currentView === 'portfolio' && (
          <div className="min-h-screen bg-gray-50 p-4">
            <h1 className="text-2xl font-bold mb-4">Portfolio</h1>
            {portfolio?.performance ? (
              <div>
                <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                  <p className="text-sm text-gray-500">Total Value</p>
                  <p className="text-3xl font-bold">
                    ${portfolio.performance.totalPortfolioValue.toLocaleString()}
                  </p>
                  <p
                    className={`text-lg ${
                      portfolio.performance.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {portfolio.performance.totalReturn >= 0 ? '+' : ''}
                    {portfolio.performance.totalReturn.toFixed(2)}%
                  </p>
                </div>

                {portfolio.performance.holdings.length > 0 ? (
                  <div className="space-y-4">
                    {portfolio.performance.holdings.map((holding) => (
                      <div
                        key={holding.symbol}
                        className="bg-white rounded-lg p-4 shadow-sm cursor-pointer"
                        onClick={() => handleStockSelect(holding.symbol)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold">{holding.symbol}</p>
                            <p className="text-sm text-gray-500">
                              {holding.shares} shares @ ${holding.avgCost.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">${holding.value?.toFixed(2) || '—'}</p>
                            <p
                              className={`text-sm ${
                                (holding.profitPercent || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                              }`}
                            >
                              {(holding.profitPercent || 0) >= 0 ? '+' : ''}
                              {holding.profitPercent?.toFixed(2) || 0}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No holdings yet</p>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-4xl mb-4">💼</p>
                <p className="text-gray-600">No portfolio data</p>
                <p className="text-sm text-gray-400">Add your first holding to track performance</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// Helper function
function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

export default App;
