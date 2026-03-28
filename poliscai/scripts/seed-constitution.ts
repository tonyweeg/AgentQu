/**
 * Seed Constitution Data to Firestore
 * PoliScai - Democracy V2.0
 *
 * Usage: npx ts-node scripts/seed-constitution.ts
 */

import * as admin from 'firebase-admin';
import { ALL_CLAUSES, CONSTITUTION_STATS } from '../src/data';

// Initialize Firebase Admin (requires service account)
const serviceAccount = require('../../agentqu-a031bdfc04c8.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'agentqu-platform',
});

const db = admin.firestore();

async function seedConstitution() {
  console.log('🏛️  PoliScai Constitution Seeder');
  console.log('================================');
  console.log(`Total clauses to seed: ${CONSTITUTION_STATS.totalClauses}`);
  console.log(`Articles: ${CONSTITUTION_STATS.articles}`);
  console.log(`Amendments: ${CONSTITUTION_STATS.amendments}`);
  console.log('');

  const batch = db.batch();
  const clausesRef = db.collection('clauses');

  for (const clause of ALL_CLAUSES) {
    const docRef = clausesRef.doc(clause.id);

    const clauseData = {
      id: clause.id,
      articleSection: clause.articleSection,
      title: clause.title,
      order: clause.order,
      version: 'v1_original',
      originalText: clause.originalText,
      // V2.0 fields - to be populated by community
      revisedText: null,
      revisedTextStatus: null,
      revisedTextApprovedAt: null,
      revisedTextApprovedVotes: null,
      // Shadow notes - to be populated by submissions
      shadowNoteIds: [],
      pendingFlagIds: [],
      // Timestamps
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    batch.set(docRef, clauseData);
    console.log(`  ✓ ${clause.articleSection}: ${clause.title}`);
  }

  console.log('');
  console.log('Committing batch write...');

  await batch.commit();

  console.log('');
  console.log('✅ Constitution seeded successfully!');
  console.log(`   ${ALL_CLAUSES.length} clauses written to Firestore`);
}

// Run the seeder
seedConstitution()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
