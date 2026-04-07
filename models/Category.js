const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  plans: {
    starter: {
      price: { type: Number, default: 0 },
      commission: { type: Number, default: 15 }, // percentage
      description: { type: String, default: '' }
    },
    premium: {
      price: { type: Number, default: 0 },
      commission: { type: Number, default: 15 },
      description: { type: String, default: '' }
    },
    enterprise: {
      price: { type: Number, default: 0 },
      commission: { type: Number, default: 15 },
      description: { type: String, default: '' }
    }
  },
  iconName: { type: String, default: 'tool' },
  isActive: { type: Boolean, default: true }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Category', categorySchema);
