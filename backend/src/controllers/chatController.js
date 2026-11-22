const ChatConversation = require('../models/ChatConversation');
const ChatMessage = require('../models/ChatMessage');
const Workshop = require('../models/Workshop');
const User = require('../models/User');
const { getStatus } = require('../config/db');
const mockStore = require('../utils/mockStore');

/**
 * Helper to emit socket events if Socket.IO is initialized on app
 */
const emitSocketEvent = (req, event, data, room = null) => {
  try {
    const io = req.app.get('io');
    if (!io) return;
    if (room) {
      io.to(room).emit(event, data);
    } else {
      io.emit(event, data);
    }
  } catch (err) {
    console.error('Socket emission error:', err.message);
  }
};

/**
 * @desc    Get or create chat conversation for logged-in workshop
 * @route   POST /api/chat/conversation
 * @access  Private (Workshop Owner / Mechanic)
 */
exports.getOrCreateConversation = async (req, res, next) => {
  try {
    const workshopId = req.workshopId;
    if (!workshopId) {
      return res.status(400).json({
        success: false,
        message: 'Workshop context missing for customer chat',
      });
    }

    if (getStatus()) {
      let conversation = await ChatConversation.findOne({ workshop_id: workshopId });
      if (!conversation) {
        conversation = await ChatConversation.create({
          workshop_id: workshopId,
          customer_user_id: req.userId,
          status: 'Open',
          last_message: 'Conversation started',
          last_message_at: new Date(),
          unread_by_admin: 0,
          unread_by_customer: 0,
        });
      }
      return res.status(200).json({ success: true, data: conversation });
    }

    // Mock store fallback
    let conv = mockStore.chat_conversations.find((c) => c.workshop_id === workshopId);
    if (!conv) {
      conv = {
        _id: `conv_${Date.now()}`,
        conversation_id: `conv_${workshopId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        workshop_id: workshopId,
        workshop_name: req.workshop?.workshop_name || req.user.workshopName || 'Workshop',
        customer_user_id: req.userId,
        customer_name: req.user.name,
        customer_email: req.user.email,
        customer_phone: req.user.phone_number || req.user.phone || '',
        status: 'Open',
        last_message: 'Conversation started',
        last_message_at: new Date(),
        unread_by_admin: 0,
        unread_by_customer: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockStore.chat_conversations.push(conv);
    }

    res.status(200).json({ success: true, data: conv });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all messages for current workshop's conversation
 * @route   GET /api/chat/messages
 * @access  Private (Workshop Customer)
 */
exports.getCustomerMessages = async (req, res, next) => {
  try {
    const workshopId = req.workshopId;
    if (!workshopId) {
      return res.status(400).json({
        success: false,
        message: 'Workshop context missing',
      });
    }

    if (getStatus()) {
      let conversation = await ChatConversation.findOne({ workshop_id: workshopId });
      if (!conversation) {
        return res.status(200).json({ success: true, data: [], conversation: null });
      }

      // Mark super_admin messages as Read
      await ChatMessage.updateMany(
        { conversation_id: conversation._id, sender_role: 'super_admin', message_status: { $ne: 'Read' } },
        { message_status: 'Read' }
      );
      conversation.unread_by_customer = 0;
      await conversation.save();

      const messages = await ChatMessage.find({ conversation_id: conversation._id }).sort({ created_at: 1 });
      return res.status(200).json({ success: true, data: messages, conversation });
    }

    // Mock store
    const conv = mockStore.chat_conversations.find((c) => c.workshop_id === workshopId);
    if (!conv) {
      return res.status(200).json({ success: true, data: [], conversation: null });
    }

    // Mark messages sent by super_admin as Read
    mockStore.chat_messages.forEach((msg) => {
      if (
        (msg.conversation_id === conv._id || msg.conversation_id === conv.conversation_id || msg.workshop_id === workshopId) &&
        msg.sender_role === 'super_admin'
      ) {
        msg.message_status = 'Read';
      }
    });
    conv.unread_by_customer = 0;

    const messages = mockStore.chat_messages
      .filter((m) => m.conversation_id === conv._id || m.conversation_id === conv.conversation_id || m.workshop_id === workshopId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    res.status(200).json({ success: true, data: messages, conversation: conv });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Workshop customer sends a message to Super Admin
 * @route   POST /api/chat/message
 * @access  Private (Workshop Customer)
 */
exports.sendCustomerMessage = async (req, res, next) => {
  try {
    const workshopId = req.workshopId;
    const { message } = req.body;
    let attachmentPath = '';
    let attachmentName = '';
    let attachmentType = 'none';

    if (req.file) {
      attachmentPath = `/uploads/${req.file.filename}`;
      attachmentName = req.file.originalname;
      attachmentType = req.file.mimetype.startsWith('image/') ? 'image' : 'document';
    }

    if (!message && !attachmentPath) {
      return res.status(400).json({
        success: false,
        message: 'Message content or attachment is required',
      });
    }

    const messagePreview = message || (attachmentType === 'image' ? '📷 Image attachment' : '📎 Document attachment');

    if (getStatus()) {
      let conversation = await ChatConversation.findOne({ workshop_id: workshopId });
      if (!conversation) {
        conversation = await ChatConversation.create({
          workshop_id: workshopId,
          customer_user_id: req.userId,
          status: 'Open',
        });
      }

      // Automatically reopen conversation if closed when customer sends new message
      conversation.status = 'Open';
      conversation.last_message = messagePreview;
      conversation.last_message_at = new Date();
      conversation.unread_by_admin = (conversation.unread_by_admin || 0) + 1;
      await conversation.save();

      const newMsg = await ChatMessage.create({
        conversation_id: conversation._id,
        workshop_id: workshopId,
        sender_id: req.userId,
        sender_role: 'workshop_customer',
        message: message || '',
        attachment_path: attachmentPath,
        attachment_name: attachmentName,
        attachment_type: attachmentType,
        message_status: 'Sent',
        created_at: new Date(),
      });

      emitSocketEvent(req, 'new_message', { message: newMsg, conversation }, `room_${workshopId}`);
      emitSocketEvent(req, 'new_message', { message: newMsg, conversation }, 'admin_room');

      return res.status(201).json({ success: true, data: newMsg, conversation });
    }

    // Mock store
    let conv = mockStore.chat_conversations.find((c) => c.workshop_id === workshopId);
    if (!conv) {
      conv = {
        _id: `conv_${Date.now()}`,
        conversation_id: `conv_${workshopId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        workshop_id: workshopId,
        workshop_name: req.workshop?.workshop_name || req.user.workshopName || 'Workshop',
        customer_user_id: req.userId,
        customer_name: req.user.name,
        customer_email: req.user.email,
        customer_phone: req.user.phone_number || req.user.phone || '',
        status: 'Open',
        last_message: messagePreview,
        last_message_at: new Date(),
        unread_by_admin: 1,
        unread_by_customer: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockStore.chat_conversations.push(conv);
    } else {
      conv.status = 'Open';
      conv.last_message = messagePreview;
      conv.last_message_at = new Date();
      conv.unread_by_admin = (conv.unread_by_admin || 0) + 1;
    }

    const newMsg = {
      _id: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      conversation_id: conv._id,
      workshop_id: workshopId,
      sender_id: req.userId,
      sender_name: req.user.name,
      sender_role: 'workshop_customer',
      message: message || '',
      attachment_path: attachmentPath,
      attachment_name: attachmentName,
      attachment_type: attachmentType,
      message_status: 'Sent',
      created_at: new Date(),
    };
    mockStore.chat_messages.push(newMsg);

    emitSocketEvent(req, 'new_message', { message: newMsg, conversation: conv }, `room_${workshopId}`);
    emitSocketEvent(req, 'new_message', { message: newMsg, conversation: conv }, 'admin_room');

    res.status(201).json({ success: true, data: newMsg, conversation: conv });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Customer marks messages as Read
 * @route   PUT /api/chat/read
 * @access  Private (Workshop Customer)
 */
exports.markAsReadByCustomer = async (req, res, next) => {
  try {
    const workshopId = req.workshopId;
    if (getStatus()) {
      const conv = await ChatConversation.findOne({ workshop_id: workshopId });
      if (conv) {
        await ChatMessage.updateMany(
          { conversation_id: conv._id, sender_role: 'super_admin' },
          { message_status: 'Read' }
        );
        conv.unread_by_customer = 0;
        await conv.save();
      }
    } else {
      const conv = mockStore.chat_conversations.find((c) => c.workshop_id === workshopId);
      if (conv) {
        conv.unread_by_customer = 0;
        mockStore.chat_messages.forEach((m) => {
          if (m.workshop_id === workshopId && m.sender_role === 'super_admin') {
            m.message_status = 'Read';
          }
        });
      }
    }

    emitSocketEvent(req, 'messages_read', { workshop_id: workshopId, read_by: 'customer' }, 'admin_room');
    res.status(200).json({ success: true, message: 'Messages marked as read' });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// SUPER ADMIN CHAT CONTROLLERS
// ==========================================

/**
 * @desc    Super Admin gets all customer conversations
 * @route   GET /api/chat/admin/conversations
 * @access  Private (Super Admin)
 */
exports.getAdminConversations = async (req, res, next) => {
  try {
    const { q, status } = req.query;

    if (getStatus()) {
      let filter = {};
      if (status && status !== 'All') {
        filter.status = status;
      }
      let conversations = await ChatConversation.find(filter)
        .populate('workshop_id', 'workshop_name location phone_number')
        .populate('customer_user_id', 'name email phone_number')
        .sort({ last_message_at: -1 });

      if (q) {
        const queryLower = q.toLowerCase();
        conversations = conversations.filter(
          (c) =>
            (c.workshop_name && c.workshop_name.toLowerCase().includes(queryLower)) ||
            (c.customer_name && c.customer_name.toLowerCase().includes(queryLower))
        );
      }

      return res.status(200).json({ success: true, count: conversations.length, data: conversations });
    }

    // Mock store
    let convs = [...mockStore.chat_conversations];

    // Filter by status if requested
    if (status && status !== 'All') {
      if (status === 'Unread') {
        convs = convs.filter((c) => (c.unread_by_admin || 0) > 0);
      } else {
        convs = convs.filter((c) => c.status === status);
      }
    }

    // Search query
    if (q) {
      const queryLower = q.toLowerCase();
      convs = convs.filter(
        (c) =>
          (c.workshop_name && c.workshop_name.toLowerCase().includes(queryLower)) ||
          (c.workshop_id && c.workshop_id.toLowerCase().includes(queryLower)) ||
          (c.customer_name && c.customer_name.toLowerCase().includes(queryLower)) ||
          (c.customer_email && c.customer_email.toLowerCase().includes(queryLower))
      );
    }

    // Sort by latest message
    convs.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));

    res.status(200).json({ success: true, count: convs.length, data: convs });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Super Admin gets message history for a specific conversation
 * @route   GET /api/chat/admin/conversation/:conversationId/messages
 * @access  Private (Super Admin)
 */
exports.getAdminConversationMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    if (getStatus()) {
      const conversation = await ChatConversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({ success: false, message: 'Conversation not found' });
      }

      // Mark customer messages as Read
      await ChatMessage.updateMany(
        { conversation_id: conversation._id, sender_role: 'workshop_customer', message_status: { $ne: 'Read' } },
        { message_status: 'Read' }
      );
      conversation.unread_by_admin = 0;
      await conversation.save();

      const messages = await ChatMessage.find({ conversation_id: conversation._id }).sort({ created_at: 1 });
      return res.status(200).json({ success: true, data: messages, conversation });
    }

    // Mock store
    const conv = mockStore.chat_conversations.find(
      (c) => c._id === conversationId || c.conversation_id === conversationId || c.workshop_id === conversationId
    );
    if (!conv) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Mark as read
    conv.unread_by_admin = 0;
    mockStore.chat_messages.forEach((m) => {
      if (
        (m.conversation_id === conv._id || m.conversation_id === conv.conversation_id || m.workshop_id === conv.workshop_id) &&
        m.sender_role === 'workshop_customer'
      ) {
        m.message_status = 'Read';
      }
    });

    const messages = mockStore.chat_messages
      .filter((m) => m.conversation_id === conv._id || m.conversation_id === conv.conversation_id || m.workshop_id === conv.workshop_id)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    emitSocketEvent(req, 'messages_read', { conversation_id: conv._id, read_by: 'super_admin' }, `room_${conv.workshop_id}`);

    res.status(200).json({ success: true, data: messages, conversation: conv });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Super Admin sends reply message to Workshop Customer
 * @route   POST /api/chat/admin/message
 * @access  Private (Super Admin)
 */
exports.sendAdminMessage = async (req, res, next) => {
  try {
    const { conversation_id, message } = req.body;
    let attachmentPath = '';
    let attachmentName = '';
    let attachmentType = 'none';

    if (req.file) {
      attachmentPath = `/uploads/${req.file.filename}`;
      attachmentName = req.file.originalname;
      attachmentType = req.file.mimetype.startsWith('image/') ? 'image' : 'document';
    }

    if (!message && !attachmentPath) {
      return res.status(400).json({
        success: false,
        message: 'Message content or attachment is required',
      });
    }

    const messagePreview = message || (attachmentType === 'image' ? '📷 Image attachment' : '📎 Document attachment');

    if (getStatus()) {
      const conv = await ChatConversation.findById(conversation_id);
      if (!conv) {
        return res.status(404).json({ success: false, message: 'Conversation not found' });
      }

      conv.last_message = messagePreview;
      conv.last_message_at = new Date();
      conv.unread_by_customer = (conv.unread_by_customer || 0) + 1;
      await conv.save();

      const newMsg = await ChatMessage.create({
        conversation_id: conv._id,
        workshop_id: conv.workshop_id,
        sender_id: req.userId,
        sender_role: 'super_admin',
        message: message || '',
        attachment_path: attachmentPath,
        attachment_name: attachmentName,
        attachment_type: attachmentType,
        message_status: 'Sent',
        created_at: new Date(),
      });

      emitSocketEvent(req, 'new_message', { message: newMsg, conversation: conv }, `room_${conv.workshop_id}`);
      emitSocketEvent(req, 'new_message', { message: newMsg, conversation: conv }, 'admin_room');

      return res.status(201).json({ success: true, data: newMsg, conversation: conv });
    }

    // Mock store
    const conv = mockStore.chat_conversations.find(
      (c) => c._id === conversation_id || c.conversation_id === conversation_id || c.workshop_id === conversation_id
    );
    if (!conv) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    conv.last_message = messagePreview;
    conv.last_message_at = new Date();
    conv.unread_by_customer = (conv.unread_by_customer || 0) + 1;

    const newMsg = {
      _id: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      conversation_id: conv._id,
      workshop_id: conv.workshop_id,
      sender_id: req.userId,
      sender_name: 'Platform Super Admin',
      sender_role: 'super_admin',
      message: message || '',
      attachment_path: attachmentPath,
      attachment_name: attachmentName,
      attachment_type: attachmentType,
      message_status: 'Sent',
      created_at: new Date(),
    };
    mockStore.chat_messages.push(newMsg);

    emitSocketEvent(req, 'new_message', { message: newMsg, conversation: conv }, `room_${conv.workshop_id}`);
    emitSocketEvent(req, 'new_message', { message: newMsg, conversation: conv }, 'admin_room');

    res.status(201).json({ success: true, data: newMsg, conversation: conv });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Super Admin close or reopen conversation
 * @route   PUT /api/chat/admin/conversation/:conversationId/status
 * @access  Private (Super Admin)
 */
exports.updateConversationStatus = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { status } = req.body; // 'Open' or 'Closed'

    if (!['Open', 'Closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Open or Closed' });
    }

    if (getStatus()) {
      const conv = await ChatConversation.findById(conversationId);
      if (!conv) {
        return res.status(404).json({ success: false, message: 'Conversation not found' });
      }
      conv.status = status;
      conv.updated_at = new Date();
      await conv.save();

      emitSocketEvent(req, 'conversation_status_updated', { conversation_id: conv._id, status }, `room_${conv.workshop_id}`);
      emitSocketEvent(req, 'conversation_status_updated', { conversation_id: conv._id, status }, 'admin_room');

      return res.status(200).json({ success: true, data: conv });
    }

    // Mock store
    const conv = mockStore.chat_conversations.find(
      (c) => c._id === conversationId || c.conversation_id === conversationId || c.workshop_id === conversationId
    );
    if (!conv) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    conv.status = status;
    conv.updated_at = new Date();

    emitSocketEvent(req, 'conversation_status_updated', { conversation_id: conv._id, status }, `room_${conv.workshop_id}`);
    emitSocketEvent(req, 'conversation_status_updated', { conversation_id: conv._id, status }, 'admin_room');

    res.status(200).json({ success: true, data: conv });
  } catch (err) {
    next(err);
  }
};

