/**
 * Check if a member has required permissions for moderation commands
 * @param {GuildMember} member - The Discord guild member
 * @returns {boolean} - True if member has moderation permissions
 */
export function hasModerationPermissions(member) {
  if (!member) return false;
  
  const permissions = member.permissions;
  return permissions.has('KickMembers') || 
         permissions.has('BanMembers') || 
         permissions.has('ManageMessages') ||
         permissions.has('Administrator');
}

/**
 * Check if a member has a specific permission
 * @param {GuildMember} member - The Discord guild member
 * @param {PermissionResolvable} permission - The permission to check
 * @returns {boolean}
 */
export function hasPermission(member, permission) {
  if (!member) return false;
  return member.permissions.has(permission);
}

/**
 * Check if executor can moderate target member based on role hierarchy
 * @param {GuildMember} executor - The staff member executing the action
 * @param {GuildMember} target - The member being moderated
 * @returns {boolean} - True if executor can moderate target
 */
export function canModerate(executor, target) {
  if (!executor || !target) return false;
  if (!executor.guild || !target.guild) return false;
  if (executor.guild.id !== target.guild.id) return false;
  
  // Cannot moderate self
  if (executor.id === target.id) return false;
  
  // Cannot moderate guild owner
  if (target.id === executor.guild.ownerId) return false;
  
  // Check role hierarchy
  return executor.roles.highest.position > target.roles.highest.position;
}

/**
 * Check if bot can moderate target member based on role hierarchy
 * @param {GuildMember} botMember - The bot's guild member
 * @param {GuildMember} target - The member being moderated
 * @returns {boolean} - True if bot can moderate target
 */
export function botCanModerate(botMember, target) {
  if (!botMember || !target) return false;
  if (!botMember.guild || !target.guild) return false;
  if (botMember.guild.id !== target.guild.id) return false;
  
  // Cannot moderate guild owner
  if (target.id === botMember.guild.ownerId) return false;
  
  // Check role hierarchy
  return botMember.roles.highest.position > target.roles.highest.position;
}

