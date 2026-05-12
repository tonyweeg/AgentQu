/**
 * Motion Types
 * Carried - Motions carry, memory too
 */

import { Timestamp } from 'firebase/firestore';
import { MotionOutcome as MotionOutcomeType } from './group';

// Re-export for convenience
export type MotionOutcome = MotionOutcomeType;

export interface VoteCount {
  yea: number;
  nay: number;
  abstain: number;
}

export interface Motion {
  id: string;
  groupId: string;
  meetingId: string;

  // Content
  text: string;                 // The motion text
  context: string;              // Surrounding discussion context

  // Outcome
  outcome: MotionOutcome;
  voteCount?: VoteCount;
  movedBy?: string;
  secondedBy?: string;

  // AI-generated
  embedding: number[];          // Vector embedding for semantic search
  tags: string[];               // Topic tags
  confidence: number;           // AI extraction confidence (0-1)

  // Metadata
  extractedAt: Timestamp;
  createdAt: Timestamp;
}

export interface MotionMatch {
  motionId: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: Timestamp;
  groupId: string;
  groupName: string;
  score: number;                // Similarity score (0-1)
  motion: Motion;
}

export interface ExtractedMotion {
  text: string;
  context: string;
  outcome: MotionOutcome;
  movedBy?: string;
  secondedBy?: string;
  voteCount?: VoteCount;
  tags: string[];
  confidence: number;
}
