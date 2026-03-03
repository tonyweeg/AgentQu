/**
 * Stock Repository
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Stock data persistence only
 * - Open/Closed: Extends BaseRepository without modification
 * - Liskov Substitution: Fully substitutable for BaseRepository
 *
 * Handles:
 * - Stock quote caching
 * - Stock metrics storage
 * - Historical data caching
 */

const BaseRepository = require('./BaseRepository');

class StockRepository extends BaseRepository {
  constructor() {
    super('stockCache');
  }

  /**
   * Cache stock data
   * @param {string} symbol - Stock symbol
   * @param {Object} data - Stock data to cache
   * @param {number} ttl - Cache TTL in seconds
   * @returns {Promise<Object>}
   */
  async cacheStock(symbol, data, ttl = 300) {
    const id = symbol.toUpperCase();
    const expiresAt = Date.now() + ttl * 1000;

    return this.merge(id, {
      symbol: id,
      data,
      expiresAt,
      cachedAt: Date.now(),
    });
  }

  /**
   * Get cached stock data
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object|null>} Cached data or null if expired/missing
   */
  async getCachedStock(symbol) {
    const id = symbol.toUpperCase();
    const cached = await this.getById(id);

    if (!cached) return null;
    if (cached.expiresAt < Date.now()) {
      // Expired - delete and return null
      await this.delete(id);
      return null;
    }

    return cached.data;
  }

  /**
   * Cache multiple stocks
   * @param {Array<Object>} stocks - Array of {symbol, data}
   * @param {number} ttl - Cache TTL in seconds
   * @returns {Promise<void>}
   */
  async cacheStocks(stocks, ttl = 300) {
    const expiresAt = Date.now() + ttl * 1000;

    const operations = stocks.map(({ symbol, data }) => ({
      type: 'set',
      id: symbol.toUpperCase(),
      data: {
        symbol: symbol.toUpperCase(),
        data,
        expiresAt,
        cachedAt: Date.now(),
      },
    }));

    await this.batch(operations);
    this.logger.info(`Cached ${stocks.length} stocks`);
  }

  /**
   * Get multiple cached stocks
   * @param {Array<string>} symbols - Stock symbols
   * @returns {Promise<Object>} Map of symbol -> data (only non-expired)
   */
  async getCachedStocks(symbols) {
    const result = {};
    const now = Date.now();

    await Promise.all(
      symbols.map(async (symbol) => {
        const cached = await this.getById(symbol.toUpperCase());
        if (cached && cached.expiresAt > now) {
          result[symbol.toUpperCase()] = cached.data;
        }
      })
    );

    return result;
  }

  /**
   * Clear expired cache entries
   * @returns {Promise<number>} Number of entries cleared
   */
  async clearExpired() {
    const now = Date.now();
    const expired = await this.query([['expiresAt', '<', now]]);

    if (expired.length === 0) return 0;

    const operations = expired.map((doc) => ({
      type: 'delete',
      id: doc.id,
      data: {},
    }));

    await this.batch(operations);
    this.logger.info(`Cleared ${expired.length} expired cache entries`);
    return expired.length;
  }
}

module.exports = StockRepository;
