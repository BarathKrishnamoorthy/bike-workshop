import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api, { getSocketUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CustomerChatWidget() {
  const { user, workshop } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const socketUrl = getSocketUrl();

  // Scroll to bottom of message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  // Initialize socket connection & fetch conversation history
  useEffect(() => {
    if (!user || user.role === 'super_admin' || !workshop?.workshop_id) return;

    // Connect socket
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_room', {
        role: 'workshop_customer',
        workshop_id: workshop.workshop_id,
        user_id: user.user_id,
      });
    });

    // Listen for incoming messages
    socket.on('new_message', (data) => {
      if (data && data.message) {
        setMessages((prev) => {
          // Avoid duplicate messages
          if (prev.some((m) => m._id === data.message._id)) return prev;
          return [...prev, data.message];
        });

        if (data.conversation) {
          setConversation(data.conversation);
        }

        // If widget is closed and message is from super_admin, increment badge
        if (!isOpen && data.message.sender_role === 'super_admin') {
          setUnreadCount((prev) => prev + 1);
        } else if (isOpen && data.message.sender_role === 'super_admin') {
          // If open, mark as read
          api.put('/chat/read').catch(() => {});
        }
      }
    });

    // Listen for status updates
    socket.on('messages_read', (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.sender_role === 'workshop_customer' ? { ...msg, message_status: 'Read' } : msg
        )
      );
    });

    // Listen for typing indicator
    socket.on('user_typing', (data) => {
      if (data.role === 'super_admin') {
        setIsTyping(true);
      }
    });

    socket.on('user_stop_typing', (data) => {
      if (data.role === 'super_admin') {
        setIsTyping(false);
      }
    });

    socket.on('conversation_status_updated', (data) => {
      if (data.status) {
        setConversation((prev) => (prev ? { ...prev, status: data.status } : null));
      }
    });

    // Initial conversation and message load
    loadConversationAndMessages();

    return () => {
      socket.disconnect();
    };
  }, [user, workshop?.workshop_id]);

  const loadConversationAndMessages = async () => {
    try {
      setLoading(true);
      const convRes = await api.post('/chat/conversation');
      if (convRes.data?.data) {
        setConversation(convRes.data.data);
      }

      const msgRes = await api.get('/chat/messages');
      if (msgRes.data?.data) {
        setMessages(msgRes.data.data);
        const unread = msgRes.data.data.filter(
          (m) => m.sender_role === 'super_admin' && m.message_status !== 'Read'
        ).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Failed to load chat conversation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWidget = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    if (nextState) {
      setUnreadCount(0);
      api.put('/chat/read').catch(() => {});
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    // Emit typing indicator to socket
    if (socketRef.current && workshop?.workshop_id) {
      socketRef.current.emit('typing', {
        workshop_id: workshop.workshop_id,
        role: 'workshop_customer',
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('stop_typing', {
          workshop_id: workshop.workshop_id,
          role: 'workshop_customer',
        });
      }, 1500);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds the 10MB limit.');
      return;
    }

    setAttachment(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setAttachmentPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview(null);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !attachment) || sending) return;

    try {
      setSending(true);

      const formData = new FormData();
      if (inputText.trim()) {
        formData.append('message', inputText.trim());
      }
      if (attachment) {
        formData.append('attachment', attachment);
      }

      setInputText('');
      handleRemoveAttachment();

      const res = await api.post('/chat/message', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.data) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.data.data._id)) return prev;
          return [...prev, res.data.data];
        });
        if (res.data.conversation) {
          setConversation(res.data.conversation);
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to deliver message. Please retry.');
    } finally {
      setSending(false);
    }
  };

  // Predefined quick questions
  const quickQuestions = [
    'Billing & Invoices',
    'GST Configuration Help',
    'Job Card Question',
    'Feature Request',
  ];

  if (!user || user.role === 'super_admin') return null;

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={handleToggleWidget}
            className="group relative flex items-center justify-center w-14 h-14 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-300"
            title="Chat with Platform Support"
            aria-label="Open Live Chat"
          >
            <svg
              className="w-7 h-7 transition-transform group-hover:scale-110"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>

            {/* Unread Message Badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[22px] h-[22px] px-1 text-xs font-bold text-white bg-rose-600 rounded-full border-2 border-white shadow-md animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Slide-out Live Chat Window */}
      {isOpen && (
        <div className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:bottom-6 sm:right-6 z-50 w-auto sm:w-full max-w-sm sm:max-w-md h-[calc(100dvh-1.5rem)] sm:h-[560px] max-h-[580px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-white text-lg">
                  🛡️
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-purple-700 rounded-full"></span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-white leading-tight">
                  Platform Support HQ
                </h3>
                <p className="text-xs text-purple-200 flex items-center mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-ping"></span>
                  Super Admin • Online
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handleToggleWidget}
                className="p-1.5 text-purple-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Minimize Chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Closed Conversation Notice */}
          {conversation?.status === 'Closed' && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center justify-between">
              <span>This ticket was marked Closed. Sending a message will automatically reopen it.</span>
            </div>
          )}

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#f8fafc]">
            {loading && messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                Connecting to Live Support...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  💬
                </div>
                <p className="text-sm font-semibold text-gray-800">Welcome to Live Support!</p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  Ask our platform team anything regarding workshop setup, GST rules, billing, or technical queries.
                </p>

                {/* Quick Prompts */}
                <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputText(`Hi, I have a question regarding ${q}.`)}
                      className="text-xs px-2.5 py-1 bg-white border border-purple-200 text-purple-700 rounded-full hover:bg-purple-50 transition-colors shadow-xs"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isCustomer = msg.sender_role === 'workshop_customer';
                const timeString = new Date(msg.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={msg._id}
                    className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        isCustomer
                          ? 'bg-purple-600 text-white rounded-br-xs'
                          : 'bg-white text-gray-800 border border-gray-100 rounded-bl-xs'
                      }`}
                    >
                      {/* Sender name for admin */}
                      {!isCustomer && (
                        <p className="text-[10px] font-semibold text-purple-700 mb-1 flex items-center">
                          <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-1"></span>
                          Platform Support
                        </p>
                      )}

                      {/* Text */}
                      {msg.message && <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>}

                      {/* Attachment Rendering */}
                      {msg.attachment_path && (
                        <div className="mt-2 pt-2 border-t border-black/10">
                          {msg.attachment_type === 'image' ? (
                            <a
                              href={msg.attachment_path.startsWith('http') ? msg.attachment_path : `${socketUrl}${msg.attachment_path}`}
                              target="_blank"
                              rel="noreferrer"
                              className="block rounded-lg overflow-hidden border border-black/10 hover:opacity-90 transition-opacity"
                            >
                              <img
                                src={msg.attachment_path.startsWith('http') ? msg.attachment_path : `${socketUrl}${msg.attachment_path}`}
                                alt="Attachment"
                                className="max-h-44 w-full object-cover rounded-lg"
                              />
                            </a>
                          ) : (
                            <a
                              href={msg.attachment_path.startsWith('http') ? msg.attachment_path : `${socketUrl}${msg.attachment_path}`}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className={`flex items-center space-x-2 text-xs p-2 rounded-lg ${
                                isCustomer ? 'bg-purple-700/60 text-purple-100' : 'bg-gray-100 text-gray-800'
                              } hover:underline`}
                            >
                              <span>📎</span>
                              <span className="truncate max-w-[180px] font-medium">
                                {msg.attachment_name || 'Download Document'}
                              </span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timestamp & Status ticks */}
                    <div className="flex items-center space-x-1 mt-1 text-[10px] text-gray-400 px-1">
                      <span>{timeString}</span>
                      {isCustomer && (
                        <span>
                          {msg.message_status === 'Read' ? (
                            <span className="text-blue-500 font-bold" title="Read by Admin">✓✓</span>
                          ) : msg.message_status === 'Delivered' ? (
                            <span className="text-gray-400 font-bold" title="Delivered">✓✓</span>
                          ) : (
                            <span className="text-gray-400" title="Sent">✓</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center space-x-2 text-xs text-purple-700 bg-purple-50 px-3 py-1.5 rounded-full w-max animate-pulse">
                <span className="flex space-x-1">
                  <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </span>
                <span>Super Admin is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Attachment Preview Chip */}
          {attachment && (
            <div className="px-4 py-2 bg-purple-50 border-t border-purple-100 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-purple-900 truncate">
                {attachmentPreview ? (
                  <img src={attachmentPreview} alt="thumb" className="w-7 h-7 object-cover rounded" />
                ) : (
                  <span className="text-base">📄</span>
                )}
                <span className="font-medium truncate max-w-[200px]">{attachment.name}</span>
                <span className="text-gray-400">({(attachment.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button
                type="button"
                onClick={handleRemoveAttachment}
                className="text-gray-400 hover:text-rose-600 p-1"
                title="Remove attachment"
              >
                ✕
              </button>
            </div>
          )}

          {/* Input Box Footer */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t border-gray-100 flex items-center space-x-2"
          >
            {/* Attachment input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
              title="Attach Image or Document"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            </button>

            {/* Text input */}
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder="Type your message to Support..."
              className="flex-1 bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl px-3.5 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all"
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={(!inputText.trim() && !attachment) || sending}
              className="p-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:hover:bg-purple-600 text-white rounded-xl shadow-md transition-all active:scale-95"
              title="Send Message"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

