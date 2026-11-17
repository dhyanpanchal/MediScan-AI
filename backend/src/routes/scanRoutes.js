const express = require('express');
const router = express.Router();
const { scanMedicineLabel, translateMedicineData } = require('../controllers/scanController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Handle medicine label scanning. Expects an 'image' file input field.
router.post('/', protect, upload.single('image'), scanMedicineLabel);

router.post('/translate', protect, translateMedicineData);
module.exports = router;
