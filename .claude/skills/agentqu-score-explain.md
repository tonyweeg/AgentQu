# AgentQu Activity Scoring Explainer

You are the AgentQu scoring specialist. You explain why activities receive specific scores and help debug scoring issues.

## SCORING ALGORITHM

AgentQu uses a multi-factor scoring system (0-300+ possible):

```
Final Score = Base Score (100)
            + Distance Score (0-30)
            + Rating Score (0-20)
            + Open Now Bonus (0-10)
            + Free Entry Bonus (0-5)
            + Popularity Score (0-15)
            + Affinity Score (0-40)
            ─────────────────────────
            = Total (100-220+)
```

### Component Breakdown

#### 1. Base Score: 100
- Every activity starts with 100 points
- Ensures all activities have minimum visibility

#### 2. Distance Score: 0-30
**Closer = Higher score**

```javascript
// Algorithm
const maxDistance = userRadius; // User's search radius
const distance = calculateDistance(userLocation, activityLocation);
const distanceScore = Math.max(0, 30 * (1 - distance / maxDistance));

// Examples:
0 miles away    → +30 points
2 miles away    → +24 points (in 10-mile radius)
5 miles away    → +15 points (in 10-mile radius)
10 miles away   → +0 points (at edge of 10-mile radius)
```

#### 3. Rating Score: 0-20
**Higher Google rating = Higher score**

```javascript
// Algorithm
const rating = activity.rating || 0; // Google rating (0-5)
const ratingScore = (rating / 5) * 20;

// Examples:
5.0 stars → +20 points
4.0 stars → +16 points
3.0 stars → +12 points
No rating → +0 points
```

#### 4. Open Now Bonus: 0-10
**Open right now = Bonus**

```javascript
// Algorithm
const openNowBonus = activity.openNow ? 10 : 0;

// Examples:
Open now     → +10 points
Closed now   → +0 points
Hours unknown → +0 points
```

#### 5. Free Entry Bonus: 0-5
**Free activities get boost**

```javascript
// Algorithm
const freeBonus = activity.isFree ? 5 : 0;

// Examples:
Free (parks, beaches, public spaces) → +5 points
Paid (museums, concerts, restaurants) → +0 points
```

#### 6. Popularity Score: 0-15
**More reviews/check-ins = Higher score**

```javascript
// Algorithm (simplified)
const userRatingsTotal = activity.userRatingsTotal || 0;
const popularityScore = Math.min(15, Math.log10(userRatingsTotal + 1) * 3);

// Examples:
1000+ reviews → +15 points
100 reviews   → +9 points
10 reviews    → +6 points
0 reviews     → +0 points
```

#### 7. Affinity Score: 0-40 ⭐ MOST IMPORTANT
**Matches user preferences = Highest boost**

```javascript
// Algorithm
const categories = activity.categories; // ['restaurant', 'italian', 'bar']
const userAffinities = user.affinities; // { restaurants: 90, bars: 75 }

let affinityScore = 0;
for (const category of categories) {
  const affinity = userAffinities[category] || 0;
  affinityScore += (affinity / 100) * 10; // Max +10 per match
}
affinityScore = Math.min(40, affinityScore); // Cap at 40

// Examples:
Perfect match (4 categories × 100 affinity) → +40 points
Good match (3 categories × 80 affinity)     → +24 points
Weak match (1 category × 50 affinity)       → +5 points
No match (no affinity categories)           → +0 points
```

## SCORE EXPLANATION FORMAT

When explaining a score, use this format:

```
Activity: Blue Moon Cafe
Final Score: 187 / 300

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Score Breakdown:

🏁 Base Score:           100 points
   Every activity starts here

📍 Distance Score:       +25 points
   0.8 miles away (very close!)
   Formula: 30 × (1 - 0.8/10) = 25

⭐ Rating Score:         +18 points
   4.6 stars on Google
   Formula: (4.6/5) × 20 = 18

🟢 Open Now Bonus:       +10 points
   Currently open (8am - 3pm)

💰 Free Entry Bonus:     +0 points
   Restaurant (not free)

👥 Popularity Score:     +14 points
   1,234 Google reviews (very popular)
   Formula: log10(1234) × 3 = 14

🎯 Affinity Score:       +20 points  ⭐ KEY FACTOR
   Matched categories:
   • restaurants (user: 90) → +9 points
   • breakfast (user: 75)   → +7.5 points
   • cafes (user: 50)       → +5 points
   Total: 21.5 → capped at 20

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total: 187 points

Why this score?
• Great affinity match (breakfast lover!)
• Very close to your location
• Highly rated and popular
• Open right now

To improve score:
• Increase "breakfast" affinity in Settings
• Visit during peak hours for better experience
```

## DEBUGGING LOW SCORES

### Low Score Checklist

#### Score < 120 (Below average)

**Check:**
1. **Distance** - Is it far away?
   - Look at distance score
   - User might have small radius setting

2. **Rating** - Is it poorly rated?
   - Check Google rating
   - Low rating = low score

3. **Affinity mismatch** - Does it match user preferences?
   - Most common issue!
   - Check if activity categories match user affinities

4. **New/unknown place** - No reviews/ratings?
   - New places score lower
   - Will improve as they get reviews

#### Score > 180 (High score)

**Indicates:**
- ✅ Close to user
- ✅ Highly rated
- ✅ Strong affinity match
- ✅ Popular/well-reviewed
- ✅ Currently open

## AFFINITY MAPPING REFERENCE

**Critical: Activity categories must map to user affinities**

### Common Mappings

**Google Place Types → Affinity Categories:**
```javascript
'restaurant' → affinities.restaurants
'cafe' → affinities.coffee_shops
'bar' → affinities.bars
'night_club' → affinities.clubs
'park' → affinities.parks
'museum' → affinities.museums
'art_gallery' → affinities.art_galleries
'shopping_mall' → affinities.shopping
'movie_theater' → affinities.movies
```

**Ticketmaster Genres → Music Affinities:**
```javascript
'Rock' → musicGenreAffinities.rock
'Jazz' → musicGenreAffinities.jazz
'Country' → musicGenreAffinities.country
'Hip-Hop/Rap' → musicGenreAffinities.hip_hop
'Electronic' → musicGenreAffinities.electronic
```

**Restaurant Genres → Restaurant Affinities:**
```javascript
'Italian' → restaurantGenreAffinities.italian
'Japanese' → restaurantGenreAffinities.japanese
'Mexican' → restaurantGenreAffinities.mexican
'Thai' → restaurantGenreAffinities.thai
```

**Mapping location:** `functions/src/utils/mappings.js`

## COMMON SCORING ISSUES

### Issue: "Why is this coffee shop scoring so low?"

**Debug steps:**
1. Check user's `coffee_shops` affinity
2. Check if activity has 'cafe' or 'coffee_shop' in categories
3. Verify category mapping in mappings.js
4. Check scoreBreakdown in Firestore

**Example:**
```
Activity categories: ['cafe', 'bakery']
User affinities: { restaurants: 90, coffee_shops: 0 }
                                               ↑ PROBLEM!

Affinity score: 0 points (no match!)
Solution: User needs to set coffee_shops affinity > 0
```

### Issue: "Why is this nightclub scoring higher than this museum?"

**Answer:** User affinity preferences!

```
Nightclub:
  Base: 100
  Affinity: +35 (user.bars: 90, user.clubs: 85)
  Total: ~165

Museum:
  Base: 100
  Affinity: +5 (user.museums: 15)
  Total: ~120

Explanation: User preferences heavily favor nightlife!
```

### Issue: "EV charging stations scoring too high/low"

**EV stations get special handling:**

```javascript
// EV charging stations
if (activity.type === 'ev_charging' && user.isEV === true) {
  // Prioritize for EV owners
  affinityScore += 20; // Bonus for EV owners
}
```

**Debug:**
1. Verify user.isEV is true in Firestore
2. Check activity.type === 'ev_charging'
3. Look for EV bonus in scoreBreakdown

## FIRESTORE SCORE DATA

**Activity document structure:**
```javascript
{
  id: "activity_123",
  name: "Blue Moon Cafe",
  score: 187,
  scoreBreakdown: {
    baseScore: 100,
    distanceScore: 25,
    ratingScore: 18,
    openNowBonus: 10,
    freeEntryBonus: 0,
    popularityScore: 14,
    affinityScore: 20,
    finalScore: 187
  },
  categories: ['restaurant', 'breakfast', 'cafe'],
  location: { lat: 39.xx, lng: -76.xx },
  rating: 4.6,
  userRatingsTotal: 1234,
  openNow: true,
  isFree: false
}
```

## TESTING SCORE CHANGES

**To test scoring:**

1. **Change user affinities** (use agentqu-user-profile skill)
2. **Clear cache** (use agentqu-cache-manager skill)
3. **Rediscover activities** (call discoverActivities)
4. **Compare scores** (check scoreBreakdown in Firestore)

**Example test:**
```
Before: user.restaurants = 0
Activity score: 130

After: user.restaurants = 90
Activity score: 166 (+36 from affinity!)
```

## QUICK SCORE CALCULATOR

```javascript
// Estimate score for activity
function estimateScore(activity, user) {
  let score = 100; // base

  // Distance (assume 2 miles, 10 mile radius)
  score += 30 * (1 - 2/10); // = +24

  // Rating (assume 4.5 stars)
  score += (4.5/5) * 20; // = +18

  // Open now (assume yes)
  score += 10;

  // Popularity (assume 500 reviews)
  score += Math.log10(500) * 3; // = +8

  // Affinity (this varies most!)
  // Assume 2 matching categories at 80 affinity each
  score += (80/100 * 10) * 2; // = +16

  return score; // ≈ 176
}
```

**Remember:** Affinity score varies most between users!
