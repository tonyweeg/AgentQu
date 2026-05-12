/**
 * Script to add video URLs to Berlin MD meeting records
 * Run this in browser console while logged in as the group owner
 *
 * Usage: Copy and paste into browser console at https://carried-app.web.app
 */

// Video URL mappings - title substring to video URL
const VIDEO_MAPPINGS = [
  // Planning Commission
  { titleMatch: '4.8.26 PC', videoUrl: 'https://www.facebook.com/townofberlinmd/videos/1221089259840584' },
  { titleMatch: '4.8.26 Planning Commission', videoUrl: 'https://www.facebook.com/townofberlinmd/videos/26388485410804969' },
  { titleMatch: '4.6.26 Closed Session', videoUrl: 'https://www.facebook.com/townofberlinmd/videos/1267486098824738' },

  // Historic District Commission
  { titleMatch: '4.1.26 Historic District', videoUrl: 'https://www.facebook.com/townofberlinmd/videos/2096359977822160' },

  // Mayor & Council
  { titleMatch: '03.30.26 Work Session', videoUrl: 'https://www.facebook.com/townofberlinmd/videos/1587328539231424' },
  { titleMatch: '3.30.26 Work Session', videoUrl: 'https://www.facebook.com/townofberlinmd/videos/1587328539231424' },
  { titleMatch: '03.23.26 Regular Session', videoUrl: 'https://www.facebook.com/townofberlinmd/videos/953541420460903' },
  { titleMatch: '3.23.26 Regular Session', videoUrl: 'https://www.facebook.com/townofberlinmd/videos/953541420460903' },
  { titleMatch: '03.23.26 Closed Session', videoUrl: 'https://www.facebook.com/townofberlinmd/videos/1658927605432382' },
  { titleMatch: '3.23.26 Closed Session', videoUrl: 'https://www.facebook.com/townofberlinmd/videos/1658927605432382' },
];

// This code runs in browser with Firebase already initialized
async function addVideoUrls() {
  const { collection, getDocs, doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

  // Get Firestore instance from window (already initialized by the app)
  const db = window.__FIREBASE_DB__ || (await import('/src/config/firebase.ts')).db;

  const meetingsRef = collection(db, 'meetings');
  const snapshot = await getDocs(meetingsRef);

  let updated = 0;

  for (const docSnap of snapshot.docs) {
    const meeting = docSnap.data();
    const title = meeting.title || '';

    // Find matching video URL
    const mapping = VIDEO_MAPPINGS.find(m =>
      title.toLowerCase().includes(m.titleMatch.toLowerCase())
    );

    if (mapping && !meeting.videoUrl) {
      console.log(`Updating: ${title} -> ${mapping.videoUrl}`);
      await updateDoc(doc(db, 'meetings', docSnap.id), {
        videoUrl: mapping.videoUrl
      });
      updated++;
    }
  }

  console.log(`Done! Updated ${updated} meetings with video URLs.`);
}

// Run it
addVideoUrls();
