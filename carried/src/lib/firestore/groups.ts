/**
 * Groups Firestore Service
 * Carried - Motions carry, memory too
 *
 * CRUD operations for groups and clearing group data
 */

import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../../config/firebase';

/**
 * Delete all meetings for a group
 */
export async function deleteMeetingsByGroup(groupId: string): Promise<number> {
  try {
    const meetingsRef = collection(db, COLLECTIONS.MEETINGS);
    const q = query(meetingsRef, where('groupId', '==', groupId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return 0;

    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.delete(doc(db, COLLECTIONS.MEETINGS, docSnap.id));
    });
    await batch.commit();

    console.log(`CARRIED_DEBUG: Deleted ${snapshot.size} meetings for group ${groupId}`);
    return snapshot.size;
  } catch (error) {
    console.error('CARRIED_DEBUG: Error deleting meetings:', error);
    throw error;
  }
}

/**
 * Delete all segments for a group
 */
export async function deleteSegmentsByGroup(groupId: string): Promise<number> {
  try {
    const segmentsRef = collection(db, COLLECTIONS.SEGMENTS);
    const q = query(segmentsRef, where('groupId', '==', groupId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return 0;

    // Delete in batches of 500 (Firestore limit)
    const batches = [];
    let batch = writeBatch(db);
    let count = 0;

    for (const docSnap of snapshot.docs) {
      batch.delete(doc(db, COLLECTIONS.SEGMENTS, docSnap.id));
      count++;

      if (count % 500 === 0) {
        batches.push(batch.commit());
        batch = writeBatch(db);
      }
    }

    // Commit remaining
    if (count % 500 !== 0) {
      batches.push(batch.commit());
    }

    await Promise.all(batches);

    console.log(`CARRIED_DEBUG: Deleted ${snapshot.size} segments for group ${groupId}`);
    return snapshot.size;
  } catch (error) {
    console.error('CARRIED_DEBUG: Error deleting segments:', error);
    throw error;
  }
}

/**
 * Delete all motions for a group (legacy)
 */
export async function deleteMotionsByGroup(groupId: string): Promise<number> {
  try {
    const motionsRef = collection(db, COLLECTIONS.MOTIONS);
    const q = query(motionsRef, where('groupId', '==', groupId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return 0;

    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.delete(doc(db, COLLECTIONS.MOTIONS, docSnap.id));
    });
    await batch.commit();

    console.log(`CARRIED_DEBUG: Deleted ${snapshot.size} motions for group ${groupId}`);
    return snapshot.size;
  } catch (error) {
    console.error('CARRIED_DEBUG: Error deleting motions:', error);
    throw error;
  }
}

/**
 * Clear all data for a group (meetings, segments, motions)
 * Keeps the group itself intact
 */
export async function clearGroupData(groupId: string): Promise<{
  meetingsDeleted: number;
  segmentsDeleted: number;
  motionsDeleted: number;
}> {
  console.log(`CARRIED_DEBUG: Clearing all data for group ${groupId}`);

  // Delete in parallel
  const [meetingsDeleted, segmentsDeleted, motionsDeleted] = await Promise.all([
    deleteMeetingsByGroup(groupId),
    deleteSegmentsByGroup(groupId),
    deleteMotionsByGroup(groupId),
  ]);

  // Reset group counters
  try {
    await updateDoc(doc(db, COLLECTIONS.GROUPS, groupId), {
      meetingCount: 0,
      motionCount: 0,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('CARRIED_DEBUG: Could not reset group counters:', error);
  }

  console.log(`CARRIED_DEBUG: Cleared group ${groupId}: ${meetingsDeleted} meetings, ${segmentsDeleted} segments, ${motionsDeleted} motions`);

  return { meetingsDeleted, segmentsDeleted, motionsDeleted };
}

/**
 * Delete a group and all its data
 */
export async function deleteGroupCompletely(groupId: string): Promise<void> {
  // First clear all group data
  await clearGroupData(groupId);

  // Then delete the group itself
  await deleteDoc(doc(db, COLLECTIONS.GROUPS, groupId));

  console.log(`CARRIED_DEBUG: Deleted group ${groupId} completely`);
}
