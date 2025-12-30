# Atlanta High School Moderation Bot

A comprehensive Discord moderation bot with a web dashboard for tracking infractions, rank changes, and analytics.

## Features

### Discord Bot
- **Moderation Commands**: `!mute`, `!unmute`, `!kick`, `!ban`, `!warn`, `!infractions`, `!clear`
- **Infraction Tracking**: Automatic logging of all moderation actions with points system
- **Rank Change Monitoring**: Automatically parses rank changes from staff channel
- **Real-time Updates**: WebSocket integration for instant dashboard updates
- **Auto-ban System**: Configurable points threshold for automatic bans

### Web Dashboard
- **Discord OAuth2 Authentication**: Secure staff-only access
- **Infractions Panel**: View, filter, and manage all infractions
- **Rank Changes Panel**: Track all promotions, demotions, and terminations
- **User Management**: Complete user history with statistics
- **Analytics**: Charts and visualizations with CSV/JSON export
- **Real-time Updates**: Live updates via WebSocket connection

## Project Structure

```
├── bot/                    # Discord bot application
│   ├── src/
│   │   ├── commands/      # Moderation commands
│   │   ├── events/        # Event handlers
│   │   ├── models/        # MongoDB models
│   │   ├── services/      # Business logic
│   │   └── utils/         # Helper functions
│   └── package.json
├── dashboard/              # Next.js web dashboard
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+ (LTS recommended)
- MongoDB database (Atlas or local)
- Discord Bot Token
- Discord OAuth2 Client ID and Secret

### Bot Setup

1. Navigate to the bot directory:
```bash
cd bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```env
DISCORD_TOKEN=your_bot_token
MONGODB_URI=your_mongodb_uri
GUILD_ID=your_guild_id
STAFF_CHANNEL_ID=1444413105496129657
LOG_CHANNEL_ID=your_log_channel_id
BOT_CLIENT_ID=your_bot_client_id
AUTO_BAN_THRESHOLD=10
WARN_POINTS=1
MUTE_POINTS=3
KICK_POINTS=5
BAN_POINTS=9
WS_PORT=3001
```

4. Start the bot:
```bash
npm start
```

### Dashboard Setup

1. Navigate to the dashboard directory:
```bash
cd dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
MONGODB_URI=your_mongodb_uri
WS_SERVER_URL=http://localhost:3001
STAFF_ROLE_IDS=role1,role2,role3
```

4. Generate a NextAuth secret:
```bash
openssl rand -base64 32
```

5. Start the development server:
```bash
npm run dev
```

The dashboard will be available at `http://localhost:3000`

## Discord Bot Commands

### Moderation Commands

- `!mute @user [duration] [reason]` - Mute a user (duration: 1d, 2h, 30m)
- `!unmute @user` - Remove mute from a user
- `!kick @user [reason]` - Kick a user from the server
- `!ban @user [duration] [reason]` - Ban a user (temporary or permanent)
- `!warn @user [reason]` - Issue a warning
- `!infractions @user` - View all infractions for a user
- `!clear [amount]` - Delete messages (1-100)

### Rank Change Format

Staff should post in the following format in the staff channel:
```
User: @username
Rank: NewRank
Reason: Detailed reason here
```

The bot will automatically parse and log rank changes.

## Configuration

### Points System
- Warning: 1 point (default)
- Mute: 3 points (default)
- Kick: 5 points (default)
- Ban: 9 points (default)
- Auto-ban threshold: 10 points (default)

All values are configurable via environment variables.

## Security Notes

⚠️ **Important**: 
- Never commit `.env` files to version control
- Regenerate Discord tokens if exposed
- Use strong NextAuth secrets
- Restrict dashboard access to staff roles only

## License

MIT
