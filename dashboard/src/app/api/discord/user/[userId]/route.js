import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { 
  validateUserId,
  sanitizeMongoQuery,
  rateLimit,
  getClientIP,
  createErrorResponse
} from '@/lib/security';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Fetch Discord user information using Discord API
 */
export async function GET(request, { params }) {
  try {
    // Rate limiting (stricter for external API calls)
    const clientIP = getClientIP(request);
    if (!rateLimit(`discord-api:${clientIP}`, 30, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let { userId } = params;

    // Validate and sanitize user ID
    try {
      userId = validateUserId(userId);
      userId = sanitizeMongoQuery(userId);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // SECURITY: Get access token securely from JWT (server-side only)
    // Never use session.accessToken as it exposes tokens to client
    const { getAccessToken } = await import('@/lib/getAccessToken');
    const accessToken = await getAccessToken(request);
    
    // Try bot token first (most reliable for fetching user info)
    const botToken = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;

    try {
      // Add timeout to Discord API call (10 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      let response;
      let usedBotToken = false;

      // Prefer bot token if available (more reliable)
      if (botToken) {
        try {
          console.log(`🔍 Fetching user ${userId} with bot token...`);
          response = await fetch(`https://discord.com/api/v10/users/${userId}`, {
            headers: {
              'Authorization': `Bot ${botToken}`,
              'Content-Type': 'application/json'
            },
            signal: controller.signal
          });
          usedBotToken = true;
        } catch (error) {
          console.warn('Bot token fetch failed, trying OAuth token...', error);
        }
      }

      // Fallback to OAuth token if bot token not available or failed
      if (!response && accessToken) {
        try {
          console.log(`🔍 Fetching user ${userId} with OAuth token...`);
          response = await fetch(`https://discord.com/api/v10/users/${userId}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            signal: controller.signal
          });
        } catch (error) {
          console.warn('OAuth token fetch failed:', error);
        }
      }

      clearTimeout(timeoutId);

      if (!response) {
        throw new Error('No valid authentication method available');
      }

      if (!response.ok) {
        // If 404, user doesn't exist or bot doesn't have access
        if (response.status === 404) {
          console.warn(`⚠️ User ${userId} not found (404)`);
          const defaultAvatarIndex = (parseInt(userId) >> 22) % 6;
          return NextResponse.json({
            id: userId,
            username: 'Unknown User',
            discriminator: '0000',
            avatar: null,
            avatarURL: `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png?size=256`,
            displayName: 'Unknown User'
          });
        }

        // If 403/401 and we used bot token, try OAuth as fallback
        if ((response.status === 403 || response.status === 401) && usedBotToken && accessToken) {
          console.log('Bot token failed, trying OAuth token as fallback...');
          const fallbackController = new AbortController();
          const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 10000);
          try {
            const fallbackResponse = await fetch(`https://discord.com/api/v10/users/${userId}`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              signal: fallbackController.signal
            });
            clearTimeout(fallbackTimeoutId);
            
            if (fallbackResponse.ok) {
              response = fallbackResponse;
            } else {
              throw new Error(`Discord API error: ${fallbackResponse.status}`);
            }
          } catch (fallbackError) {
            clearTimeout(fallbackTimeoutId);
            throw new Error(`Discord API error: ${response.status}`);
          }
        } else {
          throw new Error(`Discord API error: ${response.status}`);
        }
      }

      const user = await response.json();
      
      console.log(`✅ Successfully fetched Discord user: ${user.id} (${user.username || 'N/A'}) - ${user.global_name || user.username || 'No name'}`);

      // Build avatar URL - handle animated avatars (start with 'a_') and static avatars
      let avatarURL;
      if (user.avatar) {
        // Check if avatar is animated (starts with 'a_')
        const extension = user.avatar.startsWith('a_') ? 'gif' : 'webp';
        avatarURL = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=256`;
      } else {
        // Default Discord avatar based on user ID
        const defaultAvatarIndex = (parseInt(user.id) >> 22) % 6;
        avatarURL = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png?size=256`;
      }

      // Modern Discord uses global_name (display name) if available, otherwise username
      const displayName = user.global_name || user.username || 'Unknown User';

      const responseData = {
        id: user.id,
        username: user.username || 'Unknown User',
        discriminator: user.discriminator || '0000',
        avatar: user.avatar || null,
        avatarURL,
        displayName,
        bot: user.bot || false
      };
      
      console.log(`📤 Returning user data for ${userId}:`, { 
        id: responseData.id, 
        displayName: responseData.displayName,
        hasAvatar: !!user.avatar 
      });
      return NextResponse.json(responseData);
    } catch (apiError) {
      console.error(`❌ Error fetching user ${userId} from Discord API:`, apiError.message);
      
      // Fallback on API error (timeout, network error, etc.)
      const defaultAvatarIndex = (parseInt(userId) >> 22) % 6;
      return NextResponse.json({
        id: userId,
        username: 'Unknown User',
        discriminator: '0000',
        avatar: null,
        avatarURL: `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png?size=256`,
        displayName: 'Unknown User'
      }, { status: 200 }); // Return 200 so frontend doesn't treat it as an error
    }
  } catch (error) {
    console.error('Error in Discord user API:', error);
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      createErrorResponse(error, 500, isDev),
      { status: 500 }
    );
  }
}

