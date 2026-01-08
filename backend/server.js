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

// MongoDB connection check middleware
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      message: 'Database not connected. Please wait a moment and try again.' 
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
        role: 'creator'
      });
      console.log('✅ Default creator account created:');
      console.log('   Email: creator@igram.com');
      console.log('   Password: creator123');
      console.log('   Name: Omer');
    }
  } catch (error) {
    console.error('Error initializing creator:', error.message);
  }
}

// Connect to MongoDB and start server
async function startServer() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/igram';
  const PORT = process.env.PORT || 5000;

  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
    });
    
    console.log('✅ Connected to MongoDB successfully!');
    
    // Create default creator account if it doesn't exist
    await initializeCreator();
    
    // Start server only after MongoDB is connected
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
    });
    
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('\n💡 Please check:');
    console.error('   1. Is MongoDB running? (if using local MongoDB)');
    console.error('   2. Is your MONGODB_URI correct in .env file?');
    console.error('   3. See MONGODB_SETUP.md for setup instructions\n');
    console.error('   Current MONGODB_URI:', mongoURI.replace(/\/\/.*@/, '//***:***@'));
    process.exit(1);
  }
}

// Start the application
startServer();
