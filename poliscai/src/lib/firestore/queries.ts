/**
 * Queries Service
 * PoliScai - Democracy V2.0
 *
 * Firestore operations for constitutional queries
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
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../../config/firebase';
import { QueryResponse } from '../ai/gemini';

export interface ConstitutionalQuery {
  id: string;
  queryText: string;
  verdict: QueryResponse['verdict'];
  analysis: string;
  shadowNotes: string[];
  keyReferences: string[];
  rawResponse: string;
  userId?: string;
  userDisplayName?: string;
  createdAt: Timestamp;
  isPublic: boolean;
}

/**
 * Save a query and its response
 */
export async function saveQuery(data: {
  queryText: string;
  response: QueryResponse;
  userId?: string;
  userDisplayName?: string;
  isPublic?: boolean;
}): Promise<string> {
  const queryData: Omit<ConstitutionalQuery, 'id'> = {
    queryText: data.queryText,
    verdict: data.response.verdict,
    analysis: data.response.analysis,
    shadowNotes: data.response.shadowNotes,
    keyReferences: data.response.keyReferences,
    rawResponse: data.response.rawResponse,
    userId: data.userId,
    userDisplayName: data.userDisplayName,
    createdAt: Timestamp.now(),
    isPublic: data.isPublic ?? true,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.QUERIES), queryData);
  return docRef.id;
}

/**
 * Get recent public queries
 */
export async function getRecentQueries(limitCount: number = 10): Promise<ConstitutionalQuery[]> {
  const q = query(
    collection(db, COLLECTIONS.QUERIES),
    where('isPublic', '==', true),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ConstitutionalQuery[];
}

/**
 * Get a query by ID
 */
export async function getQuery(id: string): Promise<ConstitutionalQuery | null> {
  const docRef = doc(db, COLLECTIONS.QUERIES, id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as ConstitutionalQuery;
}

/**
 * Get queries by user
 */
export async function getUserQueries(userId: string): Promise<ConstitutionalQuery[]> {
  const q = query(
    collection(db, COLLECTIONS.QUERIES),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ConstitutionalQuery[];
}
