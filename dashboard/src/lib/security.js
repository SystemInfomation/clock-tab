/**
 * Security utilities for input validation, sanitization, and rate limiting
 */

/**
 * Sanitize MongoDB query to prevent NoSQL injection
 * @param {any} value - Value to sanitize
 * @returns {any} - Sanitized value
 */
export function sanitizeMongoQuery(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    // Remove MongoDB operators
    const dangerousPatterns = [
      /^\$/, // MongoDB operators
      /^\$where/i,
      /^\$regex/i,
      /^\$ne/i,
      /^\$ne/i,
      /^\$gt/i,
      /^\$gte/i,
      /^\$lt/i,
      /^\$lte/i,
      /^\$in/i,
      /^\$nin/i,
      /^\$exists/i,
      /^\$type/i,
      /^\$mod/i,
      /^\$size/i,
      /^\$all/i,
      /^\$elemMatch/i,
      /^\$not/i,
      /^\$or/i,
      /^\$and/i,
      /^\$nor/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(value)) {
        throw new Error('Invalid query parameter');
      }
    }

    // Trim and limit length
    return value.trim().slice(0, 1000);
  }

  if (typeof value === 'number') {
    // Validate number is finite and within reasonable bounds
    if (!Number.isFinite(value) || value < -Number.MAX_SAFE_INTEGER || value > Number.MAX_SAFE_INTEGER) {
      throw new Error('Invalid number parameter');
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeMongoQuery).filter(v => v !== null);
  }

  if (typeof value === 'object') {
    const sanitized = {};
    for (const [key, val] of Object.entries(value)) {
      // Prevent MongoDB operator injection in keys
      if (key.startsWith('$')) {
        throw new Error('Invalid query parameter');
      }
      sanitized[key] = sanitizeMongoQuery(val);
    }
    return sanitized;
  }

  return value;
}

/**
 * Validate and sanitize user ID
 * @param {string} userId - User ID to validate
 * @returns {string} - Sanitized user ID
 */
export function validateUserId(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user ID');
  }

  // Discord user IDs are 17-19 digit numbers
  if (!/^\d{17,19}$/.test(userId.trim())) {
    throw new Error('Invalid user ID format');
  }

  return userId.trim();
}

/**
 * Validate and sanitize pagination parameters
 * @param {string|number} page - Page number
 * @param {string|number} limit - Items per page
 * @returns {{page: number, limit: number}} - Validated pagination
 */
export function validatePagination(page, limit) {
  const pageNum = parseInt(page || '1', 10);
  const limitNum = parseInt(limit || '50', 10);

  if (!Number.isFinite(pageNum) || pageNum < 1 || pageNum > 1000) {
    throw new Error('Invalid page number');
  }

  if (!Number.isFinite(limitNum) || limitNum < 1 || limitNum > 100) {
    throw new Error('Invalid limit (must be between 1 and 100)');
  }

  return { page: pageNum, limit: limitNum };
}

/**
 * Validate and sanitize date string
 * @param {string} dateString - Date string to validate
 * @returns {Date} - Validated Date object
 */
export function validateDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    throw new Error('Invalid date');
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }

  // Prevent dates too far in the past or future
  const minDate = new Date('2000-01-01');
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1); // Allow 1 year in future

  if (date < minDate || date > maxDate) {
    throw new Error('Date out of valid range');
  }

  return date;
}

/**
 * Validate infraction type
 * @param {string} type - Infraction type
 * @returns {string} - Validated type
 */
export function validateInfractionType(type) {
  const validTypes = ['warning', 'mute', 'kick', 'ban'];
  if (!type || !validTypes.includes(type.toLowerCase())) {
    throw new Error('Invalid infraction type');
  }
  return type.toLowerCase();
}

/**
 * Rate limiting store (in-memory, consider Redis for production)
 */
const rateLimitStore = new Map();

/**
 * Simple rate limiter
 * @param {string} identifier - Unique identifier (IP, user ID, etc.)
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - True if allowed, false if rate limited
 */
export function rateLimit(identifier, maxRequests = 100, windowMs = 60000) {
  const now = Date.now();
  const key = identifier;
  
  const record = rateLimitStore.get(key);
  
  if (!record) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (now > record.resetTime) {
    // Reset window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Clean up expired rate limit records
 */
export function cleanupRateLimit() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimit, 5 * 60 * 1000);
}

/**
 * Get client IP from request
 * @param {Request} request - Next.js request object
 * @returns {string} - Client IP address
 */
export function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}

/**
 * Create a secure error response without leaking information
 * @param {Error|string} error - Error object or message
 * @param {number} statusCode - HTTP status code
 * @param {boolean} isDevelopment - Whether in development mode
 * @returns {Object} - Error response object
 */
export function createErrorResponse(error, statusCode = 500, isDevelopment = false) {
  const message = error instanceof Error ? error.message : error;
  
  return {
    error: isDevelopment ? message : 'An error occurred',
    ...(isDevelopment && error instanceof Error && { stack: error.stack }),
  };
}

