import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },

    // Profile & Identity
    bio: { type: String, maxLength: 160, default: '' },
    avatarUrl: { type: String, default: '' },

    // Progress & Gamification
    currentStreak: { type: Number, default: 0 },
    highestStreak: { type: Number, default: 0 },
    activeDays: { type: Number, default: 0 },
    recoveryScore: { type: Number, default: 0 },

    // Streak calendar — array of ISO date strings e.g. "2025-06-01"
    streakCalendar: [{ type: String }],

    // Relationships
    communitiesJoined: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Community' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Subscription
    planType: {
      type: String,
      enum: ['Free', 'Pro', 'Premium'],
      default: 'Free',
    },

    // Razorpay payment tracking
    razorpayPaymentId: { type: String, default: '' },
    razorpayOrderId: { type: String, default: '' },

    // Blocker settings
    blockerSettings: {
      deepFocusEnabled: { type: Boolean, default: false },
      blockedCategories: {
        social: { type: Boolean, default: true },
        streaming: { type: Boolean, default: true },
        ecommerce: { type: Boolean, default: false },
      },
      quietHours: {
        enabled: { type: Boolean, default: true },
        start: { type: String, default: '22:00' },
        end: { type: String, default: '07:00' },
      },
    },

    // Password reset
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // Onboarding
    onboardingCompleted: { type: Boolean, default: false },
    onboardingStep: { type: Number, default: 0 },

    // In-app notifications
    notifications: [
      {
        message: { type: String, required: true },
        type: { type: String, enum: ['info', 'success', 'warning', 'ai'], default: 'info' },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      }
    ],
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
