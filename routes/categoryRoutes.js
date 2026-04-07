const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// GET all active categories globally (For Apps to build their layouts)
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).sort({ name: 1 });
        res.json({ success: true, categories });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
