# VibeIndex Design Document

## 🎯 Vision

**VibeIndex** is a cultural scoring system that ranks towns and cities across multiple vibe categories based on Twitter/X activity. It creates competitive rankings where towns can "vie for top spots" in categories like Artsy, Music Scene, Sports Culture, Business Hub, etc.

More than a livability index, VibeIndex captures the **soul** of a place through social media signals.

---

## 📊 Vibe Categories

### Core Categories (8 dimensions)

1. **🎨 Artsy** - Visual arts, galleries, street art, art festivals
   - Keywords: art, gallery, exhibit, mural, artist, creative, painting, sculpture
   - Hashtags: #art #artsy #gallery #streetart #artistsontwitter #creative

2. **🎵 Music Scene** - Live music, concerts, music festivals, local bands
   - Keywords: concert, band, music, live music, show, festival, gig, venue
   - Hashtags: #livemusic #concert #musicfestival #localmusic #band

3. **🏢 Business Hub** - Startups, entrepreneurs, corporate, business development
   - Keywords: startup, business, entrepreneur, corporate, tech, innovation, company
   - Hashtags: #startup #entrepreneur #business #innovation #tech

4. **⚽ Sports Culture** - Sports teams, athletics, fitness, sports events
   - Keywords: game, team, sports, athletic, fitness, championship, tournament
   - Hashtags: #sports #fitness #athletics #gameon #championship

5. **🎭 Culture & Events** - Festivals, cultural events, community celebrations
   - Keywords: festival, event, cultural, community, celebration, tradition
   - Hashtags: #festival #culturalevent #community #celebration

6. **🌈 Quirky/Funky** - Unique, weird, unconventional, alternative culture
   - Keywords: weird, quirky, unique, funky, alternative, odd, eccentric
   - Hashtags: #weird #quirky #keepitweird #unique #funky

7. **🍽️ Foodie Scene** - Restaurants, food culture, culinary events
   - Keywords: foodie, restaurant, chef, culinary, food festival, dining
   - Hashtags: #foodie #restaurant #foodporn #chef #dining

8. **🌃 Nightlife** - Bars, clubs, nightlife, entertainment
   - Keywords: nightlife, bar, club, party, drinks, happy hour
   - Hashtags: #nightlife #bars #club #drinks #party

---

## 🧮 Scoring Algorithm

### Data Collection Window
- **Time Range**: Last 30 days of tweets
- **Update Frequency**: Daily (recalculate scores every 24 hours)
- **Geographic Scope**: Tweets with location data within city boundaries

### Scoring Components (100-point scale per category)

#### 1. **Volume Score (0-30 points)**
- Count tweets matching category keywords/hashtags
- Normalize by city population to avoid favoring large cities
- Formula: `min(30, (tweet_count / population_thousands) * 10)`

#### 2. **Engagement Score (0-30 points)**
- Measure likes + retweets + replies on category-relevant tweets
- High engagement = strong community interest
- Formula: `min(30, (total_engagement / tweet_count) * 5)`

#### 3. **Diversity Score (0-20 points)**
- Number of unique users posting about category
- More diverse = broader community participation
- Formula: `min(20, unique_users / 10)`

#### 4. **Recency Score (0-10 points)**
- Time decay: Recent tweets weighted higher
- Last 7 days: +10, 8-14 days: +7, 15-21 days: +4, 22-30 days: +2

#### 5. **Event Density Score (0-10 points)**
- Number of event-related tweets in category
- Events = tweets with date/time patterns
- Formula: `min(10, event_count / 2)`

### Final Score Calculation
```
VibeScore = Volume(30) + Engagement(30) + Diversity(20) + Recency(10) + Events(10)
Range: 0-100 per category
```

---

## 🗄️ Data Schema (Firestore)

### Collection: `vibeScores`

```javascript
{
  cityId: "rehoboth-beach-de",           // Unique city identifier
  cityName: "Rehoboth Beach",            // Display name
  state: "DE",                           // State code
  country: "US",                         // Country code
  location: {
    lat: 38.721,
    lng: -75.076,
    geohash: "dqcjqc"                    // Precision 6 for city-level
  },
  population: 1327,                      // City population (for normalization)

  scores: {
    artsy: {
      score: 85,                         // 0-100
      rank: 12,                          // National rank in category
      tweetCount: 145,                   // Tweets analyzed
      uniqueUsers: 67,                   // Distinct Twitter users
      avgEngagement: 12.4,               // Avg likes+retweets per tweet
      lastUpdated: timestamp
    },
    musicScene: {
      score: 72,
      rank: 28,
      tweetCount: 98,
      uniqueUsers: 45,
      avgEngagement: 8.7,
      lastUpdated: timestamp
    },
    businessHub: { ... },
    sportsCulture: { ... },
    cultureEvents: { ... },
    quirkyFunky: { ... },
    foodieScene: { ... },
    nightlife: { ... }
  },

  overallVibeScore: 73.5,                // Average across all categories
  overallRank: 156,                      // National overall rank
  trendingCategories: ["artsy", "musicScene"], // Top 2 categories

  calculatedAt: timestamp,               // Last calculation time
  nextUpdate: timestamp                  // Scheduled next update
}
```

### Collection: `vibeLeaderboards`

```javascript
{
  category: "artsy",                     // Category name
  type: "national" | "regional",         // Scope
  region: "northeast",                   // If regional

  topCities: [
    { cityId, cityName, state, score, rank: 1 },
    { cityId, cityName, state, score, rank: 2 },
    // ... top 100
  ],

  updatedAt: timestamp
}
```

---

## 🔧 Implementation Plan

### Phase 1: Backend Infrastructure (Task #13)

#### Cloud Function: `calculateVibeIndex`
```javascript
exports.calculateVibeIndex = onSchedule(
  { schedule: "0 2 * * *" },  // Run at 2am daily
  async (event) => {
    // 1. Get all tracked cities
    // 2. For each city:
    //    - Fetch tweets from last 30 days
    //    - Calculate scores for all 8 categories
    //    - Store in vibeScores collection
    // 3. Calculate rankings
    // 4. Update leaderboards
  }
);
```

#### Cloud Function: `getVibeIndex`
```javascript
exports.getVibeIndex = onCall(async (request) => {
  const { cityId, category } = request.data;

  // Return vibe scores for a city
  // Or return leaderboard for a category
});
```

### Phase 2: Frontend Display

#### VibeIndex Badge on Location Selector
- Show top 2 trending categories for current city
- Example: "Rehoboth Beach: 🎨 Artsy (#12) · 🎵 Music (#28)"

#### VibeIndex Leaderboard Page
- Tab view for each category
- Top 100 cities per category
- Show score, rank, trending indicator
- Filter by region (Northeast, Southeast, etc.)

#### City Detail View
- Radar chart showing all 8 category scores
- Comparison to national average
- Recent tweets contributing to scores
- Historical trends (if available)

---

## 📈 Competitive Features

### Rankings & Gamification
- **National Leaderboards**: Top 100 cities per category
- **Regional Leaderboards**: Top 50 cities per region
- **Rising Stars**: Cities with biggest score increases this month
- **Category Champions**: Cities #1 in each category
- **Renaissance Cities**: High scores across multiple categories

### Social Sharing
- "Rehoboth Beach ranked #12 in Artsy vibes! 🎨"
- Share city rankings on Twitter/X
- Badge images for city websites

---

## 🚀 Launch Strategy

### Phase 1 (MVP): Core Algorithm + Top 50 Cities
1. Implement calculation backend
2. Seed with 50 major tourist/cultural cities
3. Calculate scores daily
4. Basic leaderboard display

### Phase 2: User-Submitted Cities
1. Allow users to nominate cities
2. Minimum population threshold (e.g., 5,000)
3. Require 100+ tweets/month to qualify

### Phase 3: Advanced Features
1. Historical trends and charts
2. Category-specific deep dives
3. City comparison tool
4. API for city websites

---

## ⚡ Technical Considerations

### API Rate Limits
- Twitter API v2: 450 requests per 15 minutes (app-level)
- Need to batch and schedule city updates
- Prioritize active/popular cities

### Caching Strategy
- Cache scores for 24 hours
- Recalculate only when tweet volume justifies
- Use Firestore TTL for automatic cleanup

### Cost Optimization
- Run calculations during low-traffic hours (2-4am)
- Batch Twitter API calls efficiently
- Store only aggregated data, not individual tweets

### Scalability
- Start with 50 cities, expand to 500+
- Queue-based processing for large-scale updates
- Regional sharding if needed

---

## 🎨 UI Mockup Ideas

### Location Selector Enhancement
```
📍 Rehoboth Beach, DE
   🎨 Artsy #12 · 🎵 Music #28 · 🍽️ Foodie #45
   [View Full VibeIndex →]
```

### Leaderboard Page
```
┌─────────────────────────────────────┐
│ 🎨 ARTSY VIBES LEADERBOARD          │
├─────────────────────────────────────┤
│ 1. Portland, ME          ★★★★★ 95  │
│ 2. Asheville, NC         ★★★★★ 92  │
│ 3. Providence, RI        ★★★★☆ 88  │
│ ...                                  │
│ 12. Rehoboth Beach, DE   ★★★★☆ 85  │
│ ...                                  │
└─────────────────────────────────────┘
```

---

## 📊 Success Metrics

- **Engagement**: Click-through rate on VibeIndex badges
- **Social Sharing**: Cities sharing their rankings
- **Coverage**: Number of cities with active scores
- **Accuracy**: User feedback on score relevance
- **Virality**: Media coverage, city government interest

---

**Created**: 2025-10-10
**Status**: Design Phase
**Next Step**: Implement backend calculation function
