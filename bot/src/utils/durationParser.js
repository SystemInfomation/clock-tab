import ms from 'ms';

/**
 * Parse a duration string (e.g., "1d", "2h", "30m") into milliseconds
 * @param {string} duration - Duration string
 * @returns {number|null} - Duration in milliseconds or null if invalid
 */
export function parseDuration(duration) {
  if (!duration) return null;
  
  try {
    const result = ms(duration);
    return result || null;
  } catch (error) {
    // Fallback parser for formats like "1d", "2h", "30m"
    const units = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    };
    
    const match = duration.match(/^(\d+)([smhd])$/i);
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    return value * (units[unit] || 0);
  }
}

/**
 * Format milliseconds into a human-readable string
 * @param {number} milliseconds - Duration in milliseconds
 * @returns {string} - Formatted duration string
 */
export function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

