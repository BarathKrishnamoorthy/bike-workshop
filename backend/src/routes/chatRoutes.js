const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, requireSuperAdmin } = require('../middleware/auth');
const {
  getOrCreateConversation,
  getCustomerMessages,
  sendCustomerMessage,
  markAsReadByCustomer,
  getAdminConversations,
  getAdminConversationMessages,
  sendAdminMessage,
  updateConversationStatus,
} = require('../controllers/chatController');

// Workshop Customer Chat Routes
router.post('/conversation', protect, getOrCreateConversation);
router.get('/messages', protect, getCustomerMessages);
router.post('/message', protect, upload.single('attachment'), sendCustomerMessage);
router.put('/read', protect, markAsReadByCustomer);

// Super Admin Chat Dashboard Routes
router.get('/admin/conversations', protect, requireSuperAdmin, getAdminConversations);
router.get('/admin/conversation/:conversationId/messages', protect, requireSuperAdmin, getAdminConversationMessages);
router.post('/admin/message', protect, requireSuperAdmin, upload.single('attachment'), sendAdminMessage);
router.put('/admin/conversation/:conversationId/status', protect, requireSuperAdmin, updateConversationStatus);

module.exports = router;

