import express from 'express';
import { getJournals, createJournal, updateJournal, deleteJournal, exportJournals } from '../controllers/journalController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getJournals);
router.post('/', createJournal);
router.get('/export', exportJournals);
router.put('/:id', updateJournal);
router.delete('/:id', deleteJournal);

export default router;
