const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/resend-otp', resendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/google-oauth', googleOAuthLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/google-config', getGoogleConfig);
router.get('/smtp-status', getSmtpStatus);
router.get('/me', protect, getMe);

module.exports = router;
