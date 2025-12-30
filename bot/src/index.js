import { Client, GatewayIntentBits } from 'discord.js';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { handleMessage } from './events/messageCreate.js';

// Google Cloud Run optimized Discord Bot
// Cloud Run requires the container to listen on PORT immediately

// Validate required environment variables
const requiredEnvVars = ['DISCORD_TOKEN', 'MONGODB_URI', 'PORT'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('❌ Cloud Run requires PORT, DISCORD_TOKEN, and MONGODB_URI to be set');
  process.exit(1);
}

// Declare variables
let botReady = false;
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

// Start health check server for Cloud Run (MANDATORY)
// Cloud Run requires the container to listen on PORT immediately
const PORT = parseInt(process.env.PORT, 10);
const healthServer = createServer((req, res) => {
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

// Graceful shutdown for Cloud Run
process.on('SIGTERM', () => {
  console.log('SIGTERM received: shutting down gracefully...');
  healthServer.close(() => console.log('Health server closed'));
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
  healthServer.close(() => console.log('Health server closed'));
  if (client && client.isReady()) {
    client.destroy();
    console.log('Discord client destroyed');
  }
  mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});

// Connect to MongoDB (required for bot functionality)
// Increased timeouts for Cloud Run network latency
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000, // Increased to 30s for Cloud Run network latency
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  maxPoolSize: 10,
  minPoolSize: 1,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  console.error('❌ Bot requires MongoDB to function');
  // Keep health server running for Cloud Run, but bot won't work
  // Cloud Run will see health checks succeed, but bot functionality will be limited
});

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connection ready');
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB connection error:', error);
});

// Bot ready event
client.once('ready', () => {
  botReady = true;
  console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
  console.log(`📊 Monitoring staff channel: ${process.env.STAFF_CHANNEL_ID || 'not set'}`);
  console.log(`🆔 Bot User ID: ${client.user.id}`);
});

// Message create event
client.on('messageCreate', async (message) => {
  // Skip message processing if MongoDB is not connected
  if (mongoose.connection.readyState !== 1) {
    console.warn('⚠️  Skipping message processing - MongoDB not connected');
    return;
  }
  
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

// Login to Discord (required)
console.log('🔐 Attempting to login to Discord...');
client.login(process.env.DISCORD_TOKEN)
  .then(() => {
    console.log('✅ Discord login successful, waiting for ready event...');
  })
  .catch((error) => {
    console.error('❌ Failed to login to Discord:', error);
    console.error('Error details:', error.message);
    // Keep health server running for Cloud Run, but bot won't work
  });
