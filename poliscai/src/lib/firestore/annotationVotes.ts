/**
 * Annotation Votes Service
 * PoliScai - Democracy V2.0
 *
 * Simple voting system for shadow annotations
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../../config/firebase';

interface AnnotationVote {
  annotationId: string;
  upVotes: number;
  downVotes: number;
  voters: Record<string, 'up' | 'down'>; // userId -> vote
  updatedAt: Timestamp;
}

/**
 * Get or create annotation vote document
 */
export async function getAnnotationVotes(annotationId: string): Promise<AnnotationVote | null> {
  const docRef = doc(db, COLLECTIONS.ANNOTATION_VOTES || 'annotationVotes', annotationId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as AnnotationVote;
}

/**
 * Subscribe to real-time vote updates
 */
export function subscribeToAnnotationVotes(
  annotationId: string,
  callback: (votes: AnnotationVote | null) => void
): () => void {
  const docRef = doc(db, COLLECTIONS.ANNOTATION_VOTES || 'annotationVotes', annotationId);

  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as AnnotationVote);
    } else {
      callback(null);
    }
  });
}

/**
 * Cast a vote on an annotation
 */
export async function voteOnAnnotation(
  annotationId: string,
  userId: string,
  value: 'up' | 'down'
): Promise<{ success: boolean; error?: string }> {
  const docRef = doc(db, COLLECTIONS.ANNOTATION_VOTES || 'annotationVotes', annotationId);

  try {
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      // Create new vote document
      await setDoc(docRef, {
        annotationId,
        upVotes: value === 'up' ? 1 : 0,
        downVotes: value === 'down' ? 1 : 0,
        voters: { [userId]: value },
        updatedAt: Timestamp.now(),
      });
    } else {
      const data = snapshot.data() as AnnotationVote;
      const previousVote = data.voters?.[userId];

      if (previousVote === value) {
        // Same vote - remove it (toggle off)
        await updateDoc(docRef, {
          [value === 'up' ? 'upVotes' : 'downVotes']: increment(-1),
          [`voters.${userId}`]: null,
          updatedAt: Timestamp.now(),
        });
      } else if (previousVote) {
        // Changing vote
        await updateDoc(docRef, {
          upVotes: increment(value === 'up' ? 1 : -1),
          downVotes: increment(value === 'down' ? 1 : -1),
          [`voters.${userId}`]: value,
          updatedAt: Timestamp.now(),
        });
      } else {
        // New vote
        await updateDoc(docRef, {
          [value === 'up' ? 'upVotes' : 'downVotes']: increment(1),
          [`voters.${userId}`]: value,
          updatedAt: Timestamp.now(),
        });
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('POLISCAI_DEBUG: Error voting on annotation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's vote on an annotation
 */
export async function getUserAnnotationVote(
  annotationId: string,
  userId: string
): Promise<'up' | 'down' | null> {
  const votes = await getAnnotationVotes(annotationId);
  return votes?.voters?.[userId] || null;
}

/**
 * Calculate approval percentage
 */
export function calculateApproval(upVotes: number, downVotes: number): number {
  const total = upVotes + downVotes;
  if (total === 0) return 0;
  return Math.round((upVotes / total) * 100);
}
