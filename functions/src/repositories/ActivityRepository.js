/**
 * Activity Repository
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Activity data access only
 * - Liskov Substitution: Extends BaseRepository
 */

const BaseRepository = require('./BaseRepository');
const { encodeGeohash } = require('../utils/distance');
const { validateCoordinates, validateActivityId } = require('../utils/validation');

class ActivityRepository extends BaseRepository {
  constructor() {
    super('activities');
  }

  /**
   * Create activity with geohash indexing
   * @param {string} id - Activity ID
   * @param {Object} activityData - Activity data
   * @returns {Promise<Object>}
   */
  async createActivity(id, activityData) {
    validateActivityId(id);

    const { lat, lng } = activityData.location || activityData;
    validateCoordinates(lat, lng);

    // Add geohash for spatial queries
    const activity = {
      ...activityData,
      location: {
        ...activityData.location,
        geohash: encodeGeohash(lat, lng, 7),
        geohashPrecise: encodeGeohash(lat, lng, 9),
      },
    };

    return this.create(id, activity);
  }

  /**
   * Find activities near a location
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radiusMiles - Search radius in miles
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findNearby(lat, lng, radiusMiles = 10, options = {}) {
    validateCoordinates(lat, lng);

    // Use geohash for approximate location queries
    const centerGeohash = encodeGeohash(lat, lng, 7);

    // Query by geohash prefix for fast spatial search
    const activities = await this.query(
      [['location.geohash', '>=', centerGeohash.substring(0, 5)]],
      { limit: options.limit || 500 }
    );

    // Filter by actual distance (Firestore can't do radius queries natively)
    const { calculateDistance } = require('../utils/distance');

    return activities
      .filter((activity) => {
        const distance = calculateDistance(
          lat,
          lng,
          activity.location.lat,
          activity.location.lng
        );
        return distance <= radiusMiles;
      })
      .map((activity) => ({
        ...activity,
        distance: calculateDistance(lat, lng, activity.location.lat, activity.location.lng),
      }));
  }

  /**
   * Find activities by category
   * @param {string} category - Category name
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByCategory(category, options = {}) {
    return this.query(
      [['primaryCategory', '==', category]],
      options
    );
  }

  /**
   * Find activities by type
   * @param {string} type - Activity type (event, venue, hike, etc.)
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByType(type, options = {}) {
    return this.query(
      [['type', '==', type]],
      options
    );
  }

  /**
   * Get activities expiring soon
   * @param {number} hoursFromNow - Hours from now
   * @returns {Promise<Array>}
   */
  async getExpiringSoon(hoursFromNow = 24) {
    const expirationTime = Date.now() + hoursFromNow * 60 * 60 * 1000;

    return this.query([
      ['expiration.type', '==', 'date'],
      ['expiration.expiresAt', '<=', expirationTime],
      ['expiration.isActive', '==', true],
    ]);
  }

  /**
   * Mark activity as expired
   * @param {string} id - Activity ID
   * @returns {Promise<void>}
   */
  async markExpired(id) {
    return this.update(id, {
      'expiration.isActive': false,
      'expiration.expiredAt': Date.now(),
    });
  }

  /**
   * Add review to activity
   * @param {string} activityId - Activity ID
   * @param {Object} review - Review data
   * @returns {Promise<Object>}
   */
  async addReview(activityId, review) {
    validateActivityId(activityId);

    const activity = await this.getById(activityId);
    if (!activity) {
      throw new Error(`Activity not found: ${activityId}`);
    }

    // Calculate new average rating
    const reviews = activity.reviews || [];
    reviews.push(review);

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    return this.update(activityId, {
      reviews,
      'ratings.agentQuRating': avgRating,
      'ratings.totalReviews': reviews.length,
    });
  }

  /**
   * Update vote score
   * @param {string} activityId - Activity ID
   * @param {number} voteDelta - Vote change (+1 or -1)
   * @returns {Promise<Object>}
   */
  async updateVotes(activityId, voteDelta) {
    validateActivityId(activityId);

    const activity = await this.getById(activityId);
    if (!activity) {
      throw new Error(`Activity not found: ${activityId}`);
    }

    const ratings = activity.ratings || {};
    const upvotes = (ratings.upvotes || 0) + (voteDelta > 0 ? 1 : 0);
    const downvotes = (ratings.downvotes || 0) + (voteDelta < 0 ? 1 : 0);
    const voteScore = upvotes - downvotes;

    return this.update(activityId, {
      'ratings.upvotes': upvotes,
      'ratings.downvotes': downvotes,
      'ratings.totalVotes': upvotes + downvotes,
      'ratings.voteScore': voteScore,
    });
  }

  /**
   * Record check-in
   * @param {string} activityId - Activity ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async recordCheckIn(activityId, userId) {
    validateActivityId(activityId);

    const activity = await this.getById(activityId);
    if (!activity) {
      throw new Error(`Activity not found: ${activityId}`);
    }

    const checkIns = activity.checkIns || [];
    checkIns.push({
      userId,
      timestamp: Date.now(),
    });

    return this.update(activityId, {
      checkIns,
      checkInCount: checkIns.length,
    });
  }

  /**
   * Get popular activities (by vote score)
   * @param {number} limit - Number of results
   * @returns {Promise<Array>}
   */
  async getPopular(limit = 50) {
    return this.query([], {
      orderBy: ['ratings.voteScore', 'desc'],
      limit,
    });
  }

  /**
   * Search activities by name
   * @param {string} searchTerm - Search term
   * @param {number} limit - Number of results
   * @returns {Promise<Array>}
   */
  async searchByName(searchTerm, limit = 50) {
    // Firestore doesn't support full-text search natively
    // This is a simple prefix search
    const lowerTerm = searchTerm.toLowerCase();

    const all = await this.getAll(1000);

    return all
      .filter((activity) => activity.name.toLowerCase().includes(lowerTerm))
      .slice(0, limit);
  }
}

module.exports = ActivityRepository;
