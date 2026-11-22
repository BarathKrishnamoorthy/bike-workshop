const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema({
  company_name: {
    type: String,
    default: 'SpeedyWheels SaaS',
    trim: true,
  },
  company_logo: {
    type: String,
    default: '',
  },
  favicon: {
    type: String,
    default: '',
  },
  support_email: {
    type: String,
    default: 'support@speedywheels.com',
    trim: true,
  },
  support_phone: {
    type: String,
    default: '+91 800-456-7890',
    trim: true,
  },
  address: {
    type: String,
    default: 'Auto Tech Park, Phase 1, Bangalore, Karnataka - 560100',
  },
  website_url: {
    type: String,
    default: 'https://speedywheels-saas.com',
  },
  default_currency: {
    type: String,
    default: 'INR',
  },
  default_timezone: {
    type: String,
    default: 'Asia/Kolkata',
  },
  updated_by: {
    type: String,
    default: 'super_admin',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);

