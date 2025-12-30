# CORS Fix for WebSocket Connection

## Problem
The dashboard at `https://admin.ahscampus.com` is trying to connect to the WebSocket server, but CORS is blocking it because the bot's WebSocket server doesn't allow that origin.

## Solution

You need to update the bot's `WS_ALLOWED_ORIGINS` environment variable to include your dashboard domain.

### If Bot is Running Locally:
Update bot's `.env` file:
```env
WS_ALLOWED_ORIGINS=https://admin.ahscampus.com,http://localhost:3000
```

### If Bot is on Cloud Run:
Update the bot's Cloud Run service environment variable:

```bash
gcloud run services update moderation-bot \
  --region europe-west1 \
  --project atlanta-fire-alarm \
  --update-env-vars "WS_ALLOWED_ORIGINS=https://admin.ahscampus.com,https://atlanta-high-school-moderation-bot-706270663868.europe-west1.run.app"
```

### Important: NEXT_PUBLIC_WS_SERVER_URL
Make sure your dashboard's `NEXT_PUBLIC_WS_SERVER_URL` points to where the **bot** is running (not the dashboard):

```bash
# Update dashboard Cloud Run env var
gcloud run services update atlanta-high-school-moderation-bot \
  --region europe-west1 \
  --project atlanta-fire-alarm \
  --update-env-vars "NEXT_PUBLIC_WS_SERVER_URL=https://YOUR-BOT-URL.com"
```

## Summary

1. Bot's `WS_ALLOWED_ORIGINS` must include: `https://admin.ahscampus.com`
2. Dashboard's `NEXT_PUBLIC_WS_SERVER_URL` must point to the bot's URL (not dashboard)
3. Restart/redeploy both services after changes

