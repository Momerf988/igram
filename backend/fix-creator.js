// Quick script to fix/reset creator account
// Run: node fix-creator.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

async function fixCreator() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/igram';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Delete any existing creator accounts
    const deleted = await User.deleteMany({ role: 'creator' });
    console.log(`Deleted ${deleted.deletedCount} existing creator account(s)`);

    // Create new creator account with correct password
    const hashedPassword = await bcrypt.hash('creator123', 10);
    const creator = await User.create({
      username: 'creator',
      name: 'Omer',
      email: 'creator@igram.com',
      password: hashedPassword,
      role: 'creator'
    });
    
    console.log('✅ Creator account created successfully!');
    console.log('   Email: creator@igram.com');
    console.log('   Password: creator123');
    console.log('   Name: Omer');

    // Verify password works
    const testUser = await User.findOne({ email: 'creator@igram.com' });
    const passwordMatch = await testUser.comparePassword('creator123');
    console.log('✅ Password verification:', passwordMatch ? 'PASSED ✓' : 'FAILED ✗');

    await mongoose.disconnect();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixCreator();
