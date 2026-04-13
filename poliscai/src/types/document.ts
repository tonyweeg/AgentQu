/**
 * Document Types
 * The Open Document Project - Powered by PoliScAI
 *
 * Supports multiple founding documents: constitutions, charters, ordinances
 */

export interface DocumentInfo {
  id: string;
  name: string;
  shortName: string;
  description: string;
  jurisdiction: string;
  type: 'constitution' | 'charter' | 'ordinance' | 'bylaw' | 'other';
  dateAdopted?: string;
  dateEffective?: string;
  sourceUrl?: string;
  imageUrl?: string;
  sectionCount: number;
  submissionCount: number;
  isActive: boolean;
}

export interface DocumentSection {
  id: string;
  documentId: string;
  articleSection: string;
  title: string;
  order: number;
  originalText: string;
  parentId?: string; // For nested sections (chapters > articles > sections)
  level: number; // 0 = top level, 1 = chapter, 2 = article, 3 = section, etc.
}

// Available documents
export const DOCUMENTS: DocumentInfo[] = [
  {
    id: 'us-constitution',
    name: 'The Constitution of the United States',
    shortName: 'US Constitution',
    description: 'The supreme law of the United States, establishing the framework of the federal government and fundamental rights of citizens.',
    jurisdiction: 'United States of America',
    type: 'constitution',
    dateAdopted: '1787-09-17',
    dateEffective: '1789-03-04',
    sourceUrl: 'https://constitution.congress.gov/',
    imageUrl: '/images/us-constitution.jpg',
    sectionCount: 34, // 7 articles + 27 amendments
    submissionCount: 0,
    isActive: true,
  },
  {
    id: 'berlin-md-ordinances',
    name: 'Town of Berlin, Maryland Code of Ordinances',
    shortName: 'Berlin MD Code',
    description: 'The municipal code governing the Town of Berlin, Maryland, including local laws, regulations, and administrative procedures.',
    jurisdiction: 'Berlin, Maryland',
    type: 'ordinance',
    sourceUrl: 'https://library.municode.com/md/berlin/codes/code_of_ordinances',
    imageUrl: '/images/berlin-md.jpg',
    sectionCount: 0, // Will be populated after scraping
    submissionCount: 0,
    isActive: true,
  },
];
