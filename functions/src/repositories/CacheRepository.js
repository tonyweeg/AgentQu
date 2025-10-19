/**
 * Cache Repository
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Cache management only
 * - Dependency Inversion: Depends on Firestore abstraction
 *
 * Handles:
 * - Clearing activity cache
 * - Clearing specific cache types
 * - Cache statistics
 */

const BaseRepository = require('./BaseRepository');
const { createLogger } = require('../utils/logger');

class CacheRepository extends BaseRepository {
  constructor() {
    super('activities'); // Default collection for activity cache
    this.logger = createLogger('CACHE_REPOSITORY');
  }

  /**
   * Clear all activities from cache
   * @returns {Promise<Object>} Deletion statistics
   */
  async clearActivityCache() {
    try {
      this.logger.info('Clearing activity cache');

      const querySnapshot = await this.collection.get();
      const batch = this.db.batch();

      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      this.logger.info('Activity cache cleared', { deletedCount: querySnapshot.size });

      return {
        success: true,
        cleared: ['activities'],
        deletedCount: querySnapshot.size,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to clear activity cache', error);
      throw error;
    }
  }

  /**
   * Clear all caches (activities, places, etc.)
   * @returns {Promise<Object>} Deletion statistics
   */
  async clearAllCaches() {
    try {
      this.logger.info('Clearing all caches');

      const collections = ['activities', 'places_cache', 'twitter_cache', 'weather_cache'];
      const results = {
        success: true,
        cleared: [],
        totalDeleted: 0,
        timestamp: new Date().toISOString(),
      };

      for (const collectionName of collections) {
        try {
          const collectionRef = this.db.collection(collectionName);
          const querySnapshot = await collectionRef.get();

          if (querySnapshot.size > 0) {
            const batch = this.db.batch();
            querySnapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();

            results.cleared.push(collectionName);
            results.totalDeleted += querySnapshot.size;

            this.logger.debug(`Cleared ${collectionName}`, { deletedCount: querySnapshot.size });
          }
        } catch (error) {
          this.logger.warn(`Failed to clear ${collectionName}`, error);
          // Continue with other collections even if one fails
        }
      }

      this.logger.info('All caches cleared', results);
      return results;
    } catch (error) {
      this.logger.error('Failed to clear all caches', error);
      throw error;
    }
  }

  /**
   * Clear specific cache by type
   * @param {string} cacheType - Type of cache to clear (activities, places, twitter, weather)
   * @returns {Promise<Object>} Deletion statistics
   */
  async clearCacheByType(cacheType) {
    try {
      const collectionMap = {
        activities: 'activities',
        places: 'places_cache',
        twitter: 'twitter_cache',
        weather: 'weather_cache',
      };

      const collectionName = collectionMap[cacheType];
      if (!collectionName) {
        throw new Error(`Invalid cache type: ${cacheType}`);
      }

      this.logger.info(`Clearing ${cacheType} cache`);

      const collectionRef = this.db.collection(collectionName);
      const querySnapshot = await collectionRef.get();
      const batch = this.db.batch();

      querySnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      this.logger.info(`${cacheType} cache cleared`, { deletedCount: querySnapshot.size });

      return {
        success: true,
        cleared: [cacheType],
        deletedCount: querySnapshot.size,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to clear ${cacheType} cache`, error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache statistics
   */
  async getCacheStats() {
    try {
      const collections = ['activities', 'places_cache', 'twitter_cache', 'weather_cache'];
      const stats = {
        collections: {},
        totalEntries: 0,
        timestamp: new Date().toISOString(),
      };

      for (const collectionName of collections) {
        try {
          const collectionRef = this.db.collection(collectionName);
          const querySnapshot = await collectionRef.get();

          stats.collections[collectionName] = {
            count: querySnapshot.size,
            size: querySnapshot.docs.reduce((acc, doc) => acc + JSON.stringify(doc.data()).length, 0),
          };

          stats.totalEntries += querySnapshot.size;
        } catch (error) {
          this.logger.warn(`Failed to get stats for ${collectionName}`, error);
          stats.collections[collectionName] = { count: 0, size: 0, error: error.message };
        }
      }

      return stats;
    } catch (error) {
      this.logger.error('Failed to get cache stats', error);
      throw error;
    }
  }
}

module.exports = CacheRepository;
