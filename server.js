require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const workerRoutes = require('./routes/workerRoutes');
const customerRoutes = require('./routes/customerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Initialize MongoDB Connection securely
connectDB();

// API Endpoints
app.use('/api/worker', workerRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/bookings', bookingRoutes);

// Healthcheck Route
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'WORKLY API Service is running with AES-256 field level encryption active.',
  });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Secure Mongoose Server running on port ${PORT}`);
});
