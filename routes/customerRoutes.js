const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Worker = require('../models/Worker');
const { protect } = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');

// In-memory OTP storage representing a quick cache (Use Redis/Memcached in Production)
const otpStore = new Map();

// 1. Request OTP via SMS Simulation
router.post('/send-otp', async (req, res) => {
  try {
    const { phone, action } = req.body;
    let customer = await Customer.findOne({ phone });
    
    if (action === 'login' && !customer) {
      return res.status(404).json({ success: false, error: 'Account not found. Please register first.' });
    }
    if (action === 'register' && customer) {
      return res.status(400).json({ success: false, error: 'Phone number already registered. Please login.' });
    }

    // Generate strict 4-digit numeric OTP code
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Save to cache bound to the phone number
    otpStore.set(phone, otp);

    // MOCK SMS LOG (In real app, trigger Twilio or DialogAxiata API here)
    console.log(`\n==============================================`);
    console.log(`💬 [MOCK SMS GATEWAY] To: ${phone}`);
    console.log(`   Workly Security Code: ${otp}`);
    console.log(`==============================================\n`);

    // For dev convenience, returning the code to auto-fill the frontend form natively
    res.status(200).json({ success: true, message: 'OTP Sent successfully', devOtp: otp });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Verify OTP and authenticate user
router.post('/verify-otp', async (req, res) => {
  try {
    const { name, phone, action, otp, pushToken } = req.body;
    
    const storedOtp = otpStore.get(phone);
    if (!storedOtp || storedOtp !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid or expired SMS code. Try again.' });
    }

    // Valid OTP received! Clean up the cache token to prevent replay attacks
    otpStore.delete(phone);

    // Find or Create the Customer
    let customer = await Customer.findOne({ phone });
    if (action === 'register') {
      if (!name) return res.status(400).json({ success: false, error: 'Name is strictly required to register.' });
      customer = new Customer({ name, phone, pushToken });
      await customer.save();
    }
    
    // Update push token even on login
    if (pushToken && customer.pushToken !== pushToken) {
       customer.pushToken = pushToken;
       await customer.save();
    }
    
    // Issue long-lived secure JWT session token
    const token = jwt.sign({ id: customer._id, role: 'customer' }, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '30d' });
    
    res.status(200).json({ success: true, customerId: customer._id, token, name: customer.name, message: 'Authentication verified!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Update Customer Profile
router.put('/update', async (req, res) => {
  try {
    const { originalPhone, name, phone } = req.body;
    let customer = await Customer.findOne({ phone: originalPhone });
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found.' });

    if (phone !== originalPhone) {
      const existing = await Customer.findOne({ phone });
      if (existing) return res.status(400).json({ success: false, error: 'New phone number is already registered.' });
    }

    customer.name = name;
    customer.phone = phone;
    await customer.save();

    res.status(200).json({ success: true, message: 'Profile updated successfully!', name: customer.name, phone: customer.phone });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. GET Customer Profile via JWT
router.get('/me', protect, async (req, res) => {
  try {
     const customer = await Customer.findById(req.user.id).select('-__v');
     if (!customer) return res.status(404).json({ error: 'Customer not found.' });
     res.json({ success: true, customer });
  } catch (e) {
     res.status(500).json({ error: e.message });
  }
});

// --- Customer Map Integration ---
// Fetches active professionals based on an optional service category query
router.get('/workers/active', async (req, res) => {
   try {
      const { category } = req.query;
      const query = { status: 'active', isOnline: true };
      if (category) {
         query.serviceCategory = new RegExp(category, 'i');
      }
      
      const workers = await Worker.find(query).select('name phone serviceCategory profilePic status currentLocation');
      
      const baseLat = 6.9271;
      const baseLng = 79.8612;
      
      const workersWithLocation = workers.map(w => {
         const json = w.toJSON();
         
         // Check if worker has provided a real-time GPS ping in the last 10 minutes
         const isRecent = w.currentLocation && w.currentLocation.lastUpdated && 
                          (new Date() - new Date(w.currentLocation.lastUpdated) < 10 * 60 * 1000);

         if (isRecent) {
            json.location = { 
               latitude: w.currentLocation.latitude, 
               longitude: w.currentLocation.longitude,
               isLive: true 
            };
         } else {
            // Seed them with dummy real-time locations centering Colombo for demo
            const lDiff = (Math.random() - 0.5) * 0.04;
            const dDiff = (Math.random() - 0.5) * 0.04;
            json.location = { 
               latitude: baseLat + lDiff, 
               longitude: baseLng + dDiff,
               isLive: false
            };
         }
         return json;
      });

      res.json({ success: true, workers: workersWithLocation });
   } catch(e) {
      res.status(500).json({ error: e.message });
   }
});

module.exports = router;
