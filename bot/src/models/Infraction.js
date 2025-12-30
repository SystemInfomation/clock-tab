import mongoose from 'mongoose';

const infractionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['warning', 'mute', 'kick', 'ban'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  staffId: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  points: {
    type: Number,
    required: true
  },
  duration: {
    type: String,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null,
    index: true
  },
  active: {
    type: Boolean,
    default: true
  }
});

export default mongoose.model('Infraction', infractionSchema);

