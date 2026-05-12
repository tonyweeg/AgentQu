/**
 * Query Types
 * Carried - Motions carry, memory too
 */

import { Timestamp } from 'firebase/firestore';
import { MotionMatch } from './motion';

export interface Query {
  id: string;
  groupId?: string;             // Optional - search within specific group
  userId: string;
  question: string;
  embedding: number[];          // Query embedding
  results: MotionMatch[];
  resultCount: number;
  createdAt: Timestamp;
}

export interface SearchInput {
  question: string;
  groupId?: string;             // Optional filter
  limit?: number;               // Max results (default 10)
}

export interface SearchResult {
  query: string;
  results: MotionMatch[];
  totalMatches: number;
  searchTime: number;           // ms
}
