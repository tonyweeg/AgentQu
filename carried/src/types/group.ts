/**
 * Group Types
 * Carried - Motions carry, memory too
 */

import { Timestamp } from 'firebase/firestore';

export type GroupType =
  // Government & Civic
  | 'city_council'      // City/Municipal Council
  | 'town_council'      // Town Council
  | 'county_board'      // County Board/Commission
  | 'school_board'      // School Board/Board of Education
  | 'planning_commission' // Planning/Zoning Commission
  | 'historic_district'  // Historic District Commission
  | 'parks_rec'         // Parks & Recreation Board
  | 'library_board'     // Library Board
  | 'fire_district'     // Fire District Board
  | 'water_district'    // Water/Sewer/Utility District
  // Community & Residential
  | 'hoa'               // HOA/Condo Association
  | 'coop'              // Housing Cooperative
  | 'neighborhood'      // Neighborhood Association
  // Organizations
  | 'nonprofit'         // Nonprofit Board
  | 'church'            // Church/Religious Organization
  | 'pta'               // PTA/PTO
  | 'union'             // Union/Labor Organization
  | 'club'              // Club/Social Organization
  // Business & Professional
  | 'corporate_board'   // Corporate Board
  | 'committee'         // Committee/Task Force
  | 'team'              // Work Team
  // Personal
  | 'family'            // Family Council
  | 'other';            // Other

export type GroupVisibility = 'private' | 'link' | 'public';

export interface GroupSettings {
  allowPublicView: boolean;
  requireApproval: boolean;
  defaultMotionOutcome: MotionOutcome;
}

export const VISIBILITY_INFO: Record<GroupVisibility, { label: string; description: string; icon: string }> = {
  private: {
    label: 'Private',
    description: 'Only members can view',
    icon: 'Lock',
  },
  link: {
    label: 'Share by Link',
    description: 'Anyone with the link can view',
    icon: 'Link',
  },
  public: {
    label: 'Public',
    description: 'Anyone can discover and view',
    icon: 'Globe',
  },
};

export interface Group {
  id: string;
  name: string;
  type: GroupType;
  description?: string;
  imageUrl?: string;
  visibility: GroupVisibility;
  shareCode?: string; // For 'link' visibility - unique shareable code
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  memberCount: number;
  meetingCount: number;
  motionCount: number;
  settings: GroupSettings;
}

export interface GroupMember {
  userId: string;
  groupId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Timestamp;
  displayName: string;
  email: string;
}

export type MotionOutcome = 'carried' | 'defeated' | 'tabled' | 'withdrawn' | 'unknown';

// Group type categories for organized display
export const GROUP_TYPE_CATEGORIES = {
  'Government & Civic': ['city_council', 'town_council', 'county_board', 'school_board', 'planning_commission', 'historic_district', 'parks_rec', 'library_board', 'fire_district', 'water_district'],
  'Community & Residential': ['hoa', 'coop', 'neighborhood'],
  'Organizations': ['nonprofit', 'church', 'pta', 'union', 'club'],
  'Business & Professional': ['corporate_board', 'committee', 'team'],
  'Personal': ['family', 'other'],
} as const;

// Group type metadata for UI
export const GROUP_TYPE_INFO: Record<GroupType, { label: string; icon: string; color: string }> = {
  // Government & Civic
  city_council: { label: 'City Council', icon: 'Landmark', color: 'blue' },
  town_council: { label: 'Town Council', icon: 'Landmark', color: 'blue' },
  county_board: { label: 'County Board', icon: 'MapPin', color: 'indigo' },
  school_board: { label: 'School Board', icon: 'GraduationCap', color: 'yellow' },
  planning_commission: { label: 'Planning Commission', icon: 'Map', color: 'teal' },
  historic_district: { label: 'Historic District Commission', icon: 'Landmark', color: 'amber' },
  parks_rec: { label: 'Parks & Recreation', icon: 'Trees', color: 'green' },
  library_board: { label: 'Library Board', icon: 'BookOpen', color: 'amber' },
  fire_district: { label: 'Fire District', icon: 'Flame', color: 'red' },
  water_district: { label: 'Water/Utility District', icon: 'Droplets', color: 'cyan' },
  // Community & Residential
  hoa: { label: 'HOA/Condo Association', icon: 'Building2', color: 'slate' },
  coop: { label: 'Housing Cooperative', icon: 'Home', color: 'stone' },
  neighborhood: { label: 'Neighborhood Association', icon: 'Users', color: 'emerald' },
  // Organizations
  nonprofit: { label: 'Nonprofit Board', icon: 'Heart', color: 'pink' },
  church: { label: 'Church/Religious Org', icon: 'Church', color: 'purple' },
  pta: { label: 'PTA/PTO', icon: 'School', color: 'orange' },
  union: { label: 'Union/Labor Org', icon: 'Handshake', color: 'rose' },
  club: { label: 'Club/Social Org', icon: 'PartyPopper', color: 'fuchsia' },
  // Business & Professional
  corporate_board: { label: 'Corporate Board', icon: 'Briefcase', color: 'zinc' },
  committee: { label: 'Committee', icon: 'UserCheck', color: 'violet' },
  team: { label: 'Team', icon: 'Layers', color: 'sky' },
  // Personal
  family: { label: 'Family Council', icon: 'Heart', color: 'rose' },
  other: { label: 'Other', icon: 'Folder', color: 'gray' },
};
