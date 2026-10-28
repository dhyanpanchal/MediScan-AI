const ScanHistory = require('../models/ScanHistory');
const { extractTextFromImage } = require('../utils/ocr');
const { analyzeMedicineLabel } = require('../utils/llm');

/**
 * @desc    Upload medicine label, perform OCR, analyze using AI, save to history
 * @route   POST /api/scan
 * @access  Private
 */
const scanMedicineLabel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a medicine label image' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const filePath = req.file.path;

    // 1. Run OCR on the image (if OCR fails, Gemini Vision will still analyze image directly)
    let rawText = '';
    try {
      rawText = await extractTextFromImage(filePath);
    } catch (ocrError) {
      console.warn('Tesseract OCR warning in Controller (will rely on Gemini Vision):', ocrError.message);
    }

    // 2. Run Multimodal Gemini Medicine Label Analysis (passes both raw text and local image file path)
    let analysisResult;
    try {
      analysisResult = await analyzeMedicineLabel(rawText, filePath);
    } catch (llmError) {
      console.error('LLM Analysis Error in Controller:', llmError);
      return res.status(500).json({ success: false, error: 'Failed to analyze medicine details using AI' });
    }

    if (!analysisResult) {
      return res.status(500).json({ success: false, error: 'No medicine analysis result could be generated.' });
    }

    // 3. Save to database history
    const newScan = await ScanHistory.create({
      userId: req.user.id,
      imageUrl: fileUrl,
      rawOcrText: rawText || 'Analyzed via Gemini Vision Direct OCR',
      medicineName: analysisResult.medicineName || 'Identified Medicine',
      activeIngredients: analysisResult.activeIngredients || 'Not specified',
      manufacturer: analysisResult.manufacturer || 'Not specified',
      category: analysisResult.category || 'Prescription Medication',
      dosageForm: analysisResult.dosageForm || 'Oral Tablet/Capsule',
      dosage: analysisResult.dosage || 'Consult a healthcare professional',
      usageInstructions: analysisResult.usageInstructions || 'Use as directed',
      purposeAndUses: analysisResult.purposeAndUses || 'As indicated by physician',
      sideEffects: analysisResult.sideEffects || 'Consult packaging or pharmacist',
      warnings: analysisResult.warnings || 'Keep out of reach of children',
      precautions: analysisResult.precautions || 'Consult a physician',
      storage: analysisResult.storage || 'Store in a cool dry place',
      missedDose: analysisResult.missedDose || 'Take as soon as remembered unless near next dose'
    });

    res.status(201).json({
      success: true,
      data: newScan
    });
  } catch (error) {
    console.error('Scan controller error:', error);
    res.status(500).json({ success: false, error: 'Server error during medicine scan analysis' });
  }
};

module.exports = {
  scanMedicineLabel
};
