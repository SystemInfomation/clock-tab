/**
 * Authorization utilities for role-based access control
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { verifyStaffRole } from '@/lib/auth';

/**
 * Check if user is authenticated
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
 * @param {string} userId - Discord user ID
 * @param {string} accessToken - OAuth access token
 * @param {string} guildId - Discord guild ID (from env)
 * @returns {Promise<boolean>} - True if user has staff role
 */
export async function requireStaffRole(userId, accessToken, guildId) {
  if (!guildId) {
    guildId = process.env.DISCORD_GUILD_ID;
  }
  
  if (!guildId) {
    console.warn('DISCORD_GUILD_ID not configured');
    return false;
  }

  try {
    return await verifyStaffRole(userId, accessToken, guildId);
  } catch (error) {
    console.error('Error checking staff role:', error);
    return false;
  }
}

/**
 * Middleware wrapper for authenticated routes
 * @param {Function} handler - Route handler
 * @param {Object} options - Options { requireStaff: boolean }
 * @returns {Function} - Wrapped handler
 */
export function withAuth(handler, options = {}) {
  return async (request, context) => {
    try {
      const session = await requireAuth();
      
      if (!session) {
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
          session.accessToken,
          options.guildId
        );
        
        if (!isStaff) {
          return new Response(
            JSON.stringify({ error: 'Forbidden - Staff role required' }),
            { 
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }

      // Add session to request context
      request.session = session;
      
      return handler(request, context, session);
    } catch (error) {
      console.error('Auth middleware error:', error);
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

