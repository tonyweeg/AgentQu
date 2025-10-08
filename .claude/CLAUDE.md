# AgentQu - AI-Powered Activity Discovery Platform

## 🎯 Project Overview

**AgentQu** is a personalized activity discovery platform that uses Google Places API and Custom Search to find activities, events, and experiences tailored to each user's preferences. Built with React, Firebase, and TypeScript.

**Live URL:** https://agentqu-platform.web.app
**Tech Stack:** React + TypeScript + Firebase (Functions, Firestore, Hosting, Auth)
**Current Version:** v0.2 (Affinity-Based Ranking + Temporal Event Search)

---

## 🏗️ Architecture & Design Philosophy

### Core Principles
1. **Mobile-First Progressive Web App** - Touch-optimized, offline-capable, installable
2. **Personalization Through Affinity** - User preferences drive all discovery (28+ categories)
3. **Real-Time + Cached** - Smart caching with Firestore, geohash-indexed
4. **Production-Ready Always** - Every commit is deployable, tested, and documented
5. **Object-Oriented Design** - Clean separation of concerns, SOLID principles

### Development Methodology: **DISCUSS → DESIGN → PLAN → IMPLEMENT → TEST → CHECKPOINT → REPEAT**

```
1. DISCUSS & DESIGN
   └─ Frontend Design (UX/UI, components, state management)
   └─ Backend Design (data models, API structure, Firebase functions)
   └─ Plan Wiring (how frontend calls backend, data flow)

2. PLAN & TEST CRITERIA
   └─ Write test plan (what to test, success criteria)
   └─ Define checkpoints (where we can safely stop/resume)

3. IMPLEMENT
   └─ Build incrementally (small, testable units)
   └─ Test each piece before moving forward

4. TEST & VALIDATE
   └─ Browser console testing (fastest)
   └─ API endpoint testing with curl
   └─ User acceptance testing

5. CHECKPOINT & DOCUMENT
   └─ Commit working code with detailed message
   └─ Update WHERE-WE-LEFT-OFF.md
   └─ Deploy to production
   └─ Push to GitHub

6. REPEAT
   └─ Ready for next feature
```

---

## 📁 Project Structure

```
AgentQu/
├── agentqu-app/              # React Frontend
│   ├── src/
│   │   ├── components/       # UI Components (ActivityCard, Settings, Map, etc.)
│   │   ├── hooks/            # Custom hooks (useAuth, useLocation, useDiscovery)
│   │   ├── lib/              # Types, utilities, affinity categories
│   │   └── App.tsx           # Main application shell
│   ├── public/               # Static assets (logo, favicon)
│   └── build/                # Production build (deployed to Firebase Hosting)
│
├── functions/                # Firebase Cloud Functions (Backend)
│   ├── index.js              # Main functions file (discovery, reviews, votes)
│   └── .env                  # Environment variables (API keys) [NOT COMMITTED]
│
├── .claude/                  # Claude Code configuration
│   ├── CLAUDE.md             # This file - project knowledge base
│   └── settings.local.json   # Local Claude settings
│
├── docs/                     # Documentation
│   ├── WHERE-WE-LEFT-OFF.md  # Current status & next steps
│   └── FIRESTORE-SCHEMA.md   # Database schema reference
│
├── firebase.json             # Firebase hosting & functions config
└── firestore.rules           # Database security rules
```

---

## 🔑 Key Components & Data Flow

### Frontend Architecture

**React Components:**
- `App.tsx` - Main shell, manages view state (list/map), handles auth
- `ActivityCard.tsx` - Displays single activity with image, rating, categories
- `ActivityDetails.tsx` - Full-screen modal with complete activity info
- `Settings.tsx` - Affinity preference sliders (28+ categories, 0-100 scale)
- `ActivityMap.tsx` - Leaflet map showing activities with markers
- `OnboardingScreen.tsx` - New user setup (affinity preferences)
- `AuthScreen.tsx` - Google OAuth login/signup

**Custom Hooks:**
- `useAuth()` - Firebase Auth, user profile management, affinity updates
- `useLocation()` - Geolocation API, location permissions
- `useDiscovery()` - Calls backend to fetch activities, manages loading state

**State Management:**
- React hooks (useState, useEffect, useCallback)
- No Redux/Context - simple prop passing
- User affinities stored in Firestore (`users/{uid}`)
- Activities cached in Firestore (`activities` collection)

### Backend Architecture (Firebase Functions)

**Main Functions:**
1. `discoverActivities(lat, lng, radius, userId)` - **CORE FUNCTION**
   - Fetches from Google Places API (New) - permanent venues
   - Fetches from Google Custom Search API - events in next 3 days
   - Calculates affinity-based scores (0-200 points)
   - Caches results in Firestore with geohash indexing
   - Returns ranked, personalized activity list

2. `submitReview(activityId, rating, comment)` - User reviews
3. `voteActivity(activityId, voteType)` - Upvote/downvote
4. `clearCache()` - Admin tool to clear cached activities

**Data Models:**

```javascript
// Activity (Firestore: activities/{activityId})
{
  activityId: string,              // Unique ID
  name: string,                    // Display name
  type: "permanent" | "event",     // Permanent place or time-bound event
  location: {
    lat: number,
    lng: number,
    geohash: string,               // Precision 7 for search
    geohashPrecise: string,        // Precision 9 for exact location
    address: string,
    placeId: string                // Google Places ID
  },
  categories: string[],            // ["museums", "art_culture", "family"]
  primaryCategory: string,         // Main category for grouping
  details: {
    description: string,
    imageUrl: string,
    website: string,
    priceLevel: number             // 0-4 (0 = free)
  },
  ratings: {
    googleRating: number,          // 0-5
    agentQuRating: number,         // User-contributed rating
    totalReviews: number,
    voteScore: number              // Upvotes - downvotes
  },
  score: number,                   // Final calculated score (0-200+)
  baseScore: number,               // Before affinity
  affinityScore: number,           // User-specific affinity bonus
  distance: number                 // Miles from user
}

// User Profile (Firestore: users/{uid})
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string,
  affinities: {
    museums: 90,                   // 0-100 scale
    sports: 60,
    nightlife: 20,
    // ... 28+ categories
  },
  onboarded: boolean,              // Completed setup?
  createdAt: timestamp
}
```

**Affinity-Based Scoring Algorithm:**

```javascript
// calculateFinalScore(activity, userLat, userLng, userAffinities)
// Returns: { finalScore: number, baseScore: number, affinityPoints: number }

Base Score: 100 points

+ Distance Factor (0-30 points):
  - ≤1 mi: +30
  - ≤3 mi: +20
  - ≤5 mi: +10
  - ≤10 mi: +5
  - >10 mi: -2 per mile

+ Rating Factor (0-20 points):
  - AgentQu Rating: (rating/5) * 20
  - Google Rating: (rating/5) * 15

+ Open Now Bonus: +10 points

+ Free Activity Bonus: +5 points

+ Popularity Factor (0-15 points):
  - Based on vote score (upvotes - downvotes)

+ AFFINITY FACTOR (0-40 points): ⭐ BIGGEST WEIGHT
  - Matches activity categories to user affinities
  - Average affinity of matched categories
  - Multiplied by 40
  - Example: Museum (90% affinity) = 36 points
  - Example: Bar (20% affinity) = 8 points

Final Score: 100 + all bonuses (typically 80-180 range)
```

---

## 🚀 Deployment & Environment

### Firebase Configuration

**Project:** agentqu-platform
**Project Number:** 885682986311
**Regions:** us-central1 (Functions, Firestore)

**Environment Variables (Firebase Functions Config):**
```bash
google.places_api_key = "AIzaSyB5woqsEw_L7iESL2Gh-m47mQ4HPemb84w"
google.search_api_key = "AIzaSyB5woqsEw_L7iESL2Gh-m47mQ4HPemb84w"
google.search_engine_id = "d4e4ed3d41b444bd3"
```

**APIs Enabled:**
- Places API (New) - `places.googleapis.com`
- Places API (Old) - `maps.googleapis.com/maps/api/place` (fallback)
- Custom Search JSON API - `customsearch.googleapis.com`
- Firebase Authentication, Firestore, Hosting, Functions

### Deployment Commands

```bash
# Deploy Everything
firebase deploy

# Deploy Functions Only
firebase deploy --only functions

# Deploy Specific Function
firebase deploy --only functions:discoverActivities

# Deploy Hosting Only
cd agentqu-app && npm run build && cd .. && firebase deploy --only hosting

# Clear Cache (Admin Tool)
curl https://us-central1-agentqu-platform.cloudfunctions.net/clearCache
```

### Git Workflow

```bash
# Always work on feature branches (never main directly)
git checkout -b "v0.X-feature-name"

# Commit frequently with detailed messages
git add -A
git commit -m "feat: Description\n\nDetails...\n\n🤖 Generated with Claude Code"

# Push to GitHub
git push origin v0.X-feature-name

# Merge to main when stable
git checkout main
git merge v0.X-feature-name
git push origin main
```

---

## 🧪 Testing Strategy

### Always Test in Browser Console First
**Fastest feedback loop - use this for all debugging!**

```javascript
// Check what's being logged
// Look for emoji prefixes:
// 🔍 AGENTQU_DEBUG - Frontend logs
// 🎯 PLACES API - Places API calls
// 🔍 SEARCH API - Custom Search calls
```

### API Endpoint Testing

```bash
# Test discoverActivities
curl -X POST https://us-central1-agentqu-platform.cloudfunctions.net/discoverActivities \
  -H "Content-Type: application/json" \
  -d '{"data": {"lat": 38.324, "lng": -75.215, "radius": 10, "userId": "test123"}}'

# Clear cache
curl https://us-central1-agentqu-platform.cloudfunctions.net/clearCache

# Check Firebase logs
firebase functions:log
```

### Success Criteria Checklist

Before marking ANY task complete:
- [ ] Code runs without errors in browser console
- [ ] API returns expected data structure
- [ ] Frontend displays data correctly
- [ ] No TypeScript errors
- [ ] Deployed to production successfully
- [ ] Tested on mobile device (touch interactions)
- [ ] WHERE-WE-LEFT-OFF.md updated
- [ ] Git committed and pushed

---

## 📊 Current State (v0.2)

### ✅ Implemented Features

**Core Discovery:**
- [x] Google OAuth authentication
- [x] Geolocation-based search (1-50 mile radius)
- [x] Affinity-based personalization (28+ categories)
- [x] Activity ranking by score (affinity + distance + rating)
- [x] Temporal event search (next 3 days)
- [x] Firestore caching with geohash indexing
- [x] Real-time activity updates

**UI/UX:**
- [x] Mobile-first responsive design
- [x] List view with category grouping
- [x] Map view with markers (Leaflet)
- [x] Activity cards with images, ratings, categories
- [x] Activity details modal (full info, website link)
- [x] Settings page (affinity sliders)
- [x] Onboarding flow (new users)
- [x] Clickable logo to return home

**Backend:**
- [x] Places API (New) integration
- [x] Custom Search API with date filtering
- [x] Smart caching (location + affinity signature)
- [x] Score calculation algorithm
- [x] User profile management
- [x] Cache clearing endpoint

### 🚧 Known Issues & Limitations

1. **Event Search Quality** - Custom Search results may not always be actual events
   - Solution: Consider adding Eventbrite/Ticketmaster APIs

2. **Cache Invalidation** - Cached data doesn't auto-refresh
   - Current: Manual cache clearing
   - Future: Add TTL (time-to-live) expiration

3. **Mobile Performance** - Large activity lists can lag on older devices
   - Future: Implement virtual scrolling/pagination

4. **Offline Mode** - No offline functionality yet
   - Future: Service worker + IndexedDB caching

---

## 🎯 Development Best Practices

### Code Quality Standards
- **TypeScript Strict Mode** - No `any` types allowed
- **Functional Components** - React hooks only, no class components
- **Small Functions** - Max 50 lines per function
- **Single Responsibility** - Each function/component does ONE thing
- **Meaningful Names** - `calculateAffinityScore()` not `calc()`
- **Comments for Complex Logic** - Explain WHY, not WHAT

### Firebase Best Practices
- **Batch Writes** - Use `batch.set()` for multiple documents
- **Query Optimization** - Use geohash for location queries
- **Security Rules** - Always validate user permissions
- **Cost Control** - Cache aggressively, limit API calls
- **Error Handling** - Always try/catch Firebase calls

### Git Commit Message Format
```
type: Short summary (50 chars max)

Detailed explanation of what changed and why.
Include relevant context, API changes, etc.

Changes:
- Bullet list of specific changes
- What files were modified
- New features added

Testing:
- How it was tested
- Success criteria met

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`

---

## 🔍 Common Debugging Patterns

### Problem: Getting 0 activities
**Check:**
1. Browser console for API errors
2. Firebase Functions logs: `firebase functions:log`
3. Check if APIs are enabled in Google Cloud Console
4. Verify API key has correct permissions
5. Clear cache: `curl clearCache endpoint`

### Problem: Wrong affinity scores
**Check:**
1. User profile in Firestore - are affinities saved?
2. Activity categories - do they match affinity categories?
3. Score calculation logs in Functions
4. Frontend sorting logic in App.tsx

### Problem: Images not loading
**Check:**
1. Places API photo URLs include correct API key
2. API key has Places API enabled
3. CORS issues (check browser console)
4. Fallback to placeholder if no image

---

## 📚 Key Files to Know

### Must Read Before Coding
- `functions/index.js` - Backend logic, scoring algorithm
- `agentqu-app/src/App.tsx` - Main UI, view management
- `agentqu-app/src/lib/affinityCategories.ts` - All 28+ categories
- `agentqu-app/src/lib/types.ts` - TypeScript interfaces
- `.claude/CLAUDE.md` - This file!

### Generated Files (Don't Edit)
- `agentqu-app/build/*` - Production build
- `firebase-debug.log` - Firebase CLI logs
- `.firebase/*` - Firebase deployment cache

---

## 🎯 Next Steps & Roadmap

### Immediate Priorities (v0.3)
1. **Trip Planner** - "There-Then" planning for future activities
   - Date range picker
   - Calendar view
   - Save/load trips

2. **Better Event Quality** - Integrate dedicated event APIs
   - Eventbrite API
   - Ticketmaster API
   - Filter out non-events from Custom Search

3. **Performance Optimization**
   - Virtual scrolling for activity lists
   - Image lazy loading
   - Bundle size reduction

### Future Ideas
- Push notifications for new events matching affinities
- Social features (share activities, friend recommendations)
- Activity check-ins (track what you've done)
- Offline mode with service worker
- Apple Maps integration (alternative to Google)

---

## 💡 Working with Claude

### How to Brief Claude
```
"We need to add [feature]. Here's the design:
- Frontend: [component structure, state management]
- Backend: [API endpoints, data models]
- Wiring: [how frontend calls backend]
- Test plan: [what to test, success criteria]

Let's discuss this design first before implementing."
```

### Checkpoint After Each Feature
Claude will create checkpoints in `docs/WHERE-WE-LEFT-OFF.md` after completing major work. This allows you to:
- Resume work if connection drops
- Review what was done
- Understand state before next session

### Always Test Before Moving On
Never mark a task complete until:
1. Code runs in browser without errors
2. API returns expected data
3. Feature works as designed
4. Deployed to production
5. Git committed

---

## 🏆 Success Metrics

### How We Measure Quality
- **Zero TypeScript Errors** - Strict mode enabled
- **Zero Console Errors** - Clean browser console
- **< 500ms API Response** - Fast backend
- **> 90% Uptime** - Firebase reliability
- **Mobile-First** - Touch-optimized UI

### Production Readiness Checklist
- [x] All APIs working with correct keys
- [x] Authentication flow complete
- [x] Error boundaries in place
- [x] Loading states handled
- [x] Responsive design (mobile + desktop)
- [x] Security rules enforced
- [x] Git commits pushed
- [x] Documentation updated

---

**Last Updated:** October 8, 2025
**Current Version:** v0.2 (Affinity-Based Ranking + Temporal Event Search)
**Next Version:** v0.3 (Trip Planner)

