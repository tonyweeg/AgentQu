# AgentQu Firestore Schema

## Complete Data Architecture for Scalable Activity Discovery

---

## Collections Overview

1. **`activities`** - Master database of all discovered activities (permanent + events)
2. **`search_cache`** - Geo + affinity-based cache for fast lookups
3. **`reviews`** - User reviews with profanity filtering
4. **`user_votes`** - User upvotes/downvotes per activity
5. **`users`** - User profiles with affinities

---

## 1. `activities` Collection

**Document ID:** `{activityId}` (e.g., `place_ChIJxxx` or `event_12345`)

```typescript
{
  // Core Identity
  activityId: string,
  name: string,
  type: "permanent" | "event" | "seasonal",

  // Location & Geo
  location: {
    lat: number,
    lng: number,
    geohash: string,              // Precision 5 (~5km) for caching
    geohashPrecise: string,       // Precision 7 (~150m) for exact location
    city: string,
    state: string,
    address: string,
    placeId: string               // Google Place ID if available
  },

  // Categorization & Affinity Matching
  categories: string[],           // ["watersports", "beaches", "swimming"]
  primaryCategory: string,        // "watersports"
  tags: string[],                 // ["beginner_friendly", "family", "sunset"]

  // Details
  details: {
    description: string,
    shortDescription: string,     // 1-2 sentences for cards
    imageUrl: string,
    imageUrls: string[],          // Multiple images
    website: string,
    phone: string,
    email: string,
    priceLevel: number,           // 0-4 (free to $$$$)
    estimatedDuration: number,    // Minutes
    difficulty: string            // "easy" | "moderate" | "hard"
  },

  // Schedule & Availability
  schedule: {
    isOpen24Hours: boolean,
    openingHours: {
      monday: { open: string, close: string },
      tuesday: { open: string, close: string },
      // ... etc
    },
    specialHours: [{              // Holidays, events, etc.
      date: timestamp,
      open: string,
      close: string,
      note: string
    }]
  },

  // Expiration & Freshness
  expiration: {
    type: "permanent" | "datetime" | "date" | "seasonal",
    expiresAt: timestamp | null,  // null for permanent
    lastVerified: timestamp,
    verificationSource: string,   // "api" | "user_report" | "admin"
    isActive: boolean             // Quick flag for queries
  },

  // Ratings & Engagement
  ratings: {
    googleRating: number,         // From Google Places API
    agentQuRating: number,        // Our community rating
    totalReviews: number,
    totalVotes: number,
    upvotes: number,
    downvotes: number,
    voteScore: number,            // upvotes - downvotes
    lastRatingUpdate: timestamp
  },

  // Search Metadata
  searchMetadata: {
    firstSeen: timestamp,
    lastSearched: timestamp,
    searchCount: number,
    popularityScore: number,      // Calculated from searchCount + votes
    source: "google_places" | "google_search" | "ticketmaster" | "eventbrite" | "user_submitted",
    sourceId: string,             // Original API ID
    lastApiSync: timestamp
  },

  // Admin & Moderation
  moderation: {
    status: "approved" | "pending" | "flagged" | "removed",
    flagCount: number,
    lastModerated: timestamp,
    moderatedBy: string           // User ID
  }
}
```

---

## 2. `search_cache` Collection

**Document ID:** Auto-generated

```typescript
{
  // Cache Key Components
  cacheKey: string,               // "geo_9q8yy_rad_10_aff_abc123"
  geohash: string,                // "9q8yy" (precision 5)
  radius: number,                 // Search radius in km
  affinitySignature: string,      // Hash of top 5 affinities

  // Cached Results
  activityIds: string[],          // Array of activity document IDs
  scoredResults: [{
    activityId: string,
    baseScore: number,            // Distance + rating + freshness
    affinityScore: number,        // Category match score
    finalScore: number,
    matchedCategories: string[],
    distance: number              // Meters from search center
  }],

  // Cache Metadata
  searchCenter: {
    lat: number,
    lng: number
  },
  totalResults: number,

  // Expiration & Stats
  createdAt: timestamp,
  expiresAt: timestamp,           // 1 hour for events, 24 hours for permanent
  ttl: number,                    // Seconds
  userCount: number,              // How many users hit this cache
  lastAccessed: timestamp,

  // Quality Metrics
  hasEvents: boolean,             // Contains time-sensitive events
  hasPermanent: boolean,          // Contains permanent activities
  freshness: number               // 0-1 score based on data age
}
```

---

## 3. `reviews` Collection

**Document ID:** Auto-generated

```typescript
{
  // Identity
  reviewId: string,
  activityId: string,             // Reference to activity
  userId: string,                 // Author

  // Content
  rating: number,                 // 1-5 stars
  title: string,                  // Optional review title
  content: string,                // Review text
  contentOriginal: string,        // Original before profanity filter
  contentFiltered: boolean,       // Was profanity detected?

  // Media
  photos: [{
    url: string,
    thumbnailUrl: string,
    uploadedAt: timestamp
  }],

  // Context
  visitDate: timestamp,           // When they visited
  createdAt: timestamp,
  updatedAt: timestamp,

  // Engagement
  helpfulCount: number,           // "Was this helpful?" votes
  reportCount: number,            // Flagged by users

  // Moderation
  moderation: {
    status: "approved" | "pending" | "flagged" | "removed",
    autoFiltered: boolean,        // Caught by profanity filter
    flagReasons: string[],        // ["spam", "inappropriate", "fake"]
    moderatedBy: string,          // Admin user ID
    moderatedAt: timestamp,
    moderationNotes: string
  },

  // User Info Snapshot (for display)
  userSnapshot: {
    displayName: string,
    photoURL: string,
    reviewCount: number           // Total reviews by this user
  }
}
```

---

## 4. `user_votes` Collection

**Document ID:** `{userId}_{activityId}` (composite key prevents duplicate votes)

```typescript
{
  userId: string,
  activityId: string,
  vote: "up" | "down",
  createdAt: timestamp,
  updatedAt: timestamp,

  // Context
  votedFrom: {
    lat: number,
    lng: number,
    distance: number              // How far from activity when voted
  }
}
```

---

## 5. `users` Collection

**Document ID:** `{uid}` (Firebase Auth UID)

```typescript
{
  // Identity
  uid: string,
  email: string,
  displayName: string,
  photoURL: string,

  // Affinities
  affinities: {
    watersports: number,          // 0-1 score
    nightlife: number,
    hiking: number,
    // ... all 28 categories
  },
  onboarded: boolean,

  // Activity & Engagement
  stats: {
    totalReviews: number,
    totalVotes: number,
    activitiesCompleted: number,  // Future: check-ins
    qusEarned: number,            // Gamification
    level: number
  },

  // Preferences
  preferences: {
    defaultRadius: number,        // km
    notificationsEnabled: boolean,
    showMaturedContent: boolean,
    language: string
  },

  // Timestamps
  createdAt: timestamp,
  lastActive: timestamp,

  // Moderation
  isModerator: boolean,
  isBanned: boolean,
  banReason: string
}
```

---

## Composite Indexes Required

```javascript
// For activity queries
activities: [
  { fields: ['location.geohash', 'expiration.isActive', 'ratings.voteScore'], order: 'DESC' },
  { fields: ['categories', 'expiration.isActive', 'ratings.agentQuRating'], order: 'DESC' },
  { fields: ['type', 'expiration.expiresAt'], order: 'ASC' }
]

// For cache queries
search_cache: [
  { fields: ['geohash', 'expiresAt'], order: 'DESC' },
  { fields: ['cacheKey', 'expiresAt'], order: 'DESC' }
]

// For reviews
reviews: [
  { fields: ['activityId', 'moderation.status', 'createdAt'], order: 'DESC' },
  { fields: ['userId', 'createdAt'], order: 'DESC' }
]
```

---

## Data Flow Example

### User searches near beach (33.7, -118.2) with watersports affinity

1. **Generate geohash:** `9q5c` (precision 5)
2. **Check cache:** `search_cache` where `geohash == '9q5c'` AND `expiresAt > now`
3. **If cache miss:**
   - Fetch from Google Places API (beach, watersports, etc.)
   - Save to `activities` collection (upsert)
   - Create cache entry in `search_cache`
4. **Personalize scores** based on user's exact affinity values
5. **Fetch votes** from `user_votes` for this user
6. **Return ranked results** with personalized scores

### User submits review

1. **Profanity filter** runs on content
2. **Save to `reviews`** collection with `status: "pending"` if filtered
3. **Update activity** ratings aggregate
4. **Invalidate cache** entries containing this activity

---

## Scalability Considerations

- **Geohash clustering** reduces query complexity from O(n²) to O(log n)
- **Cache expiration** prevents stale data (1hr events, 24hr permanent)
- **Composite indexes** ensure fast queries at scale
- **Denormalized ratings** on activities for instant display
- **User vote deduplication** via composite document IDs
- **Review moderation queue** separates pending from approved

---

## Next Steps

1. Implement geohash library for location indexing
2. Create Cloud Functions for cache management
3. Build profanity filter service
4. Set up Firestore security rules
5. Create scheduled cleanup job for expired activities
