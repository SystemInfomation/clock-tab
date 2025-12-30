import { EmbedBuilder } from 'discord.js';
import { hasModerationPermissions } from '../utils/permissions.js';

/**
 * Handle help command
 */
export async function handleHelp(message, args) {
  // Check if user wants help for a specific command
  const commandName = args[0]?.toLowerCase();
  
  if (commandName) {
    return handleSpecificCommandHelp(message, commandName);
  }

  // General help embed
  const embed = new EmbedBuilder()
    .setColor(0x5865f2) // Discord blurple color
    .setTitle('🤖 Moderation Bot Commands')
    .setDescription('Here are all available commands for this bot.')
    .setThumbnail(message.client.user.displayAvatarURL())
    .setTimestamp()
    .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

  // Moderation commands (only show if user has permissions)
  if (hasModerationPermissions(message.member)) {
    embed.addFields(
      {
        name: '⚖️ Moderation Commands',
        value: '`!warn` `!mute` `!unmute` `!kick` `!ban` `!infractions` `!clear`',
        inline: false
      },
      {
        name: '📖 Get Help for a Command',
        value: 'Use `!help <command>` to get detailed information about a specific command.\nExample: `!help mute`',
        inline: false
      }
    );
  } else {
    embed.addFields({
      name: 'ℹ️ Information',
      value: 'You need moderation permissions to use bot commands. Contact a staff member if you believe this is an error.',
      inline: false
    });
  }

  // Add usage info
  embed.addFields({
    name: '💡 Tips',
    value: '• All commands use the `!` prefix\n• User mentions are required for moderation commands\n• All actions are logged to the database',
    inline: false
  });

  try {
    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error sending help embed:', error);
    await message.reply('❌ Failed to send help message. Please try again.');
  }
}

/**
 * Handle help for a specific command
 */
async function handleSpecificCommandHelp(message, commandName) {
  const commandInfo = getCommandInfo(commandName);
  
  if (!commandInfo) {
    return message.reply(`❌ Unknown command: \`${commandName}\`. Use \`!help\` to see all available commands.`);
  }

  // Check permissions for moderation commands
  if (commandInfo.requiresPermissions && !hasModerationPermissions(message.member)) {
    return message.reply('❌ You do not have permission to view help for this command.');
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`📖 Command: !${commandName}`)
    .setDescription(commandInfo.description)
    .addFields(
      {
        name: 'Usage',
        value: `\`${commandInfo.usage}\``,
        inline: false
      },
      {
        name: 'Example',
        value: `\`${commandInfo.example}\``,
        inline: false
      }
    );

  if (commandInfo.notes) {
    embed.addFields({
      name: 'Notes',
      value: commandInfo.notes,
      inline: false
    });
  }

  if (commandInfo.aliases && commandInfo.aliases.length > 0) {
    embed.addFields({
      name: 'Aliases',
      value: commandInfo.aliases.map(a => `\`!${a}\``).join(', '),
      inline: false
    });
  }

  embed.setTimestamp()
    .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

  try {
    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error sending command help embed:', error);
    await message.reply('❌ Failed to send help message. Please try again.');
  }
}

/**
 * Get command information
 */
function getCommandInfo(commandName) {
  const commands = {
    warn: {
      description: 'Issue a warning to a user. Warnings add 1 point to the user\'s infraction total.',
      usage: '!warn @user <reason>',
      example: '!warn @user Spamming in chat',
      requiresPermissions: true,
      notes: '• Points: 1\n• Creates an infraction record\n• All warnings are logged'
    },
    mute: {
      description: 'Mute a user (timeout). Can be temporary or permanent.',
      usage: '!mute @user [duration] <reason>',
      example: '!mute @user 1h Being disruptive\n!mute @user Being disruptive (permanent)',
      requiresPermissions: true,
      notes: '• Points: 3\n• Duration format: `1m`, `30m`, `1h`, `2h`, `1d`\n• Without duration, mute is permanent (max 28 days)\n• Uses Discord timeout feature'
    },
    unmute: {
      description: 'Remove a mute/timeout from a user.',
      usage: '!unmute @user',
      example: '!unmute @user',
      requiresPermissions: true,
      notes: '• Removes the timeout from the user\n• Does not remove the infraction record'
    },
    kick: {
      description: 'Kick a user from the server. They can rejoin with an invite.',
      usage: '!kick @user <reason>',
      example: '!kick @user Repeated rule violations',
      requiresPermissions: true,
      notes: '• Points: 5\n• User can rejoin the server\n• Creates an infraction record'
    },
    ban: {
      description: 'Ban a user from the server. Can be temporary or permanent.',
      usage: '!ban @user [duration] <reason>',
      example: '!ban @user 7d Severe rule violation\n!ban @user Severe rule violation (permanent)',
      requiresPermissions: true,
      notes: '• Points: 9\n• Duration format: `1m`, `30m`, `1h`, `2h`, `1d`, `7d`\n• Without duration, ban is permanent\n• Deletes messages from last 1 day'
    },
    infractions: {
      description: 'View infraction history for a user.',
      usage: '!infractions @user',
      example: '!infractions @user',
      requiresPermissions: true,
      notes: '• Shows all infractions for the mentioned user\n• Displays type, reason, staff member, and timestamp\n• Shows total points'
    },
    clear: {
      description: 'Clear messages from a channel.',
      usage: '!clear <amount>',
      example: '!clear 10 (clears last 10 messages)\n!clear 50 (clears last 50 messages)',
      requiresPermissions: true,
      notes: '• Can clear 1-100 messages at a time\n• Cannot delete messages older than 14 days\n• Bot messages and command message are included in count'
    },
    help: {
      description: 'Show help information for bot commands.',
      usage: '!help [command]',
      example: '!help (shows all commands)\n!help mute (shows detailed mute command info)',
      requiresPermissions: false,
      notes: '• Use without arguments to see all commands\n• Use with a command name to get detailed help'
    }
  };

  return commands[commandName];
}

