const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  customerName: { type: String, required: true },
  serviceType: { type: String, required: true },
  
  grossFee: { type: Number, required: true }, // The total Rs. charged to the customer
  
  adminCommissionRate: { type: Number, required: true }, // The variable percentage applied (e.g. 15 for 15%)
  adminCommissionCut: { type: Number, required: true }, // Exact decimal amount seized by platform
  workerNetPayout: { type: Number, required: true }, // Exact worker earnings to clear to Bank
  
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Transaction', transactionSchema);
