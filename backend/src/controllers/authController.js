const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendOTPEmail, sendPasswordResetEmail, verifySmtpConnection, maskEmail } = require('../utils/mailer');
const { connectDB } = require('../config/db');

// Cryptographically secure 6-digit OTP generator
const generateSecureOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// SHA-256 hash helper for secure OTP database storage
const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
};

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

// Generate JWT Helper with configurable 30-day default expiration
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
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

    console.log(`[Auth Diagnostic] Stage: Login Request Received | Target: ${maskEmail(email)}`);

    if (!email || !password) {
      console.warn(`[Auth Diagnostic] Stage: Login Rejected | Missing email or password`);
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      // Rate limiting: 30-second cooldown between OTP generation requests
      if (user.otpLastSent && (Date.now() - new Date(user.otpLastSent).getTime() < 30000)) {
        const waitSec = Math.ceil((30000 - (Date.now() - new Date(user.otpLastSent).getTime())) / 1000);
        console.warn(`[Auth Diagnostic] Stage: Login Rate-Limited | Target: ${maskEmail(user.email)} | Cooldown: ${waitSec}s remaining`);
        return res.status(429).json({
          success: false,
          error: `Please wait ${waitSec} seconds before requesting a new security code.`
        });
      }

      // Generate a secure 6-digit verification code
      const otp = generateSecureOTP();
      user.otp = hashOTP(otp);
      user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity
      user.otpPurpose = 'login';
      user.otpAttempts = 0;
      user.otpLastSent = new Date();
      await user.save();

      console.log(`[Auth Diagnostic] Stage: OTP Generated & SHA-256 Hashed | Target: ${maskEmail(user.email)} | Purpose: login | Validity: 5m`);
      console.log(`[Auth Diagnostic] Stage: Email Sending Attempted | Target: ${maskEmail(user.email)} via Nodemailer`);

      // Send email and AWAIT delivery confirmation from SMTP provider
      try {
        await sendOTPEmail(user.email, otp);
        console.log(`[Auth Diagnostic] Stage: Email Provider Accepted Message | Target: ${maskEmail(user.email)}`);
      } catch (mailErr) {
        // Invalidate OTP in database since delivery failed
        user.otp = null;
        user.otpExpires = null;
        user.otpAttempts = 0;
        user.otpPurpose = null;
        await user.save();

        console.error(`[Auth Diagnostic] Stage: Email Sending Failed | Target: ${maskEmail(user.email)} | Error: ${mailErr.message}`);
        return res.status(502).json({
          success: false,
          error: `Unable to deliver security code to ${user.email}. Please verify your email configuration.`
        });
      }

      res.json({
        success: true,
        otpRequired: true,
        email: user.email,
        message: `A security code has been sent to ${user.email}. Please check your inbox.`
      });
    } else {
      console.warn(`[Auth Diagnostic] Stage: Login Authentication Failed | Invalid credentials for: ${maskEmail(email)}`);
      res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('[Auth Diagnostic] Stage: Login Server Error |', error);
    res.status(500).json({ success: false, error: error.message || 'Server error during login' });
  }
};

/**
 * @desc    Resend OTP verification code
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
const resendOTP = async (req, res) => {
  try {
    await ensureConnected();
    const { email } = req.body;

    console.log(`[Auth Diagnostic] Stage: Resend OTP Request Received | Target: ${maskEmail(email)}`);

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required to resend security code.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.warn(`[Auth Diagnostic] Stage: Resend Rejected | User not found: ${maskEmail(email)}`);
      return res.status(404).json({ success: false, error: 'No account registered with this email address.' });
    }

    // Rate limiting: 60-second cooldown between resend requests
    if (user.otpLastSent && (Date.now() - new Date(user.otpLastSent).getTime() < 60000)) {
      const waitSec = Math.ceil((60000 - (Date.now() - new Date(user.otpLastSent).getTime())) / 1000);
      console.warn(`[Auth Diagnostic] Stage: Resend Rate-Limited | Target: ${maskEmail(user.email)} | Cooldown: ${waitSec}s remaining`);
      return res.status(429).json({
        success: false,
        error: `Please wait ${waitSec} seconds before requesting a new security code.`
      });
    }

    // Invalidate previous OTP before generating new one
    user.otp = null;
    user.otpExpires = null;
    user.otpAttempts = 0;

    // Generate new cryptographically secure 6-digit OTP
    const otp = generateSecureOTP();
    user.otp = hashOTP(otp);
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity
    user.otpPurpose = 'login';
    user.otpAttempts = 0;
    user.otpLastSent = new Date();
    await user.save();

    console.log(`[Auth Diagnostic] Stage: New OTP Generated | Target: ${maskEmail(user.email)} | Validity: 5m`);
    console.log(`[Auth Diagnostic] Stage: Resend Email Sending Attempted | Target: ${maskEmail(user.email)}`);

    // Send email and AWAIT delivery confirmation
    try {
      await sendOTPEmail(user.email, otp);
      console.log(`[Auth Diagnostic] Stage: Resend Email Provider Accepted Message | Target: ${maskEmail(user.email)}`);
    } catch (mailErr) {
      user.otp = null;
      user.otpExpires = null;
      user.otpAttempts = 0;
      user.otpPurpose = null;
      await user.save();

      console.error(`[Auth Diagnostic] Stage: Resend Email Failed | Target: ${maskEmail(user.email)} | Error: ${mailErr.message}`);
      return res.status(502).json({
        success: false,
        error: `Unable to deliver security code to ${user.email}. Please verify your email configuration.`
      });
    }

    res.json({
      success: true,
      message: `A new security code has been sent to ${user.email}. Please check your inbox.`
    });
  } catch (error) {
    console.error('[Auth Diagnostic] Stage: Resend Server Error |', error);
    res.status(500).json({ success: false, error: error.message || 'Server error during OTP resend' });
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

    console.log(`[Auth Diagnostic] Stage: OTP Verification Request Received | Target: ${maskEmail(email)}`);

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and 6-digit OTP code are required fields' });
    }

    const cleanOtp = String(otp).trim();
    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      console.warn(`[Auth Diagnostic] Stage: OTP Verification Failed | Format error (not 6 digits) for: ${maskEmail(email)}`);
      return res.status(400).json({ success: false, error: 'Security code must be exactly 6 digits.' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      console.warn(`[Auth Diagnostic] Stage: OTP Verification Failed | User not found: ${maskEmail(email)}`);
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check if an OTP was issued
    if (!user.otp || !user.otpExpires) {
      console.warn(`[Auth Diagnostic] Stage: OTP Verification Failed | No active OTP for: ${maskEmail(email)}`);
      return res.status(400).json({ success: false, error: 'No active security code found. Please request a new one.' });
    }

    // Check expiration
    if (new Date() > new Date(user.otpExpires)) {
      user.otp = null;
      user.otpExpires = null;
      user.otpAttempts = 0;
      user.otpPurpose = null;
      await user.save();
      console.warn(`[Auth Diagnostic] Stage: OTP Verification Failed | Code expired for: ${maskEmail(email)}`);
      return res.status(400).json({ success: false, error: 'Security code has expired. Please request a new code.' });
    }

    // Anti-brute force check: Maximum 5 attempts
    if ((user.otpAttempts || 0) >= 5) {
      user.otp = null;
      user.otpExpires = null;
      user.otpAttempts = 0;
      user.otpPurpose = null;
      await user.save();
      console.warn(`[Auth Diagnostic] Stage: OTP Verification Failed | Brute force limit reached for: ${maskEmail(email)}`);
      return res.status(400).json({
        success: false,
        error: 'Too many incorrect attempts. For security, this code has been invalidated. Please request a new code.'
      });
    }

    // Check purpose
    if (user.otpPurpose && user.otpPurpose !== 'login') {
      console.warn(`[Auth Diagnostic] Stage: OTP Verification Failed | Purpose mismatch: ${user.otpPurpose} for: ${maskEmail(email)}`);
      return res.status(400).json({ success: false, error: 'Invalid verification purpose.' });
    }

    // Compare SHA-256 hash
    const enteredHash = hashOTP(cleanOtp);
    if (enteredHash !== user.otp) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      const remaining = 5 - user.otpAttempts;
      if (remaining <= 0) {
        user.otp = null;
        user.otpExpires = null;
        user.otpAttempts = 0;
        user.otpPurpose = null;
      }
      await user.save();

      console.warn(`[Auth Diagnostic] Stage: OTP Verification Failed | Hash mismatch for: ${maskEmail(email)} | Remaining attempts: ${remaining}`);
      return res.status(400).json({
        success: false,
        error: remaining > 0
          ? `Incorrect security code. ${remaining} attempt(s) remaining.`
          : 'Too many incorrect attempts. This security code has been invalidated. Please request a new code.'
      });
    }

    // Invalidate OTP immediately upon successful verification to prevent reuse
    user.otp = null;
    user.otpExpires = null;
    user.otpAttempts = 0;
    user.otpPurpose = null;
    await user.save();

    console.log(`[Auth Diagnostic] Stage: OTP Verification Success | Target: ${maskEmail(user.email)} | Code invalidated & JWT token generated`);

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
    console.error('[Auth Diagnostic] Stage: OTP Verification Server Error |', error);
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

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: 'No user registered with this email address' });
    }

    // Rate limiting: 60-second cooldown
    if (user.otpLastSent && (Date.now() - new Date(user.otpLastSent).getTime() < 60000)) {
      const waitSec = Math.ceil((60000 - (Date.now() - new Date(user.otpLastSent).getTime())) / 1000);
      return res.status(429).json({
        success: false,
        error: `Please wait ${waitSec} seconds before requesting another recovery code.`
      });
    }

    // Generate secure recovery code
    const resetCode = generateSecureOTP();
    user.otp = hashOTP(resetCode);
    user.otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity
    user.otpPurpose = 'password_reset';
    user.otpAttempts = 0;
    user.otpLastSent = new Date();
    await user.save();

    // Await delivery from SMTP provider
    try {
      await sendPasswordResetEmail(user.email, resetCode);
    } catch (mailErr) {
      user.otp = null;
      user.otpExpires = null;
      user.otpAttempts = 0;
      user.otpPurpose = null;
      await user.save();

      console.error(`[Auth] Password reset delivery failed for ${maskEmail(user.email)}:`, mailErr.message);
      return res.status(502).json({
        success: false,
        error: `Unable to send recovery email to ${user.email}. Please verify email service configuration.`
      });
    }

    res.json({
      success: true,
      message: `Password recovery instructions have been sent to ${user.email}. Please check your inbox.`
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server error during forgot password' });
  }
};

/**
 * @desc    Reset password using 6-digit recovery OTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    await ensureConnected();
    const { email, otp, newPassword } = req.body;

    console.log(`[Auth Diagnostic] Stage: Reset Password Request Received | Target: ${maskEmail(email)}`);

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, error: 'Email, 6-digit recovery code, and new password are required.' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    const cleanOtp = String(otp).trim();
    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({ success: false, error: 'Recovery code must be exactly 6 digits.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({ success: false, error: 'No active recovery code found. Please request a new one.' });
    }

    // Check expiration
    if (new Date() > new Date(user.otpExpires)) {
      user.otp = null;
      user.otpExpires = null;
      user.otpAttempts = 0;
      user.otpPurpose = null;
      await user.save();
      return res.status(400).json({ success: false, error: 'Recovery code has expired. Please request a new code.' });
    }

    // Anti-brute force check: Maximum 5 attempts
    if ((user.otpAttempts || 0) >= 5) {
      user.otp = null;
      user.otpExpires = null;
      user.otpAttempts = 0;
      user.otpPurpose = null;
      await user.save();
      return res.status(400).json({
        success: false,
        error: 'Too many incorrect attempts. This recovery code has been invalidated. Please request a new code.'
      });
    }

    // Verify purpose
    if (user.otpPurpose && user.otpPurpose !== 'password_reset') {
      return res.status(400).json({ success: false, error: 'Invalid verification purpose for password recovery.' });
    }

    // Verify hash
    const enteredHash = hashOTP(cleanOtp);
    if (enteredHash !== user.otp) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      const remaining = 5 - user.otpAttempts;
      if (remaining <= 0) {
        user.otp = null;
        user.otpExpires = null;
        user.otpAttempts = 0;
        user.otpPurpose = null;
      }
      await user.save();
      return res.status(400).json({
        success: false,
        error: remaining > 0 
          ? `Invalid recovery code. ${remaining} attempt(s) remaining.` 
          : 'Too many incorrect attempts. This recovery code has been invalidated.'
      });
    }

    // Assign new password (UserSchema pre-save hook automatically hashes with bcrypt)
    user.password = newPassword;
    user.otp = null;
    user.otpExpires = null;
    user.otpAttempts = 0;
    user.otpPurpose = null;
    await user.save();

    console.log(`[Auth Diagnostic] Stage: Reset Password Success | User: ${maskEmail(user.email)} updated password successfully`);

    res.json({
      success: true,
      message: 'Password reset successfully! You can now sign in with your new password.'
    });
  } catch (error) {
    console.error('[Auth Diagnostic] Stage: Reset Password Server Error |', error);
    res.status(500).json({ success: false, error: error.message || 'Server error during password reset' });
  }
};

const path = require('path');
const dotenv = require('dotenv');

const getGoogleConfig = (req, res) => {
  try {
    dotenv.config({ path: path.join(__dirname, '..', '..', '.env'), override: true });
  } catch (_) {}

  res.json({
    success: true,
    clientId: process.env.GOOGLE_CLIENT_ID || ''
  });
};

/**
 * @desc    Get SMTP configuration status (does not expose credentials)
 * @route   GET /api/auth/smtp-status
 * @access  Public
 */
const getSmtpStatus = async (req, res) => {
  try {
    const status = await verifySmtpConnection();
    res.json({
      success: true,
      smtp: {
        configured: status.configured,
        connected: status.connected,
        error: status.error || null,
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || '587',
        user: maskEmail(process.env.EMAIL_USER || '')
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to verify SMTP service' });
  }
};

/**
 * @desc    Get authenticated user profile directly from token
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authorized, user not found' });
    }
    res.json({
      success: true,
      data: req.user
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to retrieve user profile' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  resendOTP,
  verifyOTP,
  googleOAuthLogin,
  forgotPassword,
  resetPassword,
  getGoogleConfig,
  getSmtpStatus,
  getMe
};
