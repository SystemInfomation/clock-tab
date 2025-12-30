/**
 * Parse a message for rank change information
 * Expected format:
 * User: @username
 * Rank: NewRank
 * Reason: Detailed reason here
 * 
 * @param {Message} message - Discord message
 * @returns {Object|null} - Parsed data or null if invalid format
 */
export function parseRankChange(message) {
  const content = message.content.trim();
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  
  let userId = null;
  let newRank = null;
  let reason = null;
  
  // Check for user mention
  const mentionMatch = content.match(/User:\s*<@!?(\d+)>/i);
  if (mentionMatch && mentionMatch[1]) {
    userId = mentionMatch[1];
  } else {
    // Try to find mention in the message
    if (message.mentions.users.size > 0) {
      userId = message.mentions.users.first().id;
    }
  }
  
  // Extract rank
  const rankMatch = content.match(/Rank:\s*(.+)/i);
  if (rankMatch) {
    newRank = rankMatch[1].trim();
  }
  
  // Extract reason
  const reasonMatch = content.match(/Reason:\s*(.+)/is);
  if (reasonMatch) {
    reason = reasonMatch[1].trim();
  }
  
  // Validate that we have all required fields
  if (!userId || !newRank || !reason) {
    return null;
  }
  
  return {
    userId,
    newRank,
    reason,
    staffId: message.author.id,
    timestamp: new Date()
  };
}

/**
 * Check if a message matches the rank change format
 * @param {Message} message - Discord message
 * @returns {boolean} - True if message appears to be a rank change
 */
export function isRankChangeMessage(message) {
  const content = message.content.toLowerCase();
  return content.includes('user:') && 
         content.includes('rank:') && 
         content.includes('reason:');
}

