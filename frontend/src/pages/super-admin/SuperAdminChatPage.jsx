import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api, { getSocketUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function SuperAdminChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const socketUrl = getSocketUrl();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isCustomerTyping]);

  // Connect Socket.IO
  useEffect(() => {
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_room', { role: 'super_admin' });
    });

    socket.on('new_message', (data) => {
      if (data && data.message) {
        // Update messages list if current conversation is active
        if (
          selectedConv &&
          (data.message.conversation_id === selectedConv._id ||
            data.message.conversation_id === selectedConv.conversation_id ||
            data.message.workshop_id === selectedConv.workshop_id)
        ) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === data.message._id)) return prev;
            return [...prev, data.message];
          });
        }

        // Update conversation list item
        setConversations((prev) => {
          return prev.map((c) => {
            if (
              c._id === data.message.conversation_id ||
              c.conversation_id === data.message.conversation_id ||
              c.workshop_id === data.message.workshop_id
            ) {
              const isSelected = selectedConv && selectedConv._id === c._id;
              return {
                ...c,
                last_message: data.message.message || '📎 Attachment',
                last_message_at: data.message.created_at,
                unread_by_admin: isSelected ? 0 : (c.unread_by_admin || 0) + 1,
              };
            }
            return c;
          });
        });
      }
    });

    socket.on('user_typing', (data) => {
      if (selectedConv && data.workshop_id === selectedConv.workshop_id && data.role === 'workshop_customer') {
        setIsCustomerTyping(true);
      }
    });

    socket.on('user_stop_typing', (data) => {
      if (selectedConv && data.workshop_id === selectedConv.workshop_id) {
        setIsCustomerTyping(false);
      }
    });

    socket.on('messages_read', (data) => {
      if (selectedConv && data.workshop_id === selectedConv.workshop_id && data.read_by === 'customer') {
        setMessages((prev) =>
          prev.map((m) => (m.sender_role === 'super_admin' ? { ...m, message_status: 'Read' } : m))
        );
      }
    });

    fetchConversations();

    return () => {
      socket.disconnect();
    };
  }, [selectedConv]);

  const fetchConversations = async () => {
    try {
      setLoadingConvs(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (searchQuery) params.q = searchQuery;

      const res = await api.get('/chat/admin/conversations', { params });
      if (res.data?.success) {
        setConversations(res.data.data);
        if (!selectedConv && res.data.data.length > 0) {
          handleSelectConversation(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConvs(false);
    }
  };

  const handleSelectConversation = async (conv) => {
    setSelectedConv(conv);
    setIsCustomerTyping(false);
    try {
      setLoadingMsgs(true);
      const res = await api.get(`/chat/admin/conversation/${conv._id}/messages`);
      if (res.data?.success) {
        setMessages(res.data.data);
        // Clear unread badge locally
        setConversations((prev) =>
          prev.map((c) => (c._id === conv._id ? { ...c, unread_by_admin: 0 } : c))
        );
      }
    } catch (err) {
      console.error('Failed to load messages for conversation:', err);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (socketRef.current && selectedConv?.workshop_id) {
      socketRef.current.emit('typing', {
        workshop_id: selectedConv.workshop_id,
        role: 'super_admin',
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('stop_typing', {
          workshop_id: selectedConv.workshop_id,
          role: 'super_admin',
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
    if ((!inputText.trim() && !attachment) || sending || !selectedConv) return;

    try {
      setSending(true);
      const formData = new FormData();
      formData.append('conversation_id', selectedConv._id);
      if (inputText.trim()) formData.append('message', inputText.trim());
      if (attachment) formData.append('attachment', attachment);

      setInputText('');
      handleRemoveAttachment();

      const res = await api.post('/chat/admin/message', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data?.data) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.data.data._id)) return prev;
          return [...prev, res.data.data];
        });
      }
    } catch (err) {
      console.error('Failed to send admin reply:', err);
      alert('Could not deliver message. Please retry.');
    } finally {
      setSending(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedConv) return;
    const nextStatus = selectedConv.status === 'Open' ? 'Closed' : 'Open';

    try {
      const res = await api.put(`/chat/admin/conversation/${selectedConv._id}/status`, {
        status: nextStatus,
      });
      if (res.data?.success) {
        setSelectedConv((prev) => ({ ...prev, status: nextStatus }));
        setConversations((prev) =>
          prev.map((c) => (c._id === selectedConv._id ? { ...c, status: nextStatus } : c))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Could not update conversation status.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Live Support & Support Messaging
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Centralized unified inbox to communicate with all registered workshop owners in real time.
          </p>
        </div>

        <button
          onClick={fetchConversations}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 self-start sm:self-auto transition"
          title="Refresh Inbox"
        >
          🔄 Refresh Inbox
        </button>
      </div>

      {/* Unified Two-Panel Chat UI */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[680px]">
        {/* Left Panel: Conversations List */}
        <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col bg-slate-950/70">
          {/* Search & Filter */}
          <div className="p-3.5 border-b border-slate-800 space-y-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchConversations()}
                placeholder="Search workshop or customer..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto text-[11px]">
              {['All', 'Unread', 'Open', 'Closed'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    statusFilter === tab
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {loadingConvs ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs px-4">
                No conversations found matching filters.
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedConv?._id === conv._id;
                const unread = conv.unread_by_admin || 0;

                return (
                  <button
                    key={conv._id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full text-left p-3.5 transition-all flex items-start space-x-3 ${
                      isSelected
                        ? 'bg-indigo-950/70 border-l-4 border-indigo-500'
                        : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white text-sm shrink-0">
                      🏢
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-xs text-white truncate">
                          {conv.workshop_name}
                        </h4>
                        <span className="text-[10px] text-slate-500">
                          {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {conv.customer_name} ({conv.workshop_id})
                      </p>

                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-slate-400 truncate max-w-[180px]">
                          {conv.last_message || 'Started chat'}
                        </p>
                        {unread > 0 && (
                          <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Selected Active Chat */}
        <div className="flex-1 flex flex-col bg-slate-900">
          {selectedConv ? (
            <>
              {/* Top Chat Header */}
              <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-sm text-white">
                      {selectedConv.workshop_name}
                    </h3>
                    <span className="font-mono text-[10px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-indigo-400">
                      {selectedConv.workshop_id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        selectedConv.status === 'Open'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800/60'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {selectedConv.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Owner: <strong className="text-slate-200">{selectedConv.customer_name}</strong> •{' '}
                    {selectedConv.customer_email} • {selectedConv.customer_phone}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleToggleStatus}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      selectedConv.status === 'Open'
                        ? 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800/60'
                        : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60'
                    }`}
                  >
                    {selectedConv.status === 'Open' ? 'Close Ticket' : 'Reopen Ticket'}
                  </button>
                </div>
              </div>

              {/* Messages Content */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-950/40">
                {loadingMsgs ? (
                  <div className="py-20 text-center text-slate-500 text-xs">
                    Loading conversation transcript...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-20 text-center text-slate-500 text-xs">
                    No messages yet in this conversation.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdmin = msg.sender_role === 'super_admin';
                    const timeString = new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-md ${
                            isAdmin
                              ? 'bg-indigo-600 text-white rounded-br-xs'
                              : 'bg-slate-800 text-slate-100 border border-slate-700/60 rounded-bl-xs'
                          }`}
                        >
                          {!isAdmin && (
                            <p className="text-[10px] font-semibold text-indigo-400 mb-1">
                              {selectedConv.customer_name} (Workshop Owner)
                            </p>
                          )}

                          {msg.message && <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>}

                          {/* Attachment */}
                          {msg.attachment_path && (
                            <div className="mt-2 pt-2 border-t border-white/10">
                              {msg.attachment_type === 'image' ? (
                                <a
                                  href={msg.attachment_path.startsWith('http') ? msg.attachment_path : `${socketUrl}${msg.attachment_path}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block rounded-lg overflow-hidden border border-black/20"
                                >
                                  <img
                                    src={msg.attachment_path.startsWith('http') ? msg.attachment_path : `${socketUrl}${msg.attachment_path}`}
                                    alt="attachment"
                                    className="max-h-56 w-full object-cover"
                                  />
                                </a>
                              ) : (
                                <a
                                  href={msg.attachment_path.startsWith('http') ? msg.attachment_path : `${socketUrl}${msg.attachment_path}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center space-x-2 text-xs bg-black/20 p-2 rounded-lg hover:underline"
                                >
                                  <span>📎</span>
                                  <span className="truncate max-w-[200px]">{msg.attachment_name || 'Download File'}</span>
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center space-x-1.5 mt-1 text-[10px] text-slate-500 px-1">
                          <span>{timeString}</span>
                          {isAdmin && (
                            <span>
                              {msg.message_status === 'Read' ? (
                                <span className="text-cyan-400 font-bold">✓✓ Read</span>
                              ) : msg.message_status === 'Delivered' ? (
                                <span className="text-slate-400">✓✓ Delivered</span>
                              ) : (
                                <span>✓ Sent</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Typing indicator */}
                {isCustomerTyping && (
                  <div className="flex items-center space-x-2 text-xs text-indigo-400 bg-slate-900 px-3 py-1.5 rounded-full w-max border border-slate-800">
                    <span className="flex space-x-1">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </span>
                    <span>{selectedConv.customer_name} is typing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Attachment Preview Chip */}
              {attachment && (
                <div className="px-5 py-2 bg-indigo-950/70 border-t border-indigo-900/60 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-indigo-200">
                    {attachmentPreview ? (
                      <img src={attachmentPreview} alt="thumb" className="w-7 h-7 object-cover rounded" />
                    ) : (
                      <span>📄</span>
                    )}
                    <span className="truncate max-w-[250px] font-medium">{attachment.name}</span>
                  </div>
                  <button
                    onClick={handleRemoveAttachment}
                    className="text-slate-400 hover:text-rose-400 p-1"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Message Input Box */}
              <form
                onSubmit={handleSendMessage}
                className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center space-x-2"
              >
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
                  className="p-2.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-900 rounded-xl transition"
                  title="Attach file"
                >
                  📎
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder={`Reply to ${selectedConv.customer_name}...`}
                  className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none"
                />

                <button
                  type="submit"
                  disabled={(!inputText.trim() && !attachment) || sending}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold shadow-md transition"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Select a workshop conversation on the left to review support tickets.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

