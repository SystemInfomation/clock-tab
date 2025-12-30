import Infraction from '../models/Infraction.js';
import User from '../models/User.js';
import { parseDuration } from '../utils/durationParser.js';

const POINTS_MAP = {
  warning: parseInt(process.env.WARN_POINTS || '1'),
  mute: parseInt(process.env.MUTE_POINTS || '3'),
  kick: parseInt(process.env.KICK_POINTS || '5'),
  ban: parseInt(process.env.BAN_POINTS || '9')
};

const AUTO_BAN_THRESHOLD = parseInt(process.env.AUTO_BAN_THRESHOLD || '10');

/**
 * Create a new infraction
 * @param {Object} data - Infraction data
 * @param {string} data.userId - User ID
 * @param {string} data.type - Infraction type
 * @param {string} data.reason - Reason for infraction
 * @param {string} data.staffId - Staff member ID
 * @param {string} data.duration - Optional duration string
 * @returns {Promise<Object>} - Created infraction and updated user
 */
export async function createInfraction(data) {
  const { userId, type, reason, staffId, duration } = data;
  
  const points = POINTS_MAP[type] || 0;
  let expiresAt = null;
  
  if (duration && (type === 'mute' || type === 'ban')) {
    const durationMs = parseDuration(duration);
    if (durationMs) {
      expiresAt = new Date(Date.now() + durationMs);
    }
  }
  
  const infraction = new Infraction({
    userId,
    type,
    reason,
    staffId,
    points,
    duration: duration || null,
    expiresAt,
    active: true
  });
  
  try {
    await infraction.save();
  } catch (error) {
    console.error('Error saving infraction:', error);
    throw error;
  }
  
  // Update user stats using findOneAndUpdate for better performance (atomic operation)
  const user = await User.findOneAndUpdate(
    { userId },
    {
      $inc: { totalPoints: points },
      $set: { lastActionDate: new Date() },
      $setOnInsert: { totalPoints: 0 } // Set default when creating new document
    },
    { 
      upsert: true, 
      new: true,
      runValidators: true
    }
  );
  
  // Check if user should be auto-banned
  let shouldAutoBan = false;
  if (user.totalPoints >= AUTO_BAN_THRESHOLD && type !== 'ban') {
    shouldAutoBan = true;
  }
  
  return { infraction, user, shouldAutoBan };
}

/**
 * Get all infractions for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of infractions
 */
export async function getUserInfractions(userId) {
  return await Infraction.find({ userId })
    .sort({ timestamp: -1 })
    .lean();
}

/**
 * Get user statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User stats
 */
export async function getUserStats(userId) {
  const user = await User.findOne({ userId }).lean();
  const infractions = await Infraction.find({ userId }).lean();
  
  if (!user) {
    return {
      totalPoints: 0,
      totalInfractions: 0,
      warnings: 0,
      mutes: 0,
      kicks: 0,
      bans: 0,
      lastActionDate: null
    };
  }
  
  const stats = {
    totalPoints: user.totalPoints,
    totalInfractions: infractions.length,
    warnings: infractions.filter(i => i.type === 'warning').length,
    mutes: infractions.filter(i => i.type === 'mute').length,
    kicks: infractions.filter(i => i.type === 'kick').length,
    bans: infractions.filter(i => i.type === 'ban').length,
    lastActionDate: user.lastActionDate
  };
  
  return stats;
}

/**
 * Delete an infraction
 * @param {string} infractionId - Infraction ID
 * @returns {Promise<Object>} - Deleted infraction
 */
export async function deleteInfraction(infractionId) {
  const infraction = await Infraction.findById(infractionId);
  if (!infraction) {
    throw new Error('Infraction not found');
  }
  
  // Update user points
  const user = await User.findOne({ userId: infraction.userId });
  if (user) {
    user.totalPoints = Math.max(0, user.totalPoints - infraction.points);
    await user.save();
  }
  
  await Infraction.findByIdAndDelete(infractionId);
  return infraction;
}

