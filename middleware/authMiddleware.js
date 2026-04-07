const jwt = require('jsonwebtoken');
require('dotenv').config();

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
      req.user = decoded; // Mount user payload to request
      next();
    } catch (error) {
      return res.status(401).json({ success: false, error: 'Not authorized, token failed' });
    }
  } else {
      return res.status(401).json({ success: false, error: 'Not authorized, no token' });
  }
};

// Strict Admin-Only Role Guard
const adminProtect = async (req, res, next) => {
  await protect(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ success: false, error: 'Forbidden: Requires System Administrator Privileges' });
    }
  });
};

module.exports = { protect, adminProtect };
