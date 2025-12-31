/**
 * Secure Access Token Retrieval
 * 
 * SECURITY CRITICAL: This function retrieves OAuth access tokens from JWT tokens
 * Access tokens are stored server-side only and MUST NEVER be exposed to the client
 * 
 * This prevents token leakage through:
 * - XSS attacks (tokens not in client-side JavaScript)
 * - Session hijacking (tokens not in cookies sent to client)
 * - Network interception (tokens only used server-side)
 */

import { getToken } from 'next-auth/jwt';

/**
 * Get OAuth access token from JWT token (server-side only)
 * SECURITY: This function should ONLY be called server-side (API routes, server components)
 * 
 * @param {Request} request - Next.js request object
 * @returns {Promise<string|null>} - Access token or null if not available/expired
 */
export async function getAccessToken(request) {
  try {
    // SECURITY: getToken reads from the secure HTTP-only cookie
    // It never exposes the token to client-side JavaScript
    // NextAuth automatically handles encryption/decryption using NEXTAUTH_SECRET
    const token = await getToken({ 
      req: request,
      // SECURITY: NEXTAUTH_SECRET is used for encryption/decryption
      // If not provided, getToken will use the default from authOptions
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return null;
    }

    // SECURITY: Validate token structure
    if (typeof token !== 'object') {
      return null;
    }

    // SECURITY: Check if token is expired
    if (token.accessTokenExpires && typeof token.accessTokenExpires === 'number') {
      const now = Date.now();
      const expiresAt = token.accessTokenExpires;
      
      // SECURITY: Add 5 minute buffer before expiration to avoid using expired tokens
      const bufferMs = 5 * 60 * 1000;
      if (now >= (expiresAt - bufferMs)) {
        // Token expired or will expire soon - return null to force re-authentication
        // SECURITY: Could implement token refresh here, but for now require re-auth
        return null;
      }
    }

    // SECURITY: Validate access token format (Discord tokens are typically base64-like strings)
    const accessToken = token.accessToken;
    if (!accessToken || typeof accessToken !== 'string' || accessToken.length < 20) {
      return null;
    }

    // SECURITY: Return access token (server-side only - never sent to client)
    return accessToken;
  } catch (error) {
    // SECURITY: Never expose error details - could leak information about token structure
    // Log error internally but don't expose to client
    if (process.env.NODE_ENV === 'development') {
      console.error('[SECURITY] Error retrieving access token:', error.message);
    }
    return null;
  }
}

/**
 * Get OAuth access token from session token (alternative method)
 * Use this when you already have a session object
 * 
 * @param {string} sessionToken - Session token (from cookie)
 * @returns {Promise<string|null>} - Access token or null
 */
export async function getAccessTokenFromSessionToken(sessionToken) {
  try {
    if (!sessionToken) {
      return null;
    }

    // SECURITY: Decode JWT token (NextAuth format)
    // In production, use proper JWT decoding library with secret verification
    const { decode } = await import('next-auth/jwt');
    
    // Note: This is a simplified version - NextAuth handles this internally
    // Use getAccessToken(request) instead for production code
    throw new Error('Use getAccessToken(request) instead - this function is for reference only');
  } catch (error) {
    console.error('[SECURITY] Error retrieving access token from session:', error.message);
    return null;
  }
}

/**
 * Check if access token is valid and not expired
 * 
 * @param {Request} request - Next.js request object
 * @returns {Promise<{valid: boolean, token?: string, expiresAt?: number}>}
 */
export async function validateAccessToken(request) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: authOptions.secret,
    });

    if (!token || !token.accessToken) {
      return { valid: false };
    }

    const now = Date.now();
    const expiresAt = token.accessTokenExpires || (now + 7 * 24 * 60 * 60 * 1000); // Default 7 days

    if (now >= expiresAt) {
      return { valid: false, expiresAt };
    }

    return { 
      valid: true, 
      token: token.accessToken,
      expiresAt,
    };
  } catch (error) {
    console.error('[SECURITY] Error validating access token:', error.message);
    return { valid: false };
  }
}

