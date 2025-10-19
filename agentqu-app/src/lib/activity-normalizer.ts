/**
 * Activity Data Normalizer
 *
 * Normalizes activity data from different sources (Google Places, Custom Search, Ticketmaster)
 * into a consistent format. Handles legacy formats and ensures type safety.
 *
 * @module activity-normalizer
 */

import { Activity } from './types';
import { createLogger } from '../utils/logger';

const logger = createLogger('ACTIVITY_NORMALIZER');

/**
 * Normalized Activity Interface
 *
 * This is the canonical activity structure. All activities should conform to this format
 * after normalization, regardless of their source.
 */
export interface NormalizedActivity {
  // Identity
  id: string;
  name: string;
  type: 'cache' | 'volunteer' | 'hike' | 'venue' | 'event' | 'permanent';

  // Location (single source of truth)
  location: {
    lat: number;
    lng: number;
    geohash?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };

  // Distance from user (calculated)
  distance?: number; // miles

  // Categories and classification
  categories: string[];
  primaryCategory: string;
  musicGenres?: string[]; // For music events
  restaurantGenre?: string; // For restaurants

  // Accessibility
  accessibility?: {
    wheelchairAccessible: boolean;
    mobilityLevel?: 'easy' | 'moderate' | 'difficult';
    serviceAnimalFriendly?: boolean;
  };

  // Time and availability
  openNow?: boolean;
  duration?: number; // minutes
  hours?: {
    open: string;
    close: string;
  };

  // Event-specific timing
  event?: {
    startDate: Date;
    endDate?: Date;
    venue?: string;
    venueAddress?: string;
    organizer?: string;
    capacity?: number;
  };

  // Cost
  cost: {
    free: boolean;
    price?: number;
    priceLevel?: number; // 1-4
    priceRange?: string; // "$", "$$", "$$$", "$$$$"
  };

  // Quality indicators
  rating?: number; // 0-5
  reviewCount?: number;

  // Scoring
  score?: number;
  scoreBreakdown?: {
    base: number;
    distance: number;
    rating: number;
    openNow: number;
    free: number;
    popularity: number;
    affinity: number;
    total: number;
  };

  // Content
  description?: string;
  images?: string[];
  website?: string;

  // Metadata
  source: 'google_places' | 'custom_search' | 'ticketmaster' | 'manual';
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Normalize legacy activity format to NormalizedActivity
 *
 * Handles activities from backend that may have duplicate or inconsistent fields
 *
 * @param activity - Activity from API (may be in legacy format)
 * @returns Normalized activity
 */
export function normalizeActivity(activity: Activity): NormalizedActivity {
  // Extract location from either root level or location object
  const location = {
    lat: activity.location?.lat ?? activity.lat,
    lng: activity.location?.lng ?? activity.lng,
    geohash: activity.location?.geohash,
    address: activity.location?.address ?? activity.address,
    city: activity.location?.city ?? activity.city,
    state: activity.location?.state ?? activity.state,
    country: (activity.location as any)?.country,
  };

  // Extract description from details or root
  const description = activity.details?.description ?? activity.description;

  // Extract images
  const images: string[] = [];
  if (activity.images) {
    images.push(...activity.images);
  }
  if (activity.details?.imageUrl && !images.includes(activity.details.imageUrl)) {
    images.push(activity.details.imageUrl);
  }

  // Extract website
  const website = activity.details?.website ?? activity.website;

  // Normalize cost
  const cost = {
    free: activity.cost?.free ?? false,
    price: activity.cost?.price,
    priceLevel: activity.cost?.priceLevel ?? activity.details?.priceLevel,
    priceRange: activity.details?.priceRange,
  };

  // Normalize event details if present
  let event: NormalizedActivity['event'];
  if (activity.type === 'event' && activity.details) {
    event = {
      startDate: activity.details.eventDate ? new Date(activity.details.eventDate) : new Date(),
      endDate: activity.details.eventEndDate ? new Date(activity.details.eventEndDate) : undefined,
      venue: activity.details.venue,
      venueAddress: activity.details.venueAddress,
      organizer: activity.details.organizerName,
      capacity: activity.details.capacity,
    };
  }

  // Extract music genres (can be at root or in details)
  const musicGenres = activity.musicGenres ?? activity.details?.musicGenres;

  // Normalize score breakdown
  let scoreBreakdown: NormalizedActivity['scoreBreakdown'];
  if (activity.scoreBreakdown) {
    scoreBreakdown = {
      base: activity.baseScore ?? 0,
      distance: activity.scoreBreakdown.distance ?? 0,
      rating: activity.scoreBreakdown.quality ?? 0,
      openNow: activity.scoreBreakdown.time ?? 0,
      free: activity.scoreBreakdown.cost ?? 0,
      popularity: 0,
      affinity: activity.affinityScore ?? 0,
      total: activity.score ?? 0,
    };
  }

  // Determine source (if not explicitly set, infer from type or details)
  const source: NormalizedActivity['source'] =
    activity.type === 'event' ? 'custom_search' :
    activity.type === 'venue' ? 'google_places' :
    'manual';

  return {
    id: activity.activityId ?? activity.id,
    name: activity.name,
    type: activity.type,
    location,
    distance: activity.distance,
    categories: activity.categories || [],
    primaryCategory: activity.primaryCategory || activity.categories?.[0] || 'other',
    musicGenres,
    accessibility: activity.accessibility,
    openNow: activity.openNow,
    duration: activity.duration,
    hours: activity.hoursToday,
    event,
    cost,
    rating: activity.rating,
    reviewCount: activity.reviewCount,
    score: activity.score,
    scoreBreakdown,
    description,
    images,
    website,
    source,
    createdAt: new Date(),
    updatedAt: (activity.location as any)?.updatedAt ? new Date((activity.location as any).updatedAt) : undefined,
  };
}

/**
 * Normalize array of activities
 *
 * @param activities - Array of activities from API
 * @returns Array of normalized activities
 */
export function normalizeActivities(activities: Activity[]): NormalizedActivity[] {
  logger.debug(`Normalizing ${activities.length} activities`);

  const normalized = activities.map((activity) => {
    try {
      return normalizeActivity(activity);
    } catch (error) {
      logger.error(`Failed to normalize activity: ${activity.id}`, error as Error);
      // Return a minimal valid activity
      return {
        id: activity.id,
        name: activity.name || 'Unknown',
        type: activity.type || 'venue',
        location: {
          lat: activity.lat || 0,
          lng: activity.lng || 0,
        },
        categories: [],
        primaryCategory: 'other',
        cost: { free: true },
        source: 'manual' as const,
        createdAt: new Date(),
      };
    }
  });

  logger.info(`Successfully normalized ${normalized.length} activities`);
  return normalized;
}

/**
 * Validate normalized activity has all required fields
 *
 * @param activity - Normalized activity to validate
 * @returns True if valid
 */
export function isValidNormalizedActivity(activity: NormalizedActivity): boolean {
  return !!(
    activity.id &&
    activity.name &&
    activity.type &&
    activity.location &&
    typeof activity.location.lat === 'number' &&
    typeof activity.location.lng === 'number' &&
    Array.isArray(activity.categories) &&
    activity.primaryCategory &&
    activity.cost &&
    typeof activity.cost.free === 'boolean'
  );
}

/**
 * Convert NormalizedActivity back to legacy Activity format
 * (for backward compatibility with existing components)
 *
 * @param normalized - Normalized activity
 * @returns Legacy activity format
 */
export function denormalizeActivity(normalized: NormalizedActivity): Activity {
  return {
    id: normalized.id,
    activityId: normalized.id,
    name: normalized.name,
    type: normalized.type,
    description: normalized.description,

    // Flatten location to root level for backward compatibility
    lat: normalized.location.lat,
    lng: normalized.location.lng,
    location: normalized.location,
    address: normalized.location.address,
    city: normalized.location.city,
    state: normalized.location.state,
    distance: normalized.distance,

    categories: normalized.categories,
    primaryCategory: normalized.primaryCategory,
    musicGenres: normalized.musicGenres,

    accessibility: normalized.accessibility,

    openNow: normalized.openNow,
    duration: normalized.duration,
    hoursToday: normalized.hours,

    cost: normalized.cost,

    rating: normalized.rating,
    reviewCount: normalized.reviewCount,

    score: normalized.score,
    baseScore: normalized.scoreBreakdown?.base,
    affinityScore: normalized.scoreBreakdown?.affinity,
    scoreBreakdown: normalized.scoreBreakdown ? {
      distance: normalized.scoreBreakdown.distance,
      time: normalized.scoreBreakdown.openNow,
      cost: normalized.scoreBreakdown.free,
      accessibility: 0,
      quality: normalized.scoreBreakdown.rating,
    } : undefined,

    images: normalized.images,
    website: normalized.website,

    details: normalized.event ? {
      description: normalized.description,
      imageUrl: normalized.images?.[0],
      website: normalized.website,
      eventDate: normalized.event.startDate.toISOString(),
      eventEndDate: normalized.event.endDate?.toISOString(),
      venue: normalized.event.venue,
      venueAddress: normalized.event.venueAddress,
      organizerName: normalized.event.organizer,
      capacity: normalized.event.capacity,
      priceLevel: normalized.cost.priceLevel,
      priceRange: normalized.cost.priceRange,
      musicGenres: normalized.musicGenres,
    } : undefined,
  };
}
