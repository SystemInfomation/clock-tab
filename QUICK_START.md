# Quick Start Guide

Follow these steps to get your bot and dashboard running:

## Step 1: Install Bot Dependencies

```bash
cd bot
npm install
```

## Step 2: Set Up Bot Environment Variables

Create a `.env` file in the `bot/` directory with your credentials:

```bash
cd bot
nano .env
```

Or use this command to create it (replace with your actual values if needed):

```env
DISCORD_TOKEN=MTQ1NTI4MDg1MDcwMTc4MzE4NQ.GpKbfn.uBZDuFFtECD2qVcSS_AfRLZl3kUn9iphuNbpGc
MONGODB_URI=mongodb+srv://blakeflyz1_db_user:e4jIrMKhSMyUuKJp@cluster0.tv2cz1x.mongodb.net/?appName=Cluster0
GUILD_ID=1429025093782077502
STAFF_CHANNEL_ID=1444413105496129657
LOG_CHANNEL_ID=1455644753516560464
BOT_CLIENT_ID=1455280850701783185
AUTO_BAN_THRESHOLD=10
WARN_POINTS=1
MUTE_POINTS=3
KICK_POINTS=5
BAN_POINTS=9
WS_PORT=3001
```

## Step 3: Install Dashboard Dependencies

Open a new terminal and run:

```bash
cd dashboard
npm install
```

## Step 4: Generate NextAuth Secret

Generate a secure secret for NextAuth:

```bash
openssl rand -base64 32
```

Copy the output (you'll need it for the next step).

## Step 5: Set Up Dashboard Environment Variables

Create a `.env.local` file in the `dashboard/` directory:

```bash
cd dashboard
nano .env.local
```

Add the following (use the secret you generated in Step 4):

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<paste the secret from step 4>
DISCORD_CLIENT_ID=1455280850701783185
DISCORD_CLIENT_SECRET=EMgtETS1-vru8-sEP09zG9ls4m_Qr9rP
MONGODB_URI=mongodb+srv://blakeflyz1_db_user:e4jIrMKhSMyUuKJp@cluster0.tv2cz1x.mongodb.net/?appName=Cluster0
NEXT_PUBLIC_WS_SERVER_URL=http://localhost:3001
STAFF_ROLE_IDS=1429025093782077502
```

## Step 6: Start the Bot

In the first terminal (or open a new one):

```bash
cd bot
npm start
```

You should see:
- ✅ Connected to MongoDB
- ✅ WebSocket server listening on port 3001
- ✅ Bot is ready! Logged in as [your bot name]

## Step 7: Start the Dashboard

In a second terminal:

```bash
cd dashboard
npm run dev
```

You should see:
- Ready on http://localhost:3000

## Step 8: Access the Dashboard

1. Open your browser and go to: http://localhost:3000
2. Click "Sign in with Discord"
3. Authorize the application
4. You'll be redirected to the dashboard

## Running Both Services

You need **two terminals** running simultaneously:

**Terminal 1 (Bot):**
```bash
cd bot
npm start
```

**Terminal 2 (Dashboard):**
```bash
cd dashboard
npm run dev
```

## Troubleshooting

### Bot won't start
- Check that your `.env` file exists in the `bot/` directory
- Verify all environment variables are set correctly
- Make sure MongoDB is accessible
- Check that your Discord bot token is valid

### Dashboard won't start
- Check that your `.env.local` file exists in the `dashboard/` directory
- Verify `NEXTAUTH_SECRET` is set (generate a new one if needed)
- Make sure port 3000 is not already in use
- Check that the bot is running (WebSocket connection needs it)

### WebSocket connection issues
- Make sure the bot is running first (it starts the WebSocket server)
- Verify `NEXT_PUBLIC_WS_SERVER_URL=http://localhost:3001` in dashboard `.env.local`
- Check that port 3001 is not blocked by firewall

### MongoDB connection errors
- Verify your MongoDB URI is correct
- Check that your MongoDB cluster allows connections from your IP
- Ensure the database user has proper permissions

