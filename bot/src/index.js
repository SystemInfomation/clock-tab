import { Client, GatewayIntentBits } from 'discord.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { handleMessage } from './events/messageCreate.js';
import { initializeWebSocketServer } from './services/websocketServer.js';

dotenv.config();

// Start health check server for Cloud Run (only when PORT is set)
let healthServer = null;
if (process.env.PORT) {
  const { createServer } = await import('http');
  const PORT = parseInt(process.env.PORT || '8080', 10);
  healthServer = createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'healthy', service: 'discord-bot' }));
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
    console.log('SIGTERM received: closing health server');
    if (healthServer) {
      healthServer.close(() => console.log('Health server closed'));
    }
  });
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
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
client.once('ready', () => {
  console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
  console.log(`📊 Monitoring staff channel: ${process.env.STAFF_CHANNEL_ID}`);
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

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);

