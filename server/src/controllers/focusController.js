import mongoose from 'mongoose';
import FocusSession from '../models/FocusSession.js';

export const getFocusSessions = async (req, res) => {
  try {
    const sessions = await FocusSession.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(sessions);
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

export const logFocusSession = async (req, res) => {
  try {
    const { duration, sessionType, wasSuccessful } = req.body;
    if (!duration || Number(duration) < 1) {
      return res.status(400).json({ message: 'Duration must be at least 1 minute' });
    }
    const session = await FocusSession.create({
      userId: req.user._id,
      duration: Math.round(Number(duration)),
      sessionType: sessionType || 'Deep Work',
      wasSuccessful: wasSuccessful !== false,
    });
    res.status(201).json(session);
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

export const getFocusStats = async (req, res) => {
  try {
    // Cast to ObjectId so the aggregate $match works correctly
    const uid = new mongoose.Types.ObjectId(req.user._id);
    const agg = await FocusSession.aggregate([
      { $match: { userId: uid } },
      {
        $group: {
          _id: null,
          totalMinutes: { $sum: '$duration' },
          totalSessions: { $sum: 1 },
          successCount: { $sum: { $cond: ['$wasSuccessful', 1, 0] } },
        },
      },
    ]);
    const data = agg[0] || { totalMinutes: 0, totalSessions: 0, successCount: 0 };
    res.status(200).json({
      totalHours: (data.totalMinutes / 60).toFixed(1),
      totalMinutes: data.totalMinutes,
      totalSessions: data.totalSessions,
      successRate:
        data.totalSessions > 0
          ? Math.round((data.successCount / data.totalSessions) * 100)
          : 0,
    });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

export const deleteFocusSession = async (req, res) => {
  try {
    const session = await FocusSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    await session.deleteOne();
    res.status(200).json({ message: 'Session deleted', id: req.params.id });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};
