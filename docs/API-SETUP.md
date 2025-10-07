# AgentQu API Setup Guide

## Google APIs Required

### 1. Google Custom Search API
**Purpose**: Search for "things to do near [location]"

**Setup:**
1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create or select project "agentqu-platform"
3. Enable "Custom Search API"
4. Create API key in "Credentials"
5. Copy the API key

### 2. Google Custom Search Engine ID
**Purpose**: Programmable Search Engine configuration

**Setup:**
1. Go to [Programmable Search Engine](https://cse.google.com/cse/)
2. Create new search engine
3. Set "Search the entire web"
4. Get the Search Engine ID (looks like: `a1b2c3d4e5f6g7h8i`)

### 3. Google Places API
**Purpose**: Find nearby venues, restaurants, attractions

**Setup:**
1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Enable "Places API"
3. Use same API key as above (or create new one)

## Set Environment Variables in Firebase

### Using Firebase CLI:
```bash
# Set Google Search API Key
firebase functions:secrets:set GOOGLE_SEARCH_API_KEY

# Set Google Search Engine ID
firebase functions:secrets:set GOOGLE_SEARCH_ENGINE_ID

# Set Google Places API Key
firebase functions:secrets:set GOOGLE_PLACES_API_KEY
```

### Or use Firebase Console:
1. Go to https://console.firebase.google.com/project/agentqu-platform/functions
2. Click on a function
3. Click "Environment Variables"
4. Add:
   - `GOOGLE_SEARCH_API_KEY`
   - `GOOGLE_SEARCH_ENGINE_ID`
   - `GOOGLE_PLACES_API_KEY`

## Testing Locally

Create `functions/.env` file:
```bash
GOOGLE_SEARCH_API_KEY=your_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
GOOGLE_PLACES_API_KEY=your_api_key_here
```

Then run:
```bash
cd functions
npm run serve
```

## API Limits & Costs

### Google Custom Search API
- **Free Tier**: 100 queries/day
- **Paid**: $5 per 1,000 queries
- **Limit**: Set quota in Google Cloud Console

### Google Places API
- **Free**: $200 credit/month (covers ~28,000 Place Details requests)
- **Paid**: Pay-as-you-go after credit

## Fallback Behavior

If API keys are not set:
- Functions will return empty results
- App will show "0 activities found"
- No errors thrown (graceful degradation)

## Next Steps

Once API keys are set:
1. Redeploy functions: `firebase deploy --only functions`
2. Test in browser at https://agentqu-platform.web.app
3. Check Firebase Logs: `firebase functions:log`
