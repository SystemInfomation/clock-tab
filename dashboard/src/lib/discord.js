/**
 * Get Discord avatar URL for a user
 * @param {string} userId - Discord user ID
 * @param {string} avatarHash - Optional avatar hash from Discord
 * @param {number} size - Avatar size (16, 32, 64, 128, 256, 512, 1024, 2048, 4096)
 * @returns {string} Avatar URL
 */
export function getDiscordAvatar(userId, avatarHash = null, size = 256) {
  if (avatarHash && avatarHash !== null) {
    // User has custom avatar
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.webp?size=${size}`
  }
  
  // Default Discord avatar based on user ID
  // Discord uses: (userId >> 22) % 6 for default avatar selection
  const defaultAvatar = (parseInt(userId) >> 22) % 6
  return `https://cdn.discordapp.com/embed/avatars/${defaultAvatar}.png?size=${size}`
}

/**
 * Format Discord user ID for display
 */
export function formatUserId(userId) {
  if (!userId) return 'Unknown'
  return userId
}

