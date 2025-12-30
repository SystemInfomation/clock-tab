import { isRankChangeMessage, parseRankChange } from '../services/rankParser.js';
import RankChange from '../models/RankChange.js';
import User from '../models/User.js';
import { emitRankChangeCreated } from '../services/websocketServer.js';
import * as moderationCommands from '../commands/moderation.js';
import * as helpCommands from '../commands/help.js';

const STAFF_CHANNEL_ID = process.env.STAFF_CHANNEL_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

// Track processed messages to prevent duplicate execution
const processedMessages = new Set();
const MESSAGE_CACHE_TTL = 5000; // 5 seconds

// Clean up old message IDs periodically
setInterval(() => {
  if (processedMessages.size > 1000) {
    processedMessages.clear();
  }
}, 60000); // Clear every minute if it gets too large

/**
 * Handle incoming messages
 */
export async function handleMessage(message) {
  // Ignore bot messages
  if (message.author.bot) return;
  
  // Ignore messages not from a guild
  if (!message.guild) return;

  // Prevent duplicate processing of the same message
  const messageKey = `${message.id}-${message.guild.id}`;
  if (processedMessages.has(messageKey)) {
    console.log(`Skipping duplicate message: ${message.id}`);
    return;
  }
  processedMessages.add(messageKey);
  
  // Remove from cache after TTL
  setTimeout(() => {
    processedMessages.delete(messageKey);
  }, MESSAGE_CACHE_TTL);

  // Handle rank change monitoring in staff channel
  if (message.channel.id === STAFF_CHANNEL_ID) {
    await handleRankChangeMessage(message);
    return;
  }

  // Handle prefix commands
  if (message.content.startsWith('!')) {
    const startTime = Date.now();
    await handlePrefixCommand(message);
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      console.log(`Command ${message.content.split(' ')[0]} took ${duration}ms`);
    }
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
    // Check for duplicate rank change by message ID (most reliable)
    const existingByMessageId = await RankChange.findOne({
      messageId: message.id
    }).catch(() => null);

    if (existingByMessageId) {
      console.log('Duplicate rank change detected (same message ID), skipping...');
      await message.react('⚠️');
      return;
    }

    // Also check for duplicate rank change (same user, rank, and staff within last 5 seconds) as fallback
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const existingRankChange = await RankChange.findOne({
      userId: parsed.userId,
      newRank: parsed.newRank,
      staffId: parsed.staffId,
      timestamp: { $gte: fiveSecondsAgo }
    }).catch(() => null);

    if (existingRankChange) {
      console.log('Duplicate rank change detected (time-based check), skipping...');
      await message.react('⚠️');
      return;
    }

    // Get previous rank
    const user = await User.findOne({ userId: parsed.userId }).catch((error) => {
      console.error('Error finding user:', error);
      throw error;
    });
    const previousRank = user?.currentRank || null;

    // Create rank change record
    const rankChange = new RankChange({
      ...parsed,
      previousRank,
      messageId: message.id
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

  // Use cached imports instead of dynamic imports for better performance
  const {
    handleMute,
    handleUnmute,
    handleKick,
    handleBan,
    handleWarn,
    handleInfractions,
    handleClear
  } = moderationCommands;

  const { handleHelp } = helpCommands;

  try {
    switch (command) {
      case 'help':
      case 'h':
        await handleHelp(message, args.slice(1));
        break;
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
      case 'inf':
        await handleInfractions(message, args.slice(1));
        break;
      case 'clear':
        await handleClear(message, args.slice(1));
        break;
      default:
        // Unknown command, ignore
        break;
    }
  } catch (error) {
    console.error(`Error executing command ${command}:`, error);
    await message.reply('❌ An error occurred while executing this command.').catch(() => {});
  }
}

