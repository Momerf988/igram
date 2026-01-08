const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');

// Toggle like on a post (both creator and consumer)
router.post('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user._id.toString();
    const likeIndex = post.likes.findIndex(
      like => like.toString() === userId
    );

    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Like
      post.likes.push(req.user._id);
    }

    await post.save();

    res.json({
      message: likeIndex > -1 ? 'Post unliked' : 'Post liked',
      likesCount: post.likes.length,
      isLiked: likeIndex === -1
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check if user liked a post
router.get('/:postId/status', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user._id.toString();
    const isLiked = post.likes.some(
      like => like.toString() === userId
    );

    res.json({
      isLiked,
      likesCount: post.likes.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Public like route for anonymous consumers
router.post('/public/:postId', async (req, res) => {
  try {
    const { consumerName } = req.body;
    
    if (!consumerName || !consumerName.trim()) {
      return res.status(400).json({ message: 'Consumer name is required' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Initialize consumerLikes if it doesn't exist
    if (!post.consumerLikes) {
      post.consumerLikes = [];
    }

    const trimmedName = consumerName.trim();
    const likeIndex = post.consumerLikes.findIndex(
      like => like.consumerName === trimmedName
    );

    if (likeIndex > -1) {
      // Unlike
      post.consumerLikes.splice(likeIndex, 1);
    } else {
      // Like
      post.consumerLikes.push({ consumerName: trimmedName });
    }

    await post.save();

    res.json({
      message: likeIndex > -1 ? 'Post unliked' : 'Post liked',
      likesCount: (post.likes?.length || 0) + (post.consumerLikes?.length || 0),
      isLiked: likeIndex === -1
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
