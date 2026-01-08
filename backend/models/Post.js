const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', ''],
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  caption: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  people: {
    type: String,
    default: ''
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  consumerLikes: [{
    consumerName: {
      type: String,
      required: true
    }
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Post', postSchema);
