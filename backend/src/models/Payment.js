const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  workshop_id: {
    type: String,
    required: [true, 'Workshop ID is required'],
    index: true,
  },
  user_id: {
    type: String,
    index: true,
  },
  invoiceNumber: {
    type: String,
    required: true,
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
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Multi-tenant unique index on invoiceNumber
paymentSchema.index({ workshop_id: 1, invoiceNumber: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);
