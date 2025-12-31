/**
 * OAuth Utilities
 * 
 * Secure utilities for handling Discord OAuth token management,
 * validation, and refresh operations.
 */

/**
 * Refresh a Discord OAuth access token using the refresh token
 * SECURITY: Validates token responses and logs refresh events for audit
 * 
 * @param {string} refreshToken - The refresh token (must be stored securely)
 * @param {string} clientId - Discord client ID
 * @param {string} clientSecret - Discord client secret
 * @returns {Promise<Object>} - New token data with access_token, refresh_token, expires_in, etc.
 * @throws {Error} - If refresh fails
 */
export async function refreshDiscordToken(refreshToken, clientId, clientSecret) {
  // SECURITY: Validate inputs
  if (!refreshToken || typeof refreshToken !== 'string') {
    throw new Error('Refresh token is required');
  }

  if (!clientId || !clientSecret) {
    throw new Error('Discord client credentials are required');
  }

  // SECURITY: Validate refresh token format (Discord tokens are typically base64-like strings)
  if (refreshToken.length < 20 || refreshToken.length > 200) {
    throw new Error('Invalid refresh token format');
  }

  // SECURITY: Discord OAuth2 token endpoint (official endpoint)
  const tokenEndpoint = 'https://discord.com/api/oauth2/token';
  
  // SECURITY: Create form data for token refresh (use URLSearchParams to prevent injection)
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  try {
    // SECURITY: Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // SECURITY: Log error without exposing sensitive data
      try {
        const { logAuthEvent } = await import('./auditLog');
        logAuthEvent('token_refresh_failed', {
          statusCode: response.status,
          statusText: response.statusText,
        });
      } catch (importError) {
        // Fail silently if audit logging is not available
        console.warn('[OAUTH] Could not log token refresh failure:', importError.message);
      }
      
      // Handle specific error cases
      if (response.status === 401) {
        throw new Error('Invalid refresh token - re-authentication required');
      }
      
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const tokenData = await response.json();
    
    // SECURITY: Validate response structure
    if (!tokenData || typeof tokenData !== 'object') {
      throw new Error('Invalid token response format');
    }

    if (!tokenData.access_token || typeof tokenData.access_token !== 'string') {
      throw new Error('Invalid token response: missing or invalid access_token');
    }

    // SECURITY: Validate token format
    if (tokenData.access_token.length < 20 || tokenData.access_token.length > 500) {
      throw new Error('Invalid access token format');
    }

    // SECURITY: Calculate expiration time (Discord returns expires_in in seconds)
    const expiresIn = tokenData.expires_in ? parseInt(tokenData.expires_in, 10) : 604800; // Default 7 days
    if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
      throw new Error('Invalid token expiration');
    }

    const expiresAt = Date.now() + (expiresIn * 1000);

    // SECURITY: Log successful token refresh for audit
    try {
      const { logAuthEvent } = await import('./auditLog');
      logAuthEvent('token_refresh', {
        expiresAt: new Date(expiresAt).toISOString(),
        expiresIn,
      });
    } catch (importError) {
      // Fail silently if audit logging is not available
      console.warn('[OAUTH] Could not log token refresh:', importError.message);
    }

    return {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || refreshToken, // Use new refresh token if provided
      expires_at: expiresAt,
      expires_in: expiresIn,
      scope: tokenData.scope || 'identify email guilds',
      token_type: tokenData.token_type || 'Bearer',
    };
  } catch (error) {
    // SECURITY: Log refresh failures
    try {
      const { logAuthEvent } = await import('./auditLog');
      logAuthEvent('token_refresh_failed', {
        error: error.message,
      });
    } catch (importError) {
      // Fail silently if audit logging is not available
      console.warn('[OAUTH] Could not log token refresh failure:', importError.message);
    }

    // Re-throw with context
    if (error.name === 'AbortError') {
      throw new Error('Token refresh request timed out');
    }
    if (error.message.startsWith('Token refresh failed') || error.message.startsWith('Invalid refresh token')) {
      throw error;
    }
    throw new Error(`Failed to refresh token: ${error.message}`);
  }
}

/**
 * Validate OAuth callback parameters
 * SECURITY: Validates OAuth callback to prevent callback attacks and parameter injection
 * 
 * @param {Object} params - Query parameters from OAuth callback
 * @returns {Object} - { valid: boolean, error?: string, params?: Object }
 */
export function validateOAuthCallback(params) {
  // SECURITY: Check for error parameter (Discord OAuth error)
  if (params.error) {
    const errorDescriptions = {
      access_denied: 'User denied the authorization request',
      invalid_request: 'The request is missing a required parameter or is otherwise malformed',
      invalid_scope: 'The requested scope is invalid',
      server_error: 'Discord encountered an internal error',
      temporarily_unavailable: 'Discord is temporarily unavailable',
    };

    const errorMessage = errorDescriptions[params.error] || 'An unknown error occurred during authorization';
    
    // SECURITY: Log error safely (non-blocking, fire-and-forget)
    // Use dynamic import to avoid circular dependencies, but don't await
    import('./auditLog').then(({ logAuthEvent }) => {
      logAuthEvent('oauth_error', {
        errorCode: params.error,
        errorDescription: errorMessage,
      });
    }).catch(() => {
      // Fail silently if audit logging is not available
    });
    
    return {
      valid: false,
      error: errorMessage,
      errorCode: params.error,
    };
  }

  // SECURITY: Validate required parameters for authorization code flow
  if (!params.code) {
    return {
      valid: false,
      error: 'Missing authorization code',
    };
  }

  // SECURITY: Validate code format (Discord codes are alphanumeric, roughly 30-60 characters)
  // Prevents injection attacks via malformed codes
  if (typeof params.code !== 'string') {
    return {
      valid: false,
      error: 'Invalid authorization code type',
    };
  }

  // SECURITY: Validate code length and format
  if (params.code.length < 20 || params.code.length > 100) {
    return {
      valid: false,
      error: 'Invalid authorization code format',
    };
  }

  // SECURITY: Validate code contains only safe characters (alphanumeric, hyphens, underscores)
  // Discord authorization codes are typically base64url encoded
  if (!/^[A-Za-z0-9_-]+$/.test(params.code)) {
    return {
      valid: false,
      error: 'Invalid authorization code characters',
    };
  }

  // SECURITY: State parameter validation
  // NextAuth handles state validation internally with PKCE, but we verify it exists
  if (!params.state || typeof params.state !== 'string') {
    return {
      valid: false,
      error: 'Missing or invalid state parameter',
    };
  }

  // SECURITY: Validate state parameter format (should be base64url encoded)
  if (params.state.length < 10 || params.state.length > 200) {
    return {
      valid: false,
      error: 'Invalid state parameter format',
    };
  }

  return {
    valid: true,
    params: {
      code: params.code,
      state: params.state, // Pass through for NextAuth validation (PKCE handled internally)
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




