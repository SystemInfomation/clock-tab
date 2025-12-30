#!/bin/bash
# Script to fix CORS issues for WebSocket connection

echo "🔧 Fixing CORS configuration..."

# Update bot's WS_ALLOWED_ORIGINS (if bot is on Cloud Run)
echo ""
echo "Updating bot's WS_ALLOWED_ORIGINS..."
gcloud run services update moderation-bot \
  --region europe-west1 \
  --project atlanta-fire-alarm \
  --update-env-vars "WS_ALLOWED_ORIGINS=https://admin.ahscampus.com,https://atlanta-high-school-moderation-bot-706270663868.europe-west1.run.app,http://localhost:3000" \
  2>/dev/null && echo "✅ Bot CORS updated" || echo "⚠️  Bot service not found or not on Cloud Run"

echo ""
echo "📋 Next steps:"
echo "1. Make sure your bot's WS_ALLOWED_ORIGINS includes: https://admin.ahscampus.com"
echo "2. Update dashboard's NEXT_PUBLIC_WS_SERVER_URL to point to your BOT's URL (not dashboard)"
echo ""
echo "To update dashboard WebSocket URL:"
echo "gcloud run services update atlanta-high-school-moderation-bot \\"
echo "  --region europe-west1 \\"
echo "  --project atlanta-fire-alarm \\"
echo "  --update-env-vars \"NEXT_PUBLIC_WS_SERVER_URL=https://YOUR-BOT-URL-HERE\""

