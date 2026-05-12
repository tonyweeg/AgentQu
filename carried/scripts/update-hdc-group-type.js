/**
 * Script to update Historic District Commission group type
 * Run this in browser console while logged in at https://carried-app.web.app
 */

async function updateHDCGroupType() {
  const { collection, getDocs, doc, updateDoc, query, where } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

  // Get Firestore instance from window
  const db = window.__FIREBASE_DB__;
  if (!db) {
    console.error('Firebase DB not found. Make sure you are on the Carried app.');
    return;
  }

  // Find groups with "Historic District" in the name
  const groupsRef = collection(db, 'groups');
  const snapshot = await getDocs(groupsRef);

  let updated = 0;

  for (const docSnap of snapshot.docs) {
    const group = docSnap.data();
    const name = group.name || '';

    // Check if this is the Historic District Commission group
    if (name.toLowerCase().includes('historic district')) {
      console.log(`Found: ${name} (ID: ${docSnap.id})`);
      console.log(`  Current type: ${group.type}`);

      if (group.type !== 'historic_district') {
        await updateDoc(doc(db, 'groups', docSnap.id), {
          type: 'historic_district'
        });
        console.log(`  ✅ Updated to: historic_district`);
        updated++;
      } else {
        console.log(`  Already correct type`);
      }
    }
  }

  console.log(`\nDone! Updated ${updated} group(s).`);
}

// Run it
updateHDCGroupType();
