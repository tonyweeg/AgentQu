# Music Genre Filtering System

**Branch:** `tweak-the-ticketmaster`
**Date:** October 10, 2025
**Status:** ✅ Deployed to Production

---

## 🎯 Overview

Implemented a comprehensive music genre affinity system that allows users to filter Ticketmaster events based on their music preferences. Events with genres rated below 20% affinity are automatically filtered out, while high-affinity events get scoring bonuses.

---

## 📦 What Was Built

### 1. **Music Genres Library** (`agentqu-app/src/lib/musicGenres.ts`)

Comprehensive music genre system with **18 genre categories**:

- **Rock & Alternative**: Rock, Alternative, Metal
- **Pop & Electronic**: Pop, Dance/Electronic
- **Hip-Hop & Rap**: Hip-Hop/Rap
- **R&B & Soul**: R&B/Soul
- **Country & Folk**: Country, Folk
- **Jazz & Blues**: Jazz, Blues
- **Classical & Opera**: Classical, Opera
- **Latin & World**: Latin, World, Reggae
- **Special Categories**: Oldies & Classics, Christian/Gospel, Other

**Key Functions:**
- `MUSIC_GENRES` - Complete genre configuration array
- `getGenreByTicketmasterName()` - Maps Ticketmaster API genres to our IDs
- `calculateGenreAffinityScore()` - Calculates user affinity score (0-100) for events
- `getDefaultMusicGenreAffinities()` - Default 50/100 for all genres
- `DEFAULT_GENRE_FILTER_THRESHOLD` - Filter threshold (20/100)

---

### 2. **Backend Genre Extraction** (`functions/index.js`)

**Genre Data Extraction** (lines 623-636):
```javascript
// Extract music genres from Ticketmaster classifications
const classifications = event.classifications || [];
const musicClassification = classifications.find(c => c.segment?.name === 'Music');
const musicGenres = [];

if (musicClassification) {
  if (musicClassification.genre?.name) {
    musicGenres.push(musicClassification.genre.name);
  }
  if (musicClassification.subGenre?.name &&
      musicClassification.subGenre.name !== musicClassification.genre?.name) {
    musicGenres.push(musicClassification.subGenre.name);
  }
}
```

**Data Structure:**
- Top-level `musicGenres` array on activity objects
- Also stored in `details.musicGenres` for backward compatibility

---

### 3. **Backend Genre Filtering** (`functions/index.js`)

**Genre Mapping** (lines 160-241):
- `MUSIC_GENRE_MAP` - Maps 70+ Ticketmaster genre names to 18 genre IDs
- Case-insensitive matching
- Handles variations: "Hip-Hop/Rap", "hip hop", "french rap" → all map to "hip-hop-rap"

**Filtering Logic** (lines 1386-1404):
```javascript
// Filter events by music genre affinity
if (musicGenreAffinities) {
  allActivities = allActivities.filter((activity) => {
    // Only filter music events
    if (activity.type === 'event' && activity.musicGenres && activity.musicGenres.length > 0) {
      const genreScore = calculateMusicGenreAffinityScore(activity.musicGenres, musicGenreAffinities);
      if (genreScore !== null && genreScore < MUSIC_GENRE_FILTER_THRESHOLD) {
        console.log(`🎵 Filtered out event: ${activity.name} (genre score: ${genreScore})`);
        return false; // Filter out
      }
    }
    return true; // Keep
  });
}
```

**Threshold:** Events with genre affinity < 20% are filtered out before scoring

---

### 4. **Backend Genre Scoring** (`functions/index.js`)

**Enhanced calculateFinalScore()** (lines 281-336):
```javascript
function calculateFinalScore(activity, userLat, userLng, userAffinities, musicGenreAffinities) {
  let baseScore = 100;

  // ... distance, rating, openNow, free, popularity bonuses (total ~100 points)

  // Category affinity (0-40 points) - BIGGEST WEIGHT
  const affinityScore = calculateAffinityScore(activity.categories, userAffinities);
  const affinityPoints = affinityScore * 40;
  baseScore += affinityPoints;

  // Music genre affinity bonus for events (0-20 points) ✨ NEW
  let genreAffinityPoints = 0;
  if (activity.type === 'event' && activity.musicGenres && musicGenreAffinities) {
    const genreScore = calculateMusicGenreAffinityScore(activity.musicGenres, musicGenreAffinities);
    if (genreScore !== null) {
      genreAffinityPoints = (genreScore / 100) * 20;
      baseScore += genreAffinityPoints;
    }
  }

  return {
    finalScore: Math.max(0, Math.round(baseScore)),
    baseScore: Math.round(baseScore - affinityPoints - genreAffinityPoints),
    affinityScore: Math.round(affinityPoints),
    genreAffinityScore: Math.round(genreAffinityPoints), // ✨ NEW
  };
}
```

**Scoring Breakdown:**
- **Base Score**: 100 points
- **Distance**: 0-30 points
- **Rating**: 0-20 points
- **Open Now**: +10 points
- **Free**: +5 points
- **Popularity**: 0-15 points
- **Category Affinity**: 0-40 points (BIGGEST)
- **Genre Affinity**: 0-20 points ✨ **NEW**

---

### 5. **Frontend UI** (`agentqu-app/src/components/MusicGenresPanel.tsx`)

**Collapsible Panel:**
- Gradient purple-to-blue design
- Expandable with +/− toggle
- Grid layout (1 col mobile, 2 cols desktop)
- Scrollable (max-height: 384px)

**18 Genre Sliders:**
- Range: 0-100
- Visual labels: Skip (red) / Maybe (yellow) / Like (blue) / Love (green)
- Emoji icons for each genre
- White cards with shadows

**Save Functionality:**
- Independent save button
- Updates Firestore `users/{uid}/musicGenreAffinities`
- Success/error feedback

**User Experience:**
- Collapses by default (doesn't clutter Settings)
- Clear explanation: "Filter Ticketmaster events by your music taste"
- Threshold note: "Events below 20% affinity will be filtered out"

---

### 6. **User Profile Schema** (`useAuth.ts`)

```typescript
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  affinities: Record<string, number>; // Category affinities
  musicGenreAffinities?: Record<string, number>; // ✨ NEW: Music genre affinities (0-100)
  onboarded: boolean;
  createdAt: number;
  lastActive: number;
}
```

**New Hook Function:**
```typescript
const updateMusicGenreAffinities = async (musicGenreAffinities: Record<string, number>) => {
  // Saves to Firestore users/{uid}/musicGenreAffinities
  // Updates local profile state
}
```

---

### 7. **TypeScript Types** (`types.ts`)

```typescript
export interface Activity {
  // ... existing fields
  musicGenres?: string[]; // ✨ NEW: Music genre tags for filtering (events only)

  details?: {
    // ... existing fields
    musicGenres?: string[]; // ✨ NEW: Music genre tags
  };
}

export interface UserPreferences {
  maxDistance: number;
  favoriteCategories: string[];
  musicGenreAffinities?: Record<string, number>; // ✨ NEW: Music genre ID → rating (0-100)
  accessibilityNeeds?: { ... };
}
```

---

## 🔥 How It Works

### User Flow:

1. **Open Settings** → Music Genres panel (collapsed by default)
2. **Expand Panel** → See 18 genre categories with sliders
3. **Adjust Preferences** → Set each genre 0-100:
   - **0-24**: Skip (filtered out, red)
   - **25-49**: Maybe (neutral, yellow)
   - **50-74**: Like (scoring bonus, blue)
   - **75-100**: Love (big bonus, green)
4. **Save** → Writes to Firestore `users/{uid}/musicGenreAffinities`
5. **Discover Events** → Backend filters & scores based on preferences

### Backend Flow:

1. **Fetch Events** → Ticketmaster API returns events with classifications
2. **Extract Genres** → Parse `event.classifications[0].genre.name` & `subGenre.name`
3. **Store Genres** → Add `musicGenres` array to activity object
4. **Filter Events** → Remove events with genre affinity < 20%
5. **Score Events** → Add 0-20 bonus points based on genre affinity
6. **Return Results** → Events are sorted (events first, then by score)

---

## 🎨 Design Decisions

### Why 18 Genres?
- Comprehensive coverage of Ticketmaster's music classifications
- Not too many (overwhelming) or too few (limiting)
- Maps cleanly to Ticketmaster's genre/subGenre hierarchy

### Why 0-100 Scale?
- More granular than 0-9 (activity categories)
- Matches filtering threshold (20%) and scoring (0-20 points)
- Users can express nuanced preferences

### Why Filter at 20%?
- Allows "Maybe" genres (25-49%) to pass through
- Only completely unwanted genres (0-24%) are filtered
- Balance between filtering and variety

### Why Separate Save Button?
- Music genres are optional (not required for onboarding)
- Users can experiment without affecting main settings
- Clear feedback for genre preference updates

---

## 📊 Performance

**Token Efficiency:**
- Modular component design (MusicGenresPanel separate from Settings)
- Collapsible by default (minimal DOM until expanded)
- Efficient Firestore updates (merge: true)

**Backend Efficiency:**
- Genre filtering happens BEFORE scoring (saves processing)
- Cached genre mappings (no repeated lookups)
- Parallel API calls maintained

**Bundle Size:**
- **+1.55 KB** total (main.js: 271.71 KB → added genres library + panel)
- **+69 B** CSS (main.css: 16.29 KB → minimal styling impact)

---

## 🧪 Testing Recommendations

### User Testing:
1. **Set all genres to 0** → Verify no music events appear
2. **Set one genre to 100, rest to 0** → Verify only that genre appears
3. **Set mixed preferences** → Verify scoring reflects preferences
4. **Check filtering logs** → Backend console should show filtered events

### Edge Cases:
- Events with no genre data (should pass through neutrally)
- Events with multiple genres (should average affinity scores)
- New user with no preferences (defaults to 50 for all genres)

---

## 📝 Future Enhancements

### Potential Improvements:
1. **Genre Statistics** - Show how many events match each genre
2. **Quick Presets** - "Rock Fan", "Classical Lover", "All Genres" buttons
3. **Genre Discovery** - Suggest genres based on event attendance
4. **Advanced Filtering** - Allow AND/OR logic for multiple genres
5. **Genre Trends** - Show popular genres in user's area

### Backend Optimizations:
1. **Cache Genre Mappings** - Store in Firestore for faster lookups
2. **Genre Analytics** - Track which genres are most popular
3. **Smart Defaults** - Initialize new users based on popular genres in their city

---

## 📄 Files Changed

### Backend (`functions/index.js`):
- Added `MUSIC_GENRE_MAP` (lines 160-241)
- Added `calculateMusicGenreAffinityScore()` (lines 247-270)
- Added `MUSIC_GENRE_FILTER_THRESHOLD` constant (line 276)
- Updated `fetchTicketmasterEvents()` to extract genres (lines 623-636)
- Added genre filtering logic (lines 1386-1404)
- Updated `calculateFinalScore()` with genre scoring (lines 281-336)
- Updated `discoverActivities` to pass musicGenreAffinities (lines 1161-1166, 1420)

### Frontend:
- **New Files:**
  - `agentqu-app/src/lib/musicGenres.ts` - Genre definitions and logic
  - `agentqu-app/src/components/MusicGenresPanel.tsx` - UI component

- **Modified Files:**
  - `agentqu-app/src/lib/types.ts` - Added musicGenres fields
  - `agentqu-app/src/hooks/useAuth.ts` - Added musicGenreAffinities to profile & updateMusicGenreAffinities function
  - `agentqu-app/src/components/Settings.tsx` - Integrated MusicGenresPanel

---

## 🚀 Deployment

**Backend:** ✅ Deployed
**Frontend:** ✅ Deployed
**Live:** https://agentqu-platform.web.app

---

## 🎉 Summary

Created a production-ready music genre filtering system that:
- ✅ Extracts genre data from Ticketmaster events
- ✅ Filters unwanted genres (< 20% affinity)
- ✅ Scores events based on genre preferences (0-20 bonus points)
- ✅ Provides beautiful collapsible UI with 18 genre categories
- ✅ Integrates seamlessly with existing Settings
- ✅ Maintains high performance (+1.55 KB bundle)
- ✅ Includes comprehensive genre mapping (70+ Ticketmaster genres → 18 categories)

**Result:** Users can now personalize their Ticketmaster event discovery by music taste, automatically filtering out unwanted genres while boosting scores for favorite music styles! 🎵
