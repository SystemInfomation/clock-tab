#!/bin/bash
# Complete redeployment script for both dashboard and bot

set -e

echo "🚀 Starting complete redeployment..."

# Deploy Dashboard
echo ""
echo "📊 Deploying Dashboard..."
cd dashboard
gcloud run deploy atlanta-high-school-moderation-bot \
  --source . \
  --region europe-west1 \
  --platform managed \
  --project atlanta-fire-alarm \
  --allow-unauthenticated

echo "✅ Dashboard deployed!"
cd ..

# Deploy Bot (commented out - uncomment and update env vars if needed)
# echo ""
# echo "🤖 Deploying Bot..."
# cd bot
# gcloud run deploy moderation-bot \
#   --source . \
#   --region europe-west1 \
#   --platform managed \
#   --project atlanta-fire-alarm \
#   --no-allow-unauthenticated \
#   --set-env-vars "DISCORD_TOKEN=YOUR_TOKEN" \
#   --set-env-vars "MONGODB_URI=YOUR_MONGODB_URI" \
#   --set-env-vars "GUILD_ID=1429025093782077502" \
#   --set-env-vars "STAFF_CHANNEL_ID=1444413105496129657" \
#   --set-env-vars "LOG_CHANNEL_ID=1455644753516560464" \
#   --set-env-vars "BOT_CLIENT_ID=1455280850701783185" \
#   --set-env-vars "WS_PORT=3001"

echo ""
echo "✅ All deployments complete!"
echo "📍 Dashboard URL: https://atlanta-high-school-moderation-bot-706270663868.europe-west1.run.app"
