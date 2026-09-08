import mongoose from 'mongoose';
import Post from '../models/Post.js';

export const getPosts = async (req, res) => {
  try {
    const { communityId } = req.query;

    if (communityId && !mongoose.Types.ObjectId.isValid(communityId)) {
      return res.status(200).json([]);
    }

    const query = communityId ? { communityId } : {};
    const posts = await Post.find(query)
      .populate('authorId', 'name avatarUrl')
      .populate('comments.authorId', 'name avatarUrl')
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(posts);
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

export const createPost = async (req, res) => {
  try {
    const { communityId, title, content } = req.body;

    if (!communityId || !content?.trim()) {
      return res.status(400).json({ message: 'communityId and content are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(communityId)) {
      return res.status(400).json({ message: 'Cannot post to a demo community. Create a real circle first!' });
    }

    const post = await Post.create({
      communityId,
      authorId: req.user._id,
      title: title?.trim() || content.slice(0, 60),
      content: content.trim(),
    });

    const populated = await Post.findById(post._id)
      .populate('authorId', 'name avatarUrl')
      .populate('comments.authorId', 'name avatarUrl')
      .lean();
    res.status(201).json(populated);
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

export const likePost = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const uid = req.user._id.toString();
    const idx = post.likes.findIndex((id) => id.toString() === uid);
    if (idx === -1) post.likes.push(req.user._id);
    else post.likes.splice(idx, 1);

    await post.save();
    res.status(200).json({ likes: post.likes.length, liked: idx === -1 });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.authorId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    await post.deleteOne();
    res.status(200).json({ message: 'Post deleted', id: req.params.id });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

// @desc   Add a comment to a post
// @route  POST /api/posts/:id/comments
export const addComment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text is required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({ authorId: req.user._id, text: text.trim() });
    await post.save();

    const populated = await Post.findById(post._id)
      .populate('authorId', 'name avatarUrl')
      .populate('comments.authorId', 'name avatarUrl')
      .lean();

    res.status(201).json(populated);
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

// @desc   Delete a comment
// @route  DELETE /api/posts/:id/comments/:commentId
export const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.authorId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    comment.deleteOne();
    await post.save();
    res.status(200).json({ message: 'Comment deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};
