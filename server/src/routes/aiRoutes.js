import express from 'express';
import { chatWithAI, generateJournalInsight, getDailyAffirmation } from '../controllers/aiController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/chat', chatWithAI);
router.post('/journal-insight', generateJournalInsight);
router.get('/daily-affirmation', getDailyAffirmation);

export default router;
