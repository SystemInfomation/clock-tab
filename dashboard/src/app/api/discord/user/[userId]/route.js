import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Fetch Discord user information using Discord API
 */
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Use Discord API to fetch user info
    // Note: This requires a bot token or OAuth token
    // We'll use the bot token from environment (same as the bot uses)
    const DISCORD_BOT_TOKEN = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;

    if (!DISCORD_BOT_TOKEN) {
      // Fallback: return basic info with default avatar
      return NextResponse.json({
        id: userId,
        username: 'Unknown User',
        discriminator: '0000',
        avatar: null,
        avatarURL: `https://cdn.discordapp.com/embed/avatars/${parseInt(userId) >> 22 % 6}.png`,
        displayName: 'Unknown User'
      });
    }

    try {
      const response = await fetch(`https://discord.com/api/v10/users/${userId}`, {
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // User not found - return default
          return NextResponse.json({
            id: userId,
            username: 'Unknown User',
            discriminator: '0000',
            avatar: null,
            avatarURL: `https://cdn.discordapp.com/embed/avatars/${parseInt(userId) >> 22 % 6}.png`,
            displayName: 'Unknown User'
          });
        }
        throw new Error(`Discord API error: ${response.status}`);
      }

      const user = await response.json();

      // Build avatar URL
      let avatarURL;
      if (user.avatar) {
        avatarURL = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=256`;
      } else {
        avatarURL = `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id) >> 22 % 6}.png`;
      }

      // Modern Discord uses display_name if available, otherwise username
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
    } catch (apiError) {
      console.error('Error fetching from Discord API:', apiError);
      // Fallback on API error
      return NextResponse.json({
        id: userId,
        username: 'Unknown User',
        discriminator: '0000',
        avatar: null,
        avatarURL: `https://cdn.discordapp.com/embed/avatars/${parseInt(userId) >> 22 % 6}.png`,
        displayName: 'Unknown User'
      });
    }
  } catch (error) {
    console.error('Error in Discord user API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

