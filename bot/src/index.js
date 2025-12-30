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

// Start health check server for Cloud Run FIRST (must be available immediately)
// Cloud Run requires the container to listen on PORT immediately
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
  
  healthServer.listen(PORT, '0.0.0.0', (err) => {
    if (err) {
      console.error('❌ Failed to start health server:', err);
      process.exit(1);
    }
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
} else {
  console.warn('⚠️  PORT environment variable not set - health server not started');
}

// Connect to MongoDB with timeout settings (non-blocking - don't exit on failure)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
  })
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    console.error('⚠️  Continuing without MongoDB connection - bot functionality may be limited');
    // Don't exit - let the health server continue running
  });
} else {
  console.warn('⚠️  MONGODB_URI environment variable not set - MongoDB connection skipped');
}

// Initialize WebSocket server (with error handling)
try {
  const wsPort = parseInt(process.env.WS_PORT || '3001');
  initializeWebSocketServer(wsPort);
} catch (error) {
  console.error('❌ Failed to initialize WebSocket server:', error);
  console.error('⚠️  Continuing without WebSocket server - real-time updates disabled');
  // Don't exit - let the health server continue running
}

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

// Login to Discord (non-blocking - don't exit on failure immediately)
if (!process.env.DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN environment variable is not set!');
  console.error('⚠️  Bot cannot function without Discord token, but health server will continue');
  // Don't exit - let health server continue running for Cloud Run health checks
} else {
  console.log('🔐 Attempting to login to Discord...');
  client.login(process.env.DISCORD_TOKEN)
    .then(() => {
      console.log('✅ Discord login successful, waiting for ready event...');
    })
    .catch((error) => {
      console.error('❌ Failed to login to Discord:', error);
      console.error('Error details:', error.message);
      console.error('⚠️  Bot cannot function, but health server will continue running');
      // Don't exit - let health server continue running for Cloud Run health checks
    });
}

