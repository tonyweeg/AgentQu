const admin = require('firebase-admin');

// Initialize without service account (uses Application Default Credentials)
admin.initializeApp({
  projectId: 'agentqu'
});

const db = admin.firestore();

async function clearCache() {
  console.log('🗑️ Clearing activityCache collection...');
  
  const snapshot = await db.collection('activityCache').get();
  console.log(`📊 Found ${snapshot.size} cache documents`);
  
  if (snapshot.size === 0) {
    console.log('ℹ️  No cache documents to clear');
    process.exit(0);
  }
  
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    console.log(`  Deleting: ${doc.id}`);
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log('✅ Cache cleared! Fresh API calls will now trigger reverse geocoding.');
  process.exit(0);
}

clearCache().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
