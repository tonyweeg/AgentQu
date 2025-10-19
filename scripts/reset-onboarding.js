/**
 * Reset Onboarding Script
 *
 * Resets user onboarding status by removing languageCode field
 * This forces users through the new I18N onboarding flow
 *
 * Usage:
 *   node scripts/reset-onboarding.js <email>
 *   node scripts/reset-onboarding.js all
 */

const admin = require('firebase-admin');
const serviceAccount = require('../agentqu-platform-firebase-adminsdk-a0h0o-d21e8d9d41.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function resetUserOnboarding(email) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);

    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    const userId = userRecord.uid;

    console.log(`✅ Found user: ${userId}`);

    // Remove languageCode and optionally onboarded flag
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      languageCode: admin.firestore.FieldValue.delete(),
      // Uncomment below to also reset affinity selections
      // onboarded: false,
    });

    console.log(`✅ Reset onboarding for ${email}`);
    console.log(`   User will be prompted for language selection on next login`);
  } catch (error) {
    console.error(`❌ Error resetting onboarding:`, error.message);
  }
}

async function resetAllUsers() {
  try {
    console.log('🔍 Fetching all users...');

    const usersSnapshot = await db.collection('users').get();
    const userCount = usersSnapshot.size;

    console.log(`📊 Found ${userCount} users`);

    let resetCount = 0;
    const batch = db.batch();

    usersSnapshot.forEach((doc) => {
      const userRef = db.collection('users').doc(doc.id);
      batch.update(userRef, {
        languageCode: admin.firestore.FieldValue.delete(),
      });
      resetCount++;
    });

    await batch.commit();

    console.log(`✅ Reset onboarding for ${resetCount} users`);
    console.log(`   All users will be prompted for language selection on next login`);
  } catch (error) {
    console.error(`❌ Error resetting all users:`, error.message);
  }
}

// Main execution
const arg = process.argv[2];

if (!arg) {
  console.error('❌ Usage: node scripts/reset-onboarding.js <email|all>');
  process.exit(1);
}

if (arg.toLowerCase() === 'all') {
  resetAllUsers().then(() => process.exit(0));
} else {
  resetUserOnboarding(arg).then(() => process.exit(0));
}
