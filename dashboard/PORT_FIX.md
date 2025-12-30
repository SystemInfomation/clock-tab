# PORT Binding Fix for Google Cloud Run

## Problem
Google Cloud Run requires applications to:
1. Bind to `0.0.0.0` (all interfaces) - not localhost
2. Listen on the PORT environment variable (defaults to 8080)
3. Handle SIGTERM for graceful shutdown

The previous approach using `next start -p` was failing because it wasn't explicitly binding to `0.0.0.0`.

## Solution
Created a custom `server.js` that explicitly:
1. Binds to `0.0.0.0` (required for Cloud Run)
2. Reads PORT from environment variable (defaults to 8080)
3. Uses Node.js `http.createServer` with explicit hostname binding

## Changes Made

### 1. Created `dashboard/server.js`
- Custom Next.js server that binds to `0.0.0.0:PORT`
- Uses `server.listen(port, hostname, callback)` with explicit hostname `0.0.0.0`
- Handles graceful shutdown signals (SIGTERM and SIGINT) - required for Google Cloud Run
- Stores server reference to allow proper cleanup

### 2. Updated `dashboard/package.json`
- Changed start script from `node start.js` to `NODE_ENV=production node server.js`
- This ensures the custom server is used in production

### 3. Removed `dashboard/start.js`
- The spawn-based approach was replaced with a more reliable custom server

## How It Works

1. Google Cloud Run sets `PORT=8080` environment variable automatically
2. `npm start` runs `NODE_ENV=production node server.js`
3. Server reads `PORT` from environment (defaults to 8080 if not set)
4. Server explicitly binds to `0.0.0.0:8080` (all network interfaces)
5. Cloud Run health checks pass ✅
6. When Cloud Run needs to stop the container, it sends SIGTERM
7. Server gracefully closes connections and exits ✅

## Deployment to Google Cloud Run

The application is now configured correctly for Google Cloud Run. The server will:
- Listen on `0.0.0.0:8080` (or whatever PORT Cloud Run sets)
- Accept connections from Cloud Run's load balancer
- Handle health checks properly (responds on `/` endpoint)
- Serve Next.js production build
- Gracefully shutdown when Cloud Run sends SIGTERM

### Deploy Command

```bash
cd dashboard
gcloud run deploy SERVICE_NAME \
  --source . \
  --region REGION \
  --platform managed \
  --allow-unauthenticated
```

Replace `SERVICE_NAME` and `REGION` with your values.

## Testing Locally

To test the server locally:
```bash
cd dashboard
npm run build
PORT=8080 npm start
```

The server should start and bind to `0.0.0.0:8080`.

