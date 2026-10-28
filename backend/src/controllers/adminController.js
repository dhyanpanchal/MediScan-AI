const User = require('../models/User');
const ScanHistory = require('../models/ScanHistory');
const ReportHistory = require('../models/ReportHistory');
const DiseaseHistory = require('../models/DiseaseHistory');
const MedicineSearchHistory = require('../models/MedicineSearchHistory');

/**
 * @desc    Get administrative dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalScans = await ScanHistory.countDocuments();
    const totalReports = await ReportHistory.countDocuments();
    const totalDiseaseSearches = await DiseaseHistory.countDocuments();
    const totalMedicineSearches = await MedicineSearchHistory.countDocuments();

    // Group users by oauthProvider to count Google vs Email signups
    const oauthBreakdown = await User.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$oauthProvider", "email"] },
          count: { $sum: 1 }
        }
      }
    ]);

    // Format auth breakdown
    const authStats = {
      email: 0,
      google: 0
    };
    oauthBreakdown.forEach(item => {
      const provider = item._id === 'google' ? 'google' : 'email';
      authStats[provider] = item.count;
    });

    // Gender breakdown
    const genderBreakdown = await User.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$gender", "unspecified"] },
          count: { $sum: 1 }
        }
      }
    ]);

    const genderStats = {};
    genderBreakdown.forEach(item => {
      const key = item._id.toLowerCase();
      genderStats[key] = item.count;
    });

    // Recent user signups (limit 5)
    const recentUsers = await User.find()
      .select('name email createdAt oauthProvider')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalScans,
          totalReports,
          totalDiseaseSearches,
          totalMedicineSearches
        },
        authStats,
        genderStats,
        recentUsers
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, error: 'Server error loading admin metrics' });
  }
};

/**
 * @desc    Get all registered users with search
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getAllUsers = async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};

    if (search) {
      filter = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ success: false, error: 'Server error retrieving users list' });
  }
};

/**
 * @desc    Get details of a single user (including their registration and uploads)
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
const getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Retrieve all medicine scans for this user
    const scans = await ScanHistory.find({ userId: id }).sort({ createdAt: -1 });

    // Retrieve all report analyses for this user
    const reports = await ReportHistory.find({ userId: id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        user,
        scans,
        reports
      }
    });
  } catch (error) {
    console.error('Admin get user detail error:', error);
    res.status(500).json({ success: false, error: 'Server error fetching user details' });
  }
};

/**
 * @desc    Get all medicine scans system-wide with search
 * @route   GET /api/admin/scans
 * @access  Private/Admin
 */
const getAllScans = async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};

    if (search) {
      filter = {
        medicineName: { $regex: search, $options: 'i' }
      };
    }

    // Populate user name and email
    const scans = await ScanHistory.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: scans
    });
  } catch (error) {
    console.error('Admin get all scans error:', error);
    res.status(500).json({ success: false, error: 'Server error retrieving global scan logs' });
  }
};

/**
 * @desc    Get all report analyses system-wide with search
 * @route   GET /api/admin/reports
 * @access  Private/Admin
 */
const getAllReports = async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};

    if (search) {
      filter = {
        $or: [
          { fileName: { $regex: search, $options: 'i' } },
          { summary: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Populate user name and email
    const reports = await ReportHistory.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Admin get all reports error:', error);
    res.status(500).json({ success: false, error: 'Server error retrieving global report logs' });
  }
};

/**
 * @desc    Get all disease searches system-wide with search
 * @route   GET /api/admin/diseases
 * @access  Private/Admin
 */
const getAllDiseases = async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};

    if (search) {
      filter = {
        $or: [
          { query: { $regex: search, $options: 'i' } },
          { diseaseName: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const diseases = await DiseaseHistory.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: diseases
    });
  } catch (error) {
    console.error('Admin get all diseases error:', error);
    res.status(500).json({ success: false, error: 'Server error retrieving global disease search logs' });
  }
};

const getAllMedicineSearches = async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};
    if (search) {
      filter = {
        $or: [
          { searchQuery: { $regex: search, $options: 'i' } },
          { medicineName: { $regex: search, $options: 'i' } },
          { genericName: { $regex: search, $options: 'i' } }
        ]
      };
    }
    const medicineSearches = await MedicineSearchHistory.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: medicineSearches });
  } catch (error) {
    console.error('Admin get medicine searches error:', error);
    res.status(500).json({ success: false, error: 'Server error retrieving medicine searches' });
  }
};

module.exports = {
  getAllMedicineSearches,
  getAdminStats,
  getAllUsers,
  getUserDetail,
  getAllScans,
  getAllReports,
  getAllDiseases
};
