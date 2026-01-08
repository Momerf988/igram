const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Comment = require('../models/Comment');
const Post = require('../models/Post');

// Create comment (both creator and consumer)
router.post('/', auth, async (req, res) => {
  try {
    const { postId, text } = req.body;

    if (!postId || !text) {
      return res.status(400).json({ message: 'Post ID and text are required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await Comment.create({
      post: postId,
      user: req.user._id,
      text
    });

    // Add comment to post
    post.comments.push(comment._id);
    await post.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'username name role');

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get comments for a post
router.get('/post/:postId', auth, async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('user', 'username name role')
      .sort({ createdAt: -1 });
    
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete comment (public route for consumers)
router.delete('/public/:id', async (req, res) => {
  try {
    const { consumerName } = req.body;
    
    if (!consumerName || !consumerName.trim()) {
      return res.status(400).json({ message: 'Consumer name is required' });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Consumer can only delete their own comments
    if (!comment.consumerName || comment.consumerName !== consumerName.trim()) {
      return res.status(403).json({ message: 'Not authorized - you can only delete your own comments' });
    }

    // Remove comment from post
    const post = await Post.findById(comment.post);
    if (post) {
      post.comments = post.comments.filter(
        c => c.toString() !== comment._id.toString()
      );
      await post.save();
    }

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete comment (authenticated users - creator can only delete their own, users can delete their own)
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Creator can only delete their own comments (not consumer comments)
    if (req.user.role === 'creator') {
      // Creator cannot delete consumer comments
      if (comment.consumerName) {
        return res.status(403).json({ message: 'Not authorized - you can only delete your own comments' });
      }
      // Creator can only delete their own comments
      if (!comment.user || comment.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized - you can only delete your own comments' });
      }
    } else {
      // Regular users can only delete their own comments
      if (!comment.user || comment.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    // Remove comment from post
    const post = await Post.findById(comment.post);
    if (post) {
      post.comments = post.comments.filter(
        c => c.toString() !== comment._id.toString()
      );
      await post.save();
    }

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete comment (public route for anonymous consumers)
router.delete('/public/:id', async (req, res) => {
  try {
    const { consumerName } = req.body;
    
    if (!consumerName || !consumerName.trim()) {
      return res.status(400).json({ message: 'Consumer name is required' });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Consumer can only delete their own comments
    if (!comment.consumerName || comment.consumerName !== consumerName.trim()) {
      return res.status(403).json({ message: 'Not authorized - you can only delete your own comments' });
    }

    // Remove comment from post
    const post = await Post.findById(comment.post);
    if (post) {
      post.comments = post.comments.filter(
        c => c.toString() !== comment._id.toString()
      );
      await post.save();
    }

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Public comment route for anonymous consumers
router.post('/public', async (req, res) => {
  try {
    const { postId, text, consumerName } = req.body;

    if (!postId || !text || !consumerName) {
      return res.status(400).json({ message: 'Post ID, text, and consumer name are required' });
    }

    if (!consumerName.trim()) {
      return res.status(400).json({ message: 'Consumer name cannot be empty' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await Comment.create({
      post: postId,
      consumerName: consumerName.trim(),
      text
    });

    // Add comment to post
    post.comments.push(comment._id);
    await post.save();

    res.status(201).json({
      _id: comment._id,
      text: comment.text,
      consumerName: comment.consumerName,
      createdAt: comment.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
