import { useState, useCallback, useEffect } from 'react';
import { stockApi } from '../lib/firebase';
import { Portfolio, Watchlist, UserPreferences } from '../lib/types';

interface PortfolioState {
  portfolio: Portfolio | null;
  watchlist: Watchlist | null;
  preferences: UserPreferences | null;
  loading: boolean;
  error: string | null;
}

export function usePortfolio(userId: string | null) {
  const [state, setState] = useState<PortfolioState>({
    portfolio: null,
    watchlist: null,
    preferences: null,
    loading: false,
    error: null,
  });

  /**
   * Load portfolio and watchlist
   */
  const loadUserData = useCallback(async () => {
    if (!userId) return;

    console.log('📈 STOCKS_PORTFOLIO: Loading user data');
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [portfolioRes, watchlistRes, prefsRes] = await Promise.all([
        stockApi.getPortfolio(userId) as Promise<{ success: boolean; portfolio: Portfolio }>,
        stockApi.getWatchlist(userId) as Promise<{ success: boolean; watchlist: Watchlist }>,
        stockApi.getPreferences(userId) as Promise<{ success: boolean; preferences: UserPreferences }>,
      ]);

      setState({
        portfolio: portfolioRes.success ? portfolioRes.portfolio : null,
        watchlist: watchlistRes.success ? watchlistRes.watchlist : null,
        preferences: prefsRes.success ? prefsRes.preferences : null,
        loading: false,
        error: null,
      });

      console.log('📈 STOCKS_PORTFOLIO: Loaded data', {
        holdingsCount: portfolioRes.portfolio?.holdings?.length || 0,
        watchlistCount: watchlistRes.watchlist?.stocks?.length || 0,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load user data';
      console.error('📈 STOCKS_PORTFOLIO: Error', message);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, [userId]);

  // Load on mount if userId is available
  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId, loadUserData]);

  /**
   * Add stock to watchlist
   */
  const addToWatchlist = useCallback(
    async (symbol: string) => {
      if (!userId) return;

      console.log('📈 STOCKS_WATCHLIST: Adding', symbol);

      try {
        const response = (await stockApi.addToWatchlist(userId, symbol)) as {
          success: boolean;
          watchlist: Watchlist;
        };

        if (response.success) {
          setState((prev) => ({
            ...prev,
            watchlist: response.watchlist,
          }));
        }

        return response;
      } catch (error: unknown) {
        console.error('📈 STOCKS_WATCHLIST: Add error', error);
        throw error;
      }
    },
    [userId]
  );

  /**
   * Remove stock from watchlist
   */
  const removeFromWatchlist = useCallback(
    async (symbol: string) => {
      if (!userId) return;

      console.log('📈 STOCKS_WATCHLIST: Removing', symbol);

      try {
        const response = (await stockApi.removeFromWatchlist(userId, symbol)) as {
          success: boolean;
          watchlist: Watchlist;
        };

        if (response.success) {
          setState((prev) => ({
            ...prev,
            watchlist: response.watchlist,
          }));
        }

        return response;
      } catch (error: unknown) {
        console.error('📈 STOCKS_WATCHLIST: Remove error', error);
        throw error;
      }
    },
    [userId]
  );

  /**
   * Add holding to portfolio
   */
  const addToPortfolio = useCallback(
    async (symbol: string, shares: number, avgCost: number, name?: string, sector?: string) => {
      if (!userId) return;

      console.log('📈 STOCKS_PORTFOLIO: Adding holding', { symbol, shares, avgCost });

      try {
        const response = (await stockApi.addToPortfolio(userId, {
          symbol,
          shares,
          avgCost,
          name,
          sector,
        })) as { success: boolean; portfolio: Portfolio };

        if (response.success) {
          // Reload to get updated performance
          await loadUserData();
        }

        return response;
      } catch (error: unknown) {
        console.error('📈 STOCKS_PORTFOLIO: Add error', error);
        throw error;
      }
    },
    [userId, loadUserData]
  );

  /**
   * Sell holding from portfolio
   */
  const sellFromPortfolio = useCallback(
    async (symbol: string, shares: number, price: number) => {
      if (!userId) return;

      console.log('📈 STOCKS_PORTFOLIO: Selling', { symbol, shares, price });

      try {
        const response = (await stockApi.sellFromPortfolio(userId, symbol, shares, price)) as {
          success: boolean;
          portfolio: Portfolio;
        };

        if (response.success) {
          // Reload to get updated performance
          await loadUserData();
        }

        return response;
      } catch (error: unknown) {
        console.error('📈 STOCKS_PORTFOLIO: Sell error', error);
        throw error;
      }
    },
    [userId, loadUserData]
  );

  /**
   * Save user preferences
   */
  const savePreferences = useCallback(
    async (preferences: Partial<UserPreferences>) => {
      if (!userId) return;

      console.log('📈 STOCKS_PREFS: Saving', preferences);

      try {
        const response = (await stockApi.savePreferences(userId, preferences)) as {
          success: boolean;
        };

        if (response.success) {
          setState((prev) => ({
            ...prev,
            preferences: { ...prev.preferences, ...preferences } as UserPreferences,
          }));
        }

        return response;
      } catch (error: unknown) {
        console.error('📈 STOCKS_PREFS: Save error', error);
        throw error;
      }
    },
    [userId]
  );

  /**
   * Check if stock is in watchlist
   */
  const isInWatchlist = useCallback(
    (symbol: string) => {
      return state.watchlist?.stocks?.some((s) => s.symbol === symbol.toUpperCase()) || false;
    },
    [state.watchlist]
  );

  /**
   * Check if stock is in portfolio
   */
  const isInPortfolio = useCallback(
    (symbol: string) => {
      return state.portfolio?.holdings?.some((h) => h.symbol === symbol.toUpperCase()) || false;
    },
    [state.portfolio]
  );

  /**
   * Get holding details
   */
  const getHolding = useCallback(
    (symbol: string) => {
      return state.portfolio?.holdings?.find((h) => h.symbol === symbol.toUpperCase());
    },
    [state.portfolio]
  );

  return {
    // State
    portfolio: state.portfolio,
    watchlist: state.watchlist,
    preferences: state.preferences,
    loading: state.loading,
    error: state.error,

    // Computed
    holdingsCount: state.portfolio?.holdings?.length || 0,
    watchlistCount: state.watchlist?.stocks?.length || 0,
    totalValue: state.portfolio?.performance?.totalPortfolioValue || 0,
    totalReturn: state.portfolio?.performance?.totalReturn || 0,

    // Actions
    loadUserData,
    addToWatchlist,
    removeFromWatchlist,
    addToPortfolio,
    sellFromPortfolio,
    savePreferences,

    // Helpers
    isInWatchlist,
    isInPortfolio,
    getHolding,
  };
}
