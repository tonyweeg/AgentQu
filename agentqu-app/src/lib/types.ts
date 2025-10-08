export interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface Activity {
  id: string;
  activityId?: string; // New backend format
  name: string;
  type: 'cache' | 'volunteer' | 'hike' | 'venue' | 'event' | 'permanent';
  description?: string;

  // Location (supports both old and new formats)
  lat: number;
  lng: number;
  location?: {
    lat: number;
    lng: number;
    geohash?: string;
    address?: string;
    city?: string;
    state?: string;
  };
  address?: string;
  city?: string;
  state?: string;
  distance?: number; // miles from user

  // Categories
  categories: string[];
  primaryCategory: string;

  // Accessibility
  accessibility?: {
    wheelchairAccessible: boolean;
    mobilityLevel?: 'easy' | 'moderate' | 'difficult';
    serviceAnimalFriendly?: boolean;
  };

  // Time
  openNow?: boolean;
  duration?: number; // minutes
  hoursToday?: {
    open: string;
    close: string;
  };

  // Cost
  cost: {
    free: boolean;
    price?: number;
    priceLevel?: number; // 1-4
  };

  // Quality
  rating?: number;
  reviewCount?: number;

  // Scoring
  score?: number;
  baseScore?: number;
  affinityScore?: number;
  scoreBreakdown?: {
    distance: number;
    time: number;
    cost: number;
    accessibility: number;
    quality: number;
  };

  // Media
  images?: string[];
  website?: string;
}

export interface DiscoveryFilters {
  categories?: string[];
  maxDistance?: number; // miles
  maxDuration?: number; // minutes
  requiresAccessible?: boolean;
  freeOnly?: boolean;
}

export interface DiscoveryResult {
  activities: Activity[];
  metadata: {
    totalFound: number;
    queryTimeMs: number;
    userLocation: Location;
  };
}

export interface UserPreferences {
  maxDistance: number;
  favoriteCategories: string[];
  accessibilityNeeds?: {
    requiresWheelchair?: boolean;
    mobilityLevel?: 'easy' | 'moderate' | 'difficult';
  };
}
