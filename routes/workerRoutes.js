const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { protect } = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');

// Step 1: Initialize Worker Profile (Explicit Registration or Login)
router.post('/init', async (req, res) => {
  try {
    const { name, phone, mode, pushToken } = req.body; // mode is 'login' or 'register'
    
    let worker = await Worker.findOne({ phone });
    let isNew = false;
    
    if (mode === 'login') {
       if (!worker) return res.status(404).json({ success: false, error: 'Mobile number not found. Please apply for a new account.' });
       if (worker.status === 'suspended') return res.status(403).json({ success: false, error: 'Your account has been suspended by the administrator.' });
       if (worker.status === 'rejected') return res.status(403).json({ success: false, error: 'Your application was rejected by the platform administrators.' });
    } else {
       // Registration Mode
       if (worker) return res.status(400).json({ success: false, error: 'Account already exists. Please switch to Login mode.' });
       
       if (!name) return res.status(400).json({ success: false, error: 'Name is required for new registration.' });
       worker = new Worker({ name, phone, pushToken });
       await worker.save();
       isNew = true;
    }
    
    // Update push token even on login
    if (pushToken && worker.pushToken !== pushToken) {
       worker.pushToken = pushToken;
       await worker.save();
    }
    
    // Generate secure token
    const token = jwt.sign({ id: worker._id }, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '7d' });
    
    res.status(200).json({ success: true, workerId: worker._id, token, status: worker.status, isNew, message: 'Worker Authenticated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Step 2: Document Verification (NIC Upload)
router.post('/:id/documents', protect, async (req, res) => {
  try {
    const { nicNumber } = req.body;
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    
    // Note: The schema automatically encrypts nicNumber using the custom set() hook!
    worker.nicNumber = nicNumber;
    worker.isDocumentScreened = true;
    await worker.save();
    
    res.json({ success: true, message: 'Documents Extracted and Encrypted securely' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Step 3: Bank Details
router.post('/:id/bank', protect, async (req, res) => {
  try {
    const { bankAccountNumber, bankName, branchName } = req.body;
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    worker.bankAccountNumber = bankAccountNumber;     // Backwards compat loop
    worker.bankDetails = {
      accountNumber: bankAccountNumber,
      bankName: bankName,
      branchName: branchName
    };
    await worker.save();
    
    res.json({ success: true, message: 'Bank details encrypted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Step 4: Training Evaluation Passed
router.post('/:id/training-pass', protect, async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    worker.isEthicsTrainingPassed = true;
    await worker.save();
    res.json({ success: true, message: 'Ethics Training Passed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Final Step: Submit verification for admin
router.post('/:id/submit', protect, async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker.isDocumentScreened || !worker.isEthicsTrainingPassed) {
       return res.status(400).json({ error: 'Worker has not completed the linear onboarding steps' });
    }
    worker.status = 'pending'; // Triggers Admin Dashboard
    await worker.save();
    res.json({ success: true, message: 'Application submitted securely for manual Admin Verification' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET Worker Profile & Live Status
router.get('/me', protect, async (req, res) => {
  try {
     const worker = await Worker.findById(req.user.id).select('-__v');
     if (!worker) return res.status(404).json({ error: 'Worker unverified.' });
     res.json({ success: true, worker });
  } catch (e) {
     res.status(500).json({ error: e.message });
  }
});

// Secure Phone Number Update Gateway
router.put('/me/phone', protect, async (req, res) => {
  try {
     const { newPhone } = req.body;
     const existingPhone = await Worker.findOne({ phone: newPhone });
     
     if (existingPhone && existingPhone._id.toString() !== req.user.id) {
         return res.status(400).json({ error: 'Phone number already registered to another professional.' });
     }
     
     const worker = await Worker.findById(req.user.id);
     worker.phone = newPhone;
     await worker.save();
     
     res.json({ success: true, message: 'Contact details securely updated.' });
  } catch (e) {
     res.status(500).json({ error: e.message });
  }
});

// Secure Configuration Updates: Connect Worker to a specific Global Job Category
router.put('/me/category', protect, async (req, res) => {
    try {
        const { serviceCategory } = req.body;
        
        const worker = await Worker.findById(req.user.id);
        worker.serviceCategory = serviceCategory;
        await worker.save();
        
        res.json({ success: true, message: 'Service Category Portfolio successfully updated on mainframe!' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Secure Avatar/Profile Picture Upload Gateway (Base64 representation)
router.put('/me/avatar', protect, async (req, res) => {
  try {
     const { base64Image } = req.body;
     if (!base64Image) return res.status(400).json({ error: 'No image payload provided' });
     
     const worker = await Worker.findById(req.user.id);
     worker.profilePic = base64Image;
     await worker.save();
     
     res.json({ success: true, message: 'Profile Picture securely synchronized' });
  } catch (e) {
     res.status(500).json({ error: e.message });
  }
});

// Step 5.5: Update Online/Offline Status
router.put('/me/online', protect, async (req, res) => {
  try {
     const { isOnline } = req.body;
     const worker = await Worker.findById(req.user.id);
     if (!worker) return res.status(404).json({ error: 'Worker profile missing.' });

     worker.isOnline = isOnline;
     await worker.save();
     res.json({ success: true, message: `Worker is now ${isOnline ? 'Online' : 'Offline'}` });
  } catch (e) {
     res.status(500).json({ error: e.message });
  }
});

// Step 6: Update Live GPS Location (Background Ping)
router.put('/me/location', protect, async (req, res) => {
   try {
      const { latitude, longitude } = req.body;
      const worker = await Worker.findById(req.user.id);
      if (!worker) return res.status(404).json({ error: 'Worker profile missing.' });

      worker.currentLocation = {
         latitude,
         longitude,
         lastUpdated: new Date()
      };
      await worker.save();
      res.json({ success: true, message: 'Location synchronized!' });
   } catch (e) {
      res.status(500).json({ error: e.message });
   }
});

// Step 7: Check for Incoming Job Requests (Polling Fallback)
router.get('/me/bookings/pending', protect, async (req, res) => {
   try {
      const Booking = require('../models/Booking');
      const booking = await Booking.findOne({ worker: req.user.id, status: 'pending' }).populate('customer');
      if (booking) {
         res.json({ 
            success: true, 
            booking: {
               id: booking._id,
               customerName: booking.customer.name,
               service: booking.serviceType,
               distance: '1.2 km', // Simulated distance for demo
               address: booking.location.address || 'Colombo Area',
               numericFee: 3500,
               fee: 'Rs. 3,500'
            }
         });
      } else {
         res.json({ success: false });
      }
   } catch (e) {
      res.status(500).json({ error: e.message });
   }
});

// Financials Engine...
router.post('/me/transact', protect, async (req, res) => {
  try {
     const { customerName, serviceType, grossFee } = req.body;
     
     // Dynamic Commission Engine - Read platform configuration from DB!
     let adminCommissionRate = 15; // Default Base Platform Cut
     
     const platformCategory = await Category.findOne({ name: serviceType });
     if (platformCategory && platformCategory.commissionRate) {
         adminCommissionRate = platformCategory.commissionRate;
     }

     const adminCommissionCut = parseFloat((grossFee * (adminCommissionRate / 100)).toFixed(2));
     const workerNetPayout = parseFloat((grossFee - adminCommissionCut).toFixed(2));

     const transaction = new Transaction({
        workerId: req.user.id,
        customerName,
        serviceType,
        grossFee,
        adminCommissionRate,
        adminCommissionCut,
        workerNetPayout
     });

     await transaction.save();     
     res.json({ success: true, transaction });
  } catch (e) {
     res.status(500).json({ error: e.message });
  }
});

// Financials Engine: Aggregate specific Worker Earnings
router.get('/me/reports', protect, async (req, res) => {
  try {
     const transactions = await Transaction.find({ workerId: req.user.id }).sort({ createdAt: -1 });

     let totalGross = 0;
     let totalNet = 0;
     let adminCutTotal = 0;
     
     transactions.forEach(t => {
         totalGross += t.grossFee;
         totalNet += t.workerNetPayout;
         adminCutTotal += t.adminCommissionCut;
     });

     res.json({
        success: true,
        summary: {
           totalJobs: transactions.length,
           totalGross,
           totalNet,
           adminCutTotal
        },
        transactions
     });
     
  } catch (e) {
     res.status(500).json({ error: e.message });
  }
});

module.exports = router;
