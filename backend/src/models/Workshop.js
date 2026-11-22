const mongoose = require('mongoose');

const workshopSchema = new mongoose.Schema({
  workshop_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  owner_user_id: {
    type: String,
    required: true,
    index: true,
  },
  workshop_name: {
    type: String,
    required: [true, 'Please provide workshop name'],
    trim: true,
  },
  location: {
    type: String,
    required: [true, 'Please provide workshop location'],
    trim: true,
  },
  phone_number: {
    type: String,
    required: [true, 'Please provide workshop phone number'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  subscription_plan: {
    type: String,
    default: 'Free Trial',
  },
  subscription_expiry: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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

module.exports = mongoose.model('Workshop', workshopSchema);

