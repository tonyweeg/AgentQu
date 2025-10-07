# Manual Fix for CORS Error

## The Problem

Firebase Callable Functions (v2) are deployed as Cloud Run services that require public access permissions to work from web browsers. The CORS error happens because the Cloud Run services aren't set to allow unauthenticated access.

## The Solution

You need to manually set each Cloud Run service to allow public access in the Google Cloud Console.

### Step-by-Step Instructions:

1. **Go to Cloud Run Console:**
   https://console.cloud.google.com/run?project=agentqu-platform

2. **For EACH of these functions, do the following:**
   - `discoveractivities`
   - `qupactivity`
   - `checkinactivity`
   - `shareactivity`
   - `submitreview`
   - `voteactivity`
   - `suggestactivity`
   - `getuserhistory`

3. **For each function:**
   - Click on the function name
   - Click the **"PERMISSIONS"** tab at the top
   - Click **"ADD PRINCIPAL"** button
   - In the "New principals" field, enter: `allUsers`
   - In the "Select a role" dropdown, choose: **Cloud Run > Cloud Run Invoker**
   - Click **"SAVE"**

4. **Refresh your app** after setting all permissions

### Alternative: Use gcloud CLI (faster)

If you have gcloud CLI installed, run:

```bash
cd /Users/tonyweeg/AgentQu
chmod +x set-public-access.sh
./set-public-access.sh
```

### Why This is Safe:

- Firebase Callable Functions already handle authentication through Firebase Auth tokens
- Making the Cloud Run service publicly invocable just means it can receive CORS preflight requests
- Your actual business logic still requires proper authentication in the function code

### After Fixing:

The CORS errors will disappear and you'll see activities load on the page!

---

**Quick Link to Cloud Run Console:**
https://console.cloud.google.com/run?project=agentqu-platform
