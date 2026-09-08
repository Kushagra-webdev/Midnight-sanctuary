import express from 'express';
import { getPosts, createPost, likePost, deletePost, addComment, deleteComment } from '../controllers/postController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getPosts);
router.post('/', createPost);
router.post('/:id/like', likePost);
router.delete('/:id', deletePost);
router.post('/:id/comments', addComment);
router.delete('/:id/comments/:commentId', deleteComment);

export default router;
