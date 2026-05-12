import { Timestamp } from 'firebase/firestore';

/**
 * VerdictLevel - Overall constitutional assessment
 */
export type VerdictLevel = 'constitutional' | 'partially_unconstitutional' | 'unconstitutional';

/**
 * SegmentType - Classification of text segments in analysis
 */
export type SegmentType = 'conflict' | 'warning' | 'compliant' | 'neutral';

/**
 * FlagSeverity - Severity levels for analysis flags
 */
export type FlagSeverity = 'conflict' | 'warning' | 'informational';

/**
 * UDHRStatus - Compliance status with UN Declaration
 */
export type UDHRStatus = 'compliant' | 'conflict' | 'partial';

/**
 * AnnotatedSegment - A segment of analyzed text with classification
 */
export interface AnnotatedSegment {
  text: string;
  type: SegmentType;
  clauseRef?: string;                            // which V2.0 clause this relates to
  explanation: string;
}

/**
 * AnalysisFlag - Individual flag raised during analysis
 */
export interface AnalysisFlag {
  severity: FlagSeverity;
  description: string;
  clauseRef: string;
  udhrRef?: string;
}

/**
 * UDHRCheck - Cross-reference with UN Universal Declaration of Human Rights
 */
export interface UDHRCheck {
  articleNumber: number;                         // e.g. 21
  articleTitle: string;                          // e.g. "Right to vote"
  status: UDHRStatus;
  explanation: string;
  alignmentScore: number;                        // 0–100
}

/**
 * ConstitutionalityResult - The AI analysis result
 */
export interface ConstitutionalityResult {
  verdictSummary: string;
  alignmentScore: number;                        // 0–100
  verdictLevel: VerdictLevel;
  annotatedText: AnnotatedSegment[];
  flags: AnalysisFlag[];
  udhrCrossReference: UDHRCheck[];
  reasoning: string;                             // full chain of thought — always shown
  missingV2Coverage: string[];                   // clauses the query touches with no V2.0 yet
  modelVersion: string;                          // Gemini version used
  generatedAt: Timestamp;
}

/**
 * ConstitutionalityQuery - A user's query for constitutional analysis
 */
export interface ConstitutionalityQuery {
  id: string;
  userId?: string;                               // null if anonymous
  queryText?: string;                            // typed question
  uploadedDocumentUrl?: string;                  // Firebase Storage ref
  uploadedDocumentName?: string;

  result: ConstitutionalityResult;
  createdAt: Timestamp;
}

/**
 * GeminiAnalysisResponse - Raw response from Gemini API
 * Maps to ConstitutionalityResult after processing
 */
export interface GeminiAnalysisResponse {
  verdictSummary: string;
  verdictLevel: VerdictLevel;
  alignmentScore: number;
  annotatedSegments: {
    text: string;
    type: SegmentType;
    clauseRef: string;
    explanation: string;
  }[];
  flags: {
    severity: FlagSeverity;
    description: string;
    clauseRef: string;
    udhrRef?: string;
  }[];
  udhrChecks: {
    articleNumber: number;
    articleTitle: string;
    status: UDHRStatus;
    explanation: string;
    alignmentScore: number;
  }[];
  reasoning: string;
  missingV2Coverage: string[];
}
