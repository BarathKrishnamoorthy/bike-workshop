const mongoose = require('mongoose');

const bikeSchema = new mongoose.Schema({
  workshop_id: {
    type: String,
    required: [true, 'Workshop ID is required'],
    index: true,
  },
  user_id: {
    type: String,
    index: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer is required for bike registration'],
  },
  brand: {
    type: String,
    required: [true, 'Please provide bike brand'],
    trim: true,
  },
  model: {
    type: String,
    required: [true, 'Please provide bike model'],
    trim: true,
  },
  registrationNumber: {
    type: String,
    required: [true, 'Please provide registration number'],
    uppercase: true,
    trim: true,
    index: true,
  },
  currentKilometre: {
    type: Number,
    default: 0,
    min: 0,
  },
  year: {
    type: Number,
    default: new Date().getFullYear(),
  },
  fuelType: {
    type: String,
    enum: ['Petrol', 'Electric', 'Other'],
    default: 'Petrol',
  },
  chassisNumber: {
    type: String,
    default: '',
    trim: true,
  },
  engineNumber: {
    type: String,
    default: '',
    trim: true,
  },
  color: {
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

// Multi-tenant index
bikeSchema.index({ workshop_id: 1, registrationNumber: 1 });

module.exports = mongoose.model('Bike', bikeSchema);
