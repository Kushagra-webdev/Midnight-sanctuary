import express from 'express';
import { getTasks, createTask, updateTask, deleteTask, aiSuggestTasks } from '../controllers/taskController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/ai-suggest', aiSuggestTasks);

export default router;
