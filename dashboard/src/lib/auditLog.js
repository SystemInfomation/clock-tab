/**
 * Security Audit Logging
 * 
 * SECURITY: Log all authentication and security-related events for monitoring and forensics
 * This helps detect suspicious behavior, breaches, and provides audit trails
 */

/**
 * Security event types
 */
const EVENT_TYPES = {
  SIGNIN: 'signin',
  SIGNOUT: 'signout',
  SIGNIN_FAILED: 'signin_failed',
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  ACCOUNT_LINKED: 'account_linked',
  TOKEN_REFRESH: 'token_refresh',
  TOKEN_REFRESH_FAILED: 'token_refresh_failed',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  CSRF_VIOLATION: 'csrf_violation',
  OAUTH_ERROR: 'oauth_error',
};

/**
 * In-memory audit log store (for development)
 * SECURITY: In production, use a proper database or logging service
 * Options: MongoDB collection, CloudWatch, Datadog, Splunk, etc.
 */
const auditLogStore = [];

/**
 * Audit log entry schema
 */
function createLogEntry(eventType, data = {}) {
  return {
    eventType,
    timestamp: new Date().toISOString(),
    userId: data.userId || null,
    ipAddress: data.ipAddress || null,
    userAgent: data.userAgent || null,
    metadata: {
      // Sanitize data - never log sensitive information like tokens or passwords
      email: data.email || null,
      provider: data.provider || null,
      error: data.error ? data.error.message || String(data.error) : null,
      // Additional metadata (sanitized)
      ...Object.fromEntries(
        Object.entries(data.metadata || {})
          .filter(([key]) => !['password', 'token', 'secret', 'accessToken', 'refreshToken'].includes(key.toLowerCase()))
          .map(([key, value]) => [key, typeof value === 'string' ? value.slice(0, 500) : value]) // Limit string length
      ),
    },
    // SECURITY: Generate unique log ID for correlation
    logId: crypto.randomUUID ? crypto.randomUUID() : require('crypto').randomBytes(16).toString('hex'),
  };
}

/**
 * Log authentication event
 * SECURITY: This function sanitizes all input to prevent logging sensitive data
 * 
 * @param {string} eventType - Type of event (use EVENT_TYPES constants)
 * @param {Object} data - Event data (will be sanitized)
 * @param {Request} request - Optional request object for IP/User-Agent
 */
export function logAuthEvent(eventType, data = {}, request = null) {
  try {
    // SECURITY: Sanitize and validate event type
    if (!Object.values(EVENT_TYPES).includes(eventType)) {
      console.warn(`[AUDIT] Invalid event type: ${eventType}`);
      eventType = EVENT_TYPES.SUSPICIOUS_ACTIVITY;
    }

    // SECURITY: Extract IP and User-Agent from request if available
    let ipAddress = data.ipAddress || null;
    let userAgent = data.userAgent || null;
    
    if (request) {
      // Get client IP (respects proxies)
      const forwarded = request.headers?.get('x-forwarded-for');
      const realIP = request.headers?.get('x-real-ip');
      const cfConnectingIP = request.headers?.get('cf-connecting-ip');
      
      ipAddress = forwarded?.split(',')[0]?.trim() || realIP || cfConnectingIP || ipAddress || 'unknown';
      userAgent = request.headers?.get('user-agent') || userAgent;
    }

    const logEntry = createLogEntry(eventType, {
      ...data,
      ipAddress,
      userAgent,
    });

    // Store log entry
    auditLogStore.push(logEntry);
    
    // SECURITY: Keep only last 1000 entries in memory (for development)
    if (auditLogStore.length > 1000) {
      auditLogStore.shift();
    }

    // SECURITY: Log to console in development, use proper logging service in production
    const logLevel = eventType.includes('failed') || eventType.includes('suspicious') || eventType.includes('violation') 
      ? 'error' 
      : 'info';
    
    if (process.env.NODE_ENV === 'development') {
      console[logLevel](`[AUDIT] ${eventType}:`, {
        userId: logEntry.userId,
        timestamp: logEntry.timestamp,
        logId: logEntry.logId,
      });
    }

    // SECURITY: In production, send to your logging service
    // Example: await sendToCloudWatch(logEntry);
    // Example: await sendToMongoDB(logEntry);
    
    return logEntry;
  } catch (error) {
    // SECURITY: Never throw errors from audit logging (fail silently to not break app)
    console.error('[AUDIT] Error logging event:', error.message);
    return null;
  }
}

/**
 * Get audit logs (for admin/debugging)
 * SECURITY: Restrict access to this function - should require admin authentication
 * 
 * @param {Object} filters - Filter criteria
 * @param {number} limit - Maximum number of logs to return
 * @returns {Array} - Audit log entries
 */
export function getAuditLogs(filters = {}, limit = 100) {
  try {
    let logs = [...auditLogStore];

    // Apply filters
    if (filters.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }
    if (filters.eventType) {
      logs = logs.filter(log => log.eventType === filters.eventType);
    }
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      logs = logs.filter(log => new Date(log.timestamp) >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      logs = logs.filter(log => new Date(log.timestamp) <= end);
    }

    // Sort by timestamp (newest first) and limit
    return logs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  } catch (error) {
    console.error('[AUDIT] Error retrieving logs:', error.message);
    return [];
  }
}

/**
 * Check for suspicious activity patterns
 * SECURITY: Detect potential attacks (brute force, account enumeration, etc.)
 * 
 * @param {string} identifier - User ID, IP address, or email
 * @param {string} eventType - Event type to check
 * @param {number} threshold - Number of events within timeWindow to trigger alert
 * @param {number} timeWindowMs - Time window in milliseconds
 * @returns {boolean} - True if suspicious activity detected
 */
export function detectSuspiciousActivity(identifier, eventType, threshold = 5, timeWindowMs = 15 * 60 * 1000) {
  try {
    const now = Date.now();
    const cutoff = now - timeWindowMs;

    const recentEvents = auditLogStore.filter(log => 
      log.eventType === eventType &&
      (log.userId === identifier || log.ipAddress === identifier) &&
      new Date(log.timestamp).getTime() > cutoff
    );

    if (recentEvents.length >= threshold) {
      // Log suspicious activity
      logAuthEvent(EVENT_TYPES.SUSPICIOUS_ACTIVITY, {
        userId: typeof identifier === 'string' && /^\d{17,19}$/.test(identifier) ? identifier : null,
        ipAddress: typeof identifier === 'string' && !/^\d{17,19}$/.test(identifier) ? identifier : null,
        metadata: {
          eventType,
          eventCount: recentEvents.length,
          threshold,
          timeWindowMs,
        },
      });

      return true;
    }

    return false;
  } catch (error) {
    console.error('[AUDIT] Error detecting suspicious activity:', error.message);
    return false;
  }
}

// Export event types for use in other modules
export { EVENT_TYPES };

