import mongoose from 'mongoose';

const focusSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Duration in minutes
    duration: { type: Number, required: true }, 
    
    sessionType: { 
      type: String, 
      enum: ['Deep Work', 'Meditation', 'Reading', 'Digital Detox'],
      default: 'Deep Work'
    },
    
    // Track if they successfully completed the timer without breaking the block
    wasSuccessful: { type: Boolean, default: true },
    
    blockedSitesUsed: [{ type: String }], // Optional: Track what they blocked
  },
  { timestamps: true }
);

export default mongoose.model('FocusSession', focusSessionSchema);