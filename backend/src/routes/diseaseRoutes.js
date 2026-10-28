const express = require('express');
const router = express.Router();
const { searchDisease, searchMedicineByName } = require('../controllers/diseaseController');
const { optionalProtect } = require('../middleware/authMiddleware');

// Disease search with multilingual support
router.post('/search', optionalProtect, searchDisease);

// Medicine name search
router.post('/medicine-search', optionalProtect, searchMedicineByName);

module.exports = router;
