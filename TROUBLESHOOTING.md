# Troubleshooting Guide

## "No Next.js version detected" Error

This error typically occurs when:

1. **Running from wrong directory** - Make sure you're in the `dashboard/` folder:
   ```bash
   cd dashboard
   npm run dev
   ```

2. **Platform-specific (Vercel/Netlify)** - If deploying, check:
   - Root Directory is set to `dashboard/`
   - package.json exists in that directory
   - Build command: `npm run build` or `cd dashboard && npm run build`

3. **Node modules not installed** - Reinstall if needed:
   ```bash
   cd dashboard
   rm -rf node_modules package-lock.json
   npm install
   ```

## Common Issues

### Bot won't start
- Verify `.env` file exists in `bot/` directory
- Check all environment variables are set
- Ensure MongoDB URI is correct and accessible
- Verify Discord bot token is valid

### Dashboard won't start
- Verify `.env.local` file exists in `dashboard/` directory
- Check `NEXTAUTH_SECRET` is set (should be a long random string)
- Make sure port 3000 is not already in use:
  ```bash
  lsof -ti:3000 | xargs kill -9  # Kill process on port 3000
  ```
- Verify Next.js is installed:
  ```bash
  cd dashboard
  npm list next
  ```

### WebSocket connection issues
- Bot must be running first (starts WebSocket server on port 3001)
- Check `NEXT_PUBLIC_WS_SERVER_URL=http://localhost:3001` in dashboard `.env.local`
- Verify port 3001 is not blocked

### MongoDB connection errors
- Check MongoDB URI format
- Verify network access (IP whitelist in MongoDB Atlas)
- Ensure database user has proper permissions

### Authentication issues
- Regenerate NextAuth secret if needed:
  ```bash
  openssl rand -base64 32
  ```
- Verify Discord OAuth credentials are correct
- Check redirect URI in Discord Developer Portal matches `NEXTAUTH_URL`

## Quick Fixes

### Reinstall everything
```bash
# Bot
cd bot
rm -rf node_modules package-lock.json
npm install

# Dashboard
cd ../dashboard
rm -rf node_modules package-lock.json
npm install
```

### Verify installation
```bash
# Check Node version (should be 18+)
node --version

# Check npm version
npm --version

# Verify Next.js in dashboard
cd dashboard
npm list next

# Verify Discord.js in bot
cd ../bot
npm list discord.js
```

## Starting Fresh

If nothing works, start from scratch:

1. Delete node_modules in both directories
2. Delete package-lock.json files
3. Reinstall dependencies:
   ```bash
   cd bot && npm install
   cd ../dashboard && npm install
   ```
4. Verify .env files exist with correct values
5. Start bot first, then dashboard

