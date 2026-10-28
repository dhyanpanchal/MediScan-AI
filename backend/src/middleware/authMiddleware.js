const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { connectDB } = require('../config/db');

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
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('User database lookup timeout')), 5000)
      );
      req.user = await Promise.race([lookup, timeout]);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authorized, user not found'
        });
      }

      return next();
    } catch (error) {
      console.error('JWT Token Verification Error:', error.message);
      return res.status(401).json({
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
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('User lookup timeout')), 2000));
        req.user = await Promise.race([lookup, timeout]).catch(() => null);
      }
    } catch (_) {
      req.user = null;
    }
  }

  return next();
};

module.exports = { protect, optionalProtect };
