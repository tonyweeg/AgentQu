/**
 * Segments Firestore Service
 * Carried - Motions carry, memory too
 *
 * CRUD operations for meeting segments
 */

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../../config/firebase';
import { ExtractedSegment, Segment } from '../../types/segment';

/**
 * Remove undefined values from an object (Firestore doesn't accept undefined)
 */
function removeUndefinedValues<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Save extracted segments to Firestore
 */
export async function saveSegments(
  groupId: string,
  meetingId: string,
  extractedSegments: ExtractedSegment[]
): Promise<{ saved: number; failed: number; segmentIds: string[] }> {
  const segmentIds: string[] = [];
  let saved = 0;
  let failed = 0;

  for (const extracted of extractedSegments) {
    try {
      // Create segment document - filter out undefined values (Firestore rejects them)
      const rawSegmentData = {
        groupId,
        meetingId,
        type: extracted.type,
        title: extracted.title,
        content: extracted.content,
        context: extracted.context || null,
        // Motion-specific
        outcome: extracted.outcome,
        voteCount: extracted.voteCount,
        movedBy: extracted.movedBy,
        secondedBy: extracted.secondedBy,
        yeaVoters: extracted.yeaVoters || [],
        nayVoters: extracted.nayVoters || [],
        abstainVoters: extracted.abstainVoters || [],
        // Action item specific
        assignedTo: extracted.assignedTo,
        dueDate: extracted.dueDate,
        status: extracted.type === 'action_item' ? 'pending' : undefined,
        // Search fields
        tags: extracted.tags || [],
        confidence: extracted.confidence ?? 0.5,
        order: extracted.order ?? 0,
        // Searchable text (lowercase for case-insensitive search)
        searchText: `${extracted.title} ${extracted.content} ${(extracted.tags || []).join(' ')}`.toLowerCase(),
        // Metadata
        extractedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      };

      // Remove all undefined values before saving
      const segmentData = removeUndefinedValues(rawSegmentData);

      const docRef = await addDoc(collection(db, COLLECTIONS.SEGMENTS), segmentData);
      segmentIds.push(docRef.id);
      saved++;

      console.log(`CARRIED_DEBUG: Saved segment ${docRef.id} (${extracted.type}): ${extracted.title}`);
    } catch (error) {
      console.error('CARRIED_DEBUG: Failed to save segment:', error);
      failed++;
    }
  }

  return { saved, failed, segmentIds };
}

/**
 * Get segments for a meeting
 */
export async function getSegmentsByMeeting(meetingId: string): Promise<Segment[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.SEGMENTS),
      where('meetingId', '==', meetingId)
    );
    const snapshot = await getDocs(q);

    const segments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Segment[];

    // Sort by order
    return segments.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('CARRIED_DEBUG: Error fetching segments:', error);
    return [];
  }
}

/**
 * Get segments for a group
 */
export async function getSegmentsByGroup(groupId: string): Promise<Segment[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.SEGMENTS),
      where('groupId', '==', groupId)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Segment[];
  } catch (error) {
    console.error('CARRIED_DEBUG: Error fetching segments:', error);
    return [];
  }
}

/**
 * Delete all segments for a meeting
 */
export async function deleteSegmentsByMeeting(meetingId: string): Promise<number> {
  try {
    const q = query(
      collection(db, COLLECTIONS.SEGMENTS),
      where('meetingId', '==', meetingId)
    );
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.delete(doc(db, COLLECTIONS.SEGMENTS, docSnap.id));
    });

    await batch.commit();
    console.log(`CARRIED_DEBUG: Deleted ${snapshot.docs.length} segments for meeting ${meetingId}`);
    return snapshot.docs.length;
  } catch (error) {
    console.error('CARRIED_DEBUG: Error deleting segments:', error);
    return 0;
  }
}

/**
 * Update action item status
 */
export async function updateActionItemStatus(
  segmentId: string,
  status: 'pending' | 'completed' | 'cancelled'
): Promise<boolean> {
  try {
    await updateDoc(doc(db, COLLECTIONS.SEGMENTS, segmentId), {
      status,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('CARRIED_DEBUG: Error updating action item status:', error);
    return false;
  }
}

/**
 * Delete all segments for a group (cleanup orphans)
 */
export async function deleteSegmentsByGroup(groupId: string): Promise<number> {
  try {
    const q = query(
      collection(db, COLLECTIONS.SEGMENTS),
      where('groupId', '==', groupId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.docs.length === 0) {
      return 0;
    }

    // Firestore batch limit is 500, so chunk if needed
    const chunks = [];
    for (let i = 0; i < snapshot.docs.length; i += 500) {
      chunks.push(snapshot.docs.slice(i, i + 500));
    }

    let totalDeleted = 0;
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach((docSnap) => {
        batch.delete(doc(db, COLLECTIONS.SEGMENTS, docSnap.id));
      });
      await batch.commit();
      totalDeleted += chunk.length;
    }

    console.log(`CARRIED_DEBUG: Deleted ${totalDeleted} orphaned segments for group ${groupId}`);
    return totalDeleted;
  } catch (error) {
    console.error('CARRIED_DEBUG: Error deleting orphaned segments:', error);
    return 0;
  }
}

/**
 * Delete orphaned segments (segments whose meeting no longer exists)
 */
export async function deleteOrphanedSegments(
  groupId: string,
  validMeetingIds: string[]
): Promise<number> {
  try {
    const allSegments = await getSegmentsByGroup(groupId);
    const validIds = new Set(validMeetingIds);

    // Find orphaned segments
    const orphanedSegments = allSegments.filter(s => !validIds.has(s.meetingId));

    if (orphanedSegments.length === 0) {
      return 0;
    }

    // Delete orphans in batches
    const chunks = [];
    for (let i = 0; i < orphanedSegments.length; i += 500) {
      chunks.push(orphanedSegments.slice(i, i + 500));
    }

    let totalDeleted = 0;
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach((segment) => {
        batch.delete(doc(db, COLLECTIONS.SEGMENTS, segment.id));
      });
      await batch.commit();
      totalDeleted += chunk.length;
    }

    console.log(`CARRIED_DEBUG: Deleted ${totalDeleted} orphaned segments for group ${groupId}`);
    return totalDeleted;
  } catch (error) {
    console.error('CARRIED_DEBUG: Error deleting orphaned segments:', error);
    return 0;
  }
}
