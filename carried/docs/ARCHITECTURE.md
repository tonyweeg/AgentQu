# Carried - Motions carry, memory too

**Semantic Memory Bank for Organizational Decisions**

---

## Overview

Carried ingests meeting minutes from any group type, extracts motions/decisions using AI, generates embeddings for semantic search, and builds institutional memory that persists across time.

**Tagline:** "Motions carry, memory too"

---

## Tech Stack (Same as PoliScAI)

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript + Tailwind CSS |
| Backend | Firebase Functions (Node.js) |
| Database | Firestore |
| Auth | Firebase Auth (Google) |
| Storage | Firebase Storage (file uploads) |
| AI | Google Gemini 2.0 Flash |
| Embeddings | Gemini text-embedding-004 |
| Hosting | Firebase Hosting |

---

## Core Concepts

### 1. Groups
Organizations that make decisions together.

```typescript
interface Group {
  id: string;
  name: string;
  type: GroupType;
  description?: string;
  createdBy: string;
  createdAt: Timestamp;
  memberCount: number;
  meetingCount: number;
  settings: GroupSettings;
}

type GroupType =
  | 'hoa'           // HOA/Condo boards
  | 'family'        // Family councils
  | 'club'          // Clubs, organizations
  | 'board'         // Corporate/nonprofit boards
  | 'committee'     // Committees, task forces
  | 'team'          // Work teams
  | 'other';        // General purpose
```

### 2. Meetings
Individual meeting records with minutes.

```typescript
interface Meeting {
  id: string;
  groupId: string;
  title: string;
  date: Timestamp;
  rawMinutes: string;          // Original uploaded text
  processedAt?: Timestamp;     // When AI processed it
  motionCount: number;
  attendees?: string[];
  source: 'paste' | 'pdf' | 'docx' | 'txt';
}
```

### 3. Motions (Decisions)
Individual decisions extracted from meetings.

```typescript
interface Motion {
  id: string;
  groupId: string;
  meetingId: string;
  text: string;                 // The motion text
  context: string;              // Surrounding discussion
  outcome: 'carried' | 'defeated' | 'tabled' | 'withdrawn' | 'unknown';
  voteCount?: {
    yea: number;
    nay: number;
    abstain: number;
  };
  movedBy?: string;
  secondedBy?: string;
  embedding: number[];          // Vector embedding for search
  extractedAt: Timestamp;
  confidence: number;           // AI confidence score (0-1)
  tags: string[];               // AI-generated topic tags
}
```

### 4. Queries
Semantic search queries with results.

```typescript
interface Query {
  id: string;
  groupId: string;
  userId: string;
  question: string;
  embedding: number[];
  results: MotionMatch[];
  createdAt: Timestamp;
}

interface MotionMatch {
  motionId: string;
  meetingId: string;
  score: number;                // Similarity score
  snippet: string;              // Relevant excerpt
}
```

---

## Architecture Layers

```
carried/
├── src/
│   ├── components/           # React components
│   │   ├── groups/           # Group management
│   │   ├── meetings/         # Meeting ingestion
│   │   ├── search/           # Semantic search UI
│   │   ├── layout/           # AppHeader, Navigation
│   │   └── ui/               # Button, Card, Input, etc.
│   │
│   ├── pages/                # Route pages
│   │   ├── Home.tsx          # Dashboard
│   │   ├── GroupHome.tsx     # Single group view
│   │   ├── MeetingView.tsx   # Single meeting + motions
│   │   ├── Search.tsx        # Semantic search
│   │   └── Upload.tsx        # Meeting ingestion
│   │
│   ├── hooks/                # Custom hooks
│   │   ├── useAuth.ts        # Firebase auth
│   │   ├── useGroups.ts      # Group CRUD
│   │   ├── useMeetings.ts    # Meeting CRUD
│   │   └── useSearch.ts      # Semantic search
│   │
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── gemini.ts     # Gemini client
│   │   │   ├── embeddings.ts # Embedding generation
│   │   │   ├── extraction.ts # Motion extraction
│   │   │   └── search.ts     # Semantic search
│   │   │
│   │   ├── firestore/
│   │   │   ├── groups.ts     # Group operations
│   │   │   ├── meetings.ts   # Meeting operations
│   │   │   ├── motions.ts    # Motion operations
│   │   │   └── queries.ts    # Query history
│   │   │
│   │   └── parsers/
│   │       ├── pdf.ts        # PDF parsing
│   │       ├── docx.ts       # DOCX parsing
│   │       └── text.ts       # Plain text cleaning
│   │
│   ├── config/
│   │   └── firebase.ts       # Firebase init
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx   # Auth provider
│   │
│   └── types/
│       ├── group.ts          # Group types
│       ├── meeting.ts        # Meeting types
│       ├── motion.ts         # Motion types
│       └── index.ts          # Exports
│
├── functions/                # Firebase Functions
│   └── src/
│       ├── ai/
│       │   ├── embeddings.ts # Generate embeddings
│       │   ├── extraction.ts # Extract motions from minutes
│       │   └── search.ts     # Vector similarity search
│       │
│       └── functions/
│           ├── meetings.ts   # onMeetingCreated trigger
│           ├── search.ts     # searchMotions callable
│           └── index.ts      # Exports
│
└── docs/
    └── ARCHITECTURE.md       # This file
```

---

## AI Pipeline

### 1. Ingestion Flow

```
User uploads/pastes minutes
        ↓
[Parser] - Extract text from PDF/DOCX/TXT
        ↓
[Firestore] - Store raw meeting
        ↓
[Cloud Function Trigger] - onMeetingCreated
        ↓
[Gemini] - Extract motions from text
        ↓
[Gemini Embeddings] - Generate vector for each motion
        ↓
[Firestore] - Store motions with embeddings
```

### 2. Search Flow

```
User asks question
        ↓
[Gemini Embeddings] - Generate query vector
        ↓
[Vector Search] - Find similar motion embeddings
        ↓
[Gemini] - Generate contextual answer
        ↓
Display results with source meetings
```

### 3. Motion Extraction Prompt

```
You are analyzing meeting minutes to extract formal motions and decisions.

For each motion found, extract:
1. motion_text: The exact text of what was proposed
2. outcome: carried, defeated, tabled, withdrawn, or unknown
3. context: 1-2 sentences of surrounding discussion
4. moved_by: Who made the motion (if stated)
5. seconded_by: Who seconded (if stated)
6. vote_count: { yea, nay, abstain } if recorded
7. tags: 2-5 topic tags for categorization
8. confidence: Your confidence in this extraction (0.0-1.0)

Return as JSON array. If no motions found, return [].
```

---

## Firestore Collections

```
groups/{groupId}
  └── [Group document]

groups/{groupId}/members/{memberId}
  └── { userId, role, joinedAt }

meetings/{meetingId}
  └── [Meeting document]

motions/{motionId}
  └── [Motion document with embedding]

users/{userId}
  └── { email, displayName, groups[] }

queries/{queryId}
  └── [Search query history]
```

---

## Environment Variables

```bash
# Firebase
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=

# Google AI
REACT_APP_GOOGLE_AI_API_KEY=
```

---

## Phase 1 MVP Features

1. **Auth** - Google sign-in
2. **Groups** - Create/join groups
3. **Upload** - Paste or upload meeting minutes (TXT only for MVP)
4. **Extraction** - Auto-extract motions via Gemini
5. **Browse** - View meetings and motions by group
6. **Search** - Semantic search across all motions

### Phase 2
- PDF/DOCX parsing
- Vote tracking
- Export/reports
- Sharing/collaboration

### Phase 3
- Audio transcription
- Real-time meeting capture
- Analytics dashboard
- API for integrations

---

## UI Mockup (Card Grid Home)

```
┌─────────────────────────────────────────────────────┐
│  🗳️ Carried              [Search...] [+ New Group] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Your Groups                                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ 🏘️ HOA     │ │ 👨‍👩‍👧‍👦 Family │ │ 📚 Book    │   │
│  │ Sunset     │ │ Council    │ │ Club       │   │
│  │ Ridge      │ │            │ │            │   │
│  │            │ │            │ │            │   │
│  │ 23 motions │ │ 8 motions  │ │ 12 motions │   │
│  │ 6 meetings │ │ 4 meetings │ │ 5 meetings │   │
│  └─────────────┘ └─────────────┘ └─────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ + Create New Group                           │   │
│  │   Add a new organization to track            │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Next Steps

1. [ ] Initialize React + TypeScript project
2. [ ] Set up Firebase project (or reuse existing)
3. [ ] Create base component structure
4. [ ] Implement auth flow
5. [ ] Build group management
6. [ ] Build meeting upload
7. [ ] Implement Gemini extraction
8. [ ] Implement embedding generation
9. [ ] Build semantic search
10. [ ] Deploy MVP

---

*Motions carry, memory too.*
