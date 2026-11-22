const mongoose = require('mongoose');

const chatConversationSchema = new mongoose.Schema({
  conversation_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  workshop_id: {
    type: String,
    required: true,
    index: true,
  },
  workshop_name: {
    type: String,
    default: '',
  },
  customer_user_id: {
    type: String,
    required: true,
  },
  customer_name: {
    type: String,
    default: '',
  },
  customer_email: {
    type: String,
    default: '',
  },
  customer_phone: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Open', 'Closed'],
    default: 'Open',
  },
  last_message: {
    type: String,
    default: '',
  },
  last_message_at: {
    type: Date,
    default: Date.now,
    index: true,
  },
  unread_by_admin: {
    type: Number,
    default: 0,
  },
  unread_by_customer: {
    type: Number,
    default: 0,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ChatConversation', chatConversationSchema);

