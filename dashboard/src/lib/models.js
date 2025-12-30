import mongoose from 'mongoose';

const infractionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['warning', 'mute', 'kick', 'ban'], required: true },
  reason: { type: String, required: true },
  staffId: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  points: { type: Number, required: true },
  duration: { type: String, default: null },
  expiresAt: { type: Date, default: null, index: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const rankChangeSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  newRank: { type: String, required: true },
  previousRank: { type: String, default: null },
  reason: { type: String, required: true },
  staffId: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  totalPoints: { type: Number, default: 0 },
  lastActionDate: { type: Date, default: null },
  currentRank: { type: String, default: null }
}, { timestamps: true });

export const Infraction = mongoose.models.Infraction || mongoose.model('Infraction', infractionSchema);
export const RankChange = mongoose.models.RankChange || mongoose.model('RankChange', rankChangeSchema);
export const User = mongoose.models.User || mongoose.model('User', userSchema);

