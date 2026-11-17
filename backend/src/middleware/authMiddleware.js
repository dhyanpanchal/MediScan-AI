const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { connectDB } = require('../config/db');
const { isAdminEmail } = require('../utils/adminList');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const secret = process.env.JWT_SECRET;

      if (!secret) {
        throw new Error('JWT_SECRET is not configured.');
      }

      const decoded = jwt.verify(token, secret);

      // Ensure database connection is active before querying
      if (mongoose.connection.readyState !== 1) {
        try {
          await connectDB();
        } catch (_) {
          // Allow lookup attempt even if connectDB threw an auto-retry warning
        }
      }

      // Query user with 5-second timeout to prevent request hanging on slow connections
      const lookup = User.findById(decoded.id).select('-password');
      let timer;
      const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('User database lookup timeout')), 5000); });
      try { req.user = await Promise.race([lookup, timeout]); } finally { clearTimeout(timer); }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authorized, user not found'
        });
      }

      if (isAdminEmail(req.user.email)) {
        req.user.isAdmin = true;
        User.updateOne({ _id: req.user._id, isAdmin: { $ne: true } }, { $set: { isAdmin: true } }).catch(() => {});
      }

      return next();
    } catch (error) {
      console.error('JWT Token Verification Error:', error.message);
      return res.status(error.message.includes('timeout') || error.name?.startsWith('Mongo') ? 503 : 401).json({
        success: false,
        error: error.message.includes('timeout') 
          ? 'Authentication timeout, please retry' 
          : 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized, no token provided'
    });
  }
};

const optionalProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const secret = process.env.JWT_SECRET;

      if (secret && token) {
        const decoded = jwt.verify(token, secret);
        // Timeout lookup after 2 seconds to avoid blocking on MongoDB lags
        const lookup = User.findById(decoded.id).select('-password');
        let timer;
        const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('User lookup timeout')), 2000); });
        try { req.user = await Promise.race([lookup, timeout]); } catch { req.user = null; } finally { clearTimeout(timer); }
      }
    } catch (_) {
      req.user = null;
    }
  }

  return next();
};

module.exports = { protect, optionalProtect };
