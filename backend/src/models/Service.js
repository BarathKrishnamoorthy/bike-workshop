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
  jobCardNumber: {
    type: String,
    required: true,
    unique: true,
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
    default: 18, // 18% GST default
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
  nextServiceDate: {
    type: Date,
  },
  nextServiceKilometre: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['Booked', 'In Progress', 'Ready', 'Delivered', 'Cancelled'],
    default: 'Booked',
    index: true,
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Partial', 'Paid'],
    default: 'Pending',
    index: true,
  },
  assignedMechanic: {
    type: String,
    default: 'Chief Mechanic',
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

// Calculate totals before saving
serviceSchema.pre('save', function (next) {
  // calculate spare parts total
  this.sparePartsTotal = (this.spareParts || []).reduce((acc, part) => {
    part.total = (part.quantity || 1) * (part.unitPrice || 0);
    return acc + part.total;
  }, 0);

  // calculate labour total
  this.labourTotal = (this.labourCharges || []).reduce((acc, item) => {
    return acc + (item.amount || 0);
  }, 0);

  const subtotal = this.sparePartsTotal + this.labourTotal - (this.discount || 0);
  const positiveSubtotal = subtotal > 0 ? subtotal : 0;
  
  if (this.taxRate && this.taxRate > 0) {
    this.taxAmount = Math.round((positiveSubtotal * this.taxRate) / 100);
  } else {
    this.taxAmount = 0;
  }

  this.totalAmount = Math.round(positiveSubtotal + this.taxAmount);
  this.pendingBalance = Math.max(0, this.totalAmount - (this.paidAmount || 0));

  if (this.paidAmount >= this.totalAmount && this.totalAmount > 0) {
    this.paymentStatus = 'Paid';
  } else if (this.paidAmount > 0) {
    this.paymentStatus = 'Partial';
  } else {
    this.paymentStatus = 'Pending';
  }

  next();
});

module.exports = mongoose.model('Service', serviceSchema);
