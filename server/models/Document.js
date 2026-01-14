const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalFilename: {
    type: String,
    required: true
  },
  stegoImagePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadTime: {
    type: Date,
    default: Date.now
  },
  expiryTime: {
    type: Date,
    required: true
  },
  isExpired: {
    type: Boolean,
    default: false
  },
  accessCount: {
    type: Number,
    default: 0
  },
  encryptionKey: {
    type: String,
    required: true
  },
  encryptionIv: {
    type: String,
    required: true
  }
});

// Virtual to check if document is expired
documentSchema.virtual('expired').get(function() {
  return new Date() > this.expiryTime;
});

// Update isExpired field before queries
documentSchema.pre(/^find/, function(next) {
  this.where({ expiryTime: { $gt: new Date() } });
  next();
});

module.exports = mongoose.model('Document', documentSchema);
