const express = require('express');
const router = express.Router();
const { searchDisease, searchMedicineByName } = require('../controllers/diseaseController');
const { protect } = require('../middleware/authMiddleware');

// Disease search with multilingual support
router.post('/search', protect, searchDisease);

// Medicine name search
router.post('/medicine-search', protect, searchMedicineByName);

module.exports = router;
