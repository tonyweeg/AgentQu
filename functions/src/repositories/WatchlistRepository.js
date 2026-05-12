/**
 * Watchlist Repository
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Watchlist persistence only
 * - Open/Closed: Extends BaseRepository without modification
 *
 * Handles:
 * - User watchlists
 * - Watchlist items (stocks to track)
 * - Alerts and notifications
 */

const BaseRepository = require('./BaseRepository');

class WatchlistRepository extends BaseRepository {
  constructor() {
    super('watchlists');
  }

  /**
   * Get user's watchlist
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Watchlist with stocks
   */
  async getWatchlist(userId) {
    const watchlist = await this.getById(userId);

    if (!watchlist) {
      // Create default watchlist
      return this.create(userId, {
        userId,
        stocks: [],
        alerts: [],
      });
    }

    return watchlist;
  }

  /**
   * Add stock to watchlist
   * @param {string} userId - User ID
   * @param {Object} stock - Stock to add
   * @returns {Promise<Object>} Updated watchlist
   */
  async addStock(userId, stock) {
    const watchlist = await this.getWatchlist(userId);

    // Check if already in watchlist
    if (watchlist.stocks.some((s) => s.symbol === stock.symbol.toUpperCase())) {
      this.logger.debug(`${stock.symbol} already in watchlist`);
      return watchlist;
    }

    const stockEntry = {
      symbol: stock.symbol.toUpperCase(),
      name: stock.name,
      addedAt: Date.now(),
      addedPrice: stock.price,
      notes: stock.notes || '',
    };

    watchlist.stocks.push(stockEntry);

    await this.update(userId, { stocks: watchlist.stocks });
    this.logger.info(`Added ${stock.symbol} to watchlist`, { userId });

    return { ...watchlist, stocks: [...watchlist.stocks] };
  }

  /**
   * Remove stock from watchlist
   * @param {string} userId - User ID
   * @param {string} symbol - Stock symbol to remove
   * @returns {Promise<Object>} Updated watchlist
   */
  async removeStock(userId, symbol) {
    const watchlist = await this.getWatchlist(userId);

    watchlist.stocks = watchlist.stocks.filter(
      (s) => s.symbol !== symbol.toUpperCase()
    );

    await this.update(userId, { stocks: watchlist.stocks });
    this.logger.info(`Removed ${symbol} from watchlist`, { userId });

    return watchlist;
  }

  /**
   * Add price alert
   * @param {string} userId - User ID
   * @param {Object} alert - Alert configuration
   * @returns {Promise<Object>} Updated watchlist
   */
  async addAlert(userId, alert) {
    const watchlist = await this.getWatchlist(userId);

    const alertEntry = {
      id: `${alert.symbol}-${Date.now()}`,
      symbol: alert.symbol.toUpperCase(),
      type: alert.type, // 'price_above', 'price_below', 'percent_change'
      value: alert.value,
      active: true,
      createdAt: Date.now(),
    };

    watchlist.alerts = watchlist.alerts || [];
    watchlist.alerts.push(alertEntry);

    await this.update(userId, { alerts: watchlist.alerts });
    this.logger.info(`Added alert for ${alert.symbol}`, { userId, alert });

    return watchlist;
  }

  /**
   * Remove alert
   * @param {string} userId - User ID
   * @param {string} alertId - Alert ID to remove
   * @returns {Promise<Object>} Updated watchlist
   */
  async removeAlert(userId, alertId) {
    const watchlist = await this.getWatchlist(userId);

    watchlist.alerts = (watchlist.alerts || []).filter((a) => a.id !== alertId);

    await this.update(userId, { alerts: watchlist.alerts });
    this.logger.info(`Removed alert ${alertId}`, { userId });

    return watchlist;
  }

  /**
   * Get all active alerts
   * @returns {Promise<Array>} All active alerts across users
   */
  async getAllActiveAlerts() {
    const watchlists = await this.getAll(1000);

    const alerts = [];
    watchlists.forEach((wl) => {
      (wl.alerts || [])
        .filter((a) => a.active)
        .forEach((a) => {
          alerts.push({
            ...a,
            userId: wl.userId,
          });
        });
    });

    return alerts;
  }

  /**
   * Update stock notes
   * @param {string} userId - User ID
   * @param {string} symbol - Stock symbol
   * @param {string} notes - Notes to save
   * @returns {Promise<Object>} Updated watchlist
   */
  async updateNotes(userId, symbol, notes) {
    const watchlist = await this.getWatchlist(userId);

    const stockIndex = watchlist.stocks.findIndex(
      (s) => s.symbol === symbol.toUpperCase()
    );

    if (stockIndex >= 0) {
      watchlist.stocks[stockIndex].notes = notes;
      await this.update(userId, { stocks: watchlist.stocks });
    }

    return watchlist;
  }
}

module.exports = WatchlistRepository;
