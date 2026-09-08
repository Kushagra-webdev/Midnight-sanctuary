import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  incrementStreak,
  updateBlockerSettings,
  getDashboardStats,
  searchUsers,
  followUser,
  getNotifications,
  markNotificationsRead,
  completeOnboarding,
} from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.post('/streak/increment', incrementStreak);
router.put('/blocker-settings', updateBlockerSettings);
router.get('/dashboard-stats', getDashboardStats);
router.get('/search', searchUsers);
router.post('/:id/follow', followUser);
router.get('/notifications', getNotifications);
router.put('/notifications/read', markNotificationsRead);
router.post('/onboarding/complete', completeOnboarding);

export default router;
