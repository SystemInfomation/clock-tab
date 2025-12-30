#!/bin/bash
# Script to deploy bot to Cloud Run
# NOTE: Update the environment variables with your actual values before running

set -e

echo "🤖 Deploying bot to Cloud Run..."

cd bot

# IMPORTANT: Update these values with your actual credentials
gcloud run deploy moderation-bot \
  --source . \
  --region europe-west1 \
  --platform managed \
  --project atlanta-fire-alarm \
  --no-allow-unauthenticated \
  --set-env-vars "DISCORD_TOKEN=YOUR_DISCORD_TOKEN" \
  --set-env-vars "MONGODB_URI=YOUR_MONGODB_URI" \
  --set-env-vars "GUILD_ID=1429025093782077502" \
  --set-env-vars "STAFF_CHANNEL_ID=1444413105496129657" \
  --set-env-vars "LOG_CHANNEL_ID=1455644753516560464" \
  --set-env-vars "BOT_CLIENT_ID=1455280850701783185" \
  --set-env-vars "AUTO_BAN_THRESHOLD=10" \
  --set-env-vars "WARN_POINTS=1" \
  --set-env-vars "MUTE_POINTS=3" \
  --set-env-vars "KICK_POINTS=5" \
  --set-env-vars "BAN_POINTS=9" \
  --set-env-vars "WS_PORT=3001" \
  --set-env-vars "WS_ALLOWED_ORIGINS=https://atlanta-high-school-moderation-bot-706270663868.europe-west1.run.app"

echo "✅ Bot deployed successfully!"

