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

    // Use Discord API with the user's OAuth access token
    const accessToken = session.accessToken;

    if (!accessToken) {
      console.warn('⚠️ No OAuth access token in session');
      // Fallback: return basic info with default avatar
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

    try {
      // Add timeout to Discord API call (10 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      let response;
      try {
        // Use OAuth Bearer token to fetch user info
        response = await fetch(`https://discord.com/api/v10/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        // If OAuth token fails (403/401), try bot token as fallback
        if ((response.status === 403 || response.status === 401) && (process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN)) {
          console.log('OAuth token failed, trying bot token as fallback...');
          const botToken = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;
          const botController = new AbortController();
          const botTimeoutId = setTimeout(() => botController.abort(), 10000);
          let botResponse;
          try {
            botResponse = await fetch(`https://discord.com/api/v10/users/${userId}`, {
              headers: {
                'Authorization': `Bot ${botToken}`,
                'Content-Type': 'application/json'
              },
              signal: botController.signal
            });
          } finally {
            clearTimeout(botTimeoutId);
          }
          
          if (botResponse.ok) {
            const user = await botResponse.json();
            // Build avatar URL
            let avatarURL;
            if (user.avatar) {
              const extension = user.avatar.startsWith('a_') ? 'gif' : 'webp';
              avatarURL = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=256`;
            } else {
              const defaultAvatarIndex = (parseInt(user.id) >> 22) % 6;
              avatarURL = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png?size=256`;
            }
            const displayName = user.global_name || user.username;
            return NextResponse.json({
              id: user.id,
              username: user.username,
              discriminator: user.discriminator,
              avatar: user.avatar,
              avatarURL,
              displayName,
              bot: user.bot || false
            });
          }
        }
        
        if (response.status === 404) {
          // User not found - return default
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
        throw new Error(`Discord API error: ${response.status}`);
      }

      const user = await response.json();
      
      console.log('✅ Successfully fetched Discord user:', user.id, user.username, user.global_name);

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
      const displayName = user.global_name || user.username;

      const responseData = {
        id: user.id,
        username: user.username,
        discriminator: user.discriminator,
        avatar: user.avatar,
        avatarURL,
        displayName,
        bot: user.bot || false
      };
      
      console.log('📤 Returning user data:', responseData);
      return NextResponse.json(responseData);
    } catch (apiError) {
      console.error('Error fetching from Discord API:', apiError);
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

