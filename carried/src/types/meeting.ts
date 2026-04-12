/**
 * Meeting Types
 * Carried - Motions carry, memory too
 */

import { Timestamp } from 'firebase/firestore';

export type MeetingSource = 'paste' | 'pdf' | 'docx' | 'txt';

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Meeting {
  id: string;
  groupId: string;
  title: string;
  date?: Timestamp;              // Legacy - use meetingDate
  meetingDate?: Timestamp;       // The actual meeting date
  rawMinutes: string;            // Original uploaded text
  source: MeetingSource;
  fileUrl?: string;              // If uploaded as file
  fileName?: string;             // Original filename

  // Processing state
  processingStatus: ProcessingStatus;
  processedAt?: Timestamp;
  processingError?: string;

  // Extracted data
  motionCount: number;           // Legacy - for backwards compatibility
  segmentCount?: number;         // Total extracted segments
  segmentIds?: string[];         // IDs of extracted segments
  attendees?: string[];

  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MeetingCreateInput {
  groupId: string;
  title: string;
  date: Date;
  rawMinutes: string;
  source: MeetingSource;
  fileName?: string;
}
