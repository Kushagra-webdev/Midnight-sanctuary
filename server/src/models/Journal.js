import mongoose from 'mongoose';

const journalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, default: 'Untitled Entry' },
    content: { type: String, required: true },
    
    // 1-10 scale representing the user's mental state that day
    moodScore: { type: Number, min: 1, max: 10 }, 
    
    tags: [{ type: String, trim: true }],
    isPrivate: { type: Boolean, default: true }, // Ensures journals stay private
  },
  { timestamps: true }
);

export default mongoose.model('Journal', journalSchema);