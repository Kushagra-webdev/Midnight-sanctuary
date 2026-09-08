import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    isCompleted: { type: Boolean, default: false },
    priority: { 
      type: String, 
      enum: ['Low', 'Medium', 'High', 'Critical'], 
      default: 'Medium' 
    },
    deadline: { type: Date },
    // AI suggested tasks have this flag
    aiSuggested: { type: Boolean, default: false },
    // Calendar due date (separate from deadline for display)
    dueDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Task', taskSchema);
