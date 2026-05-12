/**
 * Cirqle (Family/Friends Circle) Service
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Circle management only
 * - Dependency Inversion: Depends on repository interfaces
 */

const { CirqleRepository, UserRepository } = require('../repositories');
const { createLogger } = require('../utils/logger');
const { validateUserId, isValidEmail } = require('../utils/validation');
const crypto = require('crypto');

class CirqleService {
  constructor() {
    this.cirqleRepo = new CirqleRepository();
    this.userRepo = new UserRepository();
    this.logger = createLogger('CIRQLE_SERVICE');
  }

  /**
   * Create cirqle for user
   * @param {Object} params - Cirqle parameters
   * @returns {Promise<Object>} Created cirqle
   */
  async createCirqle(params) {
    try {
      const { ownerId, ownerName, cirqleName } = params;

      validateUserId(ownerId);

      // Check if user already has a cirqle
      const existing = await this.cirqleRepo.getByOwner(ownerId);
      if (existing) {
        this.logger.info('User already has cirqle', { ownerId });
        return { success: true, cirqle: existing };
      }

      const cirqleId = `cirqle_${ownerId}`;

      const cirqleData = {
        ownerId,
        ownerName,
        cirqleName: cirqleName || `${ownerName}'s Circle`,
        members: [],
      };

      const cirqle = await this.cirqleRepo.createCirqle(cirqleId, cirqleData);

      this.logger.info('Cirqle created', { cirqleId, ownerId });

      return { success: true, cirqle };
    } catch (error) {
      this.logger.error('Create cirqle failed', error);
      throw error;
    }
  }

  /**
   * Invite member to cirqle
   * @param {Object} params - Invite parameters
   * @returns {Promise<Object>} Updated cirqle with invite
   */
  async inviteToCirqle(params) {
    try {
      const { ownerId, nickname, relationship, email = null, memberType = 'family' } = params;

      validateUserId(ownerId);

      if (email && !isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      // Get or create cirqle
      let cirqle = await this.cirqleRepo.getByOwner(ownerId);
      if (!cirqle) {
        const owner = await this.userRepo.getProfile(ownerId);
        cirqle = await this.createCirqle({
          ownerId,
          ownerName: owner?.displayName || 'User',
        }).then((result) => result.cirqle);
      }

      // Generate unique member ID and invite token
      const memberId = `member_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const inviteToken = crypto.randomBytes(16).toString('hex');

      const member = {
        memberId,
        ownerUserId: ownerId,
        nickname,
        relationship,
        email: email || null,
        memberType,
        status: memberType === 'invited' ? 'pending' : 'active',
        inviteToken: memberType === 'invited' ? inviteToken : null,
      };

      const updatedCirqle = await this.cirqleRepo.addMember(cirqle.id, member);

      this.logger.info('Member invited to cirqle', { cirqleId: cirqle.id, memberId, memberType });

      return {
        success: true,
        cirqle: updatedCirqle,
        inviteToken: memberType === 'invited' ? inviteToken : null,
      };
    } catch (error) {
      this.logger.error('Invite to cirqle failed', error);
      throw error;
    }
  }

  /**
   * Add existing user to cirqle
   * @param {Object} params - Add user parameters
   * @returns {Promise<Object>} Updated cirqle
   */
  async addExistingUserToCirqle(params) {
    try {
      const { ownerId, userId, nickname, relationship } = params;

      validateUserId(ownerId);
      validateUserId(userId);

      // Get cirqle
      const cirqle = await this.cirqleRepo.getByOwner(ownerId);
      if (!cirqle) {
        throw new Error('Cirqle not found');
      }

      // Get user details
      const user = await this.userRepo.getProfile(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const memberId = `member_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

      const member = {
        memberId,
        userId,
        ownerUserId: ownerId,
        nickname: nickname || user.displayName,
        relationship,
        displayName: user.displayName,
        photoURL: user.photoURL,
        email: user.email,
        memberType: 'family',
        status: 'active',
        affinities: user.affinities,
      };

      const updatedCirqle = await this.cirqleRepo.addMember(cirqle.id, member);

      this.logger.info('Existing user added to cirqle', { cirqleId: cirqle.id, userId });

      return { success: true, cirqle: updatedCirqle };
    } catch (error) {
      this.logger.error('Add existing user failed', error);
      throw error;
    }
  }

  /**
   * Join cirqle with invite token
   * @param {Object} params - Join parameters
   * @returns {Promise<Object>} Updated cirqle
   */
  async joinCirqle(params) {
    try {
      const { inviteToken, userId } = params;

      validateUserId(userId);

      // Find cirqle by invite token
      const result = await this.cirqleRepo.findByInviteToken(inviteToken);
      if (!result) {
        throw new Error('Invalid invite token');
      }

      const { cirqle, member } = result;

      // Get user details
      const user = await this.userRepo.getProfile(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Link member to user account
      const updatedCirqle = await this.cirqleRepo.linkMemberToUser(cirqle.id, member.memberId, userId, {
        displayName: user.displayName,
        photoURL: user.photoURL,
      });

      this.logger.info('User joined cirqle', { cirqleId: cirqle.id, userId, memberId: member.memberId });

      return { success: true, cirqle: updatedCirqle };
    } catch (error) {
      this.logger.error('Join cirqle failed', error);
      throw error;
    }
  }

  /**
   * Get user's cirqles
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User cirqles
   */
  async getUserCirqles(userId) {
    try {
      validateUserId(userId);

      const cirqles = await this.cirqleRepo.getCirqlesForUser(userId);

      this.logger.info('Retrieved user cirqles', { userId, count: cirqles.length });

      return { success: true, cirqles };
    } catch (error) {
      this.logger.error('Get user cirqles failed', error);
      throw error;
    }
  }

  /**
   * Update member affinities
   * @param {Object} params - Update parameters
   * @returns {Promise<Object>} Updated cirqle
   */
  async updateMemberAffinities(params) {
    try {
      const { cirqleId, memberId, affinities } = params;

      const cirqle = await this.cirqleRepo.updateMemberAffinities(cirqleId, memberId, affinities);

      this.logger.info('Member affinities updated', { cirqleId, memberId });

      return { success: true, cirqle };
    } catch (error) {
      this.logger.error('Update member affinities failed', error);
      throw error;
    }
  }
}

module.exports = CirqleService;
