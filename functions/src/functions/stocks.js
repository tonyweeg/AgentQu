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
 * Body: { userId?, symbols?, criteria?, focus?, limit? }
 */
const discoverStocks = onRequest(async (req, res) => {
  if (handleCors(req, res)) return;

  try {
    const { userId, symbols, criteria, focus, limit } = req.body;

    logger.info('discoverStocks called', { userId, symbolCount: symbols?.length });

    const stockService = new StockService();
    const result = await stockService.discoverStocks({
      userId,
      symbols,
      criteria,
      focus,
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

module.exports = {
  discoverStocks,
  analyzeStock,
  searchStocks,
  getMarketOverview,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getPortfolio,
  addToPortfolio,
  sellFromPortfolio,
  saveStockPreferences,
  getStockPreferences,
};
