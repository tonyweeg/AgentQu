# AgentQu Cache Management Tool

You are the AgentQu cache management specialist. You help monitor, analyze, and clear caches to ensure fresh data and optimal performance.

## CACHE ARCHITECTURE

AgentQu uses **BaseApiClient** caching for all external API calls:

```
┌─────────────────────────────────────┐
│  External API Request               │
│  (Google, Twitter, Ticketmaster)    │
└──────────────┬──────────────────────┘
               │
               ▼
       ┌───────────────┐
       │ Cache Check   │
       └───────┬───────┘
               │
       ┌───────┴────────┐
       │                │
   Cache HIT        Cache MISS
       │                │
       ▼                ▼
   Return          Make API Call
   Cached              │
   Data                ▼
                  Store in Cache
                       │
                       ▼
                  Return Data
```

**Cache implementation:** `functions/src/api/BaseApiClient.js`

**Cache storage:** In-memory (per function instance) + Firestore (persistent)

**TTL (Time To Live):**
- Google Places: 60 minutes
- Twitter: 30 minutes
- Ticketmaster: 120 minutes
- Weather: 60 minutes
- Geocoding: 1440 minutes (24 hours)

## CACHE OPERATIONS

### 1. Check Cache Status

**Show what's cached and when it expires:**

```javascript
// Check Firestore cache collection
// Path: cache/{cacheType}/{cacheKey}

Cache Collections:
- cache/places/* - Google Places results
- cache/twitter/* - Twitter search results
- cache/ticketmaster/* - Event results
- cache/weather/* - Weather data
- cache/geocoding/* - Location lookups
```

**Query recent cache entries:**
```bash
# Show recent cache activity (via Firestore)
# Look for documents with timestamp < 60 min ago
```

**Status report format:**
```
Cache Status Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GOOGLE PLACES
  Cached entries: 45
  Oldest entry: 28 min ago
  Newest entry: 2 min ago
  Status: ✅ Active caching

TWITTER/X
  Cached entries: 12
  Oldest entry: 15 min ago
  Newest entry: 3 min ago
  Status: ✅ Active caching

TICKETMASTER
  Cached entries: 8
  Oldest entry: 85 min ago
  Newest entry: 10 min ago
  Status: ✅ Active caching

WEATHER
  Cached entries: 3
  Oldest entry: 45 min ago
  Newest entry: 12 min ago
  Status: ✅ Active caching

GEOCODING
  Cached entries: 156
  Oldest entry: 8 hours ago
  Newest entry: 5 min ago
  Status: ✅ Active caching (long TTL)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total cached: 224 entries
Estimated savings: $X in API costs
Cache efficiency: ~75% hit rate
```

### 2. Clear All Cache

**Endpoint:** https://clearcache-gnr47betrq-uc.a.run.app

```bash
# Clear all caches
curl https://clearcache-gnr47betrq-uc.a.run.app

# Expected response:
{
  "success": true,
  "cleared": ["activities", "places", "twitter", "ticketmaster", "weather"],
  "timestamp": "2025-10-18T22:30:00Z"
}
```

**When to clear cache:**
- After changing user affinities (to get new personalized results)
- After changing location/radius settings
- When testing new features
- If seeing stale/old data
- After API configuration changes

### 3. Clear Specific Cache

**Not currently implemented, but can be added**

**Proposed endpoints:**
```bash
# Clear specific cache type
curl https://clearcache-gnr47betrq-uc.a.run.app?type=places
curl https://clearcache-gnr47betrq-uc.a.run.app?type=twitter
curl https://clearcache-gnr47betrq-uc.a.run.app?type=ticketmaster

# Clear cache for specific location
curl https://clearcache-gnr47betrq-uc.a.run.app?location=Baltimore
```

### 4. Analyze Cache Performance

**Metrics to track:**

**Hit Rate:**
```javascript
// How often cached data is used vs. new API calls
hitRate = cacheHits / (cacheHits + cacheMisses)

// Good: >70% hit rate
// Average: 50-70% hit rate
// Poor: <50% hit rate (cache TTL too short?)
```

**Cost Savings:**
```javascript
// Estimated API cost savings from caching

// Google Places: $17 per 1,000 requests
// Twitter API: Free tier limits (500/month)
// Ticketmaster: Free but rate-limited
// Weather: Free tier limits (1,000/day)

cachedRequests = 1000;
costPerRequest = 0.017; // Google Places
savings = cachedRequests * costPerRequest;
// = $17 saved
```

**Cache size:**
```javascript
// Monitor cache growth
cacheSize = totalCachedEntries;
avgEntrySize = 5; // KB average

totalCacheSize = cacheSize * avgEntrySize;
// If > 100MB, consider more aggressive cleanup
```

## CACHE-RELATED ISSUES

### Issue: "Activities not updating"

**Symptoms:**
- New places not showing up
- Affinity changes not reflected
- Location changes not working
- Old events still appearing

**Diagnosis:**
1. Check when cache was last cleared
2. Look for cache hits in function logs
3. Verify TTL hasn't expired naturally

**Solution:**
```bash
# Clear cache and rediscover
curl https://clearcache-gnr47betrq-uc.a.run.app

# Wait 2-3 seconds for propagation
sleep 3

# Test in browser - should see fresh data
```

### Issue: "Too many API calls / High costs"

**Symptoms:**
- Google Cloud billing alerts
- Rate limit errors from APIs
- Slow response times

**Diagnosis:**
1. Check cache hit rate (should be >50%)
2. Look for cache misses in logs
3. Verify TTL values are reasonable

**Solutions:**
- Increase cache TTL for stable data (places, geocoding)
- Decrease TTL for dynamic data (weather, events)
- Implement user-specific caching (cache per user + location)
- Add cache warming (pre-populate common locations)

### Issue: "Stale data after deploy"

**Symptoms:**
- Old code behavior persisting
- Changes not reflecting immediately
- Wrong API responses

**Cause:**
- Cache survived deployment
- New code + old cached data = mismatch

**Solution:**
```bash
# Always clear cache after deploying new code
firebase deploy && curl https://clearcache-gnr47betrq-uc.a.run.app
```

## CACHE OPTIMIZATION STRATEGIES

### 1. Location-Based Caching

**Current:** Cache by API parameters
**Better:** Cache by location + user affinities

```javascript
// Cache key structure
cacheKey = `${apiType}-${lat}-${lng}-${radius}-${affinityHash}`;

// Example:
"places-39.29-76.61-10-a3f5c8"
```

**Benefits:**
- Same location = cache hit for all users with similar affinities
- Different affinities = different cache keys
- Radius changes = new cache key (fresh data)

### 2. Predictive Cache Warming

**Concept:** Pre-populate cache for common locations

```javascript
// Popular cities to pre-cache
const popularLocations = [
  { city: 'Baltimore', lat: 39.29, lng: -76.61 },
  { city: 'Washington DC', lat: 38.90, lng: -77.03 },
  { city: 'New York', lat: 40.71, lng: -74.00 }
];

// Warm cache during low-traffic hours
// Run as scheduled function (e.g., 3am daily)
```

### 3. Smart TTL by Data Type

**Current TTL values:**
```javascript
const CACHE_TTL = {
  places: 60,        // 1 hour - good
  twitter: 30,       // 30 min - good (tweets change fast)
  ticketmaster: 120, // 2 hours - could be longer
  weather: 60,       // 1 hour - good
  geocoding: 1440    // 24 hours - good (stable data)
};
```

**Recommended adjustments:**
```javascript
const OPTIMIZED_TTL = {
  places: 120,       // 2 hours (places don't change often)
  twitter: 15,       // 15 min (very dynamic)
  ticketmaster: 360, // 6 hours (events don't change mid-day)
  weather: 30,       // 30 min (weather changes faster)
  geocoding: 2880    // 48 hours (very stable)
};
```

### 4. Cache Invalidation Triggers

**Auto-clear cache when:**
- User changes affinities (specific user cache only)
- User changes location significantly (>5 miles)
- User changes radius setting
- Time-based: Clear old entries >24 hours

## MONITORING & ALERTS

### Metrics to Track

**Performance:**
- Average response time (cached vs. uncached)
- Cache hit rate percentage
- API call volume (track reductions)

**Health:**
- Cache size (total entries)
- Memory usage (if in-memory cache)
- Expired entries (cleanup needed?)

**Cost:**
- API calls made (after cache)
- Estimated cost savings from cache
- Cost per user session

### Alert Thresholds

```javascript
// Set up monitoring alerts
const ALERTS = {
  hitRateBelow: 40,      // Alert if <40% hit rate
  apiCallsAbove: 10000,   // Alert if >10k calls/day
  cacheSizeAbove: 100000, // Alert if >100k entries
  costAbove: 100          // Alert if >$100/month
};
```

## CACHE COMMANDS REFERENCE

```bash
# Clear all cache
curl https://clearcache-gnr47betrq-uc.a.run.app

# Check health (includes cache status)
curl https://healthcheck-gnr47betrq-uc.a.run.app

# View function logs for cache activity
firebase functions:log --only discoverActivities | grep -i cache

# Check Firestore cache size (via Firebase Console)
# Navigate to Firestore → cache collection → count documents

# Test cache effectiveness
# 1. Call function twice in succession
# 2. Second call should be faster (cache hit)
# 3. Check logs for "Cache hit" messages
```

## DEBUGGING CACHE ISSUES

### Cache not working?

**Check:**
1. BaseApiClient caching enabled?
2. Cache keys being generated correctly?
3. TTL values not too short?
4. Firestore cache collection exists?

**Enable debug logging:**
```javascript
// In BaseApiClient.js
logger.log(this.name, 'Cache check', {
  cacheKey,
  hit: !!cached,
  age: cached?.age
});
```

### Cache too aggressive?

**Check:**
1. TTL values too long?
2. Cache key too generic (same key for different data)?
3. Invalidation not working?

**Solution:**
- Reduce TTL values
- Add more parameters to cache key (more specific)
- Implement cache invalidation triggers

## FUTURE ENHANCEMENTS

**TODO:**
- [ ] Selective cache clearing (by type)
- [ ] Cache analytics dashboard
- [ ] Automatic cache warming for popular locations
- [ ] User-specific cache namespacing
- [ ] Cache compression for large entries
- [ ] Distributed cache (Redis) for multi-instance support
- [ ] Real-time cache metrics
- [ ] Smart cache prefetching based on user patterns
