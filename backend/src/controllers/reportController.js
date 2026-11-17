const ReportHistory = require('../models/ReportHistory');
const { extractTextFromImage } = require('../utils/ocr');
const { extractTextFromPDF } = require('../utils/pdfExtractor');
const { analyzeMedicalReport, translateReport } = require('../utils/llm');
const path = require('path');
const fs = require('fs');
const { confidence } = require('../utils/confidence');
const { removeOwnedUpload } = require('../utils/uploadCleanup');

/**
 * @desc    Upload report (image/PDF), extract text, analyze using LLM, save to history
 * @route   POST /api/report
 * @access  Private
 */
const analyzeReportFile = async (req, res) => {
  let saved = false;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a medical report file (Image or PDF)' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const filePath = req.file.path;
    const fileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image';
    const fileName = req.file.originalname;

    // 1. Extract text depending on file type
    let rawText = '';
    try {
      if (req.file.mimetype === 'application/pdf') {
        rawText = await extractTextFromPDF(filePath);
      } else if (req.file.mimetype.startsWith('text/') || req.file.mimetype === 'application/json') {
        rawText = fs.readFileSync(filePath, 'utf-8');
      } else {
        rawText = await extractTextFromImage(filePath);
      }
    } catch (extractError) {
      console.error('File text extraction error:', extractError);
      return res.status(500).json({ success: false, error: 'Failed to parse text from the uploaded document' });
    }

    if (!rawText || !rawText.trim()) {
      return res.status(400).json({
        success: false,
        error: 'The uploaded file appears to be empty or unreadable. Please check file quality.'
      });
    }

    // 2. Perform AI Analysis on the extracted text
    let analysisResult;
    try {
      analysisResult = await analyzeMedicalReport(rawText);
    } catch (llmError) {
      console.error('Report LLM analysis error:', llmError);
      return res.status(llmError.status || 503).json({ success: false, error: llmError.message || 'Failed to analyze report using AI' });
    }

    // 3. Save to database history
    const newReportRecord = await ReportHistory.create({
      userId: req.user.id,
      fileUrl,
      fileType,
      fileName,
      rawText,
      reportType: analysisResult.reportType || 'Other',
      patient: analysisResult.patient || {},
      doctor: analysisResult.doctor || {},
      lifestyleInformation: analysisResult.lifestyleInformation || [],
      patientDetails: analysisResult.patientDetails || {},
      doctorDetails: analysisResult.doctorDetails || {},
      summary: analysisResult.summary || 'Summary not generated',
      medicalHistory: analysisResult.medicalHistory || [],
      symptoms: analysisResult.symptoms || [],
      familyHistory: analysisResult.familyHistory || [],
      lifestyle: analysisResult.lifestyle || [],
      labResults: analysisResult.labResults || [],
      keyFindings: analysisResult.keyFindings || [],
      highlightedInsights: analysisResult.highlightedInsights || [],
      criticalAlerts: analysisResult.criticalAlerts || [],
      recommendations: analysisResult.recommendations || 'Consult your physician',
      doctorNotes: analysisResult.doctorNotes || [],
      hasLabValues: analysisResult.hasLabValues || false,
      hasCriticalFindings: analysisResult.hasCriticalFindings || false,
      patientExplanation: analysisResult.patientExplanation || {},
      reportConfidence: confidence(analysisResult.reportConfidence),
      ocrConfidence: confidence(analysisResult.ocrConfidence),
      classificationConfidence: confidence(analysisResult.classificationConfidence),
      analysisConfidence: confidence(analysisResult.analysisConfidence),
      warnings: analysisResult.warnings || 'For educational use only',
      cardAnalysis: analysisResult.cardAnalysis || null
    });

    saved = true;
    res.status(201).json({
      success: true,
      data: newReportRecord
    });
  } catch (error) {
    console.error('Report controller error:', error);
    res.status(error.status || 500).json({ success: false, error: 'Server error during report analysis' });
  } finally {
    if (!saved && req.file) await removeOwnedUpload('/uploads/' + req.file.filename).catch(error => console.error('Upload cleanup failed:', error.message));
  }
};

const translateReportData = async (req, res) => {
  try {
    const { reportData, language } = req.body;

    if (!reportData || !language) {
      return res.status(400).json({ success: false, error: 'Please provide reportData and target language' });
    }

    const translatedReport = await translateReport(reportData, language);

    res.status(200).json({
      success: true,
      data: translatedReport
    });
  } catch (error) {
    console.error('Translation controller error:', error);
    res.status(500).json({ success: false, error: 'Server error during report translation' });
  }
};

module.exports = {
  analyzeReportFile,
  translateReportData
};

