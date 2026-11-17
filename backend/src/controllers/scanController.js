const ScanHistory = require('../models/ScanHistory');
const { extractMedicineOcrData } = require('../utils/ocr');
const { analyzeMedicineLabel } = require('../utils/llm');
const { translateMedicinePayload } = require('../utils/clinicalTranslations');
const { confidence, verificationStatus } = require('../utils/confidence');
const { removeOwnedUpload } = require('../utils/uploadCleanup');
async function scanMedicineLabel(req, res) {
  let saved = false;
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Please upload a medicine label image' });
    const ocr = await extractMedicineOcrData(req.file.path);
    const rawText = ocr.text || '';
    const result = await analyzeMedicineLabel(rawText, req.file.path);
    if (!result) throw Object.assign(new Error('No medicine analysis result could be generated.'), { status: 503 });
    const fields = ['genericName', 'activeIngredients', 'activeIngredientsList', 'isCombination', 'combinationRationale', 'manufacturer', 'category', 'dosageForm', 'route', 'clinicalUses', 'purposeAndUses', 'dosage', 'dosageReference', 'prescribedDosageAvailable', 'usageInstructions', 'sideEffects', 'warnings', 'precautions', 'storage', 'missedDose', 'sources', 'identificationStatus', 'verificationReason', 'packagingEvidence'];
    const data = Object.fromEntries(fields.filter(key => result[key] !== undefined).map(key => [key, result[key]]));
    const scan = await ScanHistory.create({ ...data, userId: req.user.id, imageUrl: '/uploads/' + req.file.filename, rawOcrText: rawText, medicineName: result.medicineName || 'Unidentified medicine', verificationStatus: verificationStatus(result.verificationStatus), confidenceScore: confidence(result.confidenceScore), ocrConfidence: confidence(ocr.confidence) });
    saved = true;
    const response = scan.toJSON ? scan.toJSON() : { ...scan, id: String(scan.id || scan._id) };
    res.status(201).json({ success: true, data: response });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, error: error.status ? error.message : 'Server error during medicine scan analysis' });
  } finally {
    if (!saved && req.file) await removeOwnedUpload('/uploads/' + req.file.filename).catch(error => console.error('Upload cleanup failed:', error.message));
  }
}
async function translateMedicineData(req, res) {
  try {
    const data = req.body.medicineData || req.body.data;
    if (!data || typeof data !== 'object' || Array.isArray(data) || !['en', 'hi', 'gu'].includes(req.body.language)) return res.status(400).json({ success: false, error: 'Provide medicine data and a supported language.' });
    res.json({ success: true, data: await translateMedicinePayload(data, req.body.language) });
  } catch (error) { res.status(error.status || 503).json({ success: false, error: error.message || 'Translation unavailable' }); }
}
module.exports = { scanMedicineLabel, translateMedicineData };
