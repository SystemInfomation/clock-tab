import mongoose from 'mongoose';

const rankChangeSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  newRank: {
    type: String,
    required: true
  },
  previousRank: {
    type: String,
    default: null
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
  }
});

export default mongoose.model('RankChange', rankChangeSchema);

