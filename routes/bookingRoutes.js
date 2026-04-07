const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Worker = require('../models/Worker');
const { protect } = require('../middleware/authMiddleware');
const { sendPushNotification } = require('../utils/notificationService');

// -------------------------------------------------------------------------
// 1. SPECIFIC COMPLETION HANDSHAKE (HEAVIEST PRIORITY)
// -------------------------------------------------------------------------

// GET Test Ping
router.get('/test-ping', (req, res) => {
  res.json({ success: true, message: 'Booking routes are LIVE and reachable!' });
});

// Worker Request Completion
router.put('/:id/request-completion', protect, async (req, res) => {
  const bookingId = req.params.id;
  try {
    console.log(`[BOOKING] HIT request-completion for ID: ${bookingId}`);
    
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        console.log(`[BOOKING] Invalid ObjectId format: ${bookingId}`);
        return res.status(400).json({ success: false, error: 'Invalid booking ID format.' });
    }

    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
       console.log(`[BOOKING] Booking NOT FOUND in DB for ID: ${bookingId}`);
       return res.status(404).json({ success: false, error: 'Booking not found.' });
    }

    booking.status = 'pending_completion';
    await booking.save();

    console.log(`[BOOKING] Success: ID ${bookingId} marked as pending_completion`);
    res.json({ success: true, message: 'Completion request sent to customer.' });
  } catch (error) {
    console.error(`[BOOKING] Critical Route Error for ID ${bookingId}:`, error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Customer Confirm Completion
router.put('/:id/confirm-completion', protect, async (req, res) => {
  const bookingId = req.params.id;
  try {
    console.log(`[BOOKING] HIT confirm-completion for ID: ${bookingId}`);
    const booking = await Booking.findById(bookingId);
    
    if (!booking) return res.status(404).json({ success: false, error: 'Booking missing.' });

    booking.status = 'completed';
    await booking.save();
    
    console.log(`[BOOKING] Success: ID ${bookingId} completed!`);
    res.json({ success: true, message: 'Job successfully finished and closed!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// -------------------------------------------------------------------------
// 2. STANDARD BOOKING LIFECYCLE
// -------------------------------------------------------------------------

// Create Booking
router.post('/create', protect, async (req, res) => {
  try {
    const { workerId, serviceType, latitude, longitude, address, price, selectedPlanName, commissionRate } = req.body;
    const booking = new Booking({
      customer: req.user.id,
      worker: workerId,
      serviceType,
      location: { latitude, longitude, address },
      status: 'pending',
      price: price || 0,
      selectedPlanName: selectedPlanName || 'starter',
      commissionRate: commissionRate || 15
    });
    await booking.save();
    res.status(201).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Respond (Accept/Decline)
router.put('/:id/respond', protect, async (req, res) => {
  const bookingId = req.params.id;
  try {
    const { status } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Not found' });
    
    booking.status = status;
    await booking.save();
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Polling
router.get('/:id', protect, async (req, res) => {
  const bookingId = req.params.id;
  try {
    const booking = await Booking.findById(bookingId).populate('worker', 'name phone profilePic');
    if (!booking) return res.status(404).json({ success: false });
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
