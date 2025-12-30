#!/bin/bash
# Quick script to redeploy dashboard to Cloud Run

set -e

echo "🚀 Deploying dashboard to Cloud Run..."

cd dashboard

gcloud run deploy atlanta-high-school-moderation-bot \
  --source . \
  --region europe-west1 \
  --platform managed \
  --project atlanta-fire-alarm \
  --allow-unauthenticated

echo "✅ Dashboard deployed successfully!"
echo "📍 URL: https://atlanta-high-school-moderation-bot-706270663868.europe-west1.run.app"

