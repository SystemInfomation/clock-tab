import { Server } from 'socket.io';
import http from 'http';

let io = null;

/**
 * Initialize WebSocket server
 * @param {number} port - Port to listen on
 * @returns {Server} - Socket.io server instance
 */
export function initializeWebSocketServer(port = 3001) {
  const server = http.createServer();
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  
  server.listen(port, () => {
    console.log(`WebSocket server listening on port ${port}`);
  });
  
  io.on('connection', (socket) => {
    console.log('Client connected to WebSocket server');
    
    socket.on('disconnect', () => {
      console.log('Client disconnected from WebSocket server');
    });
  });
  
  return io;
}

/**
 * Get the Socket.io server instance
 * @returns {Server|null} - Socket.io server or null if not initialized
 */
export function getIO() {
  return io;
}

/**
 * Emit an infraction created event
 * @param {Object} infraction - Infraction data
 */
export function emitInfractionCreated(infraction) {
  if (io) {
    io.emit('infraction_created', infraction);
  }
}

/**
 * Emit a rank change created event
 * @param {Object} rankChange - Rank change data
 */
export function emitRankChangeCreated(rankChange) {
  if (io) {
    io.emit('rank_change_created', rankChange);
  }
}

/**
 * Emit an infraction deleted event
 * @param {string} infractionId - Infraction ID
 */
export function emitInfractionDeleted(infractionId) {
  if (io) {
    io.emit('infraction_deleted', { id: infractionId });
  }
}

