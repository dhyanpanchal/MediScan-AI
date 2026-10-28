const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  getDashboardStats,
  getScanHistory,
  getReportHistory,
  getDiseaseHistory,
  getMedicineSearchHistory,
  deleteScanItem,
  deleteReportItem,
  deleteMedicineSearchItem,
  clearAllHistory
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/dashboard', protect, getDashboardStats);
router.get('/scans', protect, getScanHistory);
router.get('/reports', protect, getReportHistory);
router.get('/diseases', protect, getDiseaseHistory);
router.get('/medicine-searches', protect, getMedicineSearchHistory);
router.delete('/scans/:id', protect, deleteScanItem);
router.delete('/reports/:id', protect, deleteReportItem);
router.delete('/medicine-searches/:id', protect, deleteMedicineSearchItem);
router.delete('/history/clear', protect, clearAllHistory);

module.exports = router;
