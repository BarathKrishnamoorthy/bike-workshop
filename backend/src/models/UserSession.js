const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    index: true,
  },
  user_name: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    required: true,
  },
  workshop_id: {
    type: String,
    default: null,
    index: true,
  },
  workshop_name: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    default: 'owner',
  },
  login_at: {
    type: Date,
    default: Date.now,
  },
  last_activity_at: {
    type: Date,
    default: Date.now,
    index: true,
  },
  logout_at: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'logged_out', 'revoked'],
    default: 'active',
  },
  device_info: {
    type: String,
    default: 'Chrome Desktop / Windows',
  },
  ip_address: {
    type: String,
    default: '127.0.0.1',
  },
});

module.exports = mongoose.model('UserSession', userSessionSchema);

