import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  lastActionDate: {
    type: Date,
    default: null
  },
  currentRank: {
    type: String,
    default: null
  }
});

export default mongoose.model('User', userSchema);

