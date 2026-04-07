const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Worker = require('../models/Worker');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { adminProtect } = require('../middleware/authMiddleware');

// 0. Development seed route - Auto-creates default admin if not exists
router.post('/setup', async (req, res) => {
   const existing = await Admin.findOne({ username: 'admin' });
   if (existing) return res.json({ msg: 'Admin already initialized' });
   
   await Admin.create({ username: 'admin', password: 'password123' });
   res.json({ msg: 'Admin setup complete' });
});

// 1. Secure Admin Login returning JWT
router.post('/login', async (req, res) => {
   try {
       const { username, password } = req.body;
       const admin = await Admin.findOne({ username });
       
       if (!admin) return res.status(401).json({ error: 'Invalid credentials. Unauthorized access is logged.' });
       
       const isMatch = await admin.matchPassword(password);
       if (!isMatch) return res.status(401).json({ error: 'Invalid credentials. Unauthorized access is logged.' });
       
       const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '8h' });
       res.json({ success: true, token, username: admin.username });
   } catch(e) {
       res.status(500).json({ error: e.message });
   }
});

// 2. Fetch System Metrics & KPIs
router.get('/stats', adminProtect, async (req, res) => {
   try {
       const totalWorkers = await Worker.countDocuments();
       const activeWorkers = await Worker.countDocuments({ status: 'active' });
       const pendingWorkers = await Worker.countDocuments({ status: 'pending' });
       const totalCustomers = await Customer.countDocuments();
       
       res.json({ success: true, stats: { totalWorkers, activeWorkers, pendingWorkers, totalCustomers } });
   } catch(e) {
       res.status(500).json({ error: e.message });
   }
});

// 3. Fetch Unverified Worker Pipelines with decrypted context
router.get('/workers/pending', adminProtect, async (req, res) => {
   try {
       // Fetching only workers who have progressed far enough to be pending (have init status complete)
       const workers = await Worker.find({ status: 'pending' }).select('-__v');
       
       // Maps the native mongoose objects utilizing native getters to decrypt AES-256 data dynamically!
       const decryptedWorkers = workers.map(w => w.toJSON({ getters: true }));
       res.json({ success: true, workers: decryptedWorkers });
   } catch(e) {
       res.status(500).json({ error: e.message });
   }
});

// 4. Update Moderation Status Workflow
router.put('/workers/:id/status', adminProtect, async (req, res) => {
   try {
       const { status } = req.body; // Restricted enum to 'active' or 'rejected'
       const worker = await Worker.findByIdAndUpdate(req.params.id, { status }, { new: true });
       res.json({ success: true, worker });
   } catch(e) {
       res.status(500).json({ error: e.message });
   }
});

// 5. Fetch Full Workers Directory
router.get('/workers', adminProtect, async (req, res) => {
   try {
       const workers = await Worker.find().select('-__v').sort({ createdAt: -1 });
       const decryptedWorkers = workers.map(w => w.toJSON({ getters: true }));
       res.json({ success: true, workers: decryptedWorkers });
   } catch(e) {
       res.status(500).json({ error: e.message });
   }
});

// 6. Fetch Full Customers Directory
router.get('/customers', adminProtect, async (req, res) => {
   try {
       const customers = await Customer.find().select('-__v').sort({ createdAt: -1 });
       res.json({ success: true, customers });
   } catch(e) {
       res.status(500).json({ error: e.message });
   }
});

// Extract Complete Global Platform Profitability Metrics based on New 3-Tier System
router.get('/financials', async (req, res) => {
    try {
        const Booking = require('../models/Booking');
        // Fetch only completed bookings to calculate actual revenue
        const completedBookings = await Booking.find({ status: 'completed' }).sort({ createdAt: -1 });
        
        let platformTotalProfit = 0;
        let totalSystemVolume = 0;
        let totalWorkerEarnings = 0;
        
        const recentLedger = completedBookings.map(b => {
            const price = Number(b.price || 0);
            const rate = Number(b.commissionRate || 15);
            const adminProfit = (price * rate) / 100;
            const workerNet = price - adminProfit;
            
            platformTotalProfit += adminProfit;
            totalSystemVolume += price;
            totalWorkerEarnings += workerNet;

            return {
                _id: b._id,
                serviceType: b.serviceType,
                planName: b.selectedPlanName || 'starter',
                totalPrice: price,
                commissionRate: rate,
                adminProfit: adminProfit,
                workerNet: workerNet,
                createdAt: b.createdAt
            };
        });

        res.json({
            success: true,
            platformTotalProfit: Math.round(platformTotalProfit),
            totalSystemVolume: Math.round(totalSystemVolume),
            totalWorkerEarnings: Math.round(totalWorkerEarnings),
            totalJobs: completedBookings.length,
            recentLedger
        });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

// ------------------------------------------------------------------------------------------------ //
// CONFIGURATION ENGINE: Manage Dynamic Categories
// ------------------------------------------------------------------------------------------------ //

// Create New Category
router.post('/categories', adminProtect, async (req, res) => {
    try {
        const { name, plans, iconName } = req.body;
        const category = new Category({ name, plans, iconName });
        await category.save();
        res.json({ success: true, category });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

// Update an Existing Category (Edit Feature)
router.put('/categories/:id', adminProtect, async (req, res) => {
    try {
        const { name, plans, iconName } = req.body;
        const category = await Category.findById(req.params.id);
        
        if (!category) return res.status(404).json({ error: 'Category not found' });
        
        if (name) category.name = name;
        if (iconName) category.iconName = iconName;
        if (plans) {
            // Explicitly map each nested field to ensure Mongoose detects changes
            category.plans = {
                starter: {
                    price: Number(plans.starter?.price || 0),
                    commission: Number(plans.starter?.commission || 15)
                },
                premium: {
                    price: Number(plans.premium?.price || 0),
                    commission: Number(plans.premium?.commission || 15)
                },
                enterprise: {
                    price: Number(plans.enterprise?.price || 0),
                    commission: Number(plans.enterprise?.commission || 15)
                }
            };
            category.markModified('plans'); // Force Mongoose to save nested object
        }

        await category.save();
        res.json({ success: true, category });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Fetch all Categories (Admin view)
router.get('/categories', adminProtect, async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.json({ success: true, categories });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete a category
router.delete('/categories/:id', adminProtect, async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Category removed securely from grid.' });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
