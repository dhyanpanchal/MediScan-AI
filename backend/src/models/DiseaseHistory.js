const mongoose = require('mongoose');

const DiseaseHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  query: {
    type: String,
    required: true,
  },
  diseaseName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  commonSymptoms: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('DiseaseHistory', DiseaseHistorySchema);
