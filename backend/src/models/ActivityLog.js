const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },
  user_name: {
    type: String,
    default: '',
  },
  workshop_id: {
    type: String,
    default: null,
  },
  action: {
    type: String,
    required: true,
  },
  module: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  ip_address: {
    type: String,
    default: '127.0.0.1',
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);

