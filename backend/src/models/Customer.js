const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide customer name'],
    trim: true,
  },
  mobile: {
    type: String,
    required: [true, 'Please provide mobile number'],
    trim: true,
    unique: true,
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
});

module.exports = mongoose.model('Customer', customerSchema);
