import { Timestamp } from 'firebase/firestore';

/**
 * UserRole - Permission levels in PoliScai
 */
export type UserRole =
  | 'anonymous'           // Can read, limited queries
  | 'citizen'             // Authenticated via Google SSO
  | 'verified_contributor' // Earned status — min 5 approved submissions
  | 'editorial_council'   // Future — Phase 6
  | 'admin';              // System admin

/**
 * UserSettings - User preferences
 */
export interface UserSettings {
  emailNotifications: boolean;
  // Future settings
  darkMode?: boolean;
}

/**
 * UserProfile - Authenticated user profile
 */
export interface UserProfile {
  id: string;                                    // Firebase Auth UID
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;

  // Statistics
  submissionCount: number;
  approvedSubmissionCount: number;
  votesCast: number;
  disputesSubmitted: number;
  queriesRun: number;

  // Settings/Preferences
  settings?: UserSettings;

  // Status
  isSuspended: boolean;
  suspendedAt?: Timestamp;
  suspendedReason?: string;

  // Timestamps
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}

/**
 * ContributorStatus - Requirements for verified contributor status
 */
export interface ContributorStatus {
  isVerified: boolean;
  approvedCount: number;
  requiredCount: number;                         // Currently 5
  progressPercent: number;
}
