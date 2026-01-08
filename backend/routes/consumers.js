const express = require('express');
const router = express.Router();
const Consumer = require('../models/Consumer');

// Register consumer with just a name
router.post('/register', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Validate name - only letters and spaces
    const namePattern = /^[a-zA-Z\s]+$/;
    if (!namePattern.test(name.trim())) {
      return res.status(400).json({ message: 'Name can only contain letters and spaces' });
    }

    const trimmedName = name.trim();

    // Check if exact same name exists (case-sensitive)
    const exactMatch = await Consumer.findOne({ name: trimmedName });
    if (exactMatch) {
      // Same consumer signing in again - return success
      return res.status(200).json({
        message: 'Welcome back!',
        consumerId: exactMatch._id,
        name: exactMatch.name
      });
    }

    // Check if name exists with different case (case-insensitive)
    const caseInsensitiveMatch = await Consumer.findOne({ 
      name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    if (caseInsensitiveMatch) {
      return res.status(400).json({ 
        message: 'Name must be unique and its case sensitive. A similar name already exists.' 
      });
    }

    // Create new consumer
    const consumer = await Consumer.create({ name: trimmedName });

    res.status(201).json({
      message: 'Consumer registered successfully',
      consumerId: consumer._id,
      name: consumer.name
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ message: 'This name is already taken. Please choose another name.' });
    }
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
