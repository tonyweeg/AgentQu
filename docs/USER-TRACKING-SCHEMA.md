# User Activity Tracking & Social Features

## New Firestore Collections for User Engagement

---

## 1. `user_activity_history` Collection

**Document ID:** `{userId}_{activityId}` (composite key)

Tracks where users have been and what they've done.

```typescript
{
  userId: string,
  activityId: string,

  // Visit History
  visits: [{
    visitedAt: timestamp,
    location: {
      lat: number,
      lng: number,
      verifiedByGPS: boolean,      // Within 100m of activity
      verifiedByQR: boolean,        // Future: QR code scan
      verifiedByAR: boolean         // Future: AR verification
    },
    duration: number,               // Minutes spent (if tracked)
    photos: string[],               // User photos from visit
    notes: string                   // Personal notes
  }],

  // Engagement
  totalVisits: number,
  firstVisit: timestamp,
  lastVisit: timestamp,

  // Actions
  qudUp: boolean,                   // "Qu'd up" this activity
  qudUpAt: timestamp,
  reviewed: boolean,
  reviewedAt: timestamp,
  shared: boolean,
  sharedAt: timestamp,

  // Rewards
  qusEarned: number,                // Qus earned for this activity
  achievements: string[],           // ["first_visit", "frequent_visitor", "reviewer"]

  // Social
  sharedWith: string[],             // User IDs of friends shared with
  recommendedTo: string[]           // User IDs recommended to
}
```

---

## 2. `user_qups` Collection (Replacing `user_votes`)

**Document ID:** `{userId}_{activityId}` (composite key)

"Qu'd up" activities - user's seal of approval.

```typescript
{
  userId: string,
  activityId: string,

  // Qu-up Status
  qudUp: boolean,                   // true = Qu'd up, false = Qu'd down
  createdAt: timestamp,
  updatedAt: timestamp,

  // Context
  qudFrom: {
    lat: number,
    lng: number,
    distance: number,               // How far from activity when Qu'd
    afterVisit: boolean,            // Qu'd after verified visit
    withReview: boolean             // Qu'd with a review
  },

  // Social Proof
  influence: number,                // Weight based on user's reputation
  helpful: boolean                  // Other users found this helpful
}
```

---

## 3. `activity_suggestions` Collection

**Document ID:** Auto-generated

User-submitted activity suggestions.

```typescript
{
  suggestionId: string,

  // Submitter
  userId: string,
  userName: string,
  userPhoto: string,

  // Activity Details
  name: string,
  description: string,
  categories: string[],

  // Location
  location: {
    lat: number,
    lng: number,
    geohash: string,
    address: string,
    city: string,
    state: string
  },

  // Metadata
  suggestedAt: timestamp,
  photos: string[],
  website: string,
  phone: string,
  estimatedCost: string,            // "free", "$", "$$", "$$$"

  // Moderation
  status: "pending" | "approved" | "rejected" | "duplicate",
  moderatedAt: timestamp,
  moderatedBy: string,
  moderationNotes: string,

  // If approved, link to activity
  activityId: string | null,        // Created activity ID

  // Community Validation
  upvotes: number,
  downvotes: number,
  userVotes: {
    [userId]: "up" | "down"
  }
}
```

---

## 4. `activity_shares` Collection

**Document ID:** Auto-generated

Tracks when users share activities with others.

```typescript
{
  shareId: string,

  // Who shared
  sharedBy: string,                 // User ID
  sharedByName: string,
  sharedByPhoto: string,

  // What was shared
  activityId: string,
  activityName: string,

  // Who it was shared with
  sharedWith: string[],             // User IDs or emails
  shareMethod: "direct" | "link" | "social",

  // Share Details
  message: string,                  // Personal message with share
  sharedAt: timestamp,

  // Engagement
  viewed: string[],                 // User IDs who viewed
  visitedAfterShare: string[],      // User IDs who visited after seeing share
  qudUpAfterShare: string[],        // User IDs who Qu'd up after share

  // Rewards
  qusEarnedForShare: number,        // Qus earned if others visit/Qu-up
  influenceScore: number            // Social influence metric
}
```

---

## 5. Updated `users` Collection

Add tracking fields to existing user schema:

```typescript
{
  // ... existing fields (uid, email, displayName, etc.)

  // Activity History
  stats: {
    totalReviews: number,
    totalQups: number,               // Total Qu-ups given
    totalVisits: number,             // Total verified visits
    totalSuggestions: number,        // Activities suggested
    totalShares: number,             // Activities shared
    qusEarned: number,               // Total Qus earned
    level: number,                   // User level (gamification)

    // Milestones
    firstVisit: timestamp,
    lastActivity: timestamp,
    streakDays: number,              // Consecutive days active
    achievements: string[]           // ["explorer", "reviewer", "influencer"]
  },

  // Social
  friends: string[],                 // User IDs of friends
  following: string[],               // User IDs following
  followers: string[],               // User IDs of followers

  // Privacy
  shareHistory: boolean,             // Share activity history with friends
  showVisits: boolean,               // Show where you've been
  allowSuggestions: boolean          // Receive activity suggestions
}
```

---

## 6. Updated `activities` Collection

Add social proof fields:

```typescript
{
  // ... existing fields

  ratings: {
    googleRating: number,
    agentQuRating: number,
    totalReviews: number,
    totalQups: number,               // Renamed from totalVotes
    qups: number,                    // Renamed from upvotes
    qudowns: number,                 // Renamed from downvotes
    qupScore: number,                // Renamed from voteScore
    lastRatingUpdate: timestamp
  },

  // Social Proof
  social: {
    totalVisits: number,             // Verified visits
    totalShares: number,             // Times shared
    uniqueVisitors: number,          // Unique users who visited
    popularityScore: number,         // Composite score
    trending: boolean,               // Recently popular
    trendingScore: number            // Calculated trend metric
  },

  // User Contributions
  userSubmitted: boolean,            // User-suggested activity
  suggestedBy: string,               // User ID of suggester
  verifiedByUsers: number,           // Users who confirmed it exists

  // Community Tags
  userTags: string[],                // User-added tags
  topReviewTags: string[]            // Common tags from reviews
}
```

---

## New Cloud Functions

### **1. `checkInActivity`**
Record user visit to an activity.

```typescript
exports.checkInActivity = onCall(async (request) => {
  const {userId, activityId, lat, lng, photos, notes} = request.data;

  // Verify GPS proximity (within 100m)
  const activity = await getActivity(activityId);
  const distance = calculateDistance(lat, lng, activity.lat, activity.lng);

  if (distance > 0.06) { // ~100m
    throw new Error("Too far from activity to check in");
  }

  // Record visit
  const historyRef = db.collection("user_activity_history").doc(`${userId}_${activityId}`);
  await historyRef.set({
    visits: arrayUnion({
      visitedAt: Date.now(),
      location: {lat, lng, verifiedByGPS: true},
      photos,
      notes
    }),
    totalVisits: increment(1),
    lastVisit: Date.now()
  }, {merge: true});

  // Award Qus for first visit
  // Update activity stats
  // Return Qus earned
});
```

### **2. `qupActivity`**
Renamed from `voteActivity` - Qu-up or Qu-down.

```typescript
exports.qupActivity = onCall(async (request) => {
  const {userId, activityId, qup} = request.data; // qup: true/false

  // Check if user has visited
  const history = await getUserHistory(userId, activityId);
  const afterVisit = history?.totalVisits > 0;

  // Save Qu-up
  const qupRef = db.collection("user_qups").doc(`${userId}_${activityId}`);
  await qupRef.set({
    userId,
    activityId,
    qudUp: qup,
    qudFrom: {afterVisit},
    updatedAt: Date.now()
  }, {merge: true});

  // Update activity ratings
  // Award bonus Qus if after visit
});
```

### **3. `suggestActivity`**
User suggests new activity.

```typescript
exports.suggestActivity = onCall(async (request) => {
  const {userId, name, description, lat, lng, categories, photos} = request.data;

  // Check for duplicates in area
  const geohash = encode(lat, lng, 7);
  const nearby = await findNearbyActivities(geohash, name);

  if (nearby.length > 0) {
    return {duplicate: true, suggestions: nearby};
  }

  // Create suggestion
  const suggestionRef = db.collection("activity_suggestions").doc();
  await suggestionRef.set({
    suggestionId: suggestionRef.id,
    userId,
    name,
    description,
    location: {lat, lng, geohash},
    categories,
    photos,
    suggestedAt: Date.now(),
    status: "pending",
    upvotes: 0
  });

  // Award Qus for suggestion
  // Notify moderators
});
```

### **4. `shareActivity`**
Share activity with friends.

```typescript
exports.shareActivity = onCall(async (request) => {
  const {userId, activityId, sharedWith, message, method} = request.data;

  // Create share record
  const shareRef = db.collection("activity_shares").doc();
  await shareRef.set({
    shareId: shareRef.id,
    sharedBy: userId,
    activityId,
    sharedWith,
    message,
    shareMethod: method,
    sharedAt: Date.now(),
    viewed: [],
    visitedAfterShare: []
  });

  // Send notifications to recipients
  // Update activity share count
  // Award Qus for sharing

  return {shareId: shareRef.id, shareLink: generateShareLink(shareRef.id)};
});
```

---

## Gamification: Qu Points System

### **Earning Qus:**
- ✅ **First visit** to activity: +10 Qus
- ✅ **Write review**: +25 Qus
- ✅ **Qu-up after visit**: +5 Qus
- ✅ **Upload photo**: +5 Qus per photo (max 3)
- ✅ **Suggest new activity** (approved): +50 Qus
- ✅ **Share activity** (friend visits): +15 Qus
- ✅ **Daily streak**: +5 Qus per day
- ✅ **Achievements**: Variable Qus

### **Spending Qus:**
- 🎁 **Unlock premium features**
- 🏆 **Leaderboard status**
- 🎨 **Profile customization**
- 🎟️ **Event priority access** (future)

---

## User Journey Example

**Sarah's Adventure:**

1. **Search** for hiking near Big Sur
2. **Discover** McWay Falls trail (cached result, 89 Qus score)
3. **Check In** via GPS → +10 Qus (first visit)
4. **Upload Photos** → +15 Qus (3 photos)
5. **Qu-up** the trail → +5 Qus (after visit)
6. **Write Review** → +25 Qus
7. **Share** with friend Mike → Friend visits → +15 Qus
8. **Total Earned:** 70 Qus

**Mike's Journey:**
1. **Receives share** from Sarah
2. **Views** shared activity
3. **Visits** McWay Falls (Sarah gets +15 Qus)
4. **Qu-ups** the trail
5. Sarah's influence score increases

---

## Privacy & Data Usage

- **User history**: Only visible to user unless shared
- **Qu-ups**: Public (shows on activity)
- **Reviews**: Public (with moderation)
- **Visits**: Private unless user enables sharing
- **Shares**: Recipients can see who shared
- **Suggestions**: Public after approval

---

This creates a **social, engaging, gamified experience** while building the permanent activity database! 🎮🗺️
