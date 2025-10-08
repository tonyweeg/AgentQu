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

// ============================================
// THERE-THEN: Trip Planning Types
// ============================================

export interface TripPlan {
  tripId: string;
  createdBy: string; // userId
  createdAt: number; // timestamp
  updatedAt: number; // timestamp

  // Location & Time
  destination: {
    location: { lat: number; lng: number };
    address: string;
    city: string;
    state: string;
    country: string;
  };

  dates: {
    startDate: number; // timestamp
    endDate: number; // timestamp
    timezone: string;
  };

  // Participants (for collaboration)
  participants: TripParticipant[];

  // Itinerary (schedule of activities)
  itinerary: DayItinerary[];

  // Environmental Data (cached for trip dates)
  environmental?: {
    weather: WeatherForecast[];
    airQuality: AirQualityForecast[];
    pollen: PollenForecast[];
    solar: SolarForecast[];
    cachedAt: number;
  };

  // Suggested Activities (AI-generated based on group affinities)
  suggestedActivities: SuggestedActivity[];

  // Sharing & Collaboration
  sharing: {
    isPublic: boolean;
    shareLink?: string;
    sharePassword?: string;
    allowComments: boolean;
  };

  // Status
  status: 'draft' | 'published' | 'archived';

  // Metadata
  metadata: {
    totalParticipants: number;
    totalActivities: number;
    estimatedCost?: number;
    tags?: string[];
  };
}

export interface TripParticipant {
  userId?: string; // Optional if family member hasn't registered yet
  familyMemberId?: string; // Reference to FamilyMember if applicable
  nickname: string; // Display name for the participant
  relationship?: string; // "daughter", "spouse", etc.
  role: 'owner' | 'editor' | 'viewer';
  invitedAt: number;
  joinedAt?: number;
  affinities?: Record<string, number>; // Category -> rating
}

export interface DayItinerary {
  dayIndex: number; // 0 = first day, 1 = second day, etc.
  timeSlots: TimeSlot[];
}

export interface TimeSlot {
  startTime: string; // "09:00"
  endTime: string; // "11:00"
  activityId: string;
  notes?: string;
  status: 'planned' | 'confirmed' | 'completed' | 'cancelled';
}

export interface SuggestedActivity {
  activityId: string;
  affinityScore: number; // Average across all participants
  bestTimeSlots: string[]; // ["Day 1: 9am-11am", "Day 2: 2pm-4pm"]
  environmentalFit: {
    weatherRating: number; // 0-100
    airQualityOk: boolean;
    pollenWarning: boolean;
  };
}

// Environmental Data Interfaces
export interface WeatherForecast {
  date: string; // "2025-10-15"
  hourly: HourlyWeather[];
}

export interface HourlyWeather {
  time: string; // "09:00"
  temp: number;
  feelsLike: number;
  condition: string; // "sunny", "cloudy", "rainy"
  precipitation: number;
  windSpeed: number;
  humidity: number;
  uv: number;
}

export interface AirQualityForecast {
  date: string;
  hourly: HourlyAirQuality[];
}

export interface HourlyAirQuality {
  time: string;
  aqi: number; // 0-500
  category: 'Good' | 'Moderate' | 'Unhealthy for Sensitive' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  pollutants: {
    pm25: number;
    pm10: number;
    o3: number;
    no2: number;
  };
}

export interface PollenForecast {
  date: string;
  daily: {
    grass: number; // 0-5 scale
    tree: number;
    weed: number;
    mold: number;
    overall: 'Low' | 'Moderate' | 'High' | 'Very High';
  };
}

export interface SolarForecast {
  date: string;
  sunrise: string;
  sunset: string;
  goldenHour: { morning: string; evening: string };
  uvIndex: {
    time: string;
    value: number;
  }[];
}

// ============================================
// FAMILY GRAPH: Family Member Management
// ============================================

export interface FamilyMember {
  familyMemberId: string;
  userId?: string; // Optional - only if they've registered

  // Relationship to the owner
  ownerUserId: string; // Who owns this family member record
  relationship: string; // "daughter", "son", "spouse", "parent", "friend", etc.
  nickname: string; // Display name (e.g., "Emma", "Dad", "Sarah")

  // Contact info (for invites if they haven't registered)
  email?: string;
  phone?: string;

  // Their preferences (for trip planning)
  affinities?: Record<string, number>;

  // Status
  status: 'invited' | 'registered' | 'active';
  invitedAt?: number;
  joinedAt?: number;

  // Metadata
  avatarUrl?: string;
  age?: number;
  allergies?: string[]; // For pollen/food warnings
  notes?: string;
}

export interface FamilyGraph {
  ownerId: string; // Primary account holder
  members: FamilyMember[];
  createdAt: number;
  updatedAt: number;
}
