const mongoose = require('mongoose');

const consumerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  }
}, {
  timestamps: true
});

// Ensure unique index on name (case-sensitive)
consumerSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

module.exports = mongoose.model('Consumer', consumerSchema);
