import mongoose from 'mongoose';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import Task from '../models/Task.js';
import Journal from '../models/Journal.js';
import FocusSession from '../models/FocusSession.js';

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { passwordHash, resetPasswordToken, resetPasswordExpires, ...safeUser } = user;
    res.status(200).json(safeUser);
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.bio !== undefined) user.bio = req.body.bio;
    if (req.body.avatarUrl !== undefined) user.avatarUrl = req.body.avatarUrl;

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(req.body.password, salt);
    }

    const updated = await user.save();
    const { passwordHash, resetPasswordToken, resetPasswordExpires, ...safeUser } = updated.toObject();
    res.status(200).json(safeUser);
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

export const updateBlockerSettings = async (req, res) => {
  try {
    const { deepFocusEnabled, blockedCategories, quietHours } = req.body;
    const updateFields = {};

    if (deepFocusEnabled !== undefined)
      updateFields['blockerSettings.deepFocusEnabled'] = deepFocusEnabled;

    if (blockedCategories && typeof blockedCategories === 'object') {
      Object.entries(blockedCategories).forEach(([key, val]) => {
        updateFields[`blockerSettings.blockedCategories.${key}`] = val;
      });
    }
    if (quietHours && typeof quietHours === 'object') {
      Object.entries(quietHours).forEach(([key, val]) => {
        updateFields[`blockerSettings.quietHours.${key}`] = val;
      });
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, lean: true }
    );

    res.status(200).json({ blockerSettings: updated.blockerSettings });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

export const incrementStreak = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.currentStreak += 1;
    user.activeDays += 1;
    if (user.currentStreak > user.highestStreak) user.highestStreak = user.currentStreak;
    user.recoveryScore = Math.min(100, user.recoveryScore + 5);

    // Track today in streak calendar
    const today = new Date().toISOString().split('T')[0];
    if (!user.streakCalendar.includes(today)) {
      user.streakCalendar.push(today);
      // Keep last 365 days only
      if (user.streakCalendar.length > 365) {
        user.streakCalendar = user.streakCalendar.slice(-365);
      }
    }

    await user.save();
    res.status(200).json({
      currentStreak: user.currentStreak,
      highestStreak: user.highestStreak,
      activeDays: user.activeDays,
      recoveryScore: user.recoveryScore,
      streakCalendar: user.streakCalendar,
    });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.user._id);

    const [tasks, recentJournals, focusAgg] = await Promise.all([
      Task.find({ userId: uid }).lean(),
      Journal.find({ userId: uid }).sort({ createdAt: -1 }).limit(3).lean(),
      FocusSession.aggregate([
        { $match: { userId: uid } },
        {
          $group: {
            _id: null,
            totalMinutes: { $sum: '$duration' },
            totalSessions: { $sum: 1 },
          },
        },
      ]),
    ]);

    const completed = tasks.filter((t) => t.isCompleted).length;
    const total = tasks.length;
    const focusData = focusAgg[0] || { totalMinutes: 0, totalSessions: 0 };

    res.status(200).json({
      tasks: {
        total,
        completed,
        completionRate: total ? Math.round((completed / total) * 100) : 0,
      },
      journals: { total: recentJournals.length, recent: recentJournals },
      focus: {
        totalMinutes: focusData.totalMinutes,
        totalHours: (focusData.totalMinutes / 60).toFixed(1),
        totalSessions: focusData.totalSessions,
      },
      streak: {
        current: req.user.currentStreak || 0,
        highest: req.user.highestStreak || 0,
        activeDays: req.user.activeDays || 0,
        recoveryScore: req.user.recoveryScore || 0,
        calendar: req.user.streakCalendar || [],
      },
    });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

// @desc   Search users by name/email
// @route  GET /api/users/search?q=
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.status(400).json({ message: 'Query must be at least 2 characters' });

    const users = await User.find({
      $or: [
        { name: { $regex: q.trim(), $options: 'i' } },
        { email: { $regex: q.trim(), $options: 'i' } },
      ],
      _id: { $ne: req.user._id },
    })
      .select('name email avatarUrl bio currentStreak planType followers')
      .limit(10)
      .lean();

    res.status(200).json(users.map(u => ({
      ...u,
      followerCount: u.followers?.length || 0,
      isFollowing: u.followers?.some(f => f.toString() === req.user._id.toString()) || false,
    })));
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

// @desc   Follow / unfollow a user
// @route  POST /api/users/:id/follow
export const followUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const me = await User.findById(req.user._id);
    const alreadyFollowing = me.following.some(f => f.toString() === req.params.id);

    if (alreadyFollowing) {
      me.following.pull(req.params.id);
      target.followers.pull(req.user._id);
    } else {
      me.following.push(req.params.id);
      target.followers.push(req.user._id);
      // Notify target
      target.notifications.push({
        message: `${me.name} started following you.`,
        type: 'info',
      });
    }

    await Promise.all([me.save(), target.save()]);
    res.status(200).json({
      following: !alreadyFollowing,
      followerCount: target.followers.length,
    });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

// @desc   Get notifications
// @route  GET /api/users/notifications
export const getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    const notifications = (user.notifications || []).slice().reverse().slice(0, 20);
    res.status(200).json(notifications);
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

// @desc   Mark all notifications as read
// @route  PUT /api/users/notifications/read
export const markNotificationsRead = async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.user._id },
      { $set: { 'notifications.$[].read': true } }
    );
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

// @desc   Complete onboarding
// @route  POST /api/users/onboarding/complete
export const completeOnboarding = async (req, res) => {
  try {
    const { goals, sessionPreference, notificationPreference } = req.body;
    await User.findByIdAndUpdate(req.user._id, {
      onboardingCompleted: true,
      onboardingStep: 999,
    });
    res.status(200).json({ message: 'Onboarding complete', onboardingCompleted: true });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};
