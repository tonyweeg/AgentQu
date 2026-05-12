/**
 * Votes Service
 * PoliScai - Democracy V2.0
 *
 * Firestore operations for community voting on submissions
 */

import {
  collection,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  Timestamp,
  runTransaction,
  arrayUnion,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../../config/firebase';
import { Vote } from '../../types/submission';

const APPROVAL_THRESHOLD = 0.75; // 75% approval required
const MIN_VOTES_FOR_APPROVAL = 10; // Minimum votes before approval can trigger
const VOTE_LOCK_HOURS = 24; // Hours before vote becomes permanent

/**
 * Cast a vote on a submission
 * Uses transaction to ensure atomic update of both vote and submission
 */
export async function castVote(
  userId: string,
  submissionId: string,
  value: 'up' | 'down'
): Promise<{ success: boolean; error?: string }> {
  const voteId = `${userId}_${submissionId}`;
  const voteRef = doc(db, COLLECTIONS.VOTES, voteId);
  const submissionRef = doc(db, COLLECTIONS.SUBMISSIONS, submissionId);

  try {
    await runTransaction(db, async (transaction) => {
      const voteDoc = await transaction.get(voteRef);
      const submissionDoc = await transaction.get(submissionRef);

      if (!submissionDoc.exists()) {
        throw new Error('Submission not found');
      }

      const submissionData = submissionDoc.data();

      // Check if user already voted
      if (voteDoc.exists()) {
        const existingVote = voteDoc.data() as Vote;

        // Check if vote is locked
        if (existingVote.locked) {
          throw new Error('Vote is locked and cannot be changed');
        }

        // Check if within 24-hour window
        const voteTime = existingVote.createdAt.toDate();
        const hoursSinceVote = (Date.now() - voteTime.getTime()) / (1000 * 60 * 60);

        if (hoursSinceVote >= VOTE_LOCK_HOURS) {
          // Lock the vote
          transaction.update(voteRef, { locked: true });
          throw new Error('Vote is now locked (24 hours passed)');
        }

        // Same vote - no change needed
        if (existingVote.value === value) {
          return;
        }

        // Update vote value
        transaction.update(voteRef, {
          value,
          updatedAt: Timestamp.now(),
        });

        // Update submission vote counts (swap)
        const upDelta = value === 'up' ? 1 : -1;
        const downDelta = value === 'down' ? 1 : -1;

        const newUp = (submissionData.votes?.up || 0) + upDelta;
        const newDown = (submissionData.votes?.down || 0) + downDelta;
        const newTotal = newUp + newDown;
        const newRatio = newTotal > 0 ? newUp / newTotal : 0;

        transaction.update(submissionRef, {
          'votes.up': newUp,
          'votes.down': newDown,
          'votes.total': newTotal,
          'votes.ratio': newRatio,
        });
      } else {
        // New vote
        const newVote: Vote = {
          id: voteId,
          userId,
          submissionId,
          value,
          createdAt: Timestamp.now(),
          locked: false,
        };

        transaction.set(voteRef, newVote);

        // Update submission vote counts
        const upIncrement = value === 'up' ? 1 : 0;
        const downIncrement = value === 'down' ? 1 : 0;

        const newUp = (submissionData.votes?.up || 0) + upIncrement;
        const newDown = (submissionData.votes?.down || 0) + downIncrement;
        const newTotal = newUp + newDown;
        const newRatio = newTotal > 0 ? newUp / newTotal : 0;

        transaction.update(submissionRef, {
          'votes.up': newUp,
          'votes.down': newDown,
          'votes.total': newTotal,
          'votes.ratio': newRatio,
          'votes.voterIds': arrayUnion(userId),
        });

        // Check for approval threshold
        if (newTotal >= MIN_VOTES_FOR_APPROVAL && newRatio >= APPROVAL_THRESHOLD) {
          // Auto-approve
          transaction.update(submissionRef, {
            status: 'approved',
            isCanon: true,
            approvedAt: Timestamp.now(),
            approvedVoteCount: newTotal,
            approvedVoteRatio: newRatio,
            statusHistory: arrayUnion({
              from: submissionData.status,
              to: 'approved',
              at: Timestamp.now(),
              triggeredBy: 'vote_threshold',
              voteSnapshot: {
                up: newUp,
                down: newDown,
                ratio: newRatio,
              },
            }),
          });
        } else if (submissionData.status === 'submitted') {
          // Move to in_review after first vote
          transaction.update(submissionRef, {
            status: 'in_review',
            statusHistory: arrayUnion({
              from: 'submitted',
              to: 'in_review',
              at: Timestamp.now(),
              triggeredBy: 'system',
            }),
          });
        }
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('POLISCAI_DEBUG: Error casting vote:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's vote on a submission
 */
export async function getUserVote(
  userId: string,
  submissionId: string
): Promise<Vote | null> {
  const voteId = `${userId}_${submissionId}`;
  const voteRef = doc(db, COLLECTIONS.VOTES, voteId);
  const snapshot = await getDoc(voteRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as Vote;
}

/**
 * Check if user has voted on a submission
 */
export async function hasUserVoted(
  userId: string,
  submissionId: string
): Promise<boolean> {
  const vote = await getUserVote(userId, submissionId);
  return vote !== null;
}

/**
 * Get all votes for a submission
 */
export async function getVotesForSubmission(submissionId: string): Promise<Vote[]> {
  const q = query(
    collection(db, COLLECTIONS.VOTES),
    where('submissionId', '==', submissionId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Vote);
}

/**
 * Get voting statistics for a submission
 */
export async function getVoteStats(submissionId: string): Promise<{
  up: number;
  down: number;
  total: number;
  ratio: number;
  meetsThreshold: boolean;
  votesNeeded: number;
}> {
  const submissionRef = doc(db, COLLECTIONS.SUBMISSIONS, submissionId);
  const snapshot = await getDoc(submissionRef);

  if (!snapshot.exists()) {
    return {
      up: 0,
      down: 0,
      total: 0,
      ratio: 0,
      meetsThreshold: false,
      votesNeeded: MIN_VOTES_FOR_APPROVAL,
    };
  }

  const data = snapshot.data();
  const votes = data.votes || { up: 0, down: 0, total: 0, ratio: 0 };

  const meetsThreshold = votes.total >= MIN_VOTES_FOR_APPROVAL && votes.ratio >= APPROVAL_THRESHOLD;
  const votesNeeded = Math.max(0, MIN_VOTES_FOR_APPROVAL - votes.total);

  return {
    ...votes,
    meetsThreshold,
    votesNeeded,
  };
}

export { APPROVAL_THRESHOLD, MIN_VOTES_FOR_APPROVAL };
