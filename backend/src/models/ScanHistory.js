const mongoose = require('mongoose');

const ScanHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  rawOcrText: {
    type: String,
    default: '',
  },
  medicineName: {
    type: String,
    required: true,
  },
  genericName: {
    type: String,
    default: '',
  },
  activeIngredients: {
    type: String,
    default: '',
  },
  activeIngredientsList: {
    type: Array,
    default: [],
  },
  isCombination: {
    type: Boolean,
    default: false,
  },
  combinationRationale: {
    type: String,
    default: '',
  },
  manufacturer: {
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
  route: {
    type: String,
    default: 'Oral',
  },
  clinicalUses: {
    type: Array,
    default: [],
  },
  purposeAndUses: {
    type: String,
    default: '',
  },
  dosage: {
    type: String,
    default: '',
  },
  dosageReference: {
    type: String,
    default: '',
  },
  prescribedDosageAvailable: {
    type: Boolean,
    default: false,
  },
  usageInstructions: {
    type: String,
    default: '',
  },
  sideEffects: {
    type: mongoose.Schema.Types.Mixed,
    default: '',
  },
  warnings: {
    type: String,
    default: '',
  },
  precautions: {
    type: String,
    default: '',
  },
  storage: {
    type: String,
    default: '',
  },
  missedDose: {
    type: String,
    default: '',
  },
  verificationStatus: {
    type: String,
    enum: ['Verified', 'Partially Verified', 'Information Not Verified'],
    default: 'Verified',
  },
  confidenceScore: {
    type: Number,
    default: 95,
  },
  sources: {
    type: Array,
    default: [],
  }
}, {
  timestamps: true
});

// Format _id to id
ScanHistorySchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

const ScanHistory = mongoose.model('ScanHistory', ScanHistorySchema);
module.exports = ScanHistory;
