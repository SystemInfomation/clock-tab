# Quick Deploy Commands

## Redeploy Dashboard to Cloud Run

```bash
cd dashboard
gcloud run deploy atlanta-high-school-moderation-bot \
  --source . \
  --region europe-west1 \
  --platform managed \
  --project atlanta-fire-alarm \
  --allow-unauthenticated
```

Or use the script:
```bash
./deploy-dashboard.sh
```

## Update Dashboard Environment Variables

```bash
gcloud run services update atlanta-high-school-moderation-bot \
  --region europe-west1 \
  --project atlanta-fire-alarm \
  --update-env-vars "NEXT_PUBLIC_WS_SERVER_URL=https://your-bot-url.com"
```

## Check Deployment Status

```bash
gcloud run services describe atlanta-high-school-moderation-bot \
  --region europe-west1 \
  --project atlanta-fire-alarm
```

## View Logs

```bash
gcloud run services logs read atlanta-high-school-moderation-bot \
  --region europe-west1 \
  --project atlanta-fire-alarm \
  --limit 50
```

