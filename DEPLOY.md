# Deployment Commands

## Dashboard Deployment to Cloud Run

### 1. Navigate to dashboard directory
```bash
cd dashboard
```

### 2. Build and deploy to Cloud Run
```bash
gcloud run deploy atlanta-high-school-moderation-bot \
  --source . \
  --region europe-west1 \
  --platform managed \
  --project atlanta-fire-alarm \
  --allow-unauthenticated
```

### 3. Set environment variables (if not already set)
```bash
gcloud run services update atlanta-high-school-moderation-bot \
  --region europe-west1 \
  --project atlanta-fire-alarm \
  --update-env-vars "NEXTAUTH_URL=https://atlanta-high-school-moderation-bot-706270663868.europe-west1.run.app" \
  --update-env-vars "NEXTAUTH_SECRET=YOUR_SECRET_HERE" \
  --update-env-vars "DISCORD_CLIENT_ID=1455280850701783185" \
  --update-env-vars "DISCORD_CLIENT_SECRET=YOUR_SECRET_HERE" \
  --update-env-vars "MONGODB_URI=YOUR_MONGODB_URI" \
  --update-env-vars "NEXT_PUBLIC_WS_SERVER_URL=YOUR_BOT_URL" \
  --update-env-vars "STAFF_ROLE_IDS=YOUR_ROLE_IDS"
```

### 4. Update just the WebSocket URL (quick update)
```bash
gcloud run services update atlanta-high-school-moderation-bot \
  --region europe-west1 \
  --project atlanta-fire-alarm \
  --update-env-vars "NEXT_PUBLIC_WS_SERVER_URL=YOUR_BOT_URL"
```

## Bot Deployment (if deploying bot to Cloud Run)

### 1. Navigate to bot directory
```bash
cd bot
```

### 2. Deploy bot to Cloud Run (create new service)
```bash
gcloud run deploy moderation-bot \
  --source . \
  --region europe-west1 \
  --platform managed \
  --project atlanta-fire-alarm \
  --no-allow-unauthenticated \
  --set-env-vars "DISCORD_TOKEN=YOUR_TOKEN" \
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
```

## Quick Redeploy (Dashboard Only)

From the project root:

```bash
cd dashboard && gcloud run deploy atlanta-high-school-moderation-bot --source . --region europe-west1 --platform managed --project atlanta-fire-alarm --allow-unauthenticated
```

