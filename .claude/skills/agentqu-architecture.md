# AgentQu SOLID Architecture Navigator

You are the AgentQu architecture specialist. You help developers understand where to place new code following SOLID principles and the established architecture.

## ARCHITECTURE OVERVIEW

AgentQu follows **Clean Architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────┐
│  External APIs (Google, Twitter, Ticketmaster)  │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  API Clients Layer (functions/src/api/)         │
│  - BaseApiClient (retry, cache, error handling) │
│  - GooglePlacesClient, TwitterClient, etc.      │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  Services Layer (functions/src/services/)       │
│  - Business logic and orchestration             │
│  - ActivityService, LocationService, etc.       │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  Repositories Layer (functions/src/repositories)│
│  - Data access abstraction                      │
│  - BaseRepository, ActivityRepository, etc.     │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  Firestore Database                             │
└─────────────────────────────────────────────────┘
```

**Shared across all layers:**
- `functions/src/utils/` - Scoring, mappings, distance, validation, logging
- `functions/src/config/` - API keys, constants, Firebase config

## DECISION TREE: WHERE DOES NEW CODE GO?

### Question 1: What type of code are you adding?

#### A) New External API Integration

**→ Create new API client in `functions/src/api/`**

**Template:**
```javascript
// functions/src/api/NewApiClient.js
const BaseApiClient = require('./BaseApiClient');

class NewApiClient extends BaseApiClient {
  constructor() {
    super('NEW_API', 60); // name, cacheTTL
  }

  async fetchData(params) {
    const cacheKey = `new-api-${params.id}`;
    return this.makeRequest(
      'https://api.example.com/endpoint',
      { params },
      cacheKey
    );
  }
}

module.exports = NewApiClient;
```

**Benefits of extending BaseApiClient:**
- Automatic retry logic (3 attempts)
- Built-in caching (TTL-based)
- Consistent error handling
- Request logging

**Export in:** `functions/src/api/index.js`

---

#### B) Business Logic / Feature Implementation

**→ Add to appropriate service in `functions/src/services/`**

**Which service?**
- **ActivityService** - Activity discovery, scoring, search
- **LocationService** - Geocoding, nearby towns, city detection
- **SocialService** - Twitter search, VibeIndex calculation
- **TripService** - Trip planning, There-Then features
- **WeatherService** - Weather forecasts, air quality, environmental
- **CirqleService** - Social circles, invites, group management

**Example: Adding new activity filtering**
```javascript
// functions/src/services/ActivityService.js

class ActivityService {
  // ... existing methods

  async filterByCustomCriteria(activities, criteria) {
    // New business logic here
    logger.log('ACTIVITY_SERVICE', `Filtering ${activities.length} activities`);

    // Use utils for shared logic
    const scored = this.scoringUtil.applyCustomScoring(activities, criteria);

    // Use repositories for data access
    await this.activityRepo.saveFiltered(scored);

    return scored;
  }
}
```

**Services should:**
- Contain business logic and orchestration
- Use API clients to fetch external data
- Use repositories for database operations
- Use utils for shared calculations
- NOT directly call Firebase APIs (use repositories)
- NOT have external API logic (use API clients)

---

#### C) Database Operations

**→ Add to repository in `functions/src/repositories/`**

**Which repository?**
- **ActivityRepository** - Activities CRUD
- **UserRepository** - User profiles, affinities
- **TripRepository** - Trip planning data
- **CirqleRepository** - Social circle data

**Example: Adding new query method**
```javascript
// functions/src/repositories/ActivityRepository.js

class ActivityRepository extends BaseRepository {
  constructor() {
    super('activities'); // collection name
  }

  // Add new query method
  async findByCustomCriteria(criteria) {
    const query = this.collection
      .where('category', '==', criteria.category)
      .where('score', '>=', criteria.minScore)
      .limit(criteria.limit || 50);

    return this.executeQuery(query); // from BaseRepository
  }
}
```

**Repositories should:**
- Extend BaseRepository for common operations
- Handle all Firestore queries and writes
- Return plain JavaScript objects (no Firestore references in services)
- Include proper error handling
- Use transaction support when needed

---

#### D) Shared Logic (Used by Multiple Services)

**→ Add to `functions/src/utils/`**

**Which util file?**
- **scoring.js** - Scoring algorithms, affinity calculations
- **mappings.js** - Category mappings, genre conversions
- **distance.js** - Geospatial calculations, geohash operations
- **validation.js** - Input validation, schema checking
- **logger.js** - Structured logging
- **i18n-categories.js** - Internationalization for categories

**Example: Adding new scoring logic**
```javascript
// functions/src/utils/scoring.js

function calculateCustomScore(activity, userProfile) {
  let score = 100; // base

  // Add scoring logic
  score += calculateDistanceScore(activity.location, userProfile.location);
  score += calculateAffinityScore(activity.categories, userProfile.affinities);

  return score;
}

module.exports = {
  calculateScore,
  calculateCustomScore, // ← new export
  // ... other exports
};
```

**Utils should:**
- Be pure functions when possible (no side effects)
- Be testable in isolation
- Not depend on services or repositories
- Be well-documented with examples

---

#### E) New Cloud Function Endpoint

**→ Add to `functions/src/functions/[domain].js`**

**Which domain file?**
- **activities.js** - Activity-related endpoints (5 functions)
- **location.js** - Location/geocoding endpoints (2 functions)
- **trips.js** - Trip planning endpoints (3 functions)
- **cirqles.js** - Social circle endpoints (5 functions)
- **social.js** - Twitter/VibeIndex endpoints (3 functions)
- **weather.js** - Weather endpoints (4 functions)

**Template:**
```javascript
// functions/src/functions/activities.js

const functions = require('firebase-functions');
const { ActivityService } = require('../services');
const { validateInput } = require('../utils/validation');
const logger = require('../utils/logger');

exports.newActivityEndpoint = functions.https.onCall(async (data, context) => {
  try {
    // Validate input
    validateInput(data, {
      required: ['param1', 'param2'],
      optional: ['param3']
    });

    // Get user ID if needed
    const uid = context.auth?.uid;

    // Use service for business logic
    const activityService = new ActivityService();
    const result = await activityService.doSomething(data, uid);

    logger.log('ACTIVITY_ENDPOINT', 'Success', { uid, resultCount: result.length });
    return { success: true, data: result };

  } catch (error) {
    logger.error('ACTIVITY_ENDPOINT', 'Error', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

**Export in:** `functions/src/functions/index.js`

**Then export to main:** `functions/index.js`

---

#### F) Configuration / Constants

**→ Add to `functions/src/config/`**

- **api-keys.js** - API key management with validation
- **constants.js** - App-wide constants (categories, limits, defaults)
- **firebase.js** - Firebase Admin SDK initialization

**Example: Adding new constant**
```javascript
// functions/src/config/constants.js

const ACTIVITY_CONSTANTS = {
  MAX_RESULTS: 50,
  DEFAULT_RADIUS: 10,
  SCORE_THRESHOLD: 100,
  NEW_CONSTANT: 'value' // ← Add here
};
```

---

## SOLID PRINCIPLES IN ACTION

### Single Responsibility Principle
**Each class has ONE reason to change**

✅ **Good:**
```javascript
// ActivityService only handles activity business logic
class ActivityService {
  async discoverActivities() { /* discovery logic */ }
  async scoreActivities() { /* scoring logic */ }
}

// GooglePlacesClient only handles Google Places API
class GooglePlacesClient {
  async searchPlaces() { /* API calls */ }
}
```

❌ **Bad:**
```javascript
// Service doing too much
class ActivityService {
  async discoverActivities() { /* business logic */ }
  async callGooglePlaces() { /* should be in client */ }
  async saveToFirestore() { /* should be in repository */ }
}
```

### Open/Closed Principle
**Open for extension, closed for modification**

✅ **Good:**
```javascript
// Extend BaseApiClient for new APIs
class TicketmasterClient extends BaseApiClient {
  // Add new functionality without modifying base
}
```

### Dependency Inversion
**Depend on abstractions, not concretions**

✅ **Good:**
```javascript
// Service depends on repository abstraction
class ActivityService {
  constructor(activityRepo = new ActivityRepository()) {
    this.activityRepo = activityRepo; // Can be mocked for testing
  }
}
```

---

## FILE ORGANIZATION CHECKLIST

Before adding new code, ask:

1. **Is this external API logic?** → API Client
2. **Is this business logic?** → Service
3. **Is this database logic?** → Repository
4. **Is this shared logic?** → Utils
5. **Is this a new endpoint?** → Functions
6. **Is this configuration?** → Config

## ANTI-PATTERNS TO AVOID

❌ **Don't put business logic in API clients**
```javascript
// BAD: GooglePlacesClient calculating scores
class GooglePlacesClient {
  async searchAndScore() { /* NO - scoring is business logic */ }
}
```

❌ **Don't put database calls in services**
```javascript
// BAD: Direct Firestore access in service
class ActivityService {
  async save(activity) {
    await admin.firestore().collection('activities').add(activity); // NO
  }
}
// GOOD: Use repository
class ActivityService {
  async save(activity) {
    await this.activityRepo.create(activity); // YES
  }
}
```

❌ **Don't duplicate logic across files**
```javascript
// BAD: Distance calculation in multiple places
// GOOD: Put in utils/distance.js, use everywhere
```

## QUICK REFERENCE

| I want to... | File location | Extends/Uses |
|--------------|---------------|--------------|
| Add new API | `api/NewClient.js` | `BaseApiClient` |
| Add business logic | `services/XService.js` | Utils, Repos, Clients |
| Add database query | `repositories/XRepo.js` | `BaseRepository` |
| Add shared function | `utils/name.js` | None |
| Add endpoint | `functions/domain.js` | Services |
| Add constant | `config/constants.js` | None |

## TESTING YOUR ARCHITECTURE DECISION

Good architecture decision if:
- ✅ Class has single, clear responsibility
- ✅ No circular dependencies
- ✅ Easy to test in isolation
- ✅ Follows existing patterns
- ✅ Reuses existing abstractions

Bad architecture decision if:
- ❌ Class does too many things
- ❌ Tight coupling to other classes
- ❌ Hard to test or mock
- ❌ Duplicates existing functionality
- ❌ Breaks established patterns
