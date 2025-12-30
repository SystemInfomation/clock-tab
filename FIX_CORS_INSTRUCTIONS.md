# How to Fix the CORS Error

## The Problem
Your dashboard at `https://admin.ahscampus.com` is trying to connect to the WebSocket server, but the bot's WebSocket server doesn't allow connections from that origin.

## The Fix - Two Steps Required

### Step 1: Update Bot's CORS Settings

The bot's WebSocket server needs to allow connections from `https://admin.ahscampus.com`.

**If your bot is running locally:**
1. Edit `bot/.env`
2. Add/update:
```env
WS_ALLOWED_ORIGINS=https://admin.ahscampus.com,http://localhost:3000
```
3. Restart the bot

**If your bot is on Cloud Run:**
```bash
gcloud run services update moderation-bot \
  --region europe-west1 \
  --project atlanta-fire-alarm \
  --update-env-vars "WS_ALLOWED_ORIGINS=https://admin.ahscampus.com,https://atlanta-high-school-moderation-bot-706270663868.europe-west1.run.app,http://localhost:3000"
```

### Step 2: Update Dashboard's WebSocket URL

**CRITICAL**: `NEXT_PUBLIC_WS_SERVER_URL` must point to where your **BOT** is running, NOT the dashboard!

**If your bot is running locally:**
```bash
gcloud run services update atlanta-high-school-moderation-bot \
  --region europe-west1 \
  --project atlanta-fire-alarm \
  --update-env-vars "NEXT_PUBLIC_WS_SERVER_URL=http://localhost:3001"
```
*(Note: This won't work from Cloud Run - you need your bot to be publicly accessible)*

**If your bot is on Cloud Run or another server:**
```bash
gcloud run services update atlanta-high-school-moderation-bot \
  --region europe-west1 \
  --project atlanta-fire-alarm \
  --update-env-vars "NEXT_PUBLIC_WS_SERVER_URL=https://YOUR-BOT-SERVICE-URL.run.app"
```

**If your bot is NOT deployed yet:**
- Real-time updates won't work until the bot is deployed
- Set `NEXT_PUBLIC_WS_SERVER_URL` to your bot's public URL
- Or remove/leave it unset (dashboard will work, just no real-time updates)

## Quick Check

Run this to see current dashboard env vars:
```bash
gcloud run services describe atlanta-high-school-moderation-bot \
  --region europe-west1 \
  --project atlanta-fire-alarm \
  --format="value(spec.template.spec.containers[0].env)"
```

## After Making Changes

1. Restart/redeploy the bot (if you changed WS_ALLOWED_ORIGINS)
2. The dashboard will pick up the new NEXT_PUBLIC_WS_SERVER_URL on next build/deploy

