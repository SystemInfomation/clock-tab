import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

/**
 * Security Middleware
 * 
 * SECURITY: This middleware adds security headers and CSRF protection to all requests
 * - Content Security Policy (CSP) to prevent XSS attacks
 * - HSTS to force HTTPS
 * - X-Frame-Options to prevent clickjacking
 * - Strict SameSite cookies (configured in authOptions)
 * - CSRF protection via NextAuth's built-in PKCE and state validation
 */

export default withAuth(
  function middleware(req) {
    const response = NextResponse.next();
    
    // SECURITY: Content Security Policy (CSP) - prevents XSS attacks
    // Note: 'unsafe-inline' and 'unsafe-eval' are required for Next.js/Tailwind
    // In production, consider using nonces for stricter CSP
    const isProduction = process.env.NODE_ENV === 'production';
    const csp = [
      "default-src 'self'",
      // SECURITY: Script sources - 'unsafe-eval' needed for Next.js dev, 'unsafe-inline' for Tailwind
      // Consider using nonces in production for stricter control
      isProduction 
        ? "script-src 'self' 'unsafe-inline' https://discord.com"
        : "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval in dev
      // SECURITY: Style sources - 'unsafe-inline' required for Tailwind CSS
      "style-src 'self' 'unsafe-inline'",
      // SECURITY: Image sources - allow Discord CDN for avatars
      "img-src 'self' data: https://cdn.discordapp.com https://*.discordapp.com https://*.discord.com",
      "font-src 'self' data:",
      // SECURITY: Connect sources - allow API calls to Discord and WebSocket connections
      "connect-src 'self' https://discord.com https://*.discord.com wss://* ws://*",
      // SECURITY: Prevent framing to prevent clickjacking attacks
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-src 'self' https://discord.com",
      "object-src 'none'",
      // SECURITY: Upgrade insecure requests to HTTPS
      "upgrade-insecure-requests",
    ].join('; ');

    // SECURITY: Set security headers
    
    // HSTS - Force HTTPS for 1 year, include subdomains, allow preload
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    
    // X-Frame-Options - Prevent clickjacking by blocking iframes
    response.headers.set('X-Frame-Options', 'DENY');
    
    // X-Content-Type-Options - Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');
    
    // X-XSS-Protection - Enable browser XSS filter (legacy, but still useful)
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    // Referrer-Policy - Control referrer information leakage
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions-Policy - Disable unnecessary browser features
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
    
    // Content-Security-Policy - Comprehensive XSS protection
    response.headers.set('Content-Security-Policy', csp);
    
    // DNS Prefetch Control - Allow DNS prefetching for performance
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    
    // SECURITY: Remove server information to prevent information disclosure
    response.headers.delete('X-Powered-By');
    response.headers.delete('Server');
    
    // SECURITY: CSRF protection is handled by NextAuth automatically via:
    // - PKCE (Proof Key for Code Exchange) for OAuth flows
    // - State parameter validation
    // - SameSite=strict cookies
    // No additional CSRF token needed when using NextAuth
    
    // SECURITY: Rate limiting for auth endpoints (handled in API routes, but can add here too)
    // The rate limiting is implemented in individual API routes for better control
    
    return response;
  },
  {
    pages: {
      signIn: '/auth/signin',
    },
    callbacks: {
      authorized: ({ token, req }) => {
        // SECURITY: Additional authorization checks can be added here
        // Currently just checks for valid token (authentication)
        // Role-based authorization is handled in individual API routes
        
        // SECURITY: Log suspicious access attempts (optional - can be verbose)
        // if (!token && req.nextUrl.pathname.startsWith('/api/')) {
        //   const { logAuthEvent } = require('@/lib/auditLog');
        //   logAuthEvent('unauthorized_access', {
        //     path: req.nextUrl.pathname,
        //   }, req);
        // }
        
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    // SECURITY: Apply middleware to all routes except:
    // - NextAuth API routes (they handle their own security)
    // - Static assets (images, fonts, etc.)
    // - Next.js internal routes
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|eot)$).*)',
  ],
};

