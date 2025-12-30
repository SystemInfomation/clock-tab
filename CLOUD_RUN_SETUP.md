# Cloud Run Environment Variables Setup

## Setting NEXT_PUBLIC_WS_SERVER_URL in Cloud Run

### Using gcloud CLI:

```bash
# Update the Cloud Run service with the environment variable
gcloud run services update atlanta-high-school-moderation-bot \
  --region europe-west1 \
  --set-env-vars "NEXT_PUBLIC_WS_SERVER_URL=https://your-bot-websocket-url.com" \
  --project atlanta-fire-alarm
```

### Or add multiple environment variables:

```bash
gcloud run services update atlanta-high-school-moderation-bot \
  --region europe-west1 \
  --update-env-vars "NEXT_PUBLIC_WS_SERVER_URL=https://your-bot-websocket-url.com" \
  --update-env-vars "NEXTAUTH_URL=https://atlanta-high-school-moderation-bot-706270663868.europe-west1.run.app" \
  --project atlanta-fire-alarm
```

## Important Notes:

1. **Bot WebSocket URL**: You need to know where your bot's WebSocket server is running
   - If bot is also on Cloud Run: `https://your-bot-service.run.app`
   - If bot is on a different server: `https://your-bot-domain.com`
   - The bot runs WebSocket server on port 3001 by default

2. **Required Environment Variables for Dashboard**:
   ```env
   NEXTAUTH_URL=https://atlanta-high-school-moderation-bot-706270663868.europe-west1.run.app
   NEXTAUTH_SECRET=your_secret_here
   DISCORD_CLIENT_ID=your_client_id
   DISCORD_CLIENT_SECRET=your_client_secret
   MONGODB_URI=your_mongodb_uri
   NEXT_PUBLIC_WS_SERVER_URL=https://your-bot-websocket-url.com
   STAFF_ROLE_IDS=your_role_ids
   ```

3. **If your bot WebSocket server is on the same Cloud Run service**:
   - This is tricky because the bot and dashboard need to run separately
   - The bot needs to be deployed as a separate Cloud Run service
   - Or use a different deployment method for the bot

4. **Recommended Setup**:
   - Deploy bot separately (Cloud Run, Cloud Functions, or always-on VM)
   - Get the bot's public URL
   - Set `NEXT_PUBLIC_WS_SERVER_URL` to that URL

