/**
 * Authorization utilities for role-based access control
 * 
 * SECURITY: All functions use secure token retrieval - tokens never exposed to client
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { verifyStaffRole } from '@/lib/auth';
import { getAccessToken } from '@/lib/getAccessToken';

/**
 * Check if user is authenticated
 * SECURITY: Returns session object without sensitive tokens
 * @returns {Promise<Object|null>} - Session object or null
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return null;
  }
  return session;
}

/**
 * Check if user has staff role
 * SECURITY: Uses secure token accessor to get access token server-side only
 * @param {string} userId - Discord user ID
 * @param {Request} request - Next.js request object (for secure token access)
 * @param {string} guildId - Discord guild ID (from env)
 * @returns {Promise<boolean>} - True if user has staff role
 */
export async function requireStaffRole(userId, request, guildId) {
  if (!guildId) {
    guildId = process.env.DISCORD_GUILD_ID;
  }
  
  if (!guildId) {
    console.warn('DISCORD_GUILD_ID not configured');
    return false;
  }

  try {
    // SECURITY: Get access token securely from JWT (server-side only)
    const accessToken = await getAccessToken(request);
    
    if (!accessToken) {
      console.warn('[AUTH] No access token available for staff role check');
      return false;
    }

    return await verifyStaffRole(userId, accessToken, guildId);
  } catch (error) {
    console.error('Error checking staff role:', error);
    return false;
  }
}

/**
 * Middleware wrapper for authenticated routes
 * SECURITY: Validates authentication and optionally staff role using secure token access
 * @param {Function} handler - Route handler
 * @param {Object} options - Options { requireStaff: boolean, guildId?: string }
 * @returns {Function} - Wrapped handler
 */
export function withAuth(handler, options = {}) {
  return async (request, context) => {
    try {
      const session = await requireAuth();
      
      if (!session) {
        // SECURITY: Audit log unauthorized access attempt
        const { logAuthEvent } = await import('@/lib/auditLog');
        logAuthEvent('unauthorized_access', {
          ipAddress: request.headers?.get('x-forwarded-for')?.split(',')[0] || 'unknown',
          userAgent: request.headers?.get('user-agent') || null,
        }, request);

        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Check staff role if required
      if (options.requireStaff) {
        const isStaff = await requireStaffRole(
          session.user.id,
          request,
          options.guildId
        );
        
        if (!isStaff) {
          // SECURITY: Audit log forbidden access attempt
          const { logAuthEvent } = await import('@/lib/auditLog');
          logAuthEvent('unauthorized_access', {
            userId: session.user.id,
            metadata: { reason: 'staff_role_required' },
          }, request);

          return new Response(
            JSON.stringify({ error: 'Forbidden - Staff role required' }),
            { 
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }

      // Add session to request context (without access token - never expose to client)
      request.session = session;
      
      return handler(request, context, session);
    } catch (error) {
      console.error('Auth middleware error:', error);
      // SECURITY: Don't expose error details
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}
