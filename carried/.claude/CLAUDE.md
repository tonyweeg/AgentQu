# Carried - Motions carry, memory too

**Semantic Memory Bank for Organizational Decisions**

**Stack:** React + TypeScript + Tailwind v4 + Firebase + Gemini AI
**Status:** MVP Complete with Segment Extraction
**Live:** https://carried-app.web.app

---

## Quick Start

```bash
cd carried
npm install
cp .env.example .env  # Add your Firebase & Gemini keys
npm run dev           # http://localhost:5173
```

---

## Project Structure

```
carried/
├── src/
│   ├── components/
│   │   ├── layout/        # AppHeader
│   │   └── ui/            # Button, Card, Input, Loading
│   │
│   ├── pages/
│   │   ├── Home.tsx       # Dashboard with group cards
│   │   ├── NewGroup.tsx   # Create group form
│   │   ├── GroupHome.tsx  # Group detail + meetings + segments
│   │   ├── Upload.tsx     # Meeting minutes upload with AI extraction
│   │   └── Search.tsx     # Semantic search across all segments
│   │
│   ├── hooks/
│   │   └── useAuth.ts     # Firebase auth hook
│   │
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── gemini.ts      # Gemini client
│   │   │   ├── extraction.ts  # Segment extraction (10 types)
│   │   │   ├── embeddings.ts  # Vector embeddings
│   │   │   └── search.ts      # Semantic search
│   │   │
│   │   └── firestore/
│   │       └── segments.ts    # Segment CRUD operations
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx    # Auth provider
│   │
│   ├── config/
│   │   └── firebase.ts        # Firebase config + collections
│   │
│   └── types/
│       ├── group.ts       # Group, GroupType (22 types)
│       ├── meeting.ts     # Meeting, MeetingSource
│       ├── motion.ts      # Motion, MotionMatch (legacy)
│       ├── segment.ts     # Segment, SegmentMatch, SegmentType (10 types)
│       ├── query.ts       # Query, SearchResult
│       └── user.ts        # CarriedUser
│
├── docs/
│   └── ARCHITECTURE.md    # Full architecture doc
│
└── .env.example           # Environment template
```

---

## Core Features

### 1. Groups (Multi-tenant)
- **22 group types** organized into 5 categories:
  - Government & Civic (city_council, town_council, county_board, school_board, etc.)
  - Community & Residential (hoa, coop, neighborhood)
  - Organizations (nonprofit, church, pta, union, club)
  - Business & Professional (corporate_board, committee, team)
  - Personal (family, other)

### 2. Meeting Minutes Ingestion
- Paste text (MVP)
- File upload (coming soon: PDF, DOCX)
- Stores raw minutes in Firestore

### 3. AI Segment Extraction (NEW!)
- **Gemini 2.0 Flash** extracts ALL meeting content types:
  1. **motion** - Formal proposals with votes
  2. **discussion** - Debates, Q&A, deliberation
  3. **report** - Committee, treasurer, staff reports
  4. **announcement** - Events, deadlines, news
  5. **public_comment** - Citizen input, testimony
  6. **action_item** - Assigned tasks, follow-ups
  7. **election** - Officer elections, appointments
  8. **presentation** - Guest speakers
  9. **procedural** - Call to order, adjournment
  10. **other** - Uncategorized content

- Each segment includes: title, content, context, tags, confidence score
- Motion-specific: outcome, moved_by, seconded_by, vote_count
- Action items: assigned_to, due_date, status

### 4. Semantic Search
- **Gemini text-embedding-004** for vector embeddings
- Cosine similarity matching across all segments
- Natural language queries
- Filter by segment type
- Shows match percentage and meeting context

---

## Firestore Collections

```
groups/{groupId}
  └── Group document (name, type, description, meetingCount)

groupMembers/{memberId}
  └── GroupMember document (userId, groupId, role)

meetings/{meetingId}
  └── Meeting document (rawMinutes, processingStatus, segmentCount)

segments/{segmentId}           # NEW - All meeting content
  └── Segment document (type, title, content, embedding[], tags[])

motions/{motionId}             # Legacy - for backwards compatibility
  └── Motion document (text, outcome, embedding[])

queries/{queryId}
  └── Search history

users/{userId}
  └── CarriedUser document (groups[])
```

---

## Environment Variables

```bash
# Firebase (Required)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Gemini AI (Required)
VITE_GOOGLE_AI_API_KEY=
```

---

## Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint

# Deploy
firebase deploy --only firestore:rules   # Security rules
firebase deploy --only hosting           # Frontend
firebase deploy                          # Everything
```

---

## TODO (Phase 2)

- [ ] Cloud Functions for background processing
- [ ] File upload (PDF/DOCX parsing)
- [ ] Meeting detail view
- [ ] Segment detail view
- [ ] Export/reports
- [ ] Real-time updates
- [ ] Action item tracking dashboard

---

## Debug Prefix

All console logs use: `CARRIED_DEBUG:`

---

*Motions carry, memory too.*
