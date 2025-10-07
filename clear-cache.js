const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

async function clearCache() {
  const caches = await db.collection('activity_cache').get();
  console.log(`Found ${caches.size} cache entries`);
  
  const batch = db.batch();
  caches.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log('✅ All caches cleared!');
  process.exit(0);
}

clearCache().catch(console.error);
