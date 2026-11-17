const User = require('../models/User');
const ScanHistory = require('../models/ScanHistory');
const ReportHistory = require('../models/ReportHistory');
const DiseaseHistory = require('../models/DiseaseHistory');
const MedicineSearchHistory = require('../models/MedicineSearchHistory');
const { removeOwnedUpload } = require('../utils/uploadCleanup');
const { isAdminEmail } = require('../utils/adminList');

/**
 * @desc    Get user profile details
 * @route   GET /api/user/profile
 * @access  Private
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    if (isAdminEmail(user.email)) {
      user.isAdmin = true;
      User.updateOne({ _id: user._id, isAdmin: { $ne: true } }, { $set: { isAdmin: true } }).catch(() => {});
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Server error retrieving profile' });
  }
};

/**
 * @desc    Update user profile details
 * @route   PUT /api/user/profile
 * @access  Private
 */
const updateUserProfile = async (req, res) => {
  try {
    const { name, phone, dateOfBirth, gender } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (gender) user.gender = gender;

    await user.save();

    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Server error updating profile' });
  }
};

/**
 * @desc    Get user dashboard stats & recent activities
 * @route   GET /api/user/dashboard
 * @access  Private
 */
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Count totals (Mongoose syntax)
    const totalScans = await ScanHistory.countDocuments({ userId });
    const totalReports = await ReportHistory.countDocuments({ userId });
    const totalDiseaseSearches = await DiseaseHistory.countDocuments({ userId });
    const totalMedicineSearches = await MedicineSearchHistory.countDocuments({ userId });

    // Retrieve recent items (limit 3)
    const recentScans = await ScanHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(3);

    const healedRecentScans = recentScans;

    const recentReports = await ReportHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(3);

    const recentDiseaseSearches = await DiseaseHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(3);

    const recentMedicineSearches = await MedicineSearchHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(3);

    // Generate a health tip of the day
    const healthTips = [
      "Always check the expiry date of medicines before consumption.",
      "Antibiotics should always be completed as prescribed, even if you feel better.",
      "Keep a list of all your allergies handy, especially when scanning new drugs.",
      "Most medical report levels are reference ranges; a minor variance does not immediately indicate a disease.",
      "Avoid drinking alcohol while taking NSAIDs (like Ibuprofen) to protect your stomach lining."
    ];
    const dailyTip = healthTips[new Date().getDate() % healthTips.length];

    res.json({
      success: true,
      data: {
        stats: {
          totalScans,
          totalReports,
          totalDiseaseSearches,
          totalMedicineSearches,
          lastActivityDate: healedRecentScans[0]?.createdAt || recentMedicineSearches[0]?.createdAt || recentReports[0]?.createdAt || recentDiseaseSearches[0]?.createdAt || null
        },
        recentScans: healedRecentScans,
        recentReports, 
        recentDiseaseSearches,
        recentMedicineSearches,
        dailyTip
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, error: 'Server error loading dashboard analytics' });
  }
};

/**
 * @desc    Get all medicine scans with optional search filter
 * @route   GET /api/user/scans
 * @access  Private
 */
const getScanHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { search } = req.query;

    let filter = { userId };
    
    // Case-insensitive regex search in MongoDB
    if (search) {
      filter.medicineName = {
        $regex: search,
        $options: 'i'
      };
    }

    const scans = await ScanHistory.find(filter).sort({ createdAt: -1 });
    const healedScans = scans;
    res.json({ success: true, data: healedScans });
  } catch (error) {
    console.error('Get scan history error:', error);
    res.status(500).json({ success: false, error: 'Server error loading medicine scan records' });
  }
};

/**
 * @desc    Get all report analyses with optional search filter
 * @route   GET /api/user/reports
 * @access  Private
 */
const getReportHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { search } = req.query;

    let filter = { userId };
    
    // OR filter with case-insensitive regex in MongoDB
    if (search) {
      filter.$or = [
        { fileName: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } }
      ];
    }

    const reports = await ReportHistory.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('Get report history error:', error);
    res.status(500).json({ success: false, error: 'Server error loading medical report records' });
  }
};

/**
 * @desc    Delete a specific medicine scan item
 * @route   DELETE /api/user/scans/:id
 * @access  Private
 */
const deleteScanItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const scan = await ScanHistory.findOne({ _id: id, userId });

    if (!scan) {
      return res.status(404).json({ success: false, error: 'Record not found or not authorized to delete' });
    }

    if (scan.imageUrl) {
      await removeOwnedUpload(scan.imageUrl);
    }
    await scan.deleteOne();

    res.json({ success: true, message: 'Scan history item deleted successfully' });
  } catch (error) {
    console.error('Delete scan item error:', error);
    res.status(500).json({ success: false, error: 'Server error deleting scan record' });
  }
};

/**
 * @desc    Delete a specific report analysis item
 * @route   DELETE /api/user/reports/:id
 * @access  Private
 */
const deleteReportItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const report = await ReportHistory.findOne({ _id: id, userId });

    if (!report) {
      return res.status(404).json({ success: false, error: 'Record not found or not authorized to delete' });
    }

    if (report.fileUrl) {
      await removeOwnedUpload(report.fileUrl);
    }
    await report.deleteOne();

    res.json({ success: true, message: 'Report history item deleted successfully' });
  } catch (error) {
    console.error('Delete report item error:', error);
    res.status(500).json({ success: false, error: 'Server error deleting report record' });
  }
};

/**
 * @desc    Clear all scan, report, disease and medicine search logs for user
 * @route   DELETE /api/user/history/clear
 * @access  Private
 */
const clearAllHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const scans = await ScanHistory.find({ userId }).select('imageUrl');
    const reports = await ReportHistory.find({ userId }).select('fileUrl');

    for (const scan of scans) {
      if (scan.imageUrl) {
        await removeOwnedUpload(scan.imageUrl);
      }
    }
    for (const report of reports) {
      if (report.fileUrl) {
        await removeOwnedUpload(report.fileUrl);
      }
    }

    await ScanHistory.deleteMany({ userId });
    await ReportHistory.deleteMany({ userId });
    await MedicineSearchHistory.deleteMany({ userId });
    await DiseaseHistory.deleteMany({ userId });

    res.json({ success: true, message: 'All scan, report, disease, and medicine search records cleared successfully' });
  } catch (error) {
    console.error('Clear all history error:', error);
    res.status(500).json({ success: false, error: 'Server error clearing medical records' });
  }
};

/**
 * @desc    Get all medicine searches with optional search filter
 * @route   GET /api/user/medicine-searches
 * @access  Private
 */
const getMedicineSearchHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { search } = req.query;

    let filter = { userId };
    
    if (search) {
      filter.$or = [
        { medicineName: { $regex: search, $options: 'i' } },
        { searchQuery: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } }
      ];
    }

    const searches = await MedicineSearchHistory.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: searches });
  } catch (error) {
    console.error('Get medicine search history error:', error);
    res.status(500).json({ success: false, error: 'Server error loading medicine search records' });
  }
};

/**
 * @desc    Delete a specific medicine search item
 * @route   DELETE /api/user/medicine-searches/:id
 * @access  Private
 */
const deleteMedicineSearchItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const item = await MedicineSearchHistory.findOneAndDelete({ _id: id, userId });

    if (!item) {
      return res.status(404).json({ success: false, error: 'Record not found or not authorized to delete' });
    }

    res.json({ success: true, message: 'Medicine search history item deleted successfully' });
  } catch (error) {
    console.error('Delete medicine search item error:', error);
    res.status(500).json({ success: false, error: 'Server error deleting medicine search record' });
  }
};

/**
 * @desc    Get all disease searches with optional search filter
 * @route   GET /api/user/diseases
 * @access  Private
 */
const getDiseaseHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { search } = req.query;

    let filter = { userId };
    
    if (search) {
      filter.$or = [
        { query: { $regex: search, $options: 'i' } },
        { diseaseName: { $regex: search, $options: 'i' } }
      ];
    }

    const diseases = await DiseaseHistory.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: diseases });
  } catch (error) {
    console.error('Get disease history error:', error);
    res.status(500).json({ success: false, error: 'Server error loading disease search records' });
  }
};

module.exports = {
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
};
