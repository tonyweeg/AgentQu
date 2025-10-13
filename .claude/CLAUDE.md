# AgentQu - AI Activity Discovery Platform

**Live:** https://agentqu-platform.web.app
**Stack:** React + TypeScript + Firebase (Functions, Firestore, Hosting, Auth)
**Version:** v0.3 (Twitter/X Integration + VibeIndex)

---

## 🎯 Core Architecture

**Principles:**
1. Mobile-first PWA (touch-optimized, installable)
2. Affinity-based personalization (28+ categories, 0-100 scale)
3. Smart caching (Firestore + geohash indexing)
4. Production-ready always (test in browser console first)

**Workflow:** Design → Plan → Implement → Test → Deploy → Commit → Repeat

---

## 📁 Key Files

```
AgentQu/
├── agentqu-app/src/
│   ├── components/      # ActivityCard, Settings, Map, LocalFlavorColumn
│   ├── hooks/           # useAuth, useLocation, useDiscovery, useTwitter
│   ├── lib/             # types.ts, affinityCategories.ts
│   └── App.tsx          # Main shell
├── functions/index.js   # Backend: discoverActivities, searchTwitter, calculateVibeIndex
├── docs/
│   ├── WHERE-WE-LEFT-OFF.md
│   └── VIBEINDEX-DESIGN.md
└── .claude/CLAUDE.md    # This file
```

---

## 🔑 Core Systems

### Frontend Components
- **App.tsx** - View management (list/map/twitter), auth, location
- **ActivityCard.tsx** - Activity display with share button
- **LocalFlavorColumn.tsx** - Twitter/X integration (70/30 split layout)
- **Settings.tsx** - Affinity sliders (28+ categories)

### Backend Functions
- **discoverActivities** - Places API + Custom Search → scored, ranked activities
- **searchTwitter** - 3-strategy Twitter search (affinity hashtags, geographic, location name)
- **calculateVibeIndex** - 8-category vibe scoring (Volume + Engagement + Diversity + Recency + Events)

### Custom Hooks
- **useAuth** - Firebase Auth + user profile management
- **useLocation** - Geolocation + reverse geocoding (city/state)
- **useDiscovery** - Backend activity fetching
- **useTwitter** - Dynamic Twitter search with location awareness

---

## 🚀 Deployment

### Firebase Config
**Project:** agentqu-platform (885682986311)
**Region:** us-central1

**Env Vars (functions/.env):**
```bash
GOOGLE_PLACES_API_KEY=AIzaSyB5woqsEw_L7iESL2Gh-m47mQ4HPemb84w
GOOGLE_SEARCH_API_KEY=AIzaSyB5woqsEw_L7iESL2Gh-m47mQ4HPemb84w
GOOGLE_SEARCH_ENGINE_ID=d4e4ed3d41b444bd3
TWITTER_BEARER_TOKEN=[in functions/.env]
```

**Deploy Commands:**
```bash
firebase deploy                              # Everything
firebase deploy --only functions:searchTwitter  # Specific function
cd agentqu-app && npm run build && cd .. && firebase deploy --only hosting
```

**Git Workflow:**
```bash
git checkout -b "feature-name"
git add -A && git commit -m "type: description"
git push origin feature-name
```

---

## 📊 Current State

### ✅ Implemented
**Core:** OAuth, geolocation, affinity-based ranking, caching, scoring
**UI:** List/map views, activity cards, settings, onboarding, Twitter column (70/30)
**Backend:** Places API, Custom Search, Twitter API (3 strategies), VibeIndex calculation
**Twitter:** Dynamic location search (city/state aware), affinity-based hashtags, event detection

### Twitter Search Strategies
1. **Affinity hashtags** - User preferences (threshold: 10) + fallback general hashtags
2. **Geographic** - point_radius search (2x user radius for wider coverage)
3. **Location names** - Dynamic city/state mentions (e.g., "Berlin" OR "Maryland")

### 🚧 Known Issues
- Event quality from Custom Search needs improvement (consider Eventbrite/Ticketmaster)
- Cache TTL not implemented (manual clear only)
- Mobile performance could use virtual scrolling
- VibeIndex frontend UI pending

---

## 🎯 Debugging Quick Ref

**Console Emoji Prefixes:**
- 🔍 AGENTQU_DEBUG - Frontend
- 🎯 PLACES API - Google Places
- 🔍 SEARCH API - Custom Search
- 🐦 TWITTER - Twitter API

**Common Fixes:**
- Zero activities → Check API keys, clear cache, check affinity threshold
- Wrong scores → Verify user affinities in Firestore, check category matching
- Images broken → API key permissions, CORS, fallback to placeholder

**Testing:**
```bash
# Always test in browser console first!
firebase functions:log  # Backend logs
curl https://us-central1-agentqu-platform.cloudfunctions.net/clearCache
```

---

## 📋 Data Models

See `/docs/FIRESTORE-SCHEMA.md` for complete schema.

**Key Structures:**
- `activities/{id}` - Activity data with scores, location (geohash), categories
- `users/{uid}` - User profile with affinities (0-100 per category)
- `vibeScores/{cityId}` - VibeIndex scores (8 categories, 0-100 scale)

**Scoring Algorithm:**
Base (100) + Distance (0-30) + Rating (0-20) + Open (10) + Free (5) + Popularity (0-15) + **Affinity (0-40)** = Final Score

---

## 🎯 Next Steps

**Immediate:**
- Test dynamic Twitter search with multiple cities
- Build VibeIndex frontend display
- Add Twitter OAuth sign-in option

**v0.3 Goals:**
- Trip planner ("There-Then" future planning)
- Better event APIs (Eventbrite, Ticketmaster)
- Performance optimization (virtual scrolling, lazy loading)

---

**Last Updated:** October 10, 2025
**Branch:** TWEET-THAT-YOU-TWAT (Twitter integration)
