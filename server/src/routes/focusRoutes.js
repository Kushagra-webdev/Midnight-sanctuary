import express from 'express';
import { 
  getFocusSessions, 
  logFocusSession, 
  getFocusStats, 
  deleteFocusSession 
} from '../controllers/focusController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Enforce authentication
router.use(protect); 

// Base route: /api/focus
router.route('/')
  .get(getFocusSessions)
  .post(logFocusSession);

// Analytics route: /api/focus/stats
router.get('/stats', getFocusStats);

// ID specific route: /api/focus/:id
router.route('/:id')
  .delete(deleteFocusSession);

export default router;