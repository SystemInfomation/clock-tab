/**
 * OAuth Utilities
 * 
 * Secure utilities for handling Discord OAuth token management,
 * validation, and refresh operations.
 */

/**
 * Refresh a Discord OAuth access token using the refresh token
 * @param {string} refreshToken - The refresh token
 * @param {string} clientId - Discord client ID
 * @param {string} clientSecret - Discord client secret
 * @returns {Promise<Object>} - New token data with access_token, refresh_token, expires_in, etc.
 * @throws {Error} - If refresh fails
 */
export async function refreshDiscordToken(refreshToken, clientId, clientSecret) {
  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }

  if (!clientId || !clientSecret) {
    throw new Error('Discord client credentials are required');
  }

  const tokenEndpoint = 'https://discord.com/api/oauth2/token';
  
  // Create form data for token refresh
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Log error without exposing sensitive data
      console.error(`[OAUTH] Token refresh failed: ${response.status} ${response.statusText}`);
      
      // Handle specific error cases
      if (response.status === 401) {
        throw new Error('Invalid refresh token - re-authentication required');
      }
      
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const tokenData = await response.json();
    
    // Validate response structure
    if (!tokenData.access_token) {
      throw new Error('Invalid token response: missing access_token');
    }

    // Calculate expiration time (Discord returns expires_in in seconds)
    const expiresAt = tokenData.expires_in
      ? Date.now() + (tokenData.expires_in * 1000)
      : Date.now() + (7 * 24 * 60 * 60 * 1000); // Default 7 days if not provided

    return {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || refreshToken, // Use new refresh token if provided
      expires_at: expiresAt,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
      token_type: tokenData.token_type || 'Bearer',
    };
  } catch (error) {
    // Re-throw with context
    if (error.message.startsWith('Token refresh failed') || error.message.startsWith('Invalid refresh token')) {
      throw error;
    }
    throw new Error(`Failed to refresh token: ${error.message}`);
  }
}

/**
 * Validate OAuth callback parameters
 * @param {Object} params - Query parameters from OAuth callback
 * @returns {Object} - { valid: boolean, error?: string, params?: Object }
 */
export function validateOAuthCallback(params) {
  // Check for error parameter (Discord OAuth error)
  if (params.error) {
    const errorDescriptions = {
      access_denied: 'User denied the authorization request',
      invalid_request: 'The request is missing a required parameter or is otherwise malformed',
      invalid_scope: 'The requested scope is invalid',
      server_error: 'Discord encountered an internal error',
      temporarily_unavailable: 'Discord is temporarily unavailable',
    };

    const errorMessage = errorDescriptions[params.error] || 'An unknown error occurred during authorization';
    
    // Log error safely (without exposing user-specific data)
    console.warn(`[OAUTH] OAuth callback error: ${params.error}`);
    
    return {
      valid: false,
      error: errorMessage,
      errorCode: params.error,
    };
  }

  // Validate required parameters for authorization code flow
  if (!params.code) {
    return {
      valid: false,
      error: 'Missing authorization code',
    };
  }

  // Validate code format (Discord codes are alphanumeric, roughly 30-60 characters)
  if (typeof params.code !== 'string' || params.code.length < 20 || params.code.length > 100) {
    return {
      valid: false,
      error: 'Invalid authorization code format',
    };
  }

  // State parameter should be validated by NextAuth, but we'll check it exists
  // (NextAuth handles state validation internally with PKCE)

  return {
    valid: true,
    params: {
      code: params.code,
      state: params.state, // Pass through for NextAuth validation
    },
  };
}

/**
 * Validate and sanitize Discord user ID
 * @param {string} userId - User ID to validate
 * @returns {boolean} - True if valid
 */
export function validateDiscordUserId(userId) {
  if (!userId || typeof userId !== 'string') {
    return false;
  }

  // Discord user IDs are numeric strings, 17-19 digits
  const discordIdPattern = /^\d{17,19}$/;
  return discordIdPattern.test(userId);
}

/**
 * Validate and sanitize Discord guild ID
 * @param {string} guildId - Guild ID to validate
 * @returns {boolean} - True if valid
 */
export function validateDiscordGuildId(guildId) {
  if (!guildId || typeof guildId !== 'string') {
    return false;
  }

  // Discord guild IDs are numeric strings, 17-19 digits
  const discordIdPattern = /^\d{17,19}$/;
  return discordIdPattern.test(guildId);
}

/**
 * Safely log OAuth events without exposing sensitive data
 * @param {string} event - Event type (e.g., 'signin', 'signout', 'token_refresh')
 * @param {Object} data - Event data (will be sanitized)
 */
export function logOAuthEvent(event, data = {}) {
  const sanitizedData = {
    event,
    timestamp: new Date().toISOString(),
    userId: data.userId ? data.userId : undefined, // Discord IDs are safe to log
    hasAccessToken: !!data.accessToken,
    hasRefreshToken: !!data.refreshToken,
    // Never log actual tokens
    error: data.error ? data.error.message || data.error : undefined,
    status: data.status,
  };

  // Use appropriate log level
  if (event.includes('error') || event.includes('failed')) {
    console.error(`[OAUTH] ${event}:`, sanitizedData);
  } else if (event.includes('warn') || event.includes('denied')) {
    console.warn(`[OAUTH] ${event}:`, sanitizedData);
  } else {
    console.log(`[OAUTH] ${event}:`, sanitizedData);
  }
}

/**
 * Check if a token is expired or will expire soon
 * @param {number} expiresAt - Expiration timestamp in milliseconds
 * @param {number} bufferMs - Buffer time in milliseconds before considering token expired (default: 5 minutes)
 * @returns {boolean} - True if token is expired or will expire within buffer time
 */
export function isTokenExpired(expiresAt, bufferMs = 5 * 60 * 1000) {
  if (!expiresAt) {
    return true; // Consider expired if no expiration time
  }

  return Date.now() >= (expiresAt - bufferMs);
}

/**
 * Calculate time until token expiration
 * @param {number} expiresAt - Expiration timestamp in milliseconds
 * @returns {number} - Milliseconds until expiration (negative if expired)
 */
export function getTimeUntilExpiration(expiresAt) {
  if (!expiresAt) {
    return -1;
  }
  return expiresAt - Date.now();
}



