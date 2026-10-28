const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAllUsers,
  getUserDetail,
  getAllScans,
  getAllReports,
  getAllDiseases,
  getAllMedicineSearches
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Secure all admin routes with authentication and admin privilege checks
router.get('/stats', protect, adminOnly, getAdminStats);
router.get('/users', protect, adminOnly, getAllUsers);
router.get('/users/:id', protect, adminOnly, getUserDetail);
router.get('/scans', protect, adminOnly, getAllScans);
router.get('/reports', protect, adminOnly, getAllReports);
router.get('/diseases', protect, adminOnly, getAllDiseases);
router.get('/medicine-searches', protect, adminOnly, getAllMedicineSearches);

module.exports = router;
