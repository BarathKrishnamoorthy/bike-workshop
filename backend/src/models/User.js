const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  user_id: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Please provide user name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['super_admin', 'owner', 'admin', 'manager', 'mechanic'],
    default: 'owner',
  },
  phone_number: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  workshop_id: {
    type: String,
    default: null,
    index: true,
  },
  workshopName: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    default: '',
  },
  gstNumber: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
