const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  workshop_id: {
    type: String,
    required: [true, 'Workshop ID is required'],
    index: true,
  },
  user_id: {
    type: String,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Please provide customer name'],
    trim: true,
  },
  mobile: {
    type: String,
    required: [true, 'Please provide mobile number'],
    trim: true,
    index: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
  },
  address: {
    type: String,
    default: '',
    trim: true,
  },
  bikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bike',
  }],
  notes: {
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

// Multi-tenant unique index: mobile is unique within each workshop
customerSchema.index({ workshop_id: 1, mobile: 1 }, { unique: true });

module.exports = mongoose.model('Customer', customerSchema);
