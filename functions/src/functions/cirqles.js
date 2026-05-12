/**
 * Cirqle (Family/Friends Circle) Cloud Functions
 *
 * Thin HTTP handlers that delegate to CirqleService
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { CirqleService } = require('../services');
const { createLogger } = require('../utils/logger');

const logger = createLogger('CIRQLE_FUNCTIONS');
const cirqleService = new CirqleService();

/**
 * Create cirqle for user
 */
exports.createCirqle = onCall(async (request) => {
  try {
    const { ownerId, ownerName, cirqleName } = request.data;

    if (!ownerId || !ownerName) {
      throw new HttpsError('invalid-argument', 'Owner ID and owner name are required');
    }

    logger.info('createCirqle called', { ownerId, ownerName });

    const result = await cirqleService.createCirqle({
      ownerId,
      ownerName,
      cirqleName,
    });

    return result;
  } catch (error) {
    logger.error('createCirqle failed', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Invite member to cirqle
 */
exports.inviteToCirqle = onCall(async (request) => {
  try {
    const { ownerId, nickname, relationship, email, memberType } = request.data;

    if (!ownerId || !nickname || !relationship) {
      throw new HttpsError('invalid-argument', 'Owner ID, nickname, and relationship are required');
    }

    logger.info('inviteToCirqle called', { ownerId, nickname, memberType });

    const result = await cirqleService.inviteToCirqle({
      ownerId,
      nickname,
      relationship,
      email,
      memberType,
    });

    return result;
  } catch (error) {
    logger.error('inviteToCirqle failed', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Add existing user to cirqle
 */
exports.addExistingUserToCirqle = onCall(async (request) => {
  try {
    const { ownerId, userId, nickname, relationship } = request.data;

    if (!ownerId || !userId || !nickname || !relationship) {
      throw new HttpsError(
        'invalid-argument',
        'Owner ID, user ID, nickname, and relationship are required'
      );
    }

    logger.info('addExistingUserToCirqle called', { ownerId, userId });

    const result = await cirqleService.addExistingUserToCirqle({
      ownerId,
      userId,
      nickname,
      relationship,
    });

    return result;
  } catch (error) {
    logger.error('addExistingUserToCirqle failed', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Join cirqle with invite token
 */
exports.joinCirqle = onCall(async (request) => {
  try {
    const { inviteToken, userId } = request.data;

    if (!inviteToken || !userId) {
      throw new HttpsError('invalid-argument', 'Invite token and user ID are required');
    }

    logger.info('joinCirqle called', { userId });

    const result = await cirqleService.joinCirqle({
      inviteToken,
      userId,
    });

    return result;
  } catch (error) {
    logger.error('joinCirqle failed', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Get user's cirqles
 */
exports.getUserCirqles = onCall(async (request) => {
  try {
    const { userId } = request.data;

    if (!userId) {
      throw new HttpsError('invalid-argument', 'User ID is required');
    }

    logger.info('getUserCirqles called', { userId });

    const result = await cirqleService.getUserCirqles(userId);

    return result;
  } catch (error) {
    logger.error('getUserCirqles failed', error);
    throw new HttpsError('internal', error.message);
  }
});
