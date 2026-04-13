import React, { useState, useCallback, useEffect, memo } from 'react';
import { useAuth } from './hooks/useAuth';
import { useStockDiscovery } from './hooks/useStockDiscovery';
import { usePortfolio } from './hooks/usePortfolio';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Dashboard from './components/Dashboard';
import StockDetailView from './components/StockDetailView';
import { ViewType, ScreeningCriteria, AnalysisFocus, DiscoveryMode } from './lib/types';
import './App.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://us-central1-agentqu-platform.cloudfunctions.net';

interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

/**
 * Compact Market Mood Gauge for Navbar
 */
const NavbarMoodGauge: React.FC<{ upCount: number; isDark: boolean }> = memo(({ upCount, isDark }) => {
  const position = (upCount / 3) * 100;

  const getMoodInfo = () => {
    if (upCount === 3) return { label: 'BULLISH', icon: '🚀', color: isDark ? 'text-green-400' : 'text-green-600' };
    if (upCount === 0) return { label: 'BEARISH', icon: '🐻', color: isDark ? 'text-red-400' : 'text-red-600' };
    if (upCount >= 2) return { label: 'BULLISH', icon: '📈', color: isDark ? 'text-green-300' : 'text-green-500' };
    return { label: 'MIXED', icon: '⚖️', color: isDark ? 'text-yellow-400' : 'text-yellow-600' };
  };

  const mood = getMoodInfo();

  return (
    <div className={`rounded-lg px-3 py-1.5 ${isDark ? 'bg-slate-800/80' : 'bg-white border border-gray-200 shadow-sm'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Mood
        </span>
        <span className={`text-xs font-bold ${mood.color}`}>
          {mood.icon} {mood.label}
        </span>
      </div>
      {/* Mini Gauge */}
      <div className="relative w-24">
        <div className="h-1.5 rounded-full overflow-hidden flex">
          <div className="flex-1 bg-red-500"></div>
          <div className="flex-1 bg-orange-400"></div>
          <div className="flex-1 bg-yellow-400"></div>
          <div className="flex-1 bg-green-500"></div>
        </div>
        <div
          className="absolute top-0 w-1 h-1.5 bg-white rounded-full shadow border border-gray-600 transition-all duration-300"
          style={{ left: `calc(${position}% - 2px)` }}
        />
      </div>
      <div className={`text-[8px] text-center mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
        {upCount}/3 up
      </div>
    </div>
  );
});

NavbarMoodGauge.displayName = 'NavbarMoodGauge';

/**
 * Compact VIX Fear Gauge for Navbar
 */
const NavbarVixGauge: React.FC<{ vixValue: number; isDark: boolean }> = memo(({ vixValue, isDark }) => {
  const maxVix = 45;
  const position = Math.min((vixValue / maxVix) * 100, 100);

  const getVixInfo = () => {
    if (vixValue < 15) return { label: 'Calm', color: isDark ? 'text-green-400' : 'text-green-600' };
    if (vixValue < 20) return { label: 'Normal', color: isDark ? 'text-blue-400' : 'text-blue-600' };
    if (vixValue < 25) return { label: 'Elevated', color: isDark ? 'text-yellow-400' : 'text-yellow-600' };
    if (vixValue < 30) return { label: 'High', color: isDark ? 'text-orange-400' : 'text-orange-600' };
    return { label: 'Extreme', color: isDark ? 'text-red-400' : 'text-red-600' };
  };

  const vixInfo = getVixInfo();

  return (
    <div className={`rounded-lg px-3 py-1.5 ${isDark ? 'bg-slate-800/80' : 'bg-white border border-gray-200 shadow-sm'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          VIX
        </span>
        <span className={`text-xs font-bold font-mono ${vixInfo.color}`}>
          {vixValue.toFixed(1)} · {vixInfo.label}
        </span>
      </div>
      {/* Mini Gauge */}
      <div className="relative w-24">
        <div className="h-1.5 rounded-full overflow-hidden bg-gradient-to-r from-green-500 via-yellow-400 to-red-500"></div>
        <div
          className="absolute top-0 w-1 h-1.5 bg-white rounded-full shadow border border-gray-600 transition-all duration-300"
          style={{ left: `calc(${position}% - 2px)` }}
        />
      </div>
      <div className="flex justify-between mt-0.5">
        <span className={`text-[8px] ${isDark ? 'text-green-600' : 'text-green-500'}`}>Calm</span>
        <span className={`text-[8px] ${isDark ? 'text-red-600' : 'text-red-500'}`}>Extreme</span>
      </div>
    </div>
  );
});

NavbarVixGauge.displayName = 'NavbarVixGauge';

/**
 * Ultra-compact gauge for mobile/tablet - single line
 */
const MiniGaugeBar: React.FC<{ upCount: number; vixValue: number | null; isDark: boolean }> = memo(({ upCount, vixValue, isDark }) => {
  const getMoodEmoji = () => {
    if (upCount === 3) return '🚀';
    if (upCount === 0) return '🐻';
    if (upCount >= 2) return '📈';
    return '⚖️';
  };

  const getVixColor = () => {
    if (!vixValue) return '';
    if (vixValue < 15) return isDark ? 'text-green-400' : 'text-green-600';
    if (vixValue < 20) return isDark ? 'text-blue-400' : 'text-blue-600';
    if (vixValue < 25) return isDark ? 'text-yellow-400' : 'text-yellow-600';
    if (vixValue < 30) return isDark ? 'text-orange-400' : 'text-orange-600';
    return isDark ? 'text-red-400' : 'text-red-600';
  };

  return (
    <div className={`flex items-center gap-3 rounded-lg px-2 py-1 ${isDark ? 'bg-slate-800/60' : 'bg-gray-100'}`}>
      <span className="text-sm">{getMoodEmoji()}</span>
      <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{upCount}/3</span>
      {vixValue && (
        <>
          <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>|</span>
          <span className={`text-xs font-mono font-medium ${getVixColor()}`}>{vixValue.toFixed(0)}</span>
        </>
      )}
    </div>
  );
});

MiniGaugeBar.displayName = 'MiniGaugeBar';

/**
 * Market Gauges Container - Fetches data and renders compact gauges
 * Responsive: Mini on sm/md, Full on lg+
 */
const MarketGauges: React.FC<{ isDark: boolean }> = memo(({ isDark }) => {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch(`${API_BASE}/getMarketIndices`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        if (data.success && data.indices) {
          setIndices(data.indices);
        }
      } catch (err) {
        console.error('Market data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || indices.length === 0) {
    return (
      <div className={`rounded-lg px-3 py-1.5 animate-pulse ${isDark ? 'bg-slate-800/50' : 'bg-gray-100'}`}>
        <div className="w-16 h-3"></div>
      </div>
    );
  }

  const sp500 = indices.find(i => i.symbol === '^GSPC');
  const nasdaq = indices.find(i => i.symbol === '^IXIC');
  const dow = indices.find(i => i.symbol === '^DJI');
  const vix = indices.find(i => i.symbol === '^VIX');

  const majorIndices = [sp500, nasdaq, dow].filter(Boolean);
  const upCount = majorIndices.filter(i => i && i.change >= 0).length;

  return (
    <>
      {/* Mini version for sm/md screens */}
      <div className="flex lg:hidden">
        <MiniGaugeBar upCount={upCount} vixValue={vix?.price || null} isDark={isDark} />
      </div>

      {/* Full version for lg+ screens */}
      <div className="hidden lg:flex items-center gap-2">
        <NavbarMoodGauge upCount={upCount} isDark={isDark} />
        {vix && <NavbarVixGauge vixValue={vix.price} isDark={isDark} />}
      </div>
    </>
  );
});

MarketGauges.displayName = 'MarketGauges';

/**
 * Theme Toggle Button Component
 */
function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-all duration-200 ${
        isDark
          ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
      }`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

/**
 * Main App Content - Uses Theme Context
 */
function AppContent() {
  const { isDark } = useTheme();

  // Auth
  const { loading: authLoading, isAuthenticated, userId, signIn, signUp, signOut, signInWithGoogle } = useAuth();

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
      limit?: number,
      mode?: DiscoveryMode
    ) => {
      await discoverStocks(symbols, criteria, focus, limit, mode);
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
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className={`w-12 h-12 mx-auto mb-4 rounded-full ${isDark ? 'bg-slate-800' : 'bg-gray-200'} flex items-center justify-center`}>
            <svg className={`w-6 h-6 animate-spin ${isDark ? 'text-emerald-400' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>Loading AgentQu Stocks...</p>
        </div>
      </div>
    );
  }

  // Auth screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl mb-4 shadow-lg">
              <span className="text-3xl">📈</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">AgentQu Stocks</h1>
            <p className="text-gray-300 text-sm">AI-Powered Stock Intelligence</p>
          </div>

          {/* Google Sign In - Primary */}
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 py-3 px-4 rounded-xl font-medium hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="text-gray-400 text-sm">or</span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {authError && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg text-sm">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </p>

          {/* Features badges */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">10 AI Strategies</span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">Real-time Data</span>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">Free Forever</span>
          </div>
        </div>
      </div>
    );
  }

  // Stock Detail View
  if (currentView === 'detail') {
    return (
      <StockDetailView
        stock={selectedStock?.stock || null}
        analysis={selectedStock ? {
          stock: selectedStock.stock,
          analysis: selectedStock.analysis,
        } : null}
        loading={discoveryLoading}
        onClose={() => {
          clearSelectedStock();
          setCurrentView('discover');
        }}
        onAddToWatchlist={handleWatchlistToggle}
        isInWatchlist={selectedStock?.stock ? isInWatchlist(selectedStock.stock.symbol) : false}
      />
    );
  }

  // Navigation items config
  const navItems = [
    { id: 'discover', label: 'Discover', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )},
    { id: 'watchlist', label: 'Watchlist', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    )},
    { id: 'portfolio', label: 'Portfolio', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )},
  ];

  // Main Dashboard View
  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
      {/* Top Navigation Bar */}
      <nav className={`sticky top-0 z-50 backdrop-blur-xl border-b ${
        isDark
          ? 'bg-slate-900/95 border-slate-700/50'
          : 'bg-white/95 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <img
                alt="AgentQu"
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg shadow-lg"
                src="/stocks/agentqu-glyph.png"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="hidden xl:block">
                <span className={`font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>AgentQu</span>
                <span className={`font-light ml-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Stocks</span>
              </div>
            </div>

            {/* Market Gauges */}
            <MarketGauges isDark={isDark} />

            {/* Center Navigation Pills */}
            <div className={`flex items-center rounded-full p-0.5 sm:p-1 border flex-shrink-0 ${
              isDark
                ? 'bg-slate-800/50 border-slate-700/50'
                : 'bg-gray-100 border-gray-200'
            }`}>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as ViewType)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    currentView === item.id
                      ? isDark
                        ? 'bg-slate-700 text-white shadow-lg shadow-slate-900/50'
                        : 'bg-white text-blue-600 shadow-md'
                      : isDark
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                  }`}
                >
                  {item.icon}
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Right Side - Theme Toggle & Account */}
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
              <ThemeToggle />
              <button
                onClick={signOut}
                className={`flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-lg transition-all duration-200 ${
                  isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title="Sign Out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden xl:inline text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div>
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
          <div className="min-h-screen p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
              <h1 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Watchlist</h1>
              {watchlist?.stocks && watchlist.stocks.length > 0 ? (
                <div className="space-y-3">
                  {watchlist.stocks.map((item) => (
                    <div
                      key={item.symbol}
                      className={`backdrop-blur border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                        isDark
                          ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm'
                      }`}
                      onClick={() => handleStockSelect(item.symbol)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.symbol}</p>
                          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{item.name}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            ${item.currentPrice?.toFixed(2) || '—'}
                          </p>
                          <p className={`text-sm font-mono ${
                            (item.changeFromAdded || 0) >= 0
                              ? isDark ? 'text-emerald-400' : 'text-green-600'
                              : isDark ? 'text-red-400' : 'text-red-600'
                          }`}>
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
                <div className="text-center py-16">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-slate-800' : 'bg-gray-100'
                  }`}>
                    <svg className={`w-8 h-8 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <p className={`font-medium ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>No stocks in watchlist</p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Add stocks from the Discover tab</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'portfolio' && (
          <div className="min-h-screen p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
              <h1 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Portfolio</h1>
              {portfolio?.performance ? (
                <div>
                  {/* Portfolio Summary Card */}
                  <div className={`rounded-2xl p-6 mb-6 ${
                    isDark
                      ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50'
                      : 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100'
                  }`}>
                    <p className={`text-sm uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Total Value</p>
                    <p className={`text-4xl font-bold mt-1 font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      ${portfolio.performance.totalPortfolioValue.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xl font-mono font-semibold ${
                        portfolio.performance.totalReturn >= 0
                          ? isDark ? 'text-emerald-400' : 'text-green-600'
                          : isDark ? 'text-red-400' : 'text-red-600'
                      }`}>
                        {portfolio.performance.totalReturn >= 0 ? '+' : ''}
                        {portfolio.performance.totalReturn.toFixed(2)}%
                      </span>
                      <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>all time</span>
                    </div>
                  </div>

                  {/* Holdings List */}
                  {portfolio.performance.holdings.length > 0 ? (
                    <div className="space-y-3">
                      <h2 className={`text-sm font-medium uppercase tracking-wider mb-3 ${
                        isDark ? 'text-slate-400' : 'text-gray-500'
                      }`}>Holdings</h2>
                      {portfolio.performance.holdings.map((holding) => (
                        <div
                          key={holding.symbol}
                          className={`backdrop-blur border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                            isDark
                              ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                              : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm'
                          }`}
                          onClick={() => handleStockSelect(holding.symbol)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{holding.symbol}</p>
                              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                {holding.shares} shares @ ${holding.avgCost.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                ${holding.value?.toFixed(2) || '—'}
                              </p>
                              <p className={`text-sm font-mono ${
                                (holding.profitPercent || 0) >= 0
                                  ? isDark ? 'text-emerald-400' : 'text-green-600'
                                  : isDark ? 'text-red-400' : 'text-red-600'
                              }`}>
                                {(holding.profitPercent || 0) >= 0 ? '+' : ''}
                                {holding.profitPercent?.toFixed(2) || 0}%
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-center py-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>No holdings yet</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-slate-800' : 'bg-gray-100'
                  }`}>
                    <svg className={`w-8 h-8 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className={`font-medium ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>No portfolio data</p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Add your first holding to track performance</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * AgentQu Stocks - Main Application
 * Wrapped with ThemeProvider
 */
function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
