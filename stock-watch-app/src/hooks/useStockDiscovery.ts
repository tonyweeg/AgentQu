import { useState, useCallback } from 'react';
import { stockApi } from '../lib/firebase';
import {
  Stock,
  ScreeningCriteria,
  AnalysisFocus,
  DiscoveryMode,
  DiscoverResponse,
  AnalyzeResponse,
  SearchResult,
  MarketOverview,
  MacroData,
} from '../lib/types';

interface DiscoveryState {
  stocks: Stock[];
  loading: boolean;
  error: string | null;
  metadata: DiscoverResponse['metadata'] | null;
}

interface MarketState {
  overview: MarketOverview | null;
  macro: MacroData | null;
  loading: boolean;
  error: string | null;
}

export function useStockDiscovery(userId: string | null) {
  const [state, setState] = useState<DiscoveryState>({
    stocks: [],
    loading: false,
    error: null,
    metadata: null,
  });

  const [marketState, setMarketState] = useState<MarketState>({
    overview: null,
    macro: null,
    loading: false,
    error: null,
  });

  const [selectedStock, setSelectedStock] = useState<AnalyzeResponse | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  /**
   * Discover and rank stocks
   */
  const discoverStocks = useCallback(
    async (
      symbols?: string[],
      criteria?: ScreeningCriteria,
      focus?: AnalysisFocus,
      limit: number = 20,
      mode: DiscoveryMode = 'trending'
    ) => {
      console.log('📈 STOCKS_DISCOVERY: Starting discovery', { symbols, criteria, focus, mode });

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = (await stockApi.discoverStocks({
          userId,
          symbols,
          criteria,
          focus,
          mode,
          limit,
        })) as DiscoverResponse;

        console.log('📈 STOCKS_DISCOVERY: Got response', {
          success: response.success,
          stockCount: response.stocks?.length,
        });

        if (response.success) {
          setState({
            stocks: response.stocks,
            loading: false,
            error: null,
            metadata: response.metadata,
          });
        } else {
          throw new Error('Discovery failed');
        }

        return response;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Discovery failed';
        console.error('📈 STOCKS_DISCOVERY: Error', message);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: message,
        }));
        throw error;
      }
    },
    [userId]
  );

  /**
   * Analyze a single stock in depth
   */
  const analyzeStock = useCallback(
    async (symbol: string) => {
      console.log('📈 STOCKS_ANALYSIS: Analyzing', symbol);

      try {
        const response = (await stockApi.analyzeStock(symbol, userId || undefined)) as AnalyzeResponse;

        if (response.success) {
          setSelectedStock(response);
        }

        return response;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Analysis failed';
        console.error('📈 STOCKS_ANALYSIS: Error', message);
        throw error;
      }
    },
    [userId]
  );

  /**
   * Search for stocks
   */
  const searchStocks = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return [];
    }

    console.log('📈 STOCKS_SEARCH: Searching for', query);

    try {
      const response = (await stockApi.searchStocks(query)) as {
        success: boolean;
        results: SearchResult[];
      };

      if (response.success) {
        setSearchResults(response.results);
        return response.results;
      }

      return [];
    } catch (error: unknown) {
      console.error('📈 STOCKS_SEARCH: Error', error);
      return [];
    }
  }, []);

  /**
   * Get market overview
   */
  const getMarketOverview = useCallback(async () => {
    console.log('📈 STOCKS_MARKET: Fetching overview');

    setMarketState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = (await stockApi.getMarketOverview()) as {
        success: boolean;
        market: MarketOverview;
        macro: MacroData;
      };

      if (response.success) {
        setMarketState({
          overview: response.market,
          macro: response.macro,
          loading: false,
          error: null,
        });
      }

      return response;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Market overview failed';
      console.error('📈 STOCKS_MARKET: Error', message);
      setMarketState((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  /**
   * Clear selected stock
   */
  const clearSelectedStock = useCallback(() => {
    setSelectedStock(null);
  }, []);

  /**
   * Clear search results
   */
  const clearSearch = useCallback(() => {
    setSearchResults([]);
  }, []);

  return {
    // Discovery state
    stocks: state.stocks,
    loading: state.loading,
    error: state.error,
    metadata: state.metadata,

    // Market state
    marketOverview: marketState.overview,
    macroData: marketState.macro,
    marketLoading: marketState.loading,
    marketError: marketState.error,

    // Selected stock
    selectedStock,

    // Search
    searchResults,

    // Actions
    discoverStocks,
    analyzeStock,
    searchStocks,
    getMarketOverview,
    clearSelectedStock,
    clearSearch,
  };
}
