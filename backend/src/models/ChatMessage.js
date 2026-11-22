const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  message_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  conversation_id: {
    type: String,
    required: true,
    index: true,
  },
  workshop_id: {
    type: String,
    required: true,
    index: true,
  },
  sender_id: {
    type: String,
    required: true,
  },
  sender_name: {
    type: String,
    default: '',
  },
  sender_role: {
    type: String,
    enum: ['super_admin', 'workshop_customer'],
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
  attachment_path: {
    type: String,
    default: '',
  },
  attachment_name: {
    type: String,
    default: '',
  },
  attachment_type: {
    type: String,
    enum: ['image', 'document', 'other', 'none'],
    default: 'none',
  },
  message_status: {
    type: String,
    enum: ['Sent', 'Delivered', 'Read'],
    default: 'Sent',
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);

