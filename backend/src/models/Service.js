const mongoose = require('mongoose');

const sparePartSchema = new mongoose.Schema({
  name: { type: String, required: true },
  partNumber: { type: String, default: '' },
  quantity: { type: Number, default: 1, min: 1 },
  unitPrice: { type: Number, default: 0, min: 0 },
  total: { type: Number, default: 0, min: 0 },
});

const labourChargeSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, default: 0, min: 0 },
});

const serviceSchema = new mongoose.Schema({
  workshop_id: {
    type: String,
    required: [true, 'Workshop ID is required'],
    index: true,
  },
  user_id: {
    type: String,
    index: true,
  },
  jobCardNumber: {
    type: String,
    required: true,
    index: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  bike: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bike',
    required: true,
  },
  serviceDate: {
    type: Date,
    default: Date.now,
  },
  deliveryDate: {
    type: Date,
  },
  serviceType: {
    type: String,
    enum: [
      'General Service',
      'Engine Oil & Filter Change',
      'Brake Overhaul',
      'Chain & Sprocket Replacement',
      'Electrical & Wiring Repair',
      'Major Engine Overhaul',
      'Suspension & Fork Servicing',
      'Custom Modifications',
      'Inspection & Washing'
    ],
    default: 'General Service',
  },
  customerComplaints: [{
    type: String,
    trim: true,
  }],
  workPerformed: {
    type: String,
    default: '',
  },
  spareParts: [sparePartSchema],
  labourCharges: [labourChargeSchema],
  sparePartsTotal: {
    type: Number,
    default: 0,
  },
  labourTotal: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  taxRate: {
    type: Number,
    default: 18,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
  paidAmount: {
    type: Number,
    default: 0,
  },
  pendingBalance: {
    type: Number,
    default: 0,
  },
  currentKilometre: {
    type: Number,
    default: 0,
  },
  nextServiceKilometre: {
    type: Number,
    default: 0,
  },
  nextServiceDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['Booked', 'In Progress', 'Ready', 'Delivered', 'Cancelled'],
    default: 'Booked',
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Partial', 'Paid'],
    default: 'Pending',
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

// Multi-tenant unique index on jobCardNumber
serviceSchema.index({ workshop_id: 1, jobCardNumber: 1 }, { unique: true });

module.exports = mongoose.model('Service', serviceSchema);
