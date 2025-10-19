/**
 * VibeScore Repository
 *
 * SOLID Principles Applied:
 * - Single Responsibility: VibeScore data access only
 * - Dependency Inversion: Service depends on repository interface
 * - Open/Closed: Extensible through BaseRepository
 *
 * Handles Firestore operations for VibeIndex scores by city.
 */

const BaseRepository = require('./BaseRepository');
const { createLogger } = require('../utils/logger');

class VibeScoreRepository extends BaseRepository {
  /**
   * @param {Object} db - Firestore database instance (optional, uses default if not provided)
   */
  constructor(db = null) {
    super('vibeScores', db);
    this.logger = createLogger('VIBE_SCORE_REPOSITORY');
  }

  /**
   * Save or update vibe scores for a city
   * @param {string} cityId - City identifier
   * @param {Object} vibeData - Vibe score data
   * @param {number} vibeData.timestamp - Calculation timestamp
   * @param {Object} vibeData.scores - Category scores (artsy, musicScene, etc.)
   * @param {number} vibeData.overallScore - Overall vibe score (0-100)
   * @param {Object} vibeData.metadata - Additional metadata
   * @returns {Promise<void>}
   */
  async saveVibeScores(cityId, vibeData) {
    try {
      this.logger.debug(`Saving vibe scores for city: ${cityId}`);

      const vibeDoc = {
        ...vibeData,
        updatedAt: Date.now(),
      };

      await this.collection.doc(cityId).set(vibeDoc);

      this.logger.info(`Vibe scores saved for city: ${cityId}`, {
        overallScore: vibeData.overallScore,
      });
    } catch (error) {
      this.logger.error(`Failed to save vibe scores for ${cityId}`, error);
      throw error;
    }
  }

  /**
   * Get vibe scores for a city
   * @param {string} cityId - City identifier
   * @returns {Promise<Object|null>} Vibe score data or null if not found
   */
  async getVibeScores(cityId) {
    try {
      this.logger.debug(`Fetching vibe scores for city: ${cityId}`);

      const doc = await this.collection.doc(cityId).get();

      if (!doc.exists) {
        this.logger.debug(`No vibe scores found for city: ${cityId}`);
        return null;
      }

      return {
        id: doc.id,
        ...doc.data(),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch vibe scores for ${cityId}`, error);
      throw error;
    }
  }

  /**
   * Get vibe scores for multiple cities
   * @param {string[]} cityIds - Array of city identifiers
   * @returns {Promise<Object[]>} Array of vibe score data
   */
  async getVibeScoresBatch(cityIds) {
    try {
      this.logger.debug(`Fetching vibe scores for ${cityIds.length} cities`);

      const promises = cityIds.map((cityId) => this.getVibeScores(cityId));
      const results = await Promise.all(promises);

      // Filter out nulls (cities without scores)
      return results.filter((result) => result !== null);
    } catch (error) {
      this.logger.error(`Failed to fetch batch vibe scores`, error);
      throw error;
    }
  }

  /**
   * Check if vibe scores exist and are fresh (less than 24 hours old)
   * @param {string} cityId - City identifier
   * @param {number} maxAgeMs - Maximum age in milliseconds (default: 24 hours)
   * @returns {Promise<boolean>} True if fresh scores exist
   */
  async hasFreshScores(cityId, maxAgeMs = 24 * 60 * 60 * 1000) {
    try {
      const scores = await this.getVibeScores(cityId);

      if (!scores || !scores.updatedAt) {
        return false;
      }

      const age = Date.now() - scores.updatedAt;
      return age < maxAgeMs;
    } catch (error) {
      this.logger.error(`Failed to check fresh scores for ${cityId}`, error);
      return false;
    }
  }

  /**
   * Delete vibe scores for a city
   * @param {string} cityId - City identifier
   * @returns {Promise<void>}
   */
  async deleteVibeScores(cityId) {
    try {
      this.logger.debug(`Deleting vibe scores for city: ${cityId}`);

      await this.collection.doc(cityId).delete();

      this.logger.info(`Vibe scores deleted for city: ${cityId}`);
    } catch (error) {
      this.logger.error(`Failed to delete vibe scores for ${cityId}`, error);
      throw error;
    }
  }

  /**
   * Get all cities with vibe scores
   * @param {number} limit - Maximum number of cities to return
   * @returns {Promise<Object[]>} Array of city vibe scores
   */
  async getAllCities(limit = 100) {
    try {
      this.logger.debug(`Fetching up to ${limit} cities with vibe scores`);

      const query = await this.collection.orderBy('updatedAt', 'desc').limit(limit).get();

      const cities = [];
      query.docs.forEach((doc) => {
        cities.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      this.logger.info(`Found ${cities.length} cities with vibe scores`);
      return cities;
    } catch (error) {
      this.logger.error(`Failed to fetch all cities`, error);
      throw error;
    }
  }

  /**
   * Get cities with vibe scores above threshold
   * @param {number} minScore - Minimum overall score (0-100)
   * @param {number} limit - Maximum number of cities to return
   * @returns {Promise<Object[]>} Array of city vibe scores
   */
  async getCitiesAboveScore(minScore, limit = 50) {
    try {
      this.logger.debug(`Fetching cities with score >= ${minScore}`);

      const query = await this.collection
        .where('overallScore', '>=', minScore)
        .orderBy('overallScore', 'desc')
        .limit(limit)
        .get();

      const cities = [];
      query.docs.forEach((doc) => {
        cities.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      this.logger.info(`Found ${cities.length} cities with score >= ${minScore}`);
      return cities;
    } catch (error) {
      this.logger.error(`Failed to fetch cities above score ${minScore}`, error);
      throw error;
    }
  }
}

module.exports = VibeScoreRepository;
