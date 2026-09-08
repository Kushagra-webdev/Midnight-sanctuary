import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // Embedded comments for faster reads. If comments get too large in the future, 
    // we would extract this into a separate Comment model.
    comments: [
      {
        authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      }
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Post', postSchema);