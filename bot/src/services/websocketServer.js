// WebSocket server functions for Google Cloud Run
// Note: WebSockets are not well-supported on Cloud Run, so these are no-ops
// The functions are kept for API compatibility, but do nothing
// The dashboard should use polling or REST APIs instead of WebSockets

/**
 * Initialize WebSocket server (no-op for Cloud Run)
 * @param {number} port - Port to listen on (ignored)
 * @returns {null} - Always returns null
 */
export function initializeWebSocketServer(port = 3001) {
  // No-op: WebSockets not supported on Cloud Run
  // Keeping function for API compatibility
  return null;
}

/**
 * Get the Socket.io server instance (no-op for Cloud Run)
 * @returns {null} - Always returns null
 */
export function getIO() {
  return null;
}

/**
 * Emit an infraction created event (no-op for Cloud Run)
 * @param {Object} infraction - Infraction data (ignored)
 */
export function emitInfractionCreated(infraction) {
  // No-op: WebSockets not supported on Cloud Run
  // Keeping function for API compatibility
}

/**
 * Emit a rank change created event (no-op for Cloud Run)
 * @param {Object} rankChange - Rank change data (ignored)
 */
export function emitRankChangeCreated(rankChange) {
  // No-op: WebSockets not supported on Cloud Run
  // Keeping function for API compatibility
}

/**
 * Emit an infraction deleted event (no-op for Cloud Run)
 * @param {string} infractionId - Infraction ID (ignored)
 */
export function emitInfractionDeleted(infractionId) {
  // No-op: WebSockets not supported on Cloud Run
  // Keeping function for API compatibility
}

