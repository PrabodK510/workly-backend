const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  profilePic: { type: String, default: null }, // Raw Base64 string for photo avatars
  serviceCategory: { type: String, default: 'General Labor' }, // Dynamic connection to Category.name
  
  // Encrypted Fields - PII
  nicNumber: { 
    type: String,
    set: encrypt, get: decrypt 
  },
  bankAccountNumber: { 
    type: String, 
    set: encrypt, get: decrypt 
  },
  bankDetails: {
    accountNumber: { type: String, set: encrypt, get: decrypt },
    bankName: { type: String, set: encrypt, get: decrypt },
    branchName: { type: String, set: encrypt, get: decrypt }
  },
  
  // Checkpoint Linear Flow Booleans (From Boss Architecture Request)
  isDocumentScreened: { type: Boolean, default: false },
  isEthicsTrainingPassed: { type: Boolean, default: false },
  
  // Activation Status
  adminVerified: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  status: { type: String, enum: ['incomplete', 'pending', 'active', 'suspended', 'rejected'], default: 'incomplete' },
  
  // Advanced Platform Features
  pushToken: { type: String, default: null },
  currentLocation: {
    latitude: { type: Number, default: 6.9271 }, // Colombo default
    longitude: { type: Number, default: 79.8612 },
    lastUpdated: { type: Date, default: Date.now }
  }
  
}, { 
  timestamps: true,
  toJSON: { getters: true }, // Ensure fields are decrypted when fetching responses
  toObject: { getters: true }
});

module.exports = mongoose.model('Worker', workerSchema);
