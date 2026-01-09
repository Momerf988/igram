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
// 1. Connect to Azure
const AZURE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
if (!AZURE_CONNECTION_STRING) {
  console.error("CRITICAL: AZURE_STORAGE_CONNECTION_STRING is missing in env variables.");
}

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
const containerName = 'media';
const containerClient = blobServiceClient.getContainerClient(containerName);

// 2. Configure Multer to use RAM (MemoryStorage)
// We do NOT save to disk anymore. We keep the file in memory to upload directly.
const upload = multer({
  storage: multer.memoryStorage(), 
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit to 10MB to prevent RAM overflow
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/')) {
      return cb(new Error('Only image and video files are allowed'), false);
    }
    cb(null, true);
  },
});

// ==========================================
// PUBLIC FEED (Sorted by Date)
// ==========================================
router.get('/public', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('creator', 'username name')
      .populate({
        path: 'comments',
        options: { sort: { createdAt: -1 } },
        populate: {
          path: 'user',
          select: 'username name role'
        }
      })
      .sort({ createdAt: -1 });
    
    res.json(posts);
  } catch (error) {
    console.error("Public feed error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Authenticated Feed
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('creator', 'username name')
      .populate({
        path: 'comments',
        options: { sort: { createdAt: -1 } },
        populate: { path: 'user', select: 'username name role' }
      })
      .sort({ createdAt: -1 });
    
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
        options: { sort: { createdAt: -1 } },
        populate: { path: 'user', select: 'username name role' }
      });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// CREATE POST (Uploads to Azure Blob)
// ==========================================
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'creator') {
      return res.status(403).json({ message: 'Only creator can create posts' });
    }

    const { title, caption, location, people } = req.body;
    let imageUrl = null;
    let mediaType = null;

    // 1. Handle File Upload to Azure
    if (req.file) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileExtension = path.extname(req.file.originalname);
      const blobName = `${uniqueSuffix}${fileExtension}`;
      
      // Get a reference to the blob
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
      // Upload buffer directly to Azure
      await blockBlobClient.uploadData(req.file.buffer, {
        blobHTTPHeaders: { blobContentType: req.file.mimetype }
      });

      // Save the PERMANENT Azure URL
      imageUrl = blockBlobClient.url;
      mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    }

    // 2. Validate
    if (!caption && !imageUrl) {
      return res.status(400).json({ message: 'Either caption or media file is required' });
    }

    // 3. Save to DB
    const post = await Post.create({
      creator: req.user._id,
      imageUrl: imageUrl || '', // This is now a full https://... URL
      mediaType: mediaType || '',
      title: title || '',
      caption: caption || '',
      location: location || '',
      people: people || '',
    });

    const populatedPost = await Post.findById(post._id)
      .populate('creator', 'username name');

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// DELETE POST (Deletes from Azure Blob)
// ==========================================
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'creator') return res.status(403).json({ message: 'Only creator can delete posts' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.creator.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

    // 1. Delete image from Azure Blob if it exists
    if (post.imageUrl) {
      try {
        // Extract the blob name from the full URL
        // URL format: https://<account>.blob.core.windows.net/media/<blobName>
        const urlParts = post.imageUrl.split('/');
        const blobName = urlParts[urlParts.length - 1]; // Get the last part

        if (blobName) {
           const blockBlobClient = containerClient.getBlockBlobClient(blobName);
           await blockBlobClient.deleteIfExists();
           console.log(`Deleted blob: ${blobName}`);
        }
      } catch (err) {
        console.error("Failed to delete blob from Azure:", err.message);
        // Continue deleting the post even if blob deletion fails
      }
    }

    // 2. Delete comments and post
    await Comment.deleteMany({ post: post._id });
    await Post.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;