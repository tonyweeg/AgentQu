/**
 * Annotation Votes Service
 * PoliScai - Democracy V2.0
 *
 * Simple voting system for shadow annotations
 * Annotations become "canon" when they reach 75% approval with 3+ votes
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

// Approval thresholds
export const CANON_THRESHOLD = 0.75; // 75% approval needed
export const MIN_VOTES_FOR_CANON = 3; // Minimum votes before canon status can trigger

interface AnnotationVote {
  annotationId: string;
  upVotes: number;
  downVotes: number;
  voters: Record<string, 'up' | 'down'>; // userId -> vote
  updatedAt: Timestamp;
  // Canon status
  isCanon?: boolean;
  canonAt?: Timestamp;
  canonApprovalPercent?: number;
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
 * Automatically promotes to canon when threshold is met
 */
export async function voteOnAnnotation(
  annotationId: string,
  userId: string,
  value: 'up' | 'down'
): Promise<{ success: boolean; error?: string; becameCanon?: boolean }> {
  const docRef = doc(db, COLLECTIONS.ANNOTATION_VOTES || 'annotationVotes', annotationId);

  try {
    const snapshot = await getDoc(docRef);
    let newUpVotes = 0;
    let newDownVotes = 0;

    if (!snapshot.exists()) {
      // Create new vote document
      newUpVotes = value === 'up' ? 1 : 0;
      newDownVotes = value === 'down' ? 1 : 0;

      await setDoc(docRef, {
        annotationId,
        upVotes: newUpVotes,
        downVotes: newDownVotes,
        voters: { [userId]: value },
        updatedAt: Timestamp.now(),
        isCanon: false,
      });
    } else {
      const data = snapshot.data() as AnnotationVote;
      const previousVote = data.voters?.[userId];

      // Calculate new vote counts
      newUpVotes = data.upVotes || 0;
      newDownVotes = data.downVotes || 0;

      if (previousVote === value) {
        // Same vote - remove it (toggle off)
        if (value === 'up') newUpVotes--;
        else newDownVotes--;

        await updateDoc(docRef, {
          [value === 'up' ? 'upVotes' : 'downVotes']: increment(-1),
          [`voters.${userId}`]: null,
          updatedAt: Timestamp.now(),
        });
      } else if (previousVote) {
        // Changing vote
        if (value === 'up') {
          newUpVotes++;
          newDownVotes--;
        } else {
          newUpVotes--;
          newDownVotes++;
        }

        await updateDoc(docRef, {
          upVotes: increment(value === 'up' ? 1 : -1),
          downVotes: increment(value === 'down' ? 1 : -1),
          [`voters.${userId}`]: value,
          updatedAt: Timestamp.now(),
        });
      } else {
        // New vote
        if (value === 'up') newUpVotes++;
        else newDownVotes++;

        await updateDoc(docRef, {
          [value === 'up' ? 'upVotes' : 'downVotes']: increment(1),
          [`voters.${userId}`]: value,
          updatedAt: Timestamp.now(),
        });
      }
    }

    // Check for canon threshold
    const totalVotes = newUpVotes + newDownVotes;
    const approvalPercent = totalVotes > 0 ? newUpVotes / totalVotes : 0;
    const meetsCanonThreshold = totalVotes >= MIN_VOTES_FOR_CANON && approvalPercent >= CANON_THRESHOLD;

    // Update canon status if threshold met (and not already canon)
    const currentData = (await getDoc(docRef)).data() as AnnotationVote;
    if (meetsCanonThreshold && !currentData?.isCanon) {
      await updateDoc(docRef, {
        isCanon: true,
        canonAt: Timestamp.now(),
        canonApprovalPercent: Math.round(approvalPercent * 100),
      });
      console.log('POLISCAI_DEBUG: Annotation promoted to canon!', annotationId);
      return { success: true, becameCanon: true };
    }

    // Remove canon status if it drops below threshold
    if (!meetsCanonThreshold && currentData?.isCanon) {
      await updateDoc(docRef, {
        isCanon: false,
        canonAt: null,
        canonApprovalPercent: null,
      });
      console.log('POLISCAI_DEBUG: Annotation removed from canon', annotationId);
    }

    return { success: true, becameCanon: false };
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
