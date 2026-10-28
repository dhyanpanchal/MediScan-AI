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
  activeIngredients: {
    type: String,
    default: '',
  },
  dosage: {
    type: String,
    default: '',
  },
  usageInstructions: {
    type: String,
    default: '',
  },
  sideEffects: {
    type: String,
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
  purposeAndUses: {
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
