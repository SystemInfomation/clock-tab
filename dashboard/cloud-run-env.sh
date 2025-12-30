#!/bin/bash
# Script to set Cloud Run environment variables
# Update the values below and run: bash cloud-run-env.sh

SERVICE_NAME="atlanta-high-school-moderation-bot"
REGION="europe-west1"
PROJECT_ID="atlanta-fire-alarm"

# IMPORTANT: Update these values with your actual configuration
NEXTAUTH_URL="https://atlanta-high-school-moderation-bot-706270663868.europe-west1.run.app"
NEXT_PUBLIC_WS_SERVER_URL="https://YOUR-BOT-WEBSOCKET-URL.com"  # UPDATE THIS!
NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET"  # UPDATE THIS!
DISCORD_CLIENT_ID="YOUR_DISCORD_CLIENT_ID"  # UPDATE THIS!
DISCORD_CLIENT_SECRET="YOUR_DISCORD_CLIENT_SECRET"  # UPDATE THIS!
MONGODB_URI="YOUR_MONGODB_URI"  # UPDATE THIS!
STAFF_ROLE_IDS="YOUR_STAFF_ROLE_IDS"  # UPDATE THIS!

gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --project $PROJECT_ID \
  --update-env-vars "NEXTAUTH_URL=$NEXTAUTH_URL" \
  --update-env-vars "NEXT_PUBLIC_WS_SERVER_URL=$NEXT_PUBLIC_WS_SERVER_URL" \
  --update-env-vars "NEXTAUTH_SECRET=$NEXTAUTH_SECRET" \
  --update-env-vars "DISCORD_CLIENT_ID=$DISCORD_CLIENT_ID" \
  --update-env-vars "DISCORD_CLIENT_SECRET=$DISCORD_CLIENT_SECRET" \
  --update-env-vars "MONGODB_URI=$MONGODB_URI" \
  --update-env-vars "STAFF_ROLE_IDS=$STAFF_ROLE_IDS"

echo "Environment variables updated successfully!"

