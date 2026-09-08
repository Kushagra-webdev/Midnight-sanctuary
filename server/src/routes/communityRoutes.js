import express from 'express';
import { getCommunities, createCommunity, joinCommunity, leaveCommunity } from '../controllers/communityController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getCommunities);
router.post('/', createCommunity);
router.post('/:id/join', joinCommunity);
router.delete('/:id/leave', leaveCommunity);

export default router;
