import { hasModerationPermissions, canModerate, botCanModerate } from '../utils/permissions.js';
import { createInfraction, getUserInfractions, deleteInfraction } from '../services/infractionService.js';
import { parseDuration, formatDuration } from '../utils/durationParser.js';
import { emitInfractionCreated } from '../services/websocketServer.js';
import Infraction from '../models/Infraction.js';

/**
 * Handle mute command
 */
export async function handleMute(message, args) {
  if (!hasModerationPermissions(message.member)) {
    return message.reply('❌ You do not have permission to use this command.');
  }

  const user = message.mentions.users.first();
  if (!user) {
    return message.reply('❌ Please mention a user to mute.');
  }

  const member = await message.guild.members.fetch(user.id).catch(() => null);
  if (!member) {
    return message.reply('❌ User not found in this server.');
  }

  // Check role hierarchy
  if (!canModerate(message.member, member)) {
    return message.reply('❌ You cannot mute this user. They have a higher or equal role.');
  }

  // Check bot can moderate
  const botMember = await message.guild.members.fetch(message.client.user.id).catch(() => null);
  if (botMember && !botCanModerate(botMember, member)) {
    return message.reply('❌ Bot cannot mute this user. They have a higher or equal role than the bot.');
  }

  const duration = args[1] && args[1].match(/^\d+[smhd]$/i) ? args[1] : null;
  const reason = args.slice(duration ? 2 : 1).join(' ') || 'No reason provided';

  // Apply mute role or timeout
  try {
    if (duration) {
      const durationMs = parseDuration(duration);
      if (durationMs) {
        await member.timeout(durationMs, reason);
      } else {
        // Fallback to role-based mute if timeout fails
        // You'll need to set up a mute role
        return message.reply('❌ Invalid duration format. Use format like: 1d, 2h, 30m');
      }
    } else {
      // Permanent mute (timeout for 28 days max)
      await member.timeout(28 * 24 * 60 * 60 * 1000, reason);
    }
  } catch (error) {
    console.error('Error muting user:', error);
    return message.reply('❌ Failed to mute user. Check bot permissions.');
  }

  // Create infraction
  const { infraction } = await createInfraction({
    userId: user.id,
    type: 'mute',
    reason,
    staffId: message.author.id,
    duration
  });

  emitInfractionCreated(infraction.toObject());

  const durationText = duration ? formatDuration(parseDuration(duration)) : 'permanent';
  return message.reply(`✅ Muted ${user.tag} for ${durationText}. Reason: ${reason}`);
}

/**
 * Handle unmute command
 */
export async function handleUnmute(message, args) {
  if (!hasModerationPermissions(message.member)) {
    return message.reply('❌ You do not have permission to use this command.');
  }

  const user = message.mentions.users.first();
  if (!user) {
    return message.reply('❌ Please mention a user to unmute.');
  }

  const member = await message.guild.members.fetch(user.id).catch(() => null);
  if (!member) {
    return message.reply('❌ User not found in this server.');
  }

  // Check role hierarchy
  if (!canModerate(message.member, member)) {
    return message.reply('❌ You cannot unmute this user. They have a higher or equal role.');
  }

  try {
    await member.timeout(null);
  } catch (error) {
    console.error('Error unmuting user:', error);
    return message.reply('❌ Failed to unmute user.');
  }

  // Deactivate active mute infractions
  await Infraction.updateMany(
    { userId: user.id, type: 'mute', active: true },
    { active: false }
  );

  return message.reply(`✅ Unmuted ${user.tag}.`);
}

/**
 * Handle kick command
 */
export async function handleKick(message, args) {
  if (!hasModerationPermissions(message.member)) {
    return message.reply('❌ You do not have permission to use this command.');
  }

  const user = message.mentions.users.first();
  if (!user) {
    return message.reply('❌ Please mention a user to kick.');
  }

  const member = await message.guild.members.fetch(user.id).catch(() => null);
  if (!member) {
    return message.reply('❌ User not found in this server.');
  }

  // Check role hierarchy
  if (!canModerate(message.member, member)) {
    return message.reply('❌ You cannot kick this user. They have a higher or equal role.');
  }

  // Check bot can moderate
  const botMember = await message.guild.members.fetch(message.client.user.id).catch(() => null);
  if (botMember && !botCanModerate(botMember, member)) {
    return message.reply('❌ Bot cannot kick this user. They have a higher or equal role than the bot.');
  }

  const reason = args.slice(1).join(' ') || 'No reason provided';

  try {
    await member.kick(reason);
  } catch (error) {
    console.error('Error kicking user:', error);
    return message.reply('❌ Failed to kick user. Check bot permissions.');
  }

  const { infraction } = await createInfraction({
    userId: user.id,
    type: 'kick',
    reason,
    staffId: message.author.id
  });

  emitInfractionCreated(infraction.toObject());

  return message.reply(`✅ Kicked ${user.tag}. Reason: ${reason}`);
}

/**
 * Handle ban command
 */
export async function handleBan(message, args) {
  if (!hasModerationPermissions(message.member)) {
    return message.reply('❌ You do not have permission to use this command.');
  }

  const user = message.mentions.users.first();
  if (!user) {
    return message.reply('❌ Please mention a user to ban.');
  }

  const member = await message.guild.members.fetch(user.id).catch(() => null);
  
  // Check role hierarchy if member is still in server
  if (member) {
    if (!canModerate(message.member, member)) {
      return message.reply('❌ You cannot ban this user. They have a higher or equal role.');
    }

    // Check bot can moderate
    const botMember = await message.guild.members.fetch(message.client.user.id).catch(() => null);
    if (botMember && !botCanModerate(botMember, member)) {
      return message.reply('❌ Bot cannot ban this user. They have a higher or equal role than the bot.');
    }
  }

  const duration = args[1]?.match(/^\d+[smhd]$/i) ? args[1] : null;
  const reason = args.slice(duration ? 2 : 1).join(' ') || 'No reason provided';

  try {
    await message.guild.members.ban(user.id, { reason, deleteMessageDays: 1 });
  } catch (error) {
    console.error('Error banning user:', error);
    return message.reply('❌ Failed to ban user. Check bot permissions.');
  }

  const { infraction } = await createInfraction({
    userId: user.id,
    type: 'ban',
    reason,
    staffId: message.author.id,
    duration
  });

  emitInfractionCreated(infraction.toObject());

  // Note: Temporary bans are tracked via expiresAt field in database
  // A separate scheduled job or cron task should check for expired bans
  // setTimeout will not survive bot restarts and is not reliable for production

  const durationText = duration ? formatDuration(parseDuration(duration)) : 'permanent';
  return message.reply(`✅ Banned ${user.tag} for ${durationText}. Reason: ${reason}`);
}

/**
 * Handle warn command
 */
export async function handleWarn(message, args) {
  if (!hasModerationPermissions(message.member)) {
    return message.reply('❌ You do not have permission to use this command.');
  }

  const user = message.mentions.users.first();
  if (!user) {
    return message.reply('❌ Please mention a user to warn.');
  }

  // For warnings, use cached member only (faster, warnings are less critical)
  // Skip role hierarchy check if member not in cache to improve performance
  const member = message.guild.members.cache.get(user.id);
  if (member && !canModerate(message.member, member)) {
    return message.reply('❌ You cannot warn this user. They have a higher or equal role.');
  }

  const reason = args.slice(1).join(' ') || 'No reason provided';

  // Create infraction and update user stats in parallel where possible
  const { infraction, user: userStats, shouldAutoBan } = await createInfraction({
    userId: user.id,
    type: 'warning',
    reason,
    staffId: message.author.id
  });

  // Emit WebSocket event (non-blocking)
  emitInfractionCreated(infraction.toObject());

  let reply = `✅ Warned ${user.tag}. Reason: ${reason}\n📊 Total Points: ${userStats.totalPoints}`;
  
  if (shouldAutoBan) {
    reply += '\n⚠️ User has reached the auto-ban threshold!';
  }

  return message.reply(reply);
}

/**
 * Handle infractions command
 */
export async function handleInfractions(message, args) {
  if (!hasModerationPermissions(message.member)) {
    return message.reply('❌ You do not have permission to use this command.');
  }

  const user = message.mentions.users.first();
  if (!user) {
    return message.reply('❌ Please mention a user to view infractions.');
  }

  const infractions = await getUserInfractions(user.id);

  if (infractions.length === 0) {
    return message.reply(`✅ ${user.tag} has no infractions.`);
  }

  const typeEmojis = {
    warning: '⚠️',
    mute: '🔇',
    kick: '👢',
    ban: '🔨'
  };

  let embedText = `**Infractions for ${user.tag}**\n\n`;
  
  infractions.slice(0, 10).forEach((infraction, index) => {
    const date = new Date(infraction.timestamp).toLocaleDateString();
    embedText += `${index + 1}. ${typeEmojis[infraction.type] || '📝'} **${infraction.type.toUpperCase()}**\n`;
    embedText += `   Reason: ${infraction.reason}\n`;
    embedText += `   Date: ${date}\n`;
    embedText += `   Points: ${infraction.points}\n\n`;
  });

  if (infractions.length > 10) {
    embedText += `\n*Showing 10 of ${infractions.length} infractions*`;
  }

  return message.reply(embedText);
}

/**
 * Handle clear command
 */
export async function handleClear(message, args) {
  if (!hasModerationPermissions(message.member)) {
    return message.reply('❌ You do not have permission to use this command.');
  }

  const amount = parseInt(args[0]);
  if (!amount || amount < 1 || amount > 100) {
    return message.reply('❌ Please specify a number between 1 and 100.');
  }

  try {
    const messages = await message.channel.messages.fetch({ limit: amount + 1 });
    const messagesToDelete = messages.filter(msg => !msg.pinned);
    
    if (messagesToDelete.size === 0) {
      return message.reply('❌ No messages to delete.');
    }

    await message.channel.bulkDelete(messagesToDelete);
    const reply = await message.reply(`✅ Deleted ${messagesToDelete.size} message(s).`);
    
    setTimeout(() => reply.delete().catch(() => {}), 5000);
  } catch (error) {
    console.error('Error clearing messages:', error);
    return message.reply('❌ Failed to delete messages. Messages may be too old (14+ days).');
  }
}

