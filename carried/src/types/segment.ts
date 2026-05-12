/**
 * Meeting Segment Types
 * Carried - Motions carry, memory too
 *
 * Segments represent different parts of meeting minutes:
 * motions, discussions, reports, announcements, etc.
 */

import { Timestamp } from 'firebase/firestore';
import { MotionOutcome } from './group';
import { VoteCount } from './motion';

export type SegmentType =
  | 'motion'           // Formal motion with vote
  | 'discussion'       // Debate, Q&A, deliberation
  | 'report'           // Committee report, treasurer report, staff report
  | 'announcement'     // Upcoming events, deadlines, news
  | 'public_comment'   // Citizen input, public testimony
  | 'action_item'      // Assigned task, follow-up item
  | 'election'         // Officer elections, appointments
  | 'presentation'     // Guest speaker, informational presentation
  | 'procedural'       // Call to order, adjournment, roll call
  | 'other';           // Uncategorized content

export interface Segment {
  id: string;
  groupId: string;
  meetingId: string;
  type: SegmentType;

  // Content
  title: string;                // Brief title/summary
  content: string;              // Full text of the segment
  context?: string;             // Surrounding context if needed

  // Motion-specific fields (only for type === 'motion')
  outcome?: MotionOutcome;
  voteCount?: VoteCount;
  movedBy?: string;
  secondedBy?: string;
  yeaVoters?: string[];       // Names of people who voted yes
  nayVoters?: string[];       // Names of people who voted no
  abstainVoters?: string[];   // Names of people who abstained

  // Action item fields (only for type === 'action_item')
  assignedTo?: string;
  dueDate?: string;
  status?: 'pending' | 'completed' | 'cancelled';

  // AI-generated
  embedding: number[];          // Vector embedding for semantic search
  tags: string[];               // Topic tags
  confidence: number;           // Extraction confidence (0-1)
  order: number;                // Order within meeting

  // Metadata
  extractedAt: Timestamp;
  createdAt: Timestamp;
}

export interface SegmentMatch {
  segmentId: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: Timestamp;
  groupId: string;
  groupName: string;
  score: number;                // Similarity score (0-1)
  segment: Segment;
}

export interface ExtractedSegment {
  type: SegmentType;
  title: string;
  content: string;
  context?: string;
  // Motion-specific
  outcome?: MotionOutcome;
  voteCount?: VoteCount;
  movedBy?: string;
  secondedBy?: string;
  yeaVoters?: string[];
  nayVoters?: string[];
  abstainVoters?: string[];
  // Action item specific
  assignedTo?: string;
  dueDate?: string;
  // Common
  tags: string[];
  confidence: number;
  order: number;
}

// Segment type metadata for UI
export const SEGMENT_TYPE_INFO: Record<SegmentType, { label: string; icon: string; color: string }> = {
  motion: { label: 'Motion', icon: 'Vote', color: 'blue' },
  discussion: { label: 'Discussion', icon: 'MessageSquare', color: 'purple' },
  report: { label: 'Report', icon: 'FileText', color: 'green' },
  announcement: { label: 'Announcement', icon: 'Megaphone', color: 'orange' },
  public_comment: { label: 'Public Comment', icon: 'Users', color: 'cyan' },
  action_item: { label: 'Action Item', icon: 'CheckSquare', color: 'red' },
  election: { label: 'Election', icon: 'Award', color: 'amber' },
  presentation: { label: 'Presentation', icon: 'Presentation', color: 'indigo' },
  procedural: { label: 'Procedural', icon: 'Gavel', color: 'gray' },
  other: { label: 'Other', icon: 'MoreHorizontal', color: 'slate' },
};
