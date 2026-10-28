const mongoose = require('mongoose');

const MedicineSearchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  searchQuery: {
    type: String,
    required: true,
  },
  medicineName: {
    type: String,
    default: '',
  },
  genericName: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    default: '',
  },
  dosageForm: {
    type: String,
    default: '',
  },
  language: {
    type: String,
    default: 'en',
  },
  ageGroup: {
    type: String,
    default: 'adult',
  },
  overview: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  dosageAndUsage: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  sideEffects: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  warnings: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  precautions: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

// Format _id to id
MedicineSearchHistorySchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

const MedicineSearchHistory = mongoose.model('MedicineSearchHistory', MedicineSearchHistorySchema);
module.exports = MedicineSearchHistory;
