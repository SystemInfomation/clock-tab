/**
 * Cache for Discord user information
 * In production, consider using a more robust caching solution (Redis, etc.)
 */
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch Discord user information (with caching)
 * @param {string} userId - Discord user ID
 * @returns {Promise<{id: string, username: string, avatarURL: string, displayName: string}>}
 */
export async function getDiscordUser(userId) {
  if (!userId) {
    return {
      id: userId || 'unknown',
      username: 'Unknown User',
      avatarURL: 'https://cdn.discordapp.com/embed/avatars/0.png?size=256',
      displayName: 'Unknown User'
    };
  }

  // Check cache
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await fetch(`/api/discord/user/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    
    const userData = await response.json();
    
    // Cache the result
    userCache.set(userId, {
      data: userData,
      timestamp: Date.now()
    });

    return userData;
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    // Return fallback
    const defaultAvatarIndex = (parseInt(userId) >> 22) % 6;
    return {
      id: userId,
      username: 'Unknown User',
      avatarURL: `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png?size=256`,
      displayName: 'Unknown User'
    };
  }
}

/**
 * Fetch multiple Discord users at once
 * @param {string[]} userIds - Array of Discord user IDs
 * @returns {Promise<Map<string, object>>}
 */
export async function getDiscordUsers(userIds) {
  const usersMap = new Map();
  const uncachedIds = [];

  // Check cache for each user
  userIds.forEach(userId => {
    const cached = userCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      usersMap.set(userId, cached.data);
    } else {
      uncachedIds.push(userId);
    }
  });

  // Fetch uncached users in parallel
  const fetchPromises = uncachedIds.map(userId => getDiscordUser(userId));
  const fetchedUsers = await Promise.all(fetchPromises);

  fetchedUsers.forEach(user => {
    usersMap.set(user.id, user);
  });

  return usersMap;
}

/**
 * Clear user cache (useful for testing or forced refresh)
 */
export function clearUserCache() {
  userCache.clear();
}

