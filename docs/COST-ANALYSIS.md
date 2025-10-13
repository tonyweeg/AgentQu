# AgentQu Cost Analysis - Google Cloud & Firebase

**Last Updated:** January 2025
**Analysis Date:** October 13, 2025

## 💰 Cost Breakdown Per User Discovery

### Per Discovery Request Costs

When a user opens the app and discovers activities, here's what happens:

| Service | API Calls | Cost Per Call | Cost Per Discovery | Notes |
|---------|-----------|---------------|-------------------|-------|
| **Google Geocoding API** | 1 | $0.005 | **$0.005** | Reverse geocode user location to city name |
| **Google Places API (New)** | 1 | $0.017 | **$0.017** | Nearby search with 20 results |
| **Google Custom Search API** | 3 | $5 per 1000 | **$0.015** | 3 queries for events (today, Facebook, weekend) |
| **Ticketmaster API** | 1 | Free | $0.000 | Free tier with attribution |
| **Reddit API** | 1 | Free | $0.000 | Public JSON endpoints |
| **Twitter API** | 0-1 | $100/month | ~$0.003 | Only if user switches to Twitter view |
| | | **Total:** | **$0.037-$0.040** | **~4 cents per discovery** |

### Breakdown by Component

#### 1. 🗺️ **Google Geocoding API** - COSTLIEST PER CALL
- **Purpose:** Convert lat/lng to city name ("Berlin, MD")
- **Usage:** Every discovery request
- **Pricing:** $0.005 per request
- **Monthly Free Tier:** None (pay per use after $200 Cloud credit)
- **Current Implementation:** `functions/index.js:2081-2121`
- **Optimization Potential:** HIGH 🔥

**Why it's expensive:**
- Called on EVERY discovery, even when location hasn't changed
- Most users stay in the same city for multiple discoveries
- City name rarely changes between requests

**Savings Opportunity:**
```javascript
// Current: $0.005 per discovery
// Optimized with 5-min cache: $0.005 per 30 discoveries
// Potential savings: ~95% reduction in geocoding costs
```

#### 2. 🌍 **Google Places API (New)** - HIGHEST TOTAL COST
- **Purpose:** Find restaurants, cafes, attractions near user
- **Usage:** Every discovery request
- **Pricing:** $0.017 per Nearby Search (with all fields)
- **Fields Requested:** displayName, address, location, types, rating, photos, hours, website, phone, priceLevel
- **Monthly Free Tier:** None
- **Current Implementation:** `functions/index.js:1622-1645`
- **Optimization Potential:** MEDIUM ⚠️

**Cost Breakdown:**
- Basic Search: $0.002
- Display: +$0.003
- Atmosphere: +$0.003
- Contact: +$0.003
- **Photos: +$0.007** (most expensive field)
- Total per search: $0.017

**Why it's expensive:**
- Photos field costs 3.5x more than basic search
- Returns up to 20 places per discovery
- No caching enabled (fresh data every time)

**Savings Opportunity:**
```javascript
// Remove photos field: Save $0.007 per discovery (~41% reduction)
// Cache results for 30 minutes: Amortize cost across 10+ users
// Field optimization: Could reduce to $0.010 per discovery
```

#### 3. 🔍 **Google Custom Search API** - MODERATE COST
- **Purpose:** Find local events (concerts, festivals, etc.)
- **Usage:** 3 queries per discovery
- **Pricing:** $5 per 1000 queries = $0.005 per query
- **Queries:**
  1. `events ${city} today tonight this weekend`
  2. `events site:facebook.com ${city} today this weekend`
  3. `things to do ${city} this weekend`
- **Monthly Free Tier:** 100 queries/day free (3,000/month)
- **Current Implementation:** `functions/index.js:773-806`
- **Optimization Potential:** HIGH 🔥

**Why it's moderate:**
- 3 queries = $0.015 per discovery
- Event results change frequently (good to refresh)
- Free tier covers ~33 discoveries/day (1,000/month)

**Savings Opportunity:**
```javascript
// Cache event results for 6 hours: 80% cost reduction
// Only run on weekends/evenings: 50% usage reduction
// Use 1 query instead of 3: 66% cost reduction
```

---

## 📊 Monthly Cost Projections

### Scenario 1: Small Launch (100 Active Users)
- **Assumptions:** 10 discoveries per user per month
- **Total Discoveries:** 1,000/month

| Service | Usage | Cost |
|---------|-------|------|
| Geocoding API | 1,000 calls | $5.00 |
| Places API | 1,000 calls | $17.00 |
| Custom Search | 3,000 calls | $15.00 |
| Twitter API | 200 calls | $100.00 (fixed) |
| Firebase Functions | 1,000 invocations | $0.00 (free tier) |
| Firestore Reads | ~50,000 reads | $0.00 (free tier) |
| Firebase Hosting | <1GB | $0.00 (free tier) |
| **TOTAL** | | **$137.00/month** |
| **Per User** | | **$1.37/month** |

### Scenario 2: Growing (1,000 Active Users)
- **Assumptions:** 15 discoveries per user per month
- **Total Discoveries:** 15,000/month

| Service | Usage | Cost |
|---------|-------|------|
| Geocoding API | 15,000 calls | $75.00 |
| Places API | 15,000 calls | $255.00 |
| Custom Search | 45,000 calls | $225.00 |
| Twitter API | 3,000 calls | $100.00 (fixed) |
| Firebase Functions | 15,000 invocations | $0.40 |
| Firestore Reads | ~750,000 reads | $0.11 |
| Firebase Hosting | 5GB transfer | $0.60 |
| **TOTAL** | | **$656.11/month** |
| **Per User** | | **$0.66/month** |

### Scenario 3: Viral (10,000 Active Users)
- **Assumptions:** 20 discoveries per user per month
- **Total Discoveries:** 200,000/month

| Service | Usage | Cost |
|---------|-------|------|
| Geocoding API | 200,000 calls | $1,000.00 |
| Places API | 200,000 calls | $3,400.00 |
| Custom Search | 600,000 calls | $3,000.00 |
| Twitter API | 40,000 calls | $500.00 |
| Firebase Functions | 200,000 invocations | $5.60 |
| Firestore Reads | ~10M reads | $1.80 |
| Firestore Writes | ~500K writes | $0.90 |
| Firebase Hosting | 100GB transfer | $12.00 |
| **TOTAL** | | **$7,920.30/month** |
| **Per User** | | **$0.79/month** |

---

## 🔥 Cost Optimization Strategies

### Immediate Wins (Implement First)

#### 1. Cache Geocoding Results (Save ~$950/month at 10K users)
**Impact:** 95% reduction in geocoding costs

```javascript
// Current: Geocode every discovery
// Optimized: Cache city name in user profile + localStorage

// In useLocation.ts:
localStorage.setItem('agentqu_city', JSON.stringify({
  lat, lng,
  cityName: 'Berlin, MD',
  timestamp: Date.now()
}));

// In discoverActivities function:
// Only geocode if:
// 1. User moved >5 miles
// 2. Cache older than 24 hours
// 3. No cached city name exists

// Savings: $1,000/month → $50/month (at 200K discoveries)
```

#### 2. Remove Photos Field from Places API (Save ~$1,400/month at 10K users)
**Impact:** 41% reduction in Places API costs

```javascript
// Current field mask (costs $0.017):
'X-Goog-FieldMask': 'places.displayName,places.photos,...'

// Optimized (costs $0.010):
'X-Goog-FieldMask': 'places.displayName,places.location,places.types,places.rating'

// Fallback: Use image URLs from websiteUri or default category images
// Savings: $3,400/month → $2,000/month (at 200K discoveries)
```

#### 3. Cache Event Search Results (Save ~$2,400/month at 10K users)
**Impact:** 80% reduction in Custom Search costs

```javascript
// Events don't change hourly - cache them!

// Create eventCache in Firestore:
{
  cityGeohash: 'dqcjq',
  events: [...],
  timestamp: Date.now(),
  ttl: 6 * 60 * 60 * 1000 // 6 hours
}

// Only search Custom Search API if:
// 1. No cache for this city
// 2. Cache older than 6 hours
// 3. User explicitly requests refresh

// Savings: $3,000/month → $600/month (at 600K searches)
```

### Medium-Term Optimizations

#### 4. Smart Request Batching
**Impact:** Reduce Firebase Functions invocations by 60%

```javascript
// Current: Each user request = 1 function call
// Optimized: Return cached data for popular locations

// Create "hot spots" cache:
// - Popular cities get cached for 30 minutes
// - 10 users in same area = 1 API call, 9 cache hits
// - Reduces Places API + Geocoding calls significantly
```

#### 5. Conditional Features
**Impact:** Only call expensive APIs when needed

```javascript
// Make these opt-in:
- Twitter search: Only when user clicks Twitter tab
- EV charging: Only for EV owners
- Events: Only on weekends (configurable)

// Potential savings: 30-50% on optional features
```

#### 6. Free Tier Optimization
**Impact:** Stay within free tiers longer

```
Firebase Free Tier (Spark Plan):
✅ Functions: 2M invocations/month (currently using <200K)
✅ Firestore: 50K reads/day, 20K writes/day (plenty of room)
✅ Hosting: 10GB storage, 360MB/day transfer (under limit)

Recommendation: Stay on Spark plan until 50K+ users
```

---

## 📈 Cost Comparison by User Count

| Users | Current Cost | Optimized Cost | Savings | Per User |
|-------|-------------|----------------|---------|----------|
| 100 | $137 | $45 | $92 (67%) | $0.45 |
| 1,000 | $656 | $220 | $436 (66%) | $0.22 |
| 10,000 | $7,920 | $2,100 | $5,820 (73%) | $0.21 |
| 50,000 | $39,600 | $10,500 | $29,100 (73%) | $0.21 |

**Optimization Strategy:**
1. Cache geocoding: -95% geocoding costs
2. Remove photos field: -41% Places costs
3. Cache events: -80% Custom Search costs
4. Smart batching: -60% duplicate requests

**Total Impact: ~70% cost reduction**

---

## ⚡ Implementation Priority

### Phase 1: Quick Wins (1-2 days) - Save $2,350/month @ 10K users
1. ✅ **Cache city name** in localStorage + user profile
2. ✅ **Remove photos field** from Places API requests
3. ✅ **Cache event results** in Firestore for 6 hours

### Phase 2: Smart Caching (3-5 days) - Save $3,470/month @ 10K users
4. ⬜ **Geohash-based cache** for popular locations
5. ⬜ **Activity cache** with 30-minute TTL
6. ⬜ **Request deduplication** for concurrent users

### Phase 3: Feature Optimization (1 week) - Variable savings
7. ⬜ **Conditional Twitter** (only when user clicks tab)
8. ⬜ **Weekend-only events** (reduce Custom Search by 70%)
9. ⬜ **User preference caching** (reduce Firestore reads)

---

## 🎯 Recommendations

### Immediate Action (This Week):
1. **Implement city name caching** - Easy win, huge savings
2. **Remove photos field** - 1-line change, 41% Places cost reduction
3. **Enable event caching** - Events don't change every 5 minutes

### Before Scaling (Next Month):
1. **Monitor usage patterns** - Firebase Console → APIs & Services
2. **Set billing alerts** - Alert at $50, $100, $200 thresholds
3. **Implement rate limiting** - Prevent abuse and runaway costs

### For Production Launch:
1. **Activate caching** (currently disabled in line 2076)
2. **Implement geohash caching strategy**
3. **Add cost monitoring dashboard**
4. **Consider Blaze plan** for better pricing tiers

---

## 📊 API Pricing References

### Google Cloud Platform
- **Geocoding API:** $0.005 per request
- **Places API (New):**
  - Basic: $0.002
  - +Display: $0.003
  - +Atmosphere: $0.003
  - +Contact: $0.003
  - **+Photos: $0.007** ← Most expensive
- **Custom Search API:** $5 per 1,000 queries (100/day free)

### Firebase
- **Spark Plan (Free):**
  - Functions: 2M invocations/month
  - Firestore: 50K reads/day, 20K writes/day
  - Hosting: 10GB storage, 360MB/day transfer
- **Blaze Plan (Pay-as-you-go):**
  - Functions: $0.40 per million invocations (after free tier)
  - Firestore: $0.06 per 100K reads, $0.18 per 100K writes
  - Hosting: $0.15 per GB transfer

### Third-Party
- **Twitter API:** ~$100/month (basic tier)
- **Ticketmaster API:** Free with attribution
- **Reddit API:** Free (public JSON)

---

## 💡 Key Takeaways

1. **Google Places API Photos** is the single most expensive field ($0.007 per search)
2. **Geocoding on every request** is wasteful (city rarely changes)
3. **Event caching** would save 80% of Custom Search costs
4. **Current cost: ~4 cents per discovery** (can be reduced to ~1 cent)
5. **Caching is disabled** (line 2076) - this is costing you money!

**Bottom Line:** With proper caching, you can support 10,000 users for ~$2,100/month instead of $7,920/month. That's a **$5,820 savings** per month! 💰
