const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// Multer configuration for file uploads
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
// FIXED ROUTE: Public Feed
// ==========================================
router.get('/public', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('creator', 'username name')
      .populate({
        path: 'comments',
        options: { sort: { createdAt: -1 } },
        // Deep populate: Populate the 'user' field INSIDE the comments
        populate: {
          path: 'user',
          select: 'username name role'
        }
      })
      .sort({ createdAt: -1 });
    
    res.json(posts);
  } catch (error) {
    console.error("Error in public feed:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get all posts (authenticated - for creator view)
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
      })
      .sort({ createdAt: -1 });
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single post
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

// Create post (only creator) - accepts image/video file upload
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'creator') {
      return res.status(403).json({ message: 'Only creator can create posts' });
    }

    const { title, caption, location, people } = req.body;

    // Media is optional - can create text-only posts
    let imageUrl = null;
    let mediaType = null;
    
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
      mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    }

    // At least caption or media must be provided
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

    // Ensure all fields are included in response
    const postResponse = {
      _id: populatedPost._id,
      creator: populatedPost.creator,
      imageUrl: populatedPost.imageUrl || '',
      mediaType: populatedPost.mediaType || '',
      title: populatedPost.title || '',
      caption: populatedPost.caption || '',
      location: populatedPost.location || '',
      people: populatedPost.people || '',
      likes: populatedPost.likes || [],
      comments: populatedPost.comments || [],
      createdAt: populatedPost.createdAt,
      updatedAt: populatedPost.updatedAt
    };
    
    res.status(201).json(postResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete post (only creator)
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

    // Delete the media file from disk
    if (post.imageUrl) {
      const filePath = path.join(__dirname, '..', post.imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete all comments associated with this post
    await Comment.deleteMany({ post: post._id });

    // Delete the post document from MongoDB
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;