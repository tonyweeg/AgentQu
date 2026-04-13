/**
 * Stock Cloud Functions
 *
 * HTTP handlers for stock-related endpoints
 * Following the thin handler pattern used in AgentQu
 */

const { onRequest } = require('firebase-functions/v2/https');
const { StockService } = require('../services/stocks');
const { createLogger } = require('../utils/logger');

const logger = createLogger('STOCK_FUNCTIONS');

// Shared CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper to handle CORS preflight
const handleCors = (req, res) => {
  if (req.method === 'OPTIONS') {
    res.set(corsHeaders).status(204).send('');
    return true;
  }
  res.set(corsHeaders);
  return false;
};

/**
 * Discover and rank stocks
 *
 * POST /discoverStocks
 * Body: { userId?, symbols?, criteria?, focus?, mode?, limit? }
 */
const discoverStocks = onRequest(async (req, res) => {
  if (handleCors(req, res)) return;

  try {
    const { userId, symbols, criteria, focus, mode, limit } = req.body;

    logger.info('discoverStocks called', { userId, mode, symbolCount: symbols?.length });

    const stockService = new StockService();
    const result = await stockService.discoverStocks({
      userId,
      symbols,
      criteria,
      focus,
      mode,
      limit,
    });

    res.status(200).json(result);
  } catch (error) {
    logger.error('discoverStocks failed', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Analyze a single stock in depth
 *
 * GET /analyzeStock?symbol=AAPL&userId=xxx
 * POST /analyzeStock { symbol, userId }
 */
const analyzeStock = onRequest(async (req, res) => {
  if (handleCors(req, res)) return;

  try {
    const symbol = req.query.symbol || req.body.symbol;
    const userId = req.query.userId || req.body.userId;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'symbol is required',
      });
    }

    logger.info('analyzeStock called', { symbol, userId });

    const stockService = new StockService();
    const result = await stockService.analyzeStock(symbol, userId);

    res.status(200).json(result);
  } catch (error) {
    logger.error('analyzeStock failed', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Search for stocks
 *
 * GET /searchStocks?query=apple
 */
const searchStocks = onRequest(async (req, res) => {
  if (handleCors(req, res)) return;

  try {
    const query = req.query.query || req.body.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'query is required',
      });
    }

    logger.info('searchStocks called', { query });

    const stockService = new StockService();
    const results = await stockService.searchStocks(query);

    res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    logger.error('searchStocks failed', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get market overview
 *
 * GET /getMarketOverview
 */
const getMarketOverview = onRequest(async (req, res) => {
  if (handleCors(req, res)) return;

  try {
    logger.info('getMarketOverview called');

    const stockService = new StockService();
    const result = await stockService.getMarketOverview();

    res.status(200).json(result);
  } catch (error) {
    logger.error('getMarketOverview failed', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get user's watchlist
 *
 * GET /getWatchlist?userId=xxx
 */
const getWatchlist = onRequest(async (req, res) => {
  if (handleCors(req, res)) return;

  try {
    const userId = req.query.userId || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    logger.info('getWatchlist called', { userId });

    const stockService = new StockService();
    const result = await stockService.getWatchlist(userId);

    res.status(200).json(result);
  } catch (error) {
    logger.error('getWatchlist failed', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Add stock to watchlist
 *
 * POST /addToWatchlist { userId, symbol }
 */
const addToWatchlist = onRequest(async (req, res) => {
  if (handleCors(req, res)) return;

  try {
    const { userId, symbol } = req.body;

    if (!userId || !symbol) {
      return res.status(400).json({
        success: false,
        error: 'userId and symbol are required',
      });
    }

    logger.info('addToWatchlist called', { userId, symbol });

    const stockService = new StockService();
    const result = await stockService.addToWatchlist(userId, symbol);

    res.status(200).json({
      success: true,
      watchlist: result,
    });
  } catch (error) {
    logger.error('addToWatchlist failed', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Remove stock from watchlist
 *
 * POST /removeFromWatchlist { userId, symbol }
 */
const removeFromWatchlist = onRequest(async (req, res) => {
  if (handleCors(req, res)) return;

  try {
    const { userId, symbol } = req.body;

    if (!userId || !symbol) {
      return res.status(400).json({
        success: false,
        error: 'userId and symbol are required',
      });
    }

    logger.info('removeFromWatchlist called', { userId, symbol });

    const stockService = new StockService();
    const result = await stockService.removeFromWatchlist(userId, symbol);

    res.status(200).json({
      success: true,
      watchlist: result,
    });
  } catch (error) {
    logger.error('removeFromWatchlist failed', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get user's portfolio
 *
 * GET /getPortfolio?userId=xxx
 */
const getPortfolio = onRequest(async (req, res) => {
  if (handleCors(req, res)) return;

  try {
    const userId = req.query.userId || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    logger.info('getPortfolio called', { userId });

    const stockService = new StockService();
    const result = await stockService.getPortfolio(userId);

    res.status(200).json(result);
  } catch (error) {
    logger.error('getPortfolio failed', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Add holding to portfolio
 *
 * POST /addToPortfolio { userId, symbol, shares, avgCost, name?, sector? }
 */
const addToPortfolio = onRequest(async (req, res) => {
  if (handleCors(req, res)) return;

  try {
    const { userId, symbol, shares, avgCost, name, sector } = req.body;

    if (!userId || !symbol || !shares || !avgCost) {
      return res.status(400).json({
        success: false,
        error: 'userId, symbol, shares, and avgCost are required',
      });
    }

    logger.info('addToPortfolio called', { userId, symbol, shares });

    const stockService = new StockService();
    const result = await stockService.addToPortfolio(userId, {
      symbol,
      shares,
      avgCost,
      name,
      sector,
    });

    res.status(200).json({
      success: true,
      portfolio: result,
    });
  } catch (error) {
    logger.error('addToPortfolio failed', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Sell holding from portfolio
 *
 * POST /sellFromPortfolio { userId, symbol, shares, price }
 */
const sellFromPortfolio = onRequest(async (req, res) => {
  if (handleCors(req, res)) return;

  try {
    const { userId, symbol, shares, price } = req.body;

    if (!userId || !symbol || !shares || !price) {
      return res.status(400).json({
        success: false,
        error: 'userId, symbol, shares, and price are required',
      });
    }

    logger.info('sellFromPortfolio called', { userId, symbol, shares, price });

    const stockService = new StockService();
    const result = await stockService.sellFromPortfolio(userId, symbol, shares, price);

    res.status(200).json({
      success: true,
      portfolio: result,
    });
  } catch (error) {
    logger.error('sellFromPortfolio failed', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Save user preferences
 *
 * POST /saveStockPreferences { userId, riskTolerance, timeHorizon, sectorAffinities }
 */
const saveStockPreferences = onRequest(async (req, res) => {
  if (handleCors(req, res)) return;

  try {
    const { userId, riskTolerance, timeHorizon, sectorAffinities } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    logger.info('saveStockPreferences called', { userId });

    const stockService = new StockService();
    const result = await stockService.saveUserPreferences(userId, {
      riskTolerance,
      timeHorizon,
      sectorAffinities,
    });

    res.status(200).json({
      success: true,
      portfolio: result,
    });
  } catch (error) {
    logger.error('saveStockPreferences failed', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get user preferences
 *
 * GET /getStockPreferences?userId=xxx
 */
const getStockPreferences = onRequest(async (req, res) => {
  if (handleCors(req, res)) return;

  try {
    const userId = req.query.userId || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    logger.info('getStockPreferences called', { userId });

    const stockService = new StockService();
    const preferences = await stockService.getUserPreferences(userId);

    res.status(200).json({
      success: true,
      preferences,
    });
  } catch (error) {
    logger.error('getStockPreferences failed', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get Market Indices
 *
 * GET /getMarketIndices
 * Returns major market indices, global markets, and key indicators
 */
const getMarketIndices = onRequest(async (req, res) => {
  if (handleCors(req, res)) return;

  try {
    logger.info('getMarketIndices called');

    // Index symbols to fetch
    const indexSymbols = [
      // US Markets
      '^GSPC',   // S&P 500
      '^DJI',    // Dow Jones
      '^IXIC',   // Nasdaq
      '^RUT',    // Russell 2000
      // Volatility
      '^VIX',    // VIX Fear Index
      // Global Markets
      '^FTSE',   // FTSE 100
      '^GDAXI',  // DAX
      '^N225',   // Nikkei 225
      '^HSI',    // Hang Seng
      // Commodities
      'GC=F',    // Gold
      'CL=F',    // Crude Oil
      // Crypto
      'BTC-USD', // Bitcoin
    ];

    const stockService = new StockService();
    const indices = await stockService.getMarketIndices(indexSymbols);

    res.status(200).json({
      success: true,
      indices,
      lastUpdated: Date.now(),
    });
  } catch (error) {
    logger.error('getMarketIndices failed', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Finnhub Webhook Handler
 *
 * POST /finnhubWebhook
 * Receives real-time events from Finnhub (earnings, news, filings, etc.)
 * Header: X-Finnhub-Secret must match configured secret
 */
const FINNHUB_WEBHOOK_SECRET = process.env.FINNHUB_WEBHOOK_SECRET || 'd6l006hr01qmopd2dcu0';

const finnhubWebhook = onRequest(async (req, res) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate Finnhub secret header
  const receivedSecret = req.headers['x-finnhub-secret'];
  if (receivedSecret !== FINNHUB_WEBHOOK_SECRET) {
    logger.warn('Finnhub webhook: Invalid secret', {
      received: receivedSecret ? 'present but invalid' : 'missing',
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Acknowledge receipt IMMEDIATELY (Finnhub requires fast 2xx response)
  res.status(200).json({ received: true });

  // Process event asynchronously after acknowledgment
  try {
    const event = req.body;
    logger.info('Finnhub webhook received', {
      type: event.type || 'unknown',
      symbol: event.symbol || event.data?.symbol,
      timestamp: new Date().toISOString(),
    });

    // Handle different event types
    switch (event.type) {
      case 'earnings':
        logger.info('Finnhub earnings event', {
          symbol: event.symbol,
          eps: event.data?.eps,
          revenue: event.data?.revenue,
        });
        // TODO: Store in Firestore, trigger notifications, etc.
        break;

      case 'news':
        logger.info('Finnhub news event', {
          symbol: event.symbol,
          headline: event.data?.headline,
        });
        // TODO: Store news, update stock sentiment, etc.
        break;

      case 'sec_filing':
        logger.info('Finnhub SEC filing event', {
          symbol: event.symbol,
          formType: event.data?.formType,
        });
        break;

      case 'price_target':
        logger.info('Finnhub price target event', {
          symbol: event.symbol,
          target: event.data?.targetPrice,
        });
        break;

      case 'recommendation':
        logger.info('Finnhub recommendation event', {
          symbol: event.symbol,
          rating: event.data?.rating,
        });
        break;

      default:
        logger.info('Finnhub webhook: Unhandled event type', { event });
    }
  } catch (error) {
    // Log error but don't fail - we already acknowledged
    logger.error('Finnhub webhook processing error', {
      error: error.message,
      stack: error.stack?.substring(0, 500),
    });
  }
});

module.exports = {
  discoverStocks,
  analyzeStock,
  searchStocks,
  getMarketOverview,
  getMarketIndices,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getPortfolio,
  addToPortfolio,
  sellFromPortfolio,
  saveStockPreferences,
  getStockPreferences,
  finnhubWebhook,
};
