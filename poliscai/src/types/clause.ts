import { Timestamp } from 'firebase/firestore';

/**
 * ConstitutionalClause - Represents an Article, Section, or Amendment
 * V1.0 text is immutable once seeded
 * V2.0 text is human-authored and community-approved
 */
export interface ConstitutionalClause {
  id: string;                                    // e.g. "article-1-section-2"
  articleSection: string;                        // e.g. "Article I, Section 2"
  title: string;                                 // e.g. "House of Representatives"
  version: 'v1_original' | 'v2_revised';
  originalText: string;                          // V1.0 — immutable once seeded
  revisedText?: string;                          // V2.0 — human authored, community approved
  revisedTextStatus?: RevisedTextStatus;
  revisedTextApprovedAt?: Timestamp;
  revisedTextApprovedVotes?: number;
  shadowNoteIds: string[];                       // refs to approved AmbiguitySubmissions
  pendingFlagIds: string[];                      // refs to in-review submissions
  order: number;                                 // for document ordering
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type RevisedTextStatus = 'draft' | 'proposed' | 'approved';

/**
 * ClauseType - For organizing navigation
 */
export type ClauseType = 'article' | 'amendment';

/**
 * ClauseCategory - For grouping related clauses
 */
export interface ClauseCategory {
  type: ClauseType;
  number: number;                                // Article 1-7 or Amendment 1-27
  title: string;
  sections?: number;                             // Articles have sections
}
