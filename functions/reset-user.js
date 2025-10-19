/**
 * Quick reset script for specific user by UID
 */

const admin = require('firebase-admin');
const serviceAccount = require('../agentqu-platform-firebase-adminsdk-a0h0o-d21e8d9d41.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function resetUser(userId) {
  try {
    console.log(`🔍 Resetting onboarding for user: ${userId}`);

    const userRef = db.collection('users').doc(userId);

    // Remove languageCode to force re-onboarding
    await userRef.update({
      languageCode: admin.firestore.FieldValue.delete(),
    });

    console.log(`✅ Onboarding reset complete!`);
    console.log(`   Refresh the app to go through onboarding again`);
  } catch (error) {
    console.error(`❌ Error:`, error.message);
  }
}

const userId = 'umut0PrTd2TLJOxHgwrBbSxiBXb2';
resetUser(userId).then(() => process.exit(0));
