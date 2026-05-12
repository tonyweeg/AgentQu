#!/bin/bash

# Set Cloud Run services to allow unauthenticated access
# This is required for Firebase callable functions to work with CORS

echo "Setting Cloud Run services to allow public access..."

# Get the project ID
PROJECT_ID="agentqu-platform"
REGION="us-central1"

# List of functions to make public
FUNCTIONS=(
  "discoveractivities"
  "qupactivity"
  "checkinactivity"
  "shareactivity"
  "submitreview"
  "voteactivity"
  "suggestactivity"
  "getuserhistory"
)

# Use gcloud if available, otherwise use Firebase
if command -v gcloud &> /dev/null; then
  for FUNC in "${FUNCTIONS[@]}"; do
    echo "Making $FUNC publicly accessible..."
    gcloud run services add-iam-policy-binding $FUNC \
      --region=$REGION \
      --member=allUsers \
      --role=roles/run.invoker \
      --project=$PROJECT_ID \
      --quiet
  done
else
  echo "gcloud CLI not found. Please install it or manually set permissions in Google Cloud Console:"
  echo "https://console.cloud.google.com/run?project=$PROJECT_ID"
  echo ""
  echo "For each function, go to:"
  echo "1. Click on the function name"
  echo "2. Click 'PERMISSIONS' tab"
  echo "3. Click 'ADD PRINCIPAL'"
  echo "4. Enter 'allUsers' as principal"
  echo "5. Select role 'Cloud Run Invoker'"
  echo "6. Click 'SAVE'"
fi

echo "Done!"
