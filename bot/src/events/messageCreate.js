import { isRankChangeMessage, parseRankChange } from '../services/rankParser.js';
import RankChange from '../models/RankChange.js';
import User from '../models/User.js';
import { emitRankChangeCreated } from '../services/websocketServer.js';

const STAFF_CHANNEL_ID = process.env.STAFF_CHANNEL_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

/**
 * Handle incoming messages
 */
export async function handleMessage(message) {
  // Ignore bot messages
  if (message.author.bot) return;
  
  // Ignore messages not from a guild
  if (!message.guild) return;

  // Handle rank change monitoring in staff channel
  if (message.channel.id === STAFF_CHANNEL_ID) {
    await handleRankChangeMessage(message);
    return;
  }

  // Handle prefix commands
  if (message.content.startsWith('!')) {
    await handlePrefixCommand(message);
  }
}

/**
 * Handle rank change messages in staff channel
 */
async function handleRankChangeMessage(message) {
  if (!isRankChangeMessage(message)) {
    // Not a rank change message, ignore
    return;
  }

  const parsed = parseRankChange(message);
  
  if (!parsed) {
    // Invalid format, send error message
    await message.reply('❌ Invalid format. Please use:\n```\nUser: @username\nRank: NewRank\nReason: Detailed reason here\n```');
    return;
  }

  try {
    // Get previous rank
    const user = await User.findOne({ userId: parsed.userId }).catch((error) => {
      console.error('Error finding user:', error);
      throw error;
    });
    const previousRank = user?.currentRank || null;

    // Create rank change record
    const rankChange = new RankChange({
      ...parsed,
      previousRank
    });
    
    try {
      await rankChange.save();
    } catch (error) {
      console.error('Error saving rank change:', error);
      throw error;
    }

    // Update user's current rank
    if (!user) {
      const newUser = new User({
        userId: parsed.userId,
        currentRank: parsed.newRank
      });
      try {
        await newUser.save();
      } catch (error) {
        console.error('Error creating new user:', error);
        throw error;
      }
    } else {
      user.currentRank = parsed.newRank;
      try {
        await user.save();
      } catch (error) {
        console.error('Error updating user rank:', error);
        throw error;
      }
    }

    // Emit WebSocket event
    emitRankChangeCreated(rankChange.toObject());

    // Send confirmation to log channel if configured
    if (LOG_CHANNEL_ID) {
      const logChannel = message.guild.channels.cache.get(LOG_CHANNEL_ID);
      if (logChannel) {
        const targetUser = await message.client.users.fetch(parsed.userId).catch(() => null);
        await logChannel.send(
          `📋 **Rank Change Logged**\n` +
          `User: ${targetUser ? targetUser.tag : parsed.userId}\n` +
          `Previous Rank: ${previousRank || 'None'}\n` +
          `New Rank: ${parsed.newRank}\n` +
          `Reason: ${parsed.reason}\n` +
          `Staff: ${message.author.tag}\n` +
          `Time: ${new Date().toLocaleString()}`
        );
      }
    }

    // Send confirmation to staff channel
    await message.react('✅');
  } catch (error) {
    console.error('Error processing rank change:', error);
    await message.reply('❌ Error processing rank change. Please try again.');
  }
}

/**
 * Handle prefix commands
 */
async function handlePrefixCommand(message) {
  const args = message.content.slice(1).trim().split(/\s+/);
  const command = args[0].toLowerCase();

  const {
    handleMute,
    handleUnmute,
    handleKick,
    handleBan,
    handleWarn,
    handleInfractions,
    handleClear
  } = await import('../commands/moderation.js');

  switch (command) {
    case 'mute':
      await handleMute(message, args.slice(1));
      break;
    case 'unmute':
      await handleUnmute(message, args.slice(1));
      break;
    case 'kick':
      await handleKick(message, args.slice(1));
      break;
    case 'ban':
      await handleBan(message, args.slice(1));
      break;
    case 'warn':
      await handleWarn(message, args.slice(1));
      break;
    case 'infractions':
      await handleInfractions(message, args.slice(1));
      break;
    case 'clear':
      await handleClear(message, args.slice(1));
      break;
    default:
      // Unknown command, ignore
      break;
  }
}

