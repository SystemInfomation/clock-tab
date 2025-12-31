/**
 * CORS Configuration and Validation
 * 
 * SECURITY: Proper CORS configuration prevents unauthorized cross-origin requests
 * This module provides CORS headers and validation for API routes
 */

/**
 * Allowed origins for CORS requests
 * SECURITY: Whitelist only trusted domains
 */
const ALLOWED_ORIGINS = [
  process.env.NEXTAUTH_URL,
  process.env.NEXTAUTH_URL?.replace(/\/$/, ''), // Without trailing slash
  ...(process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || []),
].filter(Boolean);

/**
 * Check if origin is allowed
 * SECURITY: Validate origin to prevent unauthorized cross-origin requests
 * 
 * @param {string} origin - Request origin header
 * @returns {boolean} - True if origin is allowed
 */
export function isOriginAllowed(origin) {
  if (!origin) {
    // Same-origin requests don't include Origin header
    return true;
  }

  try {
    const originUrl = new URL(origin);
    const baseUrl = new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000');
    
    // Allow same origin
    if (originUrl.origin === baseUrl.origin) {
      return true;
    }

    // Check against whitelist
    return ALLOWED_ORIGINS.some(allowed => {
      try {
        const allowedUrl = new URL(allowed);
        return originUrl.origin === allowedUrl.origin;
      } catch {
        return false;
      }
    });
  } catch {
    return false; // Invalid origin URL
  }
}

/**
 * Get CORS headers for response
 * SECURITY: Set appropriate CORS headers based on request origin
 * 
 * @param {Request} request - Next.js request object
 * @returns {Object} - CORS headers object
 */
export function getCorsHeaders(request) {
  const origin = request.headers.get('origin');
  
  // SECURITY: Only allow CORS from whitelisted origins
  if (origin && isOriginAllowed(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true', // SECURITY: Allow credentials only for trusted origins
      'Access-Control-Max-Age': '86400', // 24 hours
    };
  }

  // SECURITY: Default to same-origin only
  return {
    'Access-Control-Allow-Origin': process.env.NEXTAUTH_URL || 'same-origin',
  };
}

/**
 * Handle CORS preflight request
 * SECURITY: Validate preflight requests and return appropriate headers
 * 
 * @param {Request} request - Next.js request object
 * @returns {Response|null} - Response if preflight, null if not a preflight request
 */
export function handleCorsPreflight(request) {
  // SECURITY: Handle OPTIONS preflight requests
  if (request.method === 'OPTIONS') {
    const headers = getCorsHeaders(request);
    
    return new Response(null, {
      status: 204, // No Content
      headers: {
        ...headers,
        'Content-Length': '0',
      },
    });
  }

  return null;
}

/**
 * Add CORS headers to response
 * SECURITY: Adds appropriate CORS headers to API responses
 * 
 * @param {Response} response - Response object
 * @param {Request} request - Request object
 * @returns {Response} - Response with CORS headers
 */
export function addCorsHeaders(response, request) {
  const headers = getCorsHeaders(request);
  
  // SECURITY: Add CORS headers to response
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

