const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    if (
      !file.mimetype.startsWith('image/') &&
      !file.mimetype.startsWith('video/')
    ) {
      return cb(new Error('Only image and video files are allowed'), false);
    }
    cb(null, true);
  },
});

// ==========================================
// PUBLIC FEED (Fixed: No Sorting)
// ==========================================
router.get('/public', async (req, res) => {
  try {
    // 1. We removed .sort({ createdAt: -1 }) to stop the Azure error
    const posts = await Post.find()
      .populate('creator', 'username name')
      .populate({
        path: 'comments',
        // 2. We removed sorting from comments too
        populate: {
          path: 'user',
          select: 'username name role'
        }
      });
    
    // Note: Posts might appear in random order until Azure indexing is fully ready,
    // but the 500 error will be gone.
    res.json(posts);
  } catch (error) {
    console.error("Public feed error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Authenticated Feed (For consistency, removed sort here too temporarily)
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('creator', 'username name')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username name role'
        }
      });
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Single Post
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('creator', 'username name')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username name role'
        }
      });
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create Post
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'creator') {
      return res.status(403).json({ message: 'Only creator can create posts' });
    }

    const { title, caption, location, people } = req.body;

    // Media is optional
    let imageUrl = null;
    let mediaType = null;
    
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
      mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    }

    if (!caption && !imageUrl) {
      return res.status(400).json({ message: 'Either caption or media file is required' });
    }

    const postData = {
      creator: req.user._id,
      imageUrl: imageUrl || '',
      mediaType: mediaType || '',
      title: title || '',
      caption: caption || '',
      location: location || '',
      people: people || '',
    };

    const post = await Post.create(postData);

    const populatedPost = await Post.findById(post._id)
      .populate('creator', 'username name')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username name role'
        }
      });

    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Post
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'creator') {
      return res.status(403).json({ message: 'Only creator can delete posts' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (post.imageUrl) {
      const filePath = path.join(__dirname, '..', post.imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Comment.deleteMany({ post: post._id });
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;