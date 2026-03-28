import { Timestamp } from 'firebase/firestore';

/**
 * AmbiguityType - Categories of shadows/biases in V1.0 text
 */
export type AmbiguityType =
  | 'gender_assumption'
  | 'racial_exclusion'
  | 'economic_exclusion'
  | 'citizenship_definition'
  | 'deferred_to_state'
  | 'pronoun_language_bias'
  | 'corporate_personhood'
  | 'religious_assumption'
  | 'age_exclusion'
  | 'other';

/**
 * SubmissionStatus - Lifecycle states for ambiguity submissions
 */
export type SubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'disputed'           // approved but has an active dispute in review
  | 'dispute_resolved';  // dispute reviewed and resolved — both remain on record

/**
 * StatusChange - Immutable record of status transitions
 */
export interface StatusChange {
  from: SubmissionStatus;
  to: SubmissionStatus;
  at: Timestamp;
  triggeredBy: 'system' | 'vote_threshold' | 'admin';
  voteSnapshot?: {
    up: number;
    down: number;
    ratio: number;
  };
}

/**
 * VoteRecord - Tracking votes on a submission
 */
export interface VoteRecord {
  up: number;
  down: number;
  total: number;
  ratio: number;                                 // up / total
  voterIds: string[];                            // to enforce one vote per user
}

/**
 * Dispute - Counter-argument to an approved shadow note
 * Disputes are appended, never replace the original
 */
export interface Dispute {
  id: string;
  submissionId: string;                          // parent AmbiguitySubmission
  disputeText: string;                           // the counter-argument (max 500 chars)
  citation?: string;
  submittedBy: string;
  submittedByDisplayName: string;
  submittedAt: Timestamp;                        // immutable
  status: 'in_review' | 'approved' | 'rejected';
  votes: {
    up: number;
    down: number;
    ratio: number;
  };
  approvedAt?: Timestamp;
}

/**
 * CommunityResponse - Community notes from other users
 */
export interface CommunityResponse {
  id: string;
  text: string;                                  // max 300 chars
  submittedBy: string;
  submittedByDisplayName: string;
  submittedAt: Timestamp;
  upvotes: number;
}

/**
 * AmbiguitySubmission - A user-submitted identification of a shadow
 */
export interface AmbiguitySubmission {
  id: string;
  clauseId: string;                              // ref to ConstitutionalClause
  clauseRef: string;                             // human-readable e.g. "Article I, Section 2"
  flaggedText: string;                           // exact selected passage from V1.0
  flaggedTextStart: number;                      // character offset in originalText
  flaggedTextEnd: number;                        // character offset in originalText

  type: AmbiguityType;
  shadowDescription: string;                     // what this text assumes or excludes (max 500 chars)
  citation?: string;                             // historical source or legal reference
  eraOperative?: string;                         // e.g. "1787–1870"

  communityNote?: string;                        // submitter's own context note

  submittedBy: string;                           // Firebase Auth UID
  submittedByDisplayName: string;                // public attribution
  submittedAt: Timestamp;                        // immutable — set on creation, never changed

  status: SubmissionStatus;
  statusHistory: StatusChange[];                 // append-only log of every status transition

  votes: VoteRecord;

  disputes: Dispute[];                           // append-only — never removed
  responses: CommunityResponse[];                // community notes from other users

  approvedAt?: Timestamp;
  approvedVoteCount?: number;
  approvedVoteRatio?: number;

  rejectedAt?: Timestamp;
  rejectionReason?: string;

  isCanon: boolean;                              // true only when status === 'approved'
}

/**
 * Vote - Individual vote record (stored in separate collection)
 */
export interface Vote {
  id: string;                                    // format: {userId}_{submissionId}
  userId: string;
  submissionId: string;
  value: 'up' | 'down';
  createdAt: Timestamp;
  updatedAt?: Timestamp;                         // if vote was changed within 24 hours
  locked: boolean;                               // true after 24 hours
}
