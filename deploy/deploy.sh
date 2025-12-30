#!/bin/bash
# Deployment script for Google Cloud Run
# Usage: ./deploy/deploy.sh [bot|dashboard|all]

set -e

PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project)}"
REGION="${GCP_REGION:-europe-west1}"

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Error: GCP_PROJECT_ID not set and no default project configured"
  echo "Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "🚀 Deploying to Google Cloud Run"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

deploy_bot() {
  echo "📦 Building Discord Bot..."
  cd bot
  gcloud builds submit --tag gcr.io/$PROJECT_ID/discord-moderation-bot:latest
  
  echo "🚀 Deploying Discord Bot..."
  gcloud run deploy discord-moderation-bot \
    --image gcr.io/$PROJECT_ID/discord-moderation-bot:latest \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars "NODE_ENV=production,PORT=8080,STAFF_CHANNEL_ID=1444413105496129657,AUTO_BAN_THRESHOLD=10,WARN_POINTS=1,MUTE_POINTS=3,KICK_POINTS=5,BAN_POINTS=9,WS_PORT=3001" \
    --set-secrets "DISCORD_TOKEN=discord-token:latest,MONGODB_URI=mongodb-uri:latest,GUILD_ID=guild-id:latest,LOG_CHANNEL_ID=log-channel-id:latest,BOT_CLIENT_ID=bot-client-id:latest" \
    --cpu 1 \
    --memory 512Mi \
    --min-instances 1 \
    --max-instances 1 \
    --timeout 300 \
    --port 8080
  
  cd ..
  echo "✅ Bot deployed!"
}

deploy_dashboard() {
  echo "📦 Building Dashboard..."
  cd dashboard
  gcloud builds submit --tag gcr.io/$PROJECT_ID/moderation-dashboard:latest
  
  echo "🚀 Deploying Dashboard..."
  gcloud run deploy moderation-dashboard \
    --image gcr.io/$PROJECT_ID/moderation-dashboard:latest \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars "NODE_ENV=production,PORT=8080" \
    --set-secrets "NEXTAUTH_SECRET=nextauth-secret:latest,DISCORD_CLIENT_ID=discord-client-id:latest,DISCORD_CLIENT_SECRET=discord-client-secret:latest,MONGODB_URI=mongodb-uri:latest,GUILD_ID=guild-id:latest" \
    --cpu 1 \
    --memory 1Gi \
    --min-instances 0 \
    --max-instances 10 \
    --timeout 60 \
    --port 8080
  
  # Get dashboard URL and update NEXTAUTH_URL
  DASHBOARD_URL=$(gcloud run services describe moderation-dashboard --region $REGION --format="value(status.url)")
  echo "🌐 Dashboard URL: $DASHBOARD_URL"
  
  gcloud run services update moderation-dashboard \
    --region $REGION \
    --update-env-vars "NEXTAUTH_URL=$DASHBOARD_URL"
  
  cd ..
  echo "✅ Dashboard deployed!"
}

case "${1:-all}" in
  bot)
    deploy_bot
    ;;
  dashboard)
    deploy_dashboard
    ;;
  all)
    deploy_bot
    echo ""
    deploy_dashboard
    ;;
  *)
    echo "Usage: $0 [bot|dashboard|all]"
    exit 1
    ;;
esac

echo ""
echo "✅ Deployment complete!"

