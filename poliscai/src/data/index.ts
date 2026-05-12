/**
 * PoliScai Constitution Data Package
 * V1.0 Original Text of the United States Constitution
 *
 * Contains:
 * - 7 Articles (24 sections total)
 * - 27 Amendments (1791-1992)
 * - 51 total constitutional clauses
 */

import { ALL_ARTICLES, ARTICLE_METADATA } from './articles';
import { ALL_AMENDMENTS, AMENDMENT_METADATA, BILL_OF_RIGHTS, RECONSTRUCTION_AMENDMENTS } from './amendments';

// Combined constitutional data
export const ALL_CLAUSES = [
  ...ALL_ARTICLES,
  ...ALL_AMENDMENTS,
];

// Statistics
export const CONSTITUTION_STATS = {
  totalClauses: ALL_CLAUSES.length,
  articles: ALL_ARTICLES.length,
  amendments: ALL_AMENDMENTS.length,
  originalRatification: 1787,
  latestAmendment: 1992,
  billOfRightsCount: 10,
  reconstructionAmendmentsCount: 3,
};

// Export everything
export {
  ALL_ARTICLES,
  ARTICLE_METADATA,
  ALL_AMENDMENTS,
  AMENDMENT_METADATA,
  BILL_OF_RIGHTS,
  RECONSTRUCTION_AMENDMENTS,
};

// Re-export individual articles
export * from './articles';
export * from './amendments';
