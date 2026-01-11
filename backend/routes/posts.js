const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// ==========================================
// AZURE BLOB STORAGE SETUP
// ==========================================
const AZURE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

let containerClient;
if (AZURE_CONNECTION_STRING) {
  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
    containerClient = blobServiceClient.getContainerClient('media');
  } catch (err) {
    console.error("Azure Blob Init Error:", err.message);
  }
} else {
  console.error("CRITICAL: AZURE_STORAGE_CONNECTION_STRING is missing.");
}

const upload = multer({
  storage: multer.memoryStorage(), 
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/')) {
      return cb(new Error('Only image and video files are allowed'), false);
    }
    cb(null, true);
  },
});

// ==========================================
// PUBLIC FEED (FIX: Sorts in JavaScript, not DB)
// ==========================================
router.get('/public', async (req, res) => {
  try {
    // 1. Get posts from DB (Unsorted to prevent crash)
    let posts = await Post.find()
      .populate('creator', 'username name')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username name role'
        }
      });
      // REMOVED .sort({ createdAt: -1 }) from DB query

    // 2. MANUALLY SORT in JavaScript (Newest First)
    // This runs on your server, bypassing the Azure Index error completely.
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(posts);
  } catch (error) {
    console.error("Public feed error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Authenticated Feed
router.get('/', auth, async (req, res) => {
  try {
    let posts = await Post.find()
      .populate('creator', 'username name')
      .populate({
        path: 'comments',
        populate: { path: 'user', select: 'username name role' }
      });
    
    // Manual Sort
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
        populate: { path: 'user', select: 'username name role' }
      });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    // Sort comments if they exist
    if (post.comments && post.comments.length > 0) {
      post.comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create Post (Uploads to Azure)
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'creator') return res.status(403).json({ message: 'Only creator' });

    if (!containerClient) {
      return res.status(500).json({ message: "Server Error: Azure Storage not configured" });
    }

    const { title, caption, location, people } = req.body;
    let imageUrl = null;
    let mediaType = null;

    if (req.file) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileExtension = path.extname(req.file.originalname);
      const blobName = `${uniqueSuffix}${fileExtension}`;
      
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
      await blockBlobClient.uploadData(req.file.buffer, {
        blobHTTPHeaders: { blobContentType: req.file.mimetype }
      });

      imageUrl = blockBlobClient.url;
      mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    }

    if (!caption && !imageUrl) return res.status(400).json({ message: 'Caption or media required' });

    const post = await Post.create({
      creator: req.user._id,
      imageUrl: imageUrl || '',
      mediaType: mediaType || '',
      title: title || '',
      caption: caption || '',
      location: location || '',
      people: people || '',
    });

    const populatedPost = await Post.findById(post._id).populate('creator', 'username name');
    res.status(201).json(populatedPost);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete Post
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'creator') return res.status(403);

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.creator.toString() !== req.user._id.toString()) return res.status(403);

    if (post.imageUrl && containerClient) {
      try {
        const urlParts = post.imageUrl.split('/');
        const blobName = urlParts[urlParts.length - 1]; 
        if (blobName) {
           const blockBlobClient = containerClient.getBlockBlobClient(blobName);
           await blockBlobClient.deleteIfExists();
        }
      } catch (err) {
        console.error("Blob delete error:", err.message);
      }
    }

    await Comment.deleteMany({ post: post._id });
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;