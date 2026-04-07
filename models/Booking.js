const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  serviceType: { type: String, required: true },
  
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'on_the_way', 'in_progress', 'pending_completion', 'completed', 'cancelled'],
    default: 'pending' 
  },
  
  price: { type: Number, default: 0 },
  selectedPlanName: { type: String, enum: ['starter', 'premium', 'enterprise'], default: 'starter' },
  commissionRate: { type: Number, default: 15 },
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String }
  },
  
  scheduledAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
