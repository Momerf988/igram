const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Ensure uploads directory exists (for storing uploaded images)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(uploadsDir));

/**
 * ✅ Simple routes so browser checks don't show "Cannot GET /" or "Cannot GET /api"
 * These do NOT require the database.
 */
app.get('/', (req, res) => {
  res.status(200).send('igram backend running ✅');
});

app.get('/api', (req, res) => {
  res.status(200).json({ ok: true, message: 'API running ✅' });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    ok: true,
    db: mongoose.connection.readyState === 1 ? 'connected' : 'not_connected',
  });
});

/**
 * MongoDB connection check middleware
 * - Keeps Azure happy by allowing the server to start immediately
 * - Returns 503 ONLY for routes that actually need the DB
 * - Does NOT block '/', '/api', '/health', or '/uploads'
 */
app.use((req, res, next) => {
  // Always allow these routes even if DB is down
  if (
    req.path === '/' ||
    req.path === '/api' ||
    req.path === '/health' ||
    req.path.startsWith('/uploads')
  ) {
    return next();
  }

  // For everything else (your real API endpoints), require DB
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Database not connected. Please wait a moment and try again.',
    });
  }

  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/likes', require('./routes/likes'));
app.use('/api/consumers', require('./routes/consumers'));

// Initialize creator account
async function initializeCreator() {
  const User = require('./models/User');
  const bcrypt = require('bcryptjs');

  try {
    const creatorExists = await User.findOne({ role: 'creator' });
    if (!creatorExists) {
      const hashedPassword = await bcrypt.hash('creator123', 10);
      await User.create({
        username: 'creator',
        name: 'Omer',
        email: 'creator@igram.com',
        password: hashedPassword,
        role: 'creator',
      });
      console.log('✅ Default creator account created:');
      console.log('   Email: creator@igram.com');
      console.log('   Password: creator123');
      console.log('   Name: Omer');
    }
  } catch (error) {
    console.error('Error initializing creator:', error.message);
    // Don't terminate process - initialization failures are non-critical
  }
}

// Connect to MongoDB asynchronously (non-blocking)
async function connectToMongoDB() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/igram';

  try {
    console.log('🔄 Connecting to MongoDB...');

    await mongoose.connect(mongoURI, {
      // Cosmos can be a bit slower sometimes; these help avoid flaky monitor timeouts
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });

    console.log('✅ Connected to MongoDB successfully!');

    // Create default creator account if it doesn't exist
    // Keep this non-fatal (it already is), so the app stays alive even if init fails.
    await initializeCreator();
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('\n💡 Please check:');
    console.error('   1. Is MongoDB running? (if using local MongoDB)');
    console.error('   2. Is your MONGODB_URI correct in .env file?');
    console.error('   3. See MONGODB_SETUP.md for setup instructions\n');
    console.error(
      '   Current MONGODB_URI:',
      mongoURI.replace(/\/\/.*@/, '//***:***@')
    );
    // Don't exit process - allow server to continue running
    // The middleware will return 503 for DB-dependent endpoints until connection is established
  }
}

/**
 * AZURE APP SERVICE REQUIREMENT:
 * Azure requires the HTTP server to start listening immediately on process.env.PORT.
 * If the server doesn't listen quickly, Azure terminates the container (503 ContainerTimeOut).
 * That's why we call app.listen() BEFORE waiting for DB connections or initialization.
 */
const PORT = process.env.PORT || 8080;

// Start the HTTP server immediately (Azure requirement)
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);

  // Connect to MongoDB after server is listening (non-blocking)
  connectToMongoDB().catch(() => {
    // connectToMongoDB already logs details; this avoids unhandled promise rejection warnings
    console.error('MongoDB connection attempt failed (will keep serving /health etc.)');
  });
});
