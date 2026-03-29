/**
 * Submissions Service
 * PoliScai - Democracy V2.0
 *
 * Firestore operations for ambiguity submissions
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../../config/firebase';
import { AmbiguitySubmission, AmbiguityType, SubmissionStatus } from '../../types/submission';

/**
 * Create a new ambiguity submission
 */
export async function createSubmission(data: {
  clauseId: string;
  clauseRef: string;
  flaggedText: string;
  flaggedTextStart: number;
  flaggedTextEnd: number;
  type: AmbiguityType;
  shadowDescription: string;
  citation?: string;
  eraOperative?: string;
  communityNote?: string;
  userId: string;
  userDisplayName: string;
}): Promise<string> {
  // Build submission data, excluding undefined optional fields (Firestore doesn't accept undefined)
  const submissionData: Record<string, any> = {
    clauseId: data.clauseId,
    clauseRef: data.clauseRef,
    flaggedText: data.flaggedText,
    flaggedTextStart: data.flaggedTextStart,
    flaggedTextEnd: data.flaggedTextEnd,
    type: data.type,
    shadowDescription: data.shadowDescription,
    submittedBy: data.userId,
    submittedByDisplayName: data.userDisplayName,
    submittedAt: Timestamp.now(),
    status: 'submitted' as SubmissionStatus,
    statusHistory: [
      {
        from: 'draft' as SubmissionStatus,
        to: 'submitted' as SubmissionStatus,
        at: Timestamp.now(),
        triggeredBy: 'system',
      },
    ],
    votes: {
      up: 0,
      down: 0,
      total: 0,
      ratio: 0,
      voterIds: [],
    },
    disputes: [],
    responses: [],
    isCanon: false,
  };

  // Only add optional fields if they have values
  if (data.citation) submissionData.citation = data.citation;
  if (data.eraOperative) submissionData.eraOperative = data.eraOperative;
  if (data.communityNote) submissionData.communityNote = data.communityNote;

  const docRef = await addDoc(collection(db, COLLECTIONS.SUBMISSIONS), submissionData);
  return docRef.id;
}

/**
 * Get submissions for a specific clause
 */
export async function getSubmissionsForClause(clauseId: string): Promise<AmbiguitySubmission[]> {
  const q = query(
    collection(db, COLLECTIONS.SUBMISSIONS),
    where('clauseId', '==', clauseId),
    orderBy('submittedAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AmbiguitySubmission[];
}

/**
 * Get approved (canon) submissions for a clause
 */
export async function getCanonSubmissions(clauseId: string): Promise<AmbiguitySubmission[]> {
  const q = query(
    collection(db, COLLECTIONS.SUBMISSIONS),
    where('clauseId', '==', clauseId),
    where('isCanon', '==', true),
    orderBy('approvedAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AmbiguitySubmission[];
}

/**
 * Get a single submission by ID
 */
export async function getSubmission(id: string): Promise<AmbiguitySubmission | null> {
  const docRef = doc(db, COLLECTIONS.SUBMISSIONS, id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as AmbiguitySubmission;
}

/**
 * Get submissions by user
 */
export async function getUserSubmissions(userId: string): Promise<AmbiguitySubmission[]> {
  const q = query(
    collection(db, COLLECTIONS.SUBMISSIONS),
    where('submittedBy', '==', userId),
    orderBy('submittedAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AmbiguitySubmission[];
}

/**
 * Get pending submissions (in_review status)
 */
export async function getPendingSubmissions(): Promise<AmbiguitySubmission[]> {
  const q = query(
    collection(db, COLLECTIONS.SUBMISSIONS),
    where('status', '==', 'in_review'),
    orderBy('submittedAt', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AmbiguitySubmission[];
}
