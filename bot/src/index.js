import { Client, GatewayIntentBits } from 'discord.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { handleMessage } from './events/messageCreate.js';
import { initializeWebSocketServer } from './services/websocketServer.js';

dotenv.config();

// Declare variables before they're used
let botReady = false;
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

// Start health check server for Cloud Run (only when PORT is set)
let healthServer = null;
if (process.env.PORT) {
  const PORT = parseInt(process.env.PORT || '8080', 10);
  healthServer = createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
      const status = botReady ? 'ready' : 'initializing';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'healthy', 
        service: 'discord-bot',
        botStatus: status,
        mongoConnected: mongoose.connection.readyState === 1
      }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });
  
  healthServer.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Health check server listening on port ${PORT}`);
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received: shutting down gracefully...');
    if (healthServer) {
      healthServer.close(() => console.log('Health server closed'));
    }
    if (client && client.isReady()) {
      client.destroy();
      console.log('Discord client destroyed');
    }
    mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log('SIGINT received: shutting down gracefully...');
    if (healthServer) {
      healthServer.close(() => console.log('Health server closed'));
    }
    if (client && client.isReady()) {
      client.destroy();
      console.log('Discord client destroyed');
    }
    mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  });
}

// Connect to MongoDB with timeout settings
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // 5 second timeout instead of default 30s
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Initialize WebSocket server
const wsPort = parseInt(process.env.WS_PORT || '3001');
initializeWebSocketServer(wsPort);

// Bot ready event
client.once('clientReady', () => {
  botReady = true;
  console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
  console.log(`📊 Monitoring staff channel: ${process.env.STAFF_CHANNEL_ID}`);
  console.log(`🆔 Bot User ID: ${client.user.id}`);
});

// Message create event
client.on('messageCreate', async (message) => {
  try {
    await handleMessage(message);
  } catch (error) {
    console.error('Error handling message:', error);
  }
});

// Error handling
client.on('error', (error) => {
  console.error('Discord client error:', error);
});

client.on('warn', (warning) => {
  console.warn('Discord client warning:', warning);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  console.error('Stack:', error.stack);
});

// Login to Discord
if (!process.env.DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN environment variable is not set!');
  process.exit(1);
}

console.log('🔐 Attempting to login to Discord...');
client.login(process.env.DISCORD_TOKEN)
  .then(() => {
    console.log('✅ Discord login successful, waiting for ready event...');
  })
  .catch((error) => {
    console.error('❌ Failed to login to Discord:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  });

