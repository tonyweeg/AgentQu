import { Timestamp } from 'firebase/firestore';

/**
 * AuditAction - Types of auditable actions
 */
export type AuditAction =
  | 'submission.created'
  | 'submission.updated'
  | 'submission.status_changed'
  | 'vote.cast'
  | 'vote.changed'
  | 'dispute.created'
  | 'dispute.approved'
  | 'dispute.rejected'
  | 'response.added'
  | 'clause.revised_text_proposed'
  | 'clause.revised_text_approved'
  | 'query.created';

/**
 * AuditLogEntry - Immutable record of system actions
 * Write once, never update or delete
 */
export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  actorId: string;
  actorDisplayName: string;
  targetId: string;                              // document being acted upon
  targetCollection: string;
  before?: Record<string, unknown>;              // snapshot before change
  after?: Record<string, unknown>;               // snapshot after change
  timestamp: Timestamp;                          // server timestamp — client cannot set this
  ipHash?: string;                               // hashed for privacy, retained for abuse review
}

/**
 * AuditableDocument - Base interface for documents that need audit trails
 */
export interface AuditableDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
