#!/bin/bash
# Deploy both AgentQu and AgentQu Stocks to Firebase Hosting
# Stocks app is deployed as a subdirectory: /stocks

set -e

echo "=== Building AgentQu Main App ==="
cd /Users/tonyweeg/AgentQu/agentqu-app
npm run build

echo ""
echo "=== Building AgentQu Stocks App ==="
cd /Users/tonyweeg/AgentQu/stock-watch-app
npm run build

echo ""
echo "=== Copying Stocks build to /stocks subdirectory ==="
mkdir -p /Users/tonyweeg/AgentQu/agentqu-app/build/stocks
cp -r /Users/tonyweeg/AgentQu/stock-watch-app/build/* /Users/tonyweeg/AgentQu/agentqu-app/build/stocks/

echo ""
echo "=== Deploying to Firebase Hosting ==="
cd /Users/tonyweeg/AgentQu
firebase deploy --only hosting

echo ""
echo "=== Deployment Complete ==="
echo "Main app: https://agentqu-platform.web.app"
echo "Stocks app: https://agentqu-platform.web.app/stocks"
