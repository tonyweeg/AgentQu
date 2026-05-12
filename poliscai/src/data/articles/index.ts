/**
 * Articles of the United States Constitution
 * V1.0 Original Text (1787)
 */

import { ARTICLE_1_SECTIONS } from './article-1';
import { ARTICLE_2_SECTIONS } from './article-2';
import { ARTICLE_3_SECTIONS } from './article-3';
import { ARTICLE_4_SECTIONS } from './article-4';
import { ARTICLE_5_SECTIONS } from './article-5';
import { ARTICLE_6_SECTIONS } from './article-6';
import { ARTICLE_7_SECTIONS } from './article-7';

export const ALL_ARTICLES = [
  ...ARTICLE_1_SECTIONS,
  ...ARTICLE_2_SECTIONS,
  ...ARTICLE_3_SECTIONS,
  ...ARTICLE_4_SECTIONS,
  ...ARTICLE_5_SECTIONS,
  ...ARTICLE_6_SECTIONS,
  ...ARTICLE_7_SECTIONS,
];

export const ARTICLE_METADATA = [
  { number: 1, title: 'The Legislative Branch', sectionCount: 10 },
  { number: 2, title: 'The Executive Branch', sectionCount: 4 },
  { number: 3, title: 'The Judicial Branch', sectionCount: 3 },
  { number: 4, title: 'The States', sectionCount: 4 },
  { number: 5, title: 'Amendment Process', sectionCount: 1 },
  { number: 6, title: 'Supremacy Clause', sectionCount: 1 },
  { number: 7, title: 'Ratification', sectionCount: 1 },
];

export {
  ARTICLE_1_SECTIONS,
  ARTICLE_2_SECTIONS,
  ARTICLE_3_SECTIONS,
  ARTICLE_4_SECTIONS,
  ARTICLE_5_SECTIONS,
  ARTICLE_6_SECTIONS,
  ARTICLE_7_SECTIONS,
};
