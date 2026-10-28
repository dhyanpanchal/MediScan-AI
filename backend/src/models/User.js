const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  password: {
    type: String,
    default: null, // Can be null for Google OAuth users
  },
  phone: {
    type: String,
    default: null,
  },
  dateOfBirth: {
    type: String, // Kept as simple ISO string/date string for profile setup
    default: null,
  },
  gender: {
    type: String,
    default: null,
  },
  oauthProvider: {
    type: String,
    default: null, // e.g., 'google'
  },
  oauthId: {
    type: String,
    default: null,
  },
  otp: {
    type: String,
    default: null,
  },
  otpExpires: {
    type: Date,
    default: null,
  },
  otpPurpose: {
    type: String,
    default: null, // e.g., 'login', 'password_reset'
  },
  otpAttempts: {
    type: Number,
    default: 0,
  },
  otpLastSent: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true
});

// Pre-save hook to hash password
UserSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare passwords
UserSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Convert _id to virtual id on serialization to remain 100% compatible with frontend queries
UserSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;
