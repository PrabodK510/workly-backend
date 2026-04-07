const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  plans: {
    starter: {
      price: { type: Number, default: 0 },
      commission: { type: Number, default: 15 } // percentage
    },
    premium: {
      price: { type: Number, default: 0 },
      commission: { type: Number, default: 15 }
    },
    enterprise: {
      price: { type: Number, default: 0 },
      commission: { type: Number, default: 15 }
    }
  },
  iconName: { type: String, default: 'tool' },
  isActive: { type: Boolean, default: true }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Category', categorySchema);
