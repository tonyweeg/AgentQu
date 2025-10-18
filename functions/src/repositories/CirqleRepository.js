/**
 * Cirqle (Family/Friends Circle) Repository
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Circle data access only
 * - Liskov Substitution: Extends BaseRepository
 */

const BaseRepository = require('./BaseRepository');
const { validateUserId, isValidEmail } = require('../utils/validation');

class CirqleRepository extends BaseRepository {
  constructor() {
    super('cirqles');
  }

  /**
   * Create cirqle
   * @param {string} cirqleId - Cirqle ID
   * @param {Object} cirqleData - Cirqle data
   * @returns {Promise<Object>}
   */
  async createCirqle(cirqleId, cirqleData) {
    validateUserId(cirqleData.ownerId);

    return this.create(cirqleId, {
      ...cirqleData,
      members: cirqleData.members || [],
    });
  }

  /**
   * Get cirqle by owner ID
   * @param {string} ownerId - Owner user ID
   * @returns {Promise<Object|null>}
   */
  async getByOwner(ownerId) {
    validateUserId(ownerId);

    const results = await this.query([['ownerId', '==', ownerId]]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Add member to cirqle
   * @param {string} cirqleId - Cirqle ID
   * @param {Object} member - Member data
   * @returns {Promise<Object>}
   */
  async addMember(cirqleId, member) {
    const cirqle = await this.getById(cirqleId);
    if (!cirqle) {
      throw new Error(`Cirqle not found: ${cirqleId}`);
    }

    const members = cirqle.members || [];

    // Check for duplicates
    const exists = members.some(
      (m) => m.memberId === member.memberId || (m.email && m.email === member.email)
    );

    if (exists) {
      this.logger.debug(`Member already in cirqle`, { cirqleId, memberId: member.memberId });
      return cirqle;
    }

    // Validate email if provided
    if (member.email && !isValidEmail(member.email)) {
      throw new Error('Invalid email format');
    }

    members.push({
      ...member,
      invitedAt: member.invitedAt || Date.now(),
      status: member.status || 'pending',
    });

    return this.update(cirqleId, { members });
  }

  /**
   * Update member status
   * @param {string} cirqleId - Cirqle ID
   * @param {string} memberId - Member ID
   * @param {string} status - New status (pending, accepted, active)
   * @returns {Promise<Object>}
   */
  async updateMemberStatus(cirqleId, memberId, status) {
    const cirqle = await this.getById(cirqleId);
    if (!cirqle) {
      throw new Error(`Cirqle not found: ${cirqleId}`);
    }

    const validStatuses = ['pending', 'accepted', 'active'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const members = cirqle.members.map((m) => {
      if (m.memberId === memberId) {
        const updated = { ...m, status };
        if (status === 'accepted' || status === 'active') {
          updated.joinedAt = Date.now();
        }
        return updated;
      }
      return m;
    });

    return this.update(cirqleId, { members });
  }

  /**
   * Update member affinities
   * @param {string} cirqleId - Cirqle ID
   * @param {string} memberId - Member ID
   * @param {Object} affinities - Affinity scores
   * @returns {Promise<Object>}
   */
  async updateMemberAffinities(cirqleId, memberId, affinities) {
    const cirqle = await this.getById(cirqleId);
    if (!cirqle) {
      throw new Error(`Cirqle not found: ${cirqleId}`);
    }

    const members = cirqle.members.map((m) =>
      m.memberId === memberId ? { ...m, affinities } : m
    );

    return this.update(cirqleId, { members });
  }

  /**
   * Link member to user account
   * @param {string} cirqleId - Cirqle ID
   * @param {string} memberId - Member ID
   * @param {string} userId - User ID to link
   * @param {Object} userData - User data (displayName, photoURL, etc.)
   * @returns {Promise<Object>}
   */
  async linkMemberToUser(cirqleId, memberId, userId, userData = {}) {
    validateUserId(userId);

    const cirqle = await this.getById(cirqleId);
    if (!cirqle) {
      throw new Error(`Cirqle not found: ${cirqleId}`);
    }

    const members = cirqle.members.map((m) => {
      if (m.memberId === memberId) {
        return {
          ...m,
          userId,
          displayName: userData.displayName || m.nickname,
          photoURL: userData.photoURL || m.photoURL,
          status: 'active',
          joinedAt: Date.now(),
        };
      }
      return m;
    });

    return this.update(cirqleId, { members });
  }

  /**
   * Remove member from cirqle
   * @param {string} cirqleId - Cirqle ID
   * @param {string} memberId - Member ID
   * @returns {Promise<Object>}
   */
  async removeMember(cirqleId, memberId) {
    const cirqle = await this.getById(cirqleId);
    if (!cirqle) {
      throw new Error(`Cirqle not found: ${cirqleId}`);
    }

    const members = cirqle.members.filter((m) => m.memberId !== memberId);

    return this.update(cirqleId, { members });
  }

  /**
   * Find cirqle by invite token
   * @param {string} inviteToken - Invite token
   * @returns {Promise<Object|null>}
   */
  async findByInviteToken(inviteToken) {
    // This requires querying nested arrays - not efficient in Firestore
    // In production, consider a separate invites collection
    const allCirqles = await this.getAll();

    for (const cirqle of allCirqles) {
      const member = cirqle.members.find((m) => m.inviteToken === inviteToken);
      if (member) {
        return { cirqle, member };
      }
    }

    return null;
  }

  /**
   * Get cirqles where user is a member
   * @param {string} userId - User ID
   * @returns {Promise<Array>}
   */
  async getCirqlesForUser(userId) {
    validateUserId(userId);

    // Firestore limitation: can't query nested arrays efficiently
    // In production, maintain a separate user-cirqle index
    const allCirqles = await this.getAll();

    return allCirqles.filter((cirqle) =>
      cirqle.members.some((m) => m.userId === userId || cirqle.ownerId === userId)
    );
  }

  /**
   * Update cirqle name
   * @param {string} cirqleId - Cirqle ID
   * @param {string} cirqleName - New name
   * @returns {Promise<Object>}
   */
  async updateName(cirqleId, cirqleName) {
    return this.update(cirqleId, { cirqleName });
  }

  /**
   * Get active members count
   * @param {string} cirqleId - Cirqle ID
   * @returns {Promise<number>}
   */
  async getActiveMemberCount(cirqleId) {
    const cirqle = await this.getById(cirqleId);
    if (!cirqle) {
      return 0;
    }

    return cirqle.members.filter((m) => m.status === 'active').length;
  }

  /**
   * Get pending invites
   * @param {string} cirqleId - Cirqle ID
   * @returns {Promise<Array>}
   */
  async getPendingInvites(cirqleId) {
    const cirqle = await this.getById(cirqleId);
    if (!cirqle) {
      return [];
    }

    return cirqle.members.filter((m) => m.status === 'pending');
  }
}

module.exports = CirqleRepository;
