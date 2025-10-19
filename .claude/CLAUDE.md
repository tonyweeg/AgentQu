# AgentQu - AI Activity Discovery Platform

**Live:** https://agentqu-platform.web.app
**Stack:** React + TypeScript + Firebase (Functions, Firestore, Hosting, Auth)
**Version:** v2.0-refactored
**Release:** v2.0 SOLID Refactoring - The Tightest App on the Internet 🎯
**Tags:** v1.0-pre-refactoring (rollback point), v2.0-refactored (current)

---

## 🏗️ Architecture (SOLID Foundation)

**Clean Architecture Pattern:**
- **API Clients** → External services (Google, Twitter, Ticketmaster, Weather)
- **Services** → Business logic (Activity, Location, Social, Trip, Weather, Cirqle)
- **Repositories** → Data access (Activity, User, Trip, Cirqle)
- **Utils** → Shared logic (scoring, mappings, distance, validation)

**Principles:**
1. **S**ingle Responsibility - Each class has one reason to change
2. **O**pen/Closed - Open for extension, closed for modification
3. **L**iskov Substitution - Derived classes are substitutable
4. **I**nterface Segregation - No unused interfaces
5. **D**ependency Inversion - Depend on abstractions

**Production-Ready:** Test in browser console first, always validate before deploy

---

## 📁 Project Structure

```
AgentQu/
├── agentqu-app/src/          # Frontend (React + TypeScript)
│   ├── components/           # ActivityCard, Settings, Map, LocalFlavorColumn
│   ├── hooks/                # useAuth, useLocation, useDiscovery, useTwitter
│   ├── lib/                  # types.ts, affinityCategories.ts
│   └── App.tsx               # Main application shell
│
├── functions/                # Backend (Firebase Cloud Functions)
│   ├── src/
│   │   ├── api/              # API Clients Layer
│   │   │   ├── BaseApiClient.js         # Base class with retry/cache
│   │   │   ├── GooglePlacesClient.js    # Google Places API
│   │   │   ├── GoogleSearchClient.js    # Google Custom Search
│   │   │   ├── TwitterClient.js         # Twitter/X API v2
│   │   │   ├── TicketmasterClient.js    # Ticketmaster Discovery API
│   │   │   └── WeatherClient.js         # OpenWeather API
│   │   │
│   │   ├── services/         # Business Logic Layer
│   │   │   ├── ActivityService.js                # Activity discovery orchestration
│   │   │   ├── ActivityDataFetcherService.js     # External API integration
│   │   │   ├── ActivityUserInteractionService.js # User reviews/voting/check-ins
│   │   │   ├── LocationService.js                # Geocoding & nearby towns
│   │   │   ├── SocialService.js                  # Twitter & VibeIndex
│   │   │   ├── TripService.js                    # There-Then planning
│   │   │   ├── WeatherService.js                 # Weather & environmental
│   │   │   └── CirqleService.js                  # Social circles
│   │   │
│   │   ├── repositories/     # Data Access Layer
│   │   │   ├── BaseRepository.js        # Firestore base operations
│   │   │   ├── ActivityRepository.js    # Activity CRUD
│   │   │   ├── UserRepository.js        # User profiles
│   │   │   ├── TripRepository.js        # Trip data
│   │   │   └── CirqleRepository.js      # Cirqle data
│   │   │
│   │   ├── utils/            # Shared Utilities
│   │   │   ├── scoring/              # Strategy Pattern Scoring System
│   │   │   │   ├── ScoringStrategy.js        # Base strategy class
│   │   │   │   ├── strategies.js             # 8 concrete strategies
│   │   │   │   ├── CompositeScorer.js        # Orchestrator
│   │   │   │   └── index.js                  # Exports & backward compat
│   │   │   ├── scoring.js               # Legacy scoring (uses strategies)
│   │   │   ├── mappings.js              # Category/genre mappings
│   │   │   ├── distance.js              # Geospatial calculations
│   │   │   ├── validation.js            # Input validation
│   │   │   └── logger.js                # Structured logging
│   │   │
│   │   ├── config/           # Configuration
│   │   │   ├── api-keys.js              # API key management
│   │   │   ├── constants.js             # App constants
│   │   │   └── firebase.js              # Firebase admin setup
│   │   │
│   │   └── functions/        # Function Exports (25 total)
│   │       ├── activities.js            # Activity functions
│   │       ├── location.js              # Location functions
│   │       ├── social.js                # Social/Twitter functions
│   │       ├── trips.js                 # Trip planning functions
│   │       ├── cirqles.js               # Social circle functions
│   │       └── weather.js               # Weather functions
│   │
│   ├── index.js              # Main function exports
│   └── .env                  # Environment variables (not in git)
│
└── .claude/CLAUDE.md         # This file
```

---

## 🎯 v2.0 Refactoring Highlights

### Backend Improvements

**Strategy Pattern Scoring (MEDIUM 10)**
- Converted monolithic scoring to 8 focused strategies
- Each strategy scores one aspect (distance, rating, affinity, etc.)
- CompositeScorer orchestrates all strategies
- **Benefit:** Add new scoring factors without modifying existing code

**Service Separation (HIGH 4)**
- Split ActivityService (567→237 lines, 58% reduction)
- **ActivityDataFetcherService** - Handles all API fetching & transformation
- **ActivityUserInteractionService** - Handles reviews, voting, check-ins
- **ActivityService** - Orchestration only
- **Benefit:** Clear separation of concerns, easier testing

### Frontend Improvements

**Component Extraction (HIGH 5)**
- Reduced App.tsx (2,219→1,950 lines, 12% reduction)
- **ViewModeSelector** (108 lines) - List/Map/Off-Grid toggle
- **CategoryFilter** (197 lines) - Horizontal scrollable chips
- **ActivityListView** (57 lines) - Responsive grid
- **LoadingScreen** (38 lines) - Consistent loading states
- **LocationErrorScreen** (68 lines) - User-friendly errors
- **Benefit:** Reusable components, easier maintenance

**React Performance (LOW 20)**
- React.memo on 4 critical components
- useMemo for expensive calculations (isVisited lookup)
- 99% reduction in re-renders (10,000→100 on 100-item grids)
- Bundle size impact: +130B (0.04%, negligible)
- **Benefit:** Faster UI, better mobile performance

### Code Quality Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| ActivityService | 567 lines | 237 lines | -58% |
| App.tsx | 2,219 lines | 1,950 lines | -12% |
| React re-renders (100 items) | ~10,000 | ~100 | -99% |
| Bundle size | 300.34 KB | 300.47 KB | +0.04% |
| Scoring modularity | Monolithic | 8 strategies | ♾️ |

**Documentation:** See `docs/REFACTORING-SESSION-2-SUMMARY.md` for complete details

---

## 🔑 Core Features

### Data Sources
1. **Google Places API** - Venues, attractions, restaurants (60+ results)
2. **Google Custom Search** - Events, activities (web scraping)
3. **Ticketmaster API** - Live events with affiliate tracking (NEW!)
4. **Twitter/X API** - Local buzz, trending activities
5. **EV Charging API** - Charging stations for EV owners (Google Places New API)
6. **Weather APIs** - OpenWeather for forecasts

### Discovery Algorithm (Strategy Pattern - v2.0)

**Scoring System:** 8 extensible strategies orchestrated by CompositeScorer

```javascript
// Base Score: 100 points
// Bonus Strategies (8 total):
1. DistanceScoringStrategy      → 0-30 points
2. RatingScoringStrategy        → 0-20 points
3. AffinityScoringStrategy      → 0-40 points (personalization!)
4. OpenNowScoringStrategy       → 0-10 points
5. FreeScoringStrategy          → 0-5 points
6. PopularityScoringStrategy    → 0-15 points
7. MusicGenreScoringStrategy    → 0-10 points (for events)
8. EVChargingBonusStrategy      → 0-15 points (for EV owners)

Total Range: 100-245 points
```

**Extensibility:** Add new scoring factors by creating new strategy classes (Open/Closed Principle)

**Files:**
- `functions/src/utils/scoring/strategies.js` - 8 concrete strategies
- `functions/src/utils/scoring/CompositeScorer.js` - Orchestrator
- `functions/src/utils/scoring/ScoringStrategy.js` - Base class

### Personalization
- **28+ Affinity Categories** (0-100 scale per user)
- **Music Genre Matching** (Ticketmaster events)
- **Restaurant Genre Filtering** (cuisine preferences)
- **EV Owner Detection** (automatic charging station inclusion)

---

## 🚀 25 Cloud Functions

### Activities (5)
- `discoverActivities` - Main discovery with all sources
- `submitReview` - User reviews
- `voteActivity` - Upvote/downvote
- `checkInActivity` - User check-ins
- `getUserHistory` - User activity history

### Location (2)
- `geocode` - Address → coordinates
- `getNearbyTowns` - Find adjacent cities

### Trips (3)
- `createTrip` - There-Then trip planning
- `scoreThereThenActivities` - Future date scoring
- `getUserTrips` - User's saved trips

### Social/Cirqles (5)
- `createCirqle` - Create social circle
- `inviteToCirqle` - Send invite
- `addExistingUserToCirqle` - Add user
- `joinCirqle` - Accept invite
- `getUserCirqles` - User's circles

### Twitter/VibeIndex (3)
- `searchTwitter` - 3-strategy location search
- `calculateVibeIndex` - 8-category vibe scoring
- `getVibeIndex` - Retrieve city vibe scores

### Weather (4)
- `getWeatherForecast` - Weather forecast
- `getAirQuality` - Air quality index
- `getSolarData` - UV/solar data
- `getEnvironmentalData` - Combined environmental

### Utilities (3)
- `clearCache` - Manual cache clear
- `healthCheck` - System health
- `cleanupExpired` - Scheduled cleanup

---

## 🔐 Environment Variables

**Required in `functions/.env`:**
```bash
# Google APIs
GOOGLE_PLACES_API_KEY=AIzaSyB5woqsEw_L7iESL2Gh-m47mQ4HPemb84w
GOOGLE_SEARCH_API_KEY=AIzaSyB5woqsEw_L7iESL2Gh-m47mQ4HPemb84w
GOOGLE_SEARCH_ENGINE_ID=d4e4ed3d41b444bd3
GOOGLE_GEOCODING_API_KEY=AIzaSyDKTAxMKuQ4-KsuP7vr7HbvteNTYvDyWjw

# Twitter API
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAC%2FO4gEAAAAAMU4rr4aNcopfCqSmJ%2BIH6xGNss0%3D7LoqD8Twr6zRB46Wv4xEPRWsKskO5OWTjvlNfpZ4kgVLK1QqlF

# Weather API
OPENWEATHER_API_KEY=ced5512b9799c4333d48ab97a0e716f5
OPEN_WEATHER_API_KEY=ced5512b9799c4333d48ab97a0e716f5

# Ticketmaster API
TICKETMASTER_API_KEY=b1LnYR9vt6soGEMJO2qQwmcgpUoBb9Cf
TICKETMASTER_CONSUMER_SECRET=WPKT9MvcbGGYzQPX
TICKETMASTER_AFFILIATE_ID=6598326
TICKETMASTER_MARKET=United States

# Eventbrite (not yet active)
EVENTBRITE_PRIVATE_TOKEN=placeholder
```

---

## 🛠️ Development Workflow

### Deploy Commands
```bash
# Backend functions
cd functions && npm run deploy          # All functions
firebase deploy --only functions        # Same as above

# Frontend
cd agentqu-app && npm run build && cd .. && firebase deploy --only hosting

# Full deploy
firebase deploy

# Specific function
firebase deploy --only functions:discoverActivities
```

### Git Workflow
```bash
git checkout -b "feature-name"          # Create feature branch
git add -A && git commit -m "type: description"
git push origin feature-name            # Push for review
git checkout main && git merge feature-name  # Merge when ready
git push origin main                    # Push to production
```

### Testing
```bash
# Backend logs
firebase functions:log

# Clear cache
curl https://clearcache-gnr47betrq-uc.a.run.app

# Health check
curl https://healthcheck-gnr47betrq-uc.a.run.app
```

---

## 🐛 Debugging

### Log Categories (Structured Logging)
- `ACTIVITY_SERVICE` - Activity discovery
- `LOCATION_SERVICE` - Geocoding
- `SOCIAL_SERVICE` - Twitter/VibeIndex
- `TRIP_SERVICE` - Trip planning
- `GOOGLE_PLACES` - Places API
- `GOOGLE_SEARCH` - Custom Search API
- `TICKETMASTER` - Ticketmaster API
- `TWITTER` - Twitter API

### Console Emoji Prefixes (Frontend)
- 🔍 AGENTQU_DEBUG
- 🗺️ CLIENT DEBUG
- ⚡ EV CHARGING

### Common Issues
1. **Zero activities**
   - Check API keys in `.env`
   - Verify user affinities in Firestore
   - Clear cache: `curl https://clearcache-gnr47betrq-uc.a.run.app`

2. **No EV charging stations**
   - Verify user has `isEV: true` in Firestore (`users/{uid}`)
   - Check logs for "User is EV owner" message
   - Verify Google Places API key has new Places API enabled

3. **Ticketmaster events missing**
   - Check API key is valid
   - Verify within supported markets (United States)
   - Check date range (default: 3 days)

4. **Wrong activity scores**
   - Verify user affinities saved correctly
   - Check category mappings in `utils/mappings.js`
   - Review scoring algorithm in `utils/scoring.js`

---

## 📊 Data Models

### Firestore Collections

**users/{uid}**
```javascript
{
  email: string,
  affinities: { [categoryId]: 0-100 },
  musicGenreAffinities: { [genreId]: 0-100 },
  restaurantGenreAffinities: { [cuisineId]: 0-100 },
  isEV: boolean,                    // EV owner flag
  createdAt: timestamp,
  settings: { ... }
}
```

**activities/{id}**
```javascript
{
  name: string,
  type: 'permanent' | 'event',
  location: { lat, lng, address, geohash },
  categories: string[],
  score: number,
  scoreBreakdown: { ... },
  source: 'google_places' | 'ticketmaster' | 'custom_search',
  images: string[],
  ...
}
```

**vibeScores/{cityId}**
```javascript
{
  cityName: string,
  scores: {
    volume: 0-100,
    engagement: 0-100,
    diversity: 0-100,
    recency: 0-100,
    events: 0-100,
    positivity: 0-100,
    foodAndDrink: 0-100,
    entertainment: 0-100
  },
  calculatedAt: timestamp
}
```

---

## ✅ Recent Fixes (v1.0)

1. **Parameter passing bug** - Fixed geocode function parameter order
2. **Activity type filtering** - Changed 'venue' → 'permanent' to match frontend
3. **EV charging restoration** - Restored EV charging station fetching
4. **Invalid isReady() call** - Fixed GooglePlacesClient method call
5. **Ticketmaster integration** - Added event discovery with affiliate links

---

## 🎯 Next Steps

### Immediate Improvements
- [ ] Implement cache TTL (currently manual clear only)
- [ ] Add virtual scrolling for performance
- [ ] Build VibeIndex frontend UI
- [ ] Add more event sources (Eventbrite, Meetup)

### v1.1 Goals
- Improved caching strategy with auto-expiry
- Performance optimization (lazy loading, virtual scrolling)
- Event quality improvements
- Better mobile performance

### Future Features
- Trip planner frontend UI
- Social features (Cirqles) frontend
- Push notifications for events
- Favorites/bookmarks
- Calendar integration

---

## 📝 Important Notes

1. **Always test in browser console first** before committing
2. **SOLID principles** - Keep classes focused and testable
3. **Error handling** - All API calls wrapped in try/catch
4. **Logging** - Use structured logger with categories
5. **Validation** - Validate all inputs using `utils/validation.js`
6. **Type safety** - Use proper type checking (TODO: add TypeScript to backend)

---

## 🎯 AgentQu Skills (Automated Workflows)

**Location:** `.claude/skills/`
**Reference:** See `SKILLS-REFERENCE.md` for complete trigger patterns

### 🤖 Auto-Invoke Rules

**Claude should automatically invoke skills based on user requests without asking permission.**

### Skill Trigger Patterns

#### 🚀 agentqu-deploy
**Auto-invoke when user says:**
- "deploy", "push to production", "release", "publish"
- "deploy functions", "deploy hosting", "update production"
- After completing features and user mentions deployment

**Example:** "Deploy to production" → Automatically invoke skill

---

#### 🐛 agentqu-debug
**Auto-invoke when user says:**
- "not working", "bug", "error", "issue", "problem"
- "why isn't X showing", "activities not loading", "nothing appears"
- "check logs", "debug this", "what's wrong"

**Example:** "Activities aren't loading" → Automatically invoke skill

---

#### 🏗️ agentqu-architecture
**Auto-invoke when user says:**
- "where should I put", "where do I add", "how do I structure"
- "new feature", "new API", "add integration", "create service"
- "which file", "what layer", "service or repository"

**Example:** "Where should I add Yelp integration?" → Automatically invoke skill

---

#### 👤 agentqu-user-profile
**Auto-invoke when user says:**
- "test personalization", "create test user", "test affinities"
- "test different profiles", "simulate user", "affinity testing"
- "reset user", "change affinities"

**Example:** "Create a test user who loves nightlife" → Automatically invoke skill

---

#### 🔑 agentqu-api-verify
**Auto-invoke when user says:**
- "API not working", "getting 401 errors", "authentication failed"
- "check API keys", "verify environment", "test APIs"
- "setup", "configuration", ".env file"

**Example:** "Check if all API keys are configured" → Automatically invoke skill

---

#### 🎯 agentqu-score-explain
**Auto-invoke when user says:**
- "why is X scoring", "why does this have high/low score", "explain score"
- "why is this ranked higher", "scoring seems wrong"
- "score breakdown", "affinity not working"

**Example:** "Why is Blue Moon Cafe scoring 187?" → Automatically invoke skill

---

#### 💾 agentqu-cache-manager
**Auto-invoke when user says:**
- "seeing old data", "changes not showing", "stale results"
- "clear cache", "cache status", "refresh data"
- "cache", "old activities", "not updating"

**Example:** "Clear the cache" → Automatically invoke skill

---

### Skill Chaining

**Deploy Flow:**
```
User: "Let's deploy"
1. [agentqu-debug] - "Test in browser console first?"
2. Wait for confirmation
3. [agentqu-deploy] - Execute deployment
```

**Debug Flow:**
```
User: "Activities aren't loading"
1. [agentqu-debug] - Check logs
2. If API errors → [agentqu-api-verify]
3. If cache issue → [agentqu-cache-manager]
4. If scoring → [agentqu-score-explain]
```

**New Feature Flow:**
```
User: "Add Spotify integration"
1. [agentqu-architecture] - Guide placement
2. Implement feature
3. [agentqu-user-profile] - Create test users
4. [agentqu-debug] - Browser console testing
5. [agentqu-deploy] - Deploy when ready
```

### Priority Order

When multiple skills apply, use this order:
1. **agentqu-debug** - Fix errors FIRST
2. **agentqu-api-verify** - If API-related
3. **agentqu-cache-manager** - If data staleness
4. **agentqu-architecture** - If adding code
5. **agentqu-user-profile** - If testing
6. **agentqu-score-explain** - If explaining
7. **agentqu-deploy** - Always LAST

### Quick Reference
```
deploy → agentqu-deploy
debug/error → agentqu-debug
where/structure → agentqu-architecture
test user → agentqu-user-profile
API/keys → agentqu-api-verify
score/why → agentqu-score-explain
cache/stale → agentqu-cache-manager
```

**Remember:** Skills are workflow accelerators - use them proactively to save time!

---

**Current Branch:** main
**Current Tag:** v2.0-refactored
**Rollback Tag:** v1.0-pre-refactoring (safe restore point)
**Last Updated:** October 19, 2025
**Status:** ✅ Production Stable - v2.0 Refactored (The Tightest App on the Internet)
