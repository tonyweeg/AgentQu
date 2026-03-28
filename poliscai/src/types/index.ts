// PoliScai Type Definitions
// Democracy V2.0 | Political Science + AI

// Clause types
export type {
  ConstitutionalClause,
  RevisedTextStatus,
  ClauseType,
  ClauseCategory,
} from './clause';

// Submission types
export type {
  AmbiguityType,
  SubmissionStatus,
  StatusChange,
  VoteRecord,
  Dispute,
  CommunityResponse,
  AmbiguitySubmission,
  Vote,
} from './submission';

// Query types
export type {
  VerdictLevel,
  SegmentType,
  FlagSeverity,
  UDHRStatus,
  AnnotatedSegment,
  AnalysisFlag,
  UDHRCheck,
  ConstitutionalityResult,
  ConstitutionalityQuery,
  GeminiAnalysisResponse,
} from './query';

// Audit types
export type {
  AuditAction,
  AuditLogEntry,
  AuditableDocument,
} from './audit';

// User types
export type {
  UserRole,
  UserProfile,
  ContributorStatus,
} from './user';
