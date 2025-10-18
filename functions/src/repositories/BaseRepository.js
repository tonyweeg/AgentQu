/**
 * Base Repository Class
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Firestore CRUD operations only
 * - Open/Closed: Can be extended without modification
 * - Liskov Substitution: All repositories can be substituted
 * - Dependency Inversion: Depends on Firestore interface, not implementation
 */

const { getFirestore } = require('../config/firebase');
const { createLogger } = require('../utils/logger');
const { sanitizeForFirestore } = require('../utils/validation');

class BaseRepository {
  /**
   * @param {string} collectionName - Firestore collection name
   */
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.db = getFirestore();
    this.logger = createLogger(`REPO:${collectionName.toUpperCase()}`);
  }

  /**
   * Get collection reference
   * @returns {FirebaseFirestore.CollectionReference}
   */
  getCollection() {
    return this.db.collection(this.collectionName);
  }

  /**
   * Create a new document
   * @param {string} id - Document ID
   * @param {Object} data - Document data
   * @returns {Promise<Object>} Created document
   */
  async create(id, data) {
    try {
      const sanitized = sanitizeForFirestore(data);
      const docRef = this.getCollection().doc(id);

      await docRef.set({
        ...sanitized,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      this.logger.info(`Created document`, { id, collection: this.collectionName });
      return { id, ...sanitized };
    } catch (error) {
      this.logger.error(`Failed to create document`, error);
      throw error;
    }
  }

  /**
   * Get document by ID
   * @param {string} id - Document ID
   * @returns {Promise<Object|null>} Document data or null
   */
  async getById(id) {
    try {
      const doc = await this.getCollection().doc(id).get();

      if (!doc.exists) {
        this.logger.debug(`Document not found`, { id });
        return null;
      }

      return { id: doc.id, ...doc.data() };
    } catch (error) {
      this.logger.error(`Failed to get document`, error);
      throw error;
    }
  }

  /**
   * Update document
   * @param {string} id - Document ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated document
   */
  async update(id, data) {
    try {
      const sanitized = sanitizeForFirestore(data);
      const docRef = this.getCollection().doc(id);

      await docRef.update({
        ...sanitized,
        updatedAt: Date.now(),
      });

      this.logger.info(`Updated document`, { id });
      return { id, ...sanitized };
    } catch (error) {
      this.logger.error(`Failed to update document`, error);
      throw error;
    }
  }

  /**
   * Merge update (create if doesn't exist)
   * @param {string} id - Document ID
   * @param {Object} data - Data to merge
   * @returns {Promise<Object>} Updated document
   */
  async merge(id, data) {
    try {
      const sanitized = sanitizeForFirestore(data);
      const docRef = this.getCollection().doc(id);

      await docRef.set(
        {
          ...sanitized,
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      this.logger.info(`Merged document`, { id });
      return { id, ...sanitized };
    } catch (error) {
      this.logger.error(`Failed to merge document`, error);
      throw error;
    }
  }

  /**
   * Delete document
   * @param {string} id - Document ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    try {
      await this.getCollection().doc(id).delete();
      this.logger.info(`Deleted document`, { id });
    } catch (error) {
      this.logger.error(`Failed to delete document`, error);
      throw error;
    }
  }

  /**
   * Query documents
   * @param {Array} queryConstraints - Array of [field, operator, value]
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Query results
   */
  async query(queryConstraints = [], options = {}) {
    try {
      let query = this.getCollection();

      // Apply where clauses
      queryConstraints.forEach(([field, operator, value]) => {
        query = query.where(field, operator, value);
      });

      // Apply ordering
      if (options.orderBy) {
        const [field, direction = 'asc'] = options.orderBy;
        query = query.orderBy(field, direction);
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const snapshot = await query.get();

      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      this.logger.debug(`Query returned ${results.length} results`);
      return results;
    } catch (error) {
      this.logger.error(`Query failed`, error);
      throw error;
    }
  }

  /**
   * Get all documents in collection
   * @param {number} limit - Optional limit
   * @returns {Promise<Array>} All documents
   */
  async getAll(limit = 1000) {
    try {
      let query = this.getCollection();

      if (limit) {
        query = query.limit(limit);
      }

      const snapshot = await query.get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      this.logger.error(`Failed to get all documents`, error);
      throw error;
    }
  }

  /**
   * Batch write operation
   * @param {Array} operations - Array of {type, id, data}
   * @returns {Promise<void>}
   */
  async batch(operations) {
    try {
      const batch = this.db.batch();

      operations.forEach(({ type, id, data }) => {
        const docRef = this.getCollection().doc(id);
        const sanitized = sanitizeForFirestore(data);

        switch (type) {
          case 'create':
          case 'set':
            batch.set(docRef, { ...sanitized, createdAt: Date.now(), updatedAt: Date.now() });
            break;
          case 'update':
            batch.update(docRef, { ...sanitized, updatedAt: Date.now() });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
          default:
            throw new Error(`Unknown batch operation type: ${type}`);
        }
      });

      await batch.commit();
      this.logger.info(`Batch committed`, { operations: operations.length });
    } catch (error) {
      this.logger.error(`Batch failed`, error);
      throw error;
    }
  }

  /**
   * Check if document exists
   * @param {string} id - Document ID
   * @returns {Promise<boolean>}
   */
  async exists(id) {
    try {
      const doc = await this.getCollection().doc(id).get();
      return doc.exists;
    } catch (error) {
      this.logger.error(`Failed to check existence`, error);
      throw error;
    }
  }
}

module.exports = BaseRepository;
