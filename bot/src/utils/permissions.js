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

