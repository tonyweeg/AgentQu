/**
 * Firebase Configuration Module
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Firebase initialization only
 * - Dependency Inversion: Exports interface, not implementation
 */

const admin = require('firebase-admin');

let initialized = false;

/**
 * Initialize Firebase Admin SDK
 * @returns {admin.app.App} Firebase app instance
 */
function initializeFirebase() {
  if (!initialized) {
    admin.initializeApp();
    initialized = true;
  }
  return admin.app();
}

/**
 * Get Firestore database instance
 * @returns {admin.firestore.Firestore}
 */
function getFirestore() {
  if (!initialized) {
    initializeFirebase();
  }
  return admin.firestore();
}

/**
 * Get Firebase Auth instance
 * @returns {admin.auth.Auth}
 */
function getAuth() {
  if (!initialized) {
    initializeFirebase();
  }
  return admin.auth();
}

module.exports = {
  initializeFirebase,
  getFirestore,
  getAuth,
  admin,
};
