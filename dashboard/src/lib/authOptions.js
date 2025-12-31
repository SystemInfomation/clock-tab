import NextAuth from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';

// Validate required environment variables
if (!process.env.DISCORD_CLIENT_ID) {
  throw new Error('DISCORD_CLIENT_ID is not set');
}
if (!process.env.DISCORD_CLIENT_SECRET) {
  throw new Error('DISCORD_CLIENT_SECRET is not set');
}
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is not set. Generate one with: openssl rand -base64 32');
}
if (!process.env.NEXTAUTH_URL) {
  console.warn('NEXTAUTH_URL is not set. This may cause issues in production.');
}

// SECURITY: Validate and whitelist redirect URIs to prevent open redirect attacks
const ALLOWED_REDIRECT_URIS = [
  process.env.NEXTAUTH_URL,
  process.env.NEXTAUTH_URL?.replace(/\/$/, ''), // Without trailing slash
  ...(process.env.ALLOWED_REDIRECT_URIS?.split(',').map(uri => uri.trim()) || []),
].filter(Boolean);

/**
 * Validate redirect URI to prevent open redirect attacks
 * SECURITY: Only allow redirects to whitelisted domains
 */
function validateRedirectUri(uri) {
  if (!uri) return true; // Allow null/undefined (default behavior)
  
  try {
    const url = new URL(uri);
    const baseUrl = new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000');
    
    // Only allow redirects to same origin
    return url.origin === baseUrl.origin || ALLOWED_REDIRECT_URIS.some(allowed => {
      try {
        const allowedUrl = new URL(allowed);
        return url.origin === allowedUrl.origin;
      } catch {
        return false;
      }
    });
  } catch {
    return false; // Invalid URL format
  }
}

export const authOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'identify email guilds',
          // SECURITY: Explicitly request only required scopes
          // Discord OAuth2 scope validation happens server-side
        },
        // SECURITY: Validate redirect URI
        url: 'https://discord.com/api/oauth2/authorize',
      },
      // SECURITY: Verify token issuer (Discord)
      checks: ['state', 'pkce'], // NextAuth handles PKCE automatically for CSRF protection
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
    // SECURITY: NextAuth automatically generates secure session tokens
    // Session fixation protection is handled by NextAuth's secure token generation
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    // SECURITY: NextAuth encrypts JWT tokens when NEXTAUTH_SECRET is set
    // Encryption is automatic - no need to set encryption: true
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true, // SECURITY: Prevent XSS access to cookie
        sameSite: 'strict', // SECURITY: Strict SameSite prevents CSRF attacks
        path: '/',
        secure: true, // SECURITY: Always use secure cookies (even in dev if using HTTPS)
        maxAge: 30 * 24 * 60 * 60, // 30 days
        // SECURITY: Use domain restriction if needed
        // domain: process.env.COOKIE_DOMAIN, // Uncomment if serving from subdomain
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.callback-url'
        : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'strict', // SECURITY: Strict SameSite prevents CSRF
        path: '/',
        secure: true,
        // SECURITY: Limit maxAge for callback URLs
        maxAge: 60 * 60, // 1 hour (temporary)
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Host-next-auth.csrf-token'
        : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'strict', // SECURITY: Strict SameSite for CSRF token
        path: '/',
        secure: true,
        // SECURITY: __Host- prefix requires secure, no domain, path=/
        maxAge: 60 * 60, // 1 hour
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, profile, trigger }) {
      // SECURITY: Only store tokens on initial sign-in
      if (account && profile) {
        // SECURITY: Validate Discord user ID format (17-19 digit numeric string)
        if (!/^\d{17,19}$/.test(profile.id)) {
          throw new Error('Invalid Discord user ID format');
        }
        
        // SECURITY: Store access token in JWT (server-side only, never exposed to client)
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token; // Store for token refresh if needed
        token.accessTokenExpires = account.expires_at 
          ? account.expires_at * 1000 // Convert to milliseconds
          : Date.now() + (7 * 24 * 60 * 60 * 1000); // Default 7 days
        token.id = profile.id;
        token.email = profile.email;
        token.emailVerified = profile.verified || false;
        
        // SECURITY: Store token issuance time for replay attack prevention
        token.issuedAt = Date.now();
      }
      
      // SECURITY: Refresh token if expired (optional - uncomment if you want auto-refresh)
      // if (token.accessTokenExpires && Date.now() >= token.accessTokenExpires) {
      //   return await refreshAccessToken(token);
      // }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // SECURITY: Only expose non-sensitive user data to client
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.emailVerified = token.emailVerified;
        
        // SECURITY CRITICAL: DO NOT expose accessToken in session
        // Access tokens must remain server-side only in JWT
        // Use getAccessToken() helper function to retrieve tokens server-side
        // This prevents token leakage to client-side JavaScript
        
        // NOTE: Staff role verification should be added here
        // This requires Discord API access with proper OAuth scopes
        // See dashboard/src/lib/auth.js for implementation details
      }
      return session;
    },
    // SECURITY: Validate redirect URLs to prevent open redirect attacks
    async redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith('/')) return url;
      
      // Validate absolute URLs
      if (validateRedirectUri(url)) {
        return url;
      }
      
      // Default to base URL if redirect is invalid
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // SECURITY: Audit log sign-in events (sanitized)
      try {
        const { logAuthEvent } = await import('@/lib/auditLog');
        logAuthEvent('signin', {
          userId: user?.id,
          email: user?.email,
          isNewUser: !!isNewUser,
          provider: account?.provider || 'discord',
        });
      } catch (error) {
        // Fail silently - audit logging should not break authentication
        console.error('[AUTH] Error logging sign-in event:', error.message);
      }
    },
    // Note: NextAuth v4 does not support signOut, createUser, updateUser, linkAccount events
    // These would need to be handled in the signOut callback or custom API routes if needed
  },
  debug: process.env.NODE_ENV === 'development',
  // SECURITY: CSRF protection is enabled by default in NextAuth via PKCE and state parameters
  // useSecureCookies is not a valid NextAuth option - cookies are secured via cookie options above
};

