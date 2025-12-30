import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    // Parse URI to remove any existing timeout parameters that might conflict
    // This ensures our timeout settings take precedence
    let cleanUri = MONGODB_URI;
    try {
      const uri = new URL(MONGODB_URI);
      // Remove timeout-related query parameters
      uri.searchParams.delete('connectTimeoutMS');
      uri.searchParams.delete('serverSelectionTimeoutMS');
      uri.searchParams.delete('socketTimeoutMS');
      cleanUri = uri.toString();
    } catch (error) {
      // If URI parsing fails (non-standard format), use original URI
      // The options will still override any timeout params in the connection string
      console.warn('Could not parse MongoDB URI, using as-is:', error.message);
    }

    const opts = {
      bufferCommands: false,
      // Increased timeouts for Cloud Run/Cloud Build environments
      // These account for cold starts and network latency
      serverSelectionTimeoutMS: 60000, // 60 seconds for server selection
      socketTimeoutMS: 90000, // 90 seconds for socket operations
      connectTimeoutMS: 60000, // 60 seconds for initial connection
      // Connection pooling for better performance in serverless
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1, // Start with 1 connection (better for cold starts)
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      // Retry settings
      retryWrites: true,
      retryReads: true,
      // Heartbeat to keep connection alive
      heartbeatFrequencyMS: 10000,
    };

    cached.promise = mongoose.connect(cleanUri, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
      return mongoose;
    }).catch((error) => {
      console.error('❌ MongoDB connection failed:', error.message);
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;

