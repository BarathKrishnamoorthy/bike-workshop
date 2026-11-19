const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  amountPaid: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentType: {
    type: String,
    enum: ['Advance', 'Partial', 'Final'],
    default: 'Final',
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Card', 'Bank Transfer'],
    default: 'UPI',
  },
  transactionReference: {
    type: String,
    default: '',
    trim: true,
  },
  pendingBalance: {
    type: Number,
    default: 0,
    min: 0,
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  receivedBy: {
    type: String,
    default: 'Admin',
  },
  notes: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Payment', paymentSchema);
