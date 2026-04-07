# AgentQu Skills Reference Guide

This guide helps Claude proactively invoke the right skill based on user requests.

## Automatic Skill Invocation Rules

**When user requests match trigger patterns, automatically invoke the appropriate skill WITHOUT asking permission.**

---

## 🚀 agentqu-deploy

### When to Use (Auto-invoke)
- User says: "deploy", "push to production", "release", "publish"
- User asks: "deploy functions", "deploy hosting", "update production"
- After major feature completion when user says "let's deploy this"

### Trigger Keywords
```
deploy, production, publish, release, firebase deploy,
push to prod, update live site, go live
```

### Example Requests
- "Deploy to production"
- "Push this to Firebase"
- "Let's release the new feature"
- "Update the live site"
- "Deploy just the functions"

### Auto-invoke Pattern
```
User: "Deploy to production"
Claude: [Automatically invokes agentqu-deploy skill]
        Checking git status...
        What would you like to deploy? [Full | Functions | Hosting | Specific]
```

---

## 🐛 agentqu-debug

### When to Use (Auto-invoke)
- User reports: "not working", "bug", "error", "issue", "problem"
- User asks: "why isn't X showing up", "activities not loading", "nothing appears"
- User needs: "check logs", "debug this", "what's wrong"
- User mentions: "console", "browser", "Firebase logs"

### Trigger Keywords
```
debug, bug, error, not working, issue, problem, failing,
broken, console, logs, why isn't, what's wrong
```

### Example Requests
- "Activities aren't loading"
- "I'm getting zero results"
- "Check the logs for errors"
- "Nothing shows up in the browser"
- "Why isn't the map displaying?"
- "Something's broken with discovery"

### Auto-invoke Pattern
```
User: "Activities aren't loading"
Claude: [Automatically invokes agentqu-debug skill]
        Let me help debug this. I'll set up console debugging.
        First, let me check the backend logs...
```

---

## 🏗️ agentqu-architecture

### When to Use (Auto-invoke)
- User asks: "where should I put", "where do I add", "how do I structure"
- User mentions: "new feature", "new API", "add integration", "create service"
- User questions: "which file", "what layer", "service or repository"
- Planning new features or refactoring

### Trigger Keywords
```
where should, where do I, how do I structure, which file,
what layer, new API, new service, add feature, architecture,
organize code, file structure
```

### Example Requests
- "Where should I add Yelp API integration?"
- "I want to add a new event source, where does that go?"
- "How do I structure this new feature?"
- "Which file should handle user notifications?"
- "Should this be in a service or repository?"

### Auto-invoke Pattern
```
User: "Where should I add Yelp integration?"
Claude: [Automatically invokes agentqu-architecture skill]
        Based on AgentQu's SOLID architecture:
        1. Create YelpClient.js in functions/src/api/
        2. Add business logic to ActivityService.js...
```

---

## 👤 agentqu-user-profile

### When to Use (Auto-invoke)
- User wants to: "test personalization", "create test user", "test affinities"
- User mentions: "test different profiles", "simulate user", "affinity testing"
- User needs: "reset user", "change affinities", "test discovery"
- Testing scoring or personalization features

### Trigger Keywords
```
test user, test profile, create test, affinities, personalization,
simulate user, test discovery, reset user, user testing
```

### Example Requests
- "Create a test user who loves nightlife"
- "I want to test discovery for a foodie"
- "Reset my affinities"
- "Test with someone who has high bar affinities"
- "Create different user profiles for testing"

### Auto-invoke Pattern
```
User: "Create a test user who loves nightlife"
Claude: [Automatically invokes agentqu-user-profile skill]
        Creating nightlife enthusiast profile:
        - bars: 90
        - clubs: 85
        - live_music: 80...
```

---

## 🔑 agentqu-api-verify

### When to Use (Auto-invoke)
- User reports: "API not working", "getting 401 errors", "authentication failed"
- User asks: "check API keys", "verify environment", "test APIs"
- User mentions: "setup", "configuration", ".env file"
- After pulling code or setting up new environment

### Trigger Keywords
```
API key, API not working, authentication, 401, 403,
verify API, check keys, environment, .env, configuration,
setup, test API
```

### Example Requests
- "Check if all API keys are configured"
- "I'm getting 401 errors from Google"
- "Verify the environment is set up correctly"
- "Test if Twitter API is working"
- "Are all the API keys valid?"

### Auto-invoke Pattern
```
User: "Check if all API keys are configured"
Claude: [Automatically invokes agentqu-api-verify skill]
        Reading functions/.env...
        Verifying API keys:
        ✅ GOOGLE_PLACES_API_KEY: AIzaSyB5wo... (present)
        ✅ TWITTER_BEARER_TOKEN: AAAAAAAAAA... (present)...
```

---

## 🎯 agentqu-score-explain

### When to Use (Auto-invoke)
- User asks: "why is X scoring", "why does this have high/low score", "explain score"
- User questions: "why is this ranked higher", "scoring seems wrong"
- User mentions: "score breakdown", "affinity not working", "scoring algorithm"
- Debugging personalization or ranking issues

### Trigger Keywords
```
why score, why scoring, explain score, score breakdown,
why ranked, why higher, why lower, scoring, affinity score,
ranking, personalization not working
```

### Example Requests
- "Why is this coffee shop scoring 187?"
- "Explain the score for Blue Moon Cafe"
- "Why is this nightclub ranked higher than this museum?"
- "The scores seem wrong"
- "Why isn't affinity affecting the score?"
- "Show me the score breakdown"

### Auto-invoke Pattern
```
User: "Why is Blue Moon Cafe scoring 187?"
Claude: [Automatically invokes agentqu-score-explain skill]
        Score Breakdown for Blue Moon Cafe:
        Final Score: 187 / 300

        🏁 Base Score: 100 points
        📍 Distance Score: +25 points (0.8 miles)...
```

---

## 💾 agentqu-cache-manager

### When to Use (Auto-invoke)
- User reports: "seeing old data", "changes not showing", "stale results"
- User asks: "clear cache", "cache status", "refresh data"
- User mentions: "cache", "old activities", "not updating"
- After changing affinities or configuration

### Trigger Keywords
```
cache, stale, old data, not updating, clear cache,
refresh, cache status, old activities, changes not showing,
data not refreshing
```

### Example Requests
- "Clear the cache"
- "I'm seeing old activities"
- "Data isn't refreshing"
- "Check cache status"
- "Changes aren't showing up"
- "Refresh the activity data"

### Auto-invoke Pattern
```
User: "Clear the cache"
Claude: [Automatically invokes agentqu-cache-manager skill]
        Clearing all caches...
        curl https://clearcache-gnr47betrq-uc.a.run.app

        ✅ Cache cleared successfully!
        - activities
        - places
        - twitter...
```

---

## Skill Chaining (Use Multiple Skills)

### Deploy After Feature Development
```
User: "I added EV charging support, let's deploy"

Claude:
1. [Invoke agentqu-debug] - "Test in browser console first?"
2. Wait for user confirmation
3. [Invoke agentqu-deploy] - "Ready to deploy!"
```

### Debug Flow
```
User: "Activities aren't loading"

Claude:
1. [Invoke agentqu-debug] - Check logs, console setup
2. If API errors → [Invoke agentqu-api-verify] - Check keys
3. If cache issue → [Invoke agentqu-cache-manager] - Clear cache
4. If scoring issue → [Invoke agentqu-score-explain] - Analyze scores
```

### New Feature Flow
```
User: "I want to add Spotify integration"

Claude:
1. [Invoke agentqu-architecture] - "Here's where it goes..."
2. [Help implement]
3. [Invoke agentqu-user-profile] - "Let's create test users to verify"
4. [Invoke agentqu-debug] - "Test in browser console"
5. [Invoke agentqu-deploy] - "Ready to deploy?"
```

---

## Decision Matrix: Which Skill to Use?

| User Intent | Primary Skill | Secondary Skill |
|------------|---------------|-----------------|
| Deploy code | agentqu-deploy | agentqu-debug (pre-deploy test) |
| Fix bug | agentqu-debug | agentqu-cache-manager |
| Add feature | agentqu-architecture | agentqu-user-profile (testing) |
| Test personalization | agentqu-user-profile | agentqu-score-explain |
| Setup environment | agentqu-api-verify | agentqu-debug |
| Scoring issues | agentqu-score-explain | agentqu-user-profile |
| Stale data | agentqu-cache-manager | agentqu-debug |

---

## When NOT to Use Skills

**Don't invoke skills for:**
- Simple questions about code (just answer directly)
- Reading files (use Read tool)
- Small edits (use Edit tool)
- General conversation
- Quick git status checks

**Examples of non-skill requests:**
- "What does this function do?" → Read file and explain
- "Fix this typo" → Use Edit tool
- "Show me the API key" → Use Read to check .env
- "What's the current branch?" → Use git command

---

## Skill Priority Order

When multiple skills could apply, use this priority:

1. **agentqu-debug** - If there's an error/issue, debug FIRST
2. **agentqu-api-verify** - If API-related, verify keys
3. **agentqu-cache-manager** - If data staleness, check cache
4. **agentqu-architecture** - If adding code, guide placement
5. **agentqu-user-profile** - If testing personalization
6. **agentqu-score-explain** - If explaining scores
7. **agentqu-deploy** - Always LAST (after everything works)

---

## Confidence Thresholds

**High Confidence (Auto-invoke immediately):**
- Exact keyword matches: "deploy", "clear cache", "explain score"
- Obvious errors: "not working", "getting 401"
- Direct requests: "check API keys", "where should I add X"

**Medium Confidence (Suggest skill):**
- Indirect mentions: "something's wrong", "weird behavior"
- Planning discussions: "thinking about adding X"
- Performance questions: "why is this slow"

**Low Confidence (Don't invoke):**
- Vague questions: "how does this work"
- General conversation
- Unrelated topics

---

## Skill Usage Tracking

**After using a skill, mention what you did:**

✅ **Good:**
```
I've invoked the agentqu-debug skill to help diagnose this issue.
[Skill output]
Based on the logs, the problem is...
```

❌ **Bad:**
```
[Silently invoke skill without context]
```

---

## 🎵 no-vocals

### When to Use (Auto-invoke)
- User mentions: "remove vocals", "vocal removal", "karaoke", "instrumental"
- User asks: "separate vocals", "extract vocals", "isolate vocals"
- User mentions: "demucs", "audio separation", "backing track"
- User provides: YouTube URL for audio download
- User asks: "download audio from YouTube", "rip audio", "extract audio"
- User provides an audio file path for vocal processing

### Trigger Keywords
```
remove vocals, vocal removal, karaoke, instrumental,
separate vocals, extract vocals, isolate vocals,
demucs, audio separation, backing track, no vocals,
youtube audio, download youtube, rip audio, youtube mp3,
extract audio from youtube
```

### Example Requests
- "Remove vocals from this song"
- "I want to make a karaoke track"
- "Separate the vocals from docs/Audio/song.mp3"
- "Create an instrumental version"
- "Extract vocals from this audio file"
- "Download audio from this YouTube video"
- "Rip the audio from https://youtube.com/watch?v=..."
- "Make a karaoke track from this YouTube link"

### Auto-invoke Pattern
```
User: "Download audio from https://youtube.com/watch?v=xyz"
Claude: [Automatically invokes no-vocals skill]
        Downloading audio from YouTube...

        ✅ Complete! MP3 saved to docs/Audio/

User: "Make a karaoke track from this YouTube video"
Claude: [Automatically invokes no-vocals skill]
        Downloading and removing vocals...

        ✅ Complete! Files saved:
        - Song.mp3 (downloaded)
        - vocals.wav
        - no_vocals.wav
```

---

## Quick Reference

```
deploy → agentqu-deploy
debug/error → agentqu-debug
where/structure → agentqu-architecture
test user → agentqu-user-profile
API/keys → agentqu-api-verify
score/why → agentqu-score-explain
cache/stale → agentqu-cache-manager
vocals/karaoke/youtube → no-vocals
```

---

**Remember:** Skills are for Tony's benefit - use them proactively to save him time and align with his workflows!
