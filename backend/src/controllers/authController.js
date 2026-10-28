const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/mailer');
const { connectDB } = require('../config/db');

// Ensure database connection helper
const ensureConnected = async () => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (e) {
      if (mongoose.connection.readyState !== 1) {
        throw new Error('Database service is currently establishing connection. Please try again in a few moments.');
      }
    }
  }
};

// Generate JWT Helper
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'mediscan_jwt_fallback_secret_key',
    { expiresIn: '30d' }
  );
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  try {
    await ensureConnected();
    const { name, email, password, phone, dateOfBirth, gender } = req.body;

    // Check if user exists (Mongoose syntax)
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists with this email' });
    }

    // Create user (Mongoose syntax)
    const user = await User.create({
      name,
      email,
      password,
      phone,
      dateOfBirth,
      gender
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          token: generateToken(user.id)
        }
      });
    } else {
      res.status(400).json({ success: false, error: 'Invalid user data provided' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server error during registration' });
  }
};

/**
 * @desc    Auth user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    await ensureConnected();
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      // Generate a 6-digit random verification code
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity
      await user.save();

      // Trigger email send (runs asynchronously to avoid blocking the API response)
      sendOTPEmail(user.email, otp).catch(err => {
        console.error('Failed to send OTP email inside login handler:', err);
      });

      res.json({
        success: true,
        otpRequired: true,
        email: user.email
      });
    } else {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server error during login' });
  }
};

/**
 * @desc    Verify OTP code and complete login
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOTP = async (req, res) => {
  try {
    await ensureConnected();
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP code are required fields' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Verify OTP code match and expiration
    if (!user.otp || user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP code' });
    }

    // Clear OTP fields upon successful verification
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // Complete authentication and return JWT token
    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        token: generateToken(user.id)
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ success: false, error: 'Server error during OTP verification' });
  }
};

/**
 * @desc    Simulated Google OAuth login/callback
 * @route   POST /api/auth/google-oauth
 * @access  Public
 */
const googleOAuthLogin = async (req, res) => {
  try {
    await ensureConnected();
    const { oauthToken, email, name } = req.body;

    const userEmail = email || 'google.user@gmail.com';
    const userName = name || 'Google Clinical User';
    const oauthId = oauthToken || 'google_mock_id_998877';

    // Find or create user (Mongoose syntax)
    let user = await User.findOne({ email: userEmail });
    
    if (!user) {
      user = await User.create({
        name: userName,
        email: userEmail,
        oauthProvider: 'google',
        oauthId: oauthId,
        password: null // OAuth users do not need a password
      });
    } else if (!user.oauthProvider) {
      // Link existing user if logging in via OAuth for the first time
      user.oauthProvider = 'google';
      user.oauthId = oauthId;
      await user.save();
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        token: generateToken(user.id)
      }
    });
  } catch (error) {
    console.error('Google OAuth error:', error.message || error);
    res.status(500).json({ success: false, error: error.message || 'Server error during Google OAuth authentication' });
  }
};

/**
 * @desc    Forgot password request
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  try {
    await ensureConnected();
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: 'No user registered with this email address' });
    }

    res.json({
      success: true,
      message: 'A simulated password reset instructions email has been sent to ' + email
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: 'Server error during forgot password' });
  }
};

const getGoogleConfig = (req, res) => {
  res.json({
    success: true,
    clientId: process.env.GOOGLE_CLIENT_ID || ''
  });
};

module.exports = {
  registerUser,
  loginUser,
  verifyOTP,
  googleOAuthLogin,
  forgotPassword,
  getGoogleConfig
};
