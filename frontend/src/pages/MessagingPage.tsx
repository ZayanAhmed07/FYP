import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  FaSearch,
  FaPaperPlane,
  FaUserCircle,
  FaPhone,
  FaVideo,
  FaEllipsisV,
  FaPaperclip,
  FaComments,
} from 'react-icons/fa';
import { authService } from '../services/authService';
import { httpClient } from '../api/httpClient';
import { Box, Typography, TextField, IconButton, Avatar, Button, Chip } from '@mui/material';
import { useSocket } from '../hooks/useSocket';
import NotificationDropdown from '../components/layout/NotificationDropdown';

interface User {
  _id: string;
  name: string;
  email?: string;
  profileImage?: string;
  isOnline?: boolean;
}

interface Message {
  _id: string;
  conversationId: string;
  sender?: User;
  senderId?: User;
  receiver?: User;
  receiverId?: User;
  content: string;
  attachments?: string[];
  createdAt: string;
}

interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: {
    _id: string;
    content: string;
    sender?: User;
    createdAt?: string;
  };
  updatedAt?: string;
  unreadCount?: Record<string, number>;
}

const MessagingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId: selectedUserIdParam } = useParams();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(selectedUserIdParam || null);
  const [preselectedUser, setPreselectedUser] = useState<User | null>(
    (location.state as { user?: User })?.user || null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialLoadRef = useRef(true);

  // Socket.IO connection for real-time messaging
  const { connect, disconnect, isConnected, markConversationAsRead } = useSocket({
    onMessageReceive: (data) => {
      // If message is for current conversation, add it
      if (data.message && selectedUserId) {
        const senderId =
          data.message.senderId?._id || data.message.senderId || data.message.sender?._id;

        // Add message if it's from the person we're chatting with OR if it's our own message
        if (
          senderId === selectedUserId ||
          senderId === currentUser?.id ||
          senderId === currentUser?._id
        ) {
          setMessages((prev) => [...prev, data.message]);
          // Mark as read since user is viewing the conversation
          markAsRead(selectedUserId);
        }
      }
      // Refresh conversations to update list
      fetchConversations();
    },
    onMessagesRead: (data) => {
      // Update message statuses
      if (data.messageIds && Array.isArray(data.messageIds)) {
        setMessages((prev) =>
          prev.map((msg) =>
            data.messageIds.includes(msg._id) ? { ...msg, isRead: true, status: 'seen' } : msg,
          ),
        );
      }
    },
    onUnreadCountUpdate: () => {
      // Refresh conversations to show updated counts
      fetchConversations();
    },
  });

  // Initialize and fetch user
  useEffect(() => {
    const user = authService.getCurrentUser();

    if (!user) {
      navigate('/login');
      return;
    }

    // Normalize user id fields: some responses use `id`, others `_id`.
    const userId = (user as any).id || (user as any)._id;
    const normalizedUser = {
      ...user,
      id: userId,
      _id: userId,
    } as any;

    setCurrentUser(normalizedUser);

    // Connect to Socket.IO first
    connect();

    // CRITICAL: Fetch conversations immediately when page loads
    // This ensures conversations load regardless of navigation state
    fetchConversations();

    // Poll conversations less frequently since we have real-time updates
    const conversationInterval = setInterval(() => {
      fetchConversations();
    }, 10000); // Reduced from 5s to 10s

    return () => {
      clearInterval(conversationInterval);
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Handle URL parameter changes
  useEffect(() => {
    if (selectedUserIdParam) {
      setSelectedUserId(selectedUserIdParam);
    }
  }, [selectedUserIdParam]);

  // Fetch messages when conversation changes and manage socket rooms
  useEffect(() => {
    if (selectedUserId && currentUser) {
      console.log('[MessagingPage] Selected conversation changed:', selectedUserId);
      
      // Fetch messages first to get conversation data
      fetchMessages(selectedUserId);
      markAsRead(selectedUserId);

      // Poll messages every 3 seconds (reduced frequency with socket)
      const messageInterval = setInterval(() => {
        fetchMessages(selectedUserId);
      }, 3000);

      return () => {
        clearInterval(messageInterval);
      };
    }
  }, [selectedUserId, currentUser]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = useCallback(async () => {
    try {
      console.log('[MessagingPage] Fetching conversations...');
      const response = await httpClient.get('/conversations');
      const conversationsData = response.data?.data || [];
      console.log('[MessagingPage] Conversations loaded:', conversationsData.length);
      
      setConversations(conversationsData);

      // Only auto-select on initial load, not on subsequent polling fetches
      if (initialLoadRef.current && !selectedUserId && !selectedUserIdParam && !preselectedUser && conversationsData.length > 0 && currentUser) {
        const firstConversation = conversationsData[0];
        const otherUser = firstConversation.participants?.find((p: any) => {
          const participantId = p._id || p.id;
          return participantId !== currentUser.id && participantId !== currentUser._id;
        });
        if (otherUser) {
          const otherUserId = otherUser._id || otherUser.id;
          console.log('[MessagingPage] Auto-selecting first conversation:', otherUserId);
          setSelectedUserId(otherUserId);
        }
        initialLoadRef.current = false;
      }
    } catch (error: any) {
      console.error('💥 [MessagingPage] Failed to fetch conversations:', error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
      setConversations([]);
    }
  }, [currentUser, selectedUserId, selectedUserIdParam, preselectedUser]);

  const fetchMessages = async (otherUserId: string) => {
    try {
      setLoading(true);
      const response = await httpClient.get(`/messages/${otherUserId}`);

      const data = response.data?.data;
      if (data?.messages) {
        // Keep original order (oldest first, newest last)
        setMessages(data.messages);
      } else if (Array.isArray(data)) {
        setMessages(data);
      } else {
        setMessages([]);
      }
    } catch (error: any) {
      console.error('[MessagingPage] Failed to fetch messages:', {
        error: error.response?.data || error.message,
        otherUserId,
      });
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = useCallback(
    async (otherUserId: string) => {
      try {
        // Try Socket.IO first for real-time updates
        if (isConnected) {
          await markConversationAsRead(otherUserId);
        } else {
          // Fallback to HTTP if socket not connected
          await httpClient.patch(`/messages/${otherUserId}/read`);
        }
        // Refresh conversations to update unread counts
        fetchConversations();
      } catch (error) {
        console.error('Failed to mark as read', error);
      }
    },
    [isConnected],
  );

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedUserId || sending) {
      return;
    }

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      setSending(true);

      const response = await httpClient.post('/messages', {
        receiverId: selectedUserId,
        content: messageContent,
      });

      // Immediately add the message to the UI for instant feedback
      if (response.data?.data) {
        setMessages((prev) => [...prev, response.data.data]);
      }

      // Then fetch to sync
      await fetchMessages(selectedUserId);
      await fetchConversations();
      inputRef.current?.focus();
    } catch (error: any) {
      console.error('💥 [MessagingPage] Failed to send message:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        receiverId: selectedUserId,
        url: error.config?.url,
        method: error.config?.method,
      });
      // Restore message if failed
      setNewMessage(messageContent);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      alert(`Failed to send message: ${errorMessage}`);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e as any);
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUserId) {
      return;
    }

    try {
      setUploadingFile(true);
      
      // Create FormData to send file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('receiverId', selectedUserId);

      const response = await httpClient.post('/messages/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.data) {
        setMessages((prev) => [...prev, response.data.data]);
      }

      await fetchMessages(selectedUserId);
      await fetchConversations();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Failed to upload file:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload file';
      alert(`Upload failed: ${errorMessage}`);
    } finally {
      setUploadingFile(false);
    }
  };

  const getOtherUser = (conversation: Conversation): User | null => {
    if (!currentUser || !Array.isArray(conversation.participants)) return null;

    return (
      conversation.participants.find((p) => {
        const participantId = p._id || '';
        return participantId !== currentUser._id && participantId !== currentUser._id;
      }) || null
    );
  };

  const getUnreadCount = (conversation: Conversation): number => {
    if (!currentUser || !conversation.unreadCount) return 0;
    return (
      conversation.unreadCount[currentUser.id] || conversation.unreadCount[currentUser._id] || 0
    );
  };

  const selectedUserFromConversations = conversations
    .flatMap((c) => c.participants || [])
    .find((p) => (p._id || '') === selectedUserId);

  useEffect(() => {
    if (selectedUserFromConversations) {
      setPreselectedUser(null);
    }
  }, [selectedUserFromConversations]);

  useEffect(() => {
    const stateUser = (location.state as { user?: User })?.user;
    if (stateUser && !selectedUserFromConversations) {
      setPreselectedUser(stateUser);
    }
  }, [location.state, selectedUserFromConversations]);

  const selectedUser = selectedUserFromConversations || preselectedUser || null;

  const filteredConversations = conversations.filter((conv) => {
    const otherUser = getOtherUser(conv);
    if (!otherUser) return false;
    return otherUser.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getTotalUnread = () => {
    return conversations.reduce((sum, conv) => sum + getUnreadCount(conv), 0);
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';
    let currentGroup: Message[] = [];

    messages.forEach((message) => {
      const messageDate = new Date(message.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
        display: 'flex',
        py: 4,
        px: { xs: 2, md: 4 },
      }}
    >
      {/* Conversations List */}
      <Box
        sx={{
          display: selectedUserId ? { xs: 'none', md: 'flex' } : 'flex',
          flexDirection: 'column',
          width: { xs: '100%', md: '380px' },
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          mr: { md: 3 },
          height: 'calc(100vh - 64px)',
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
            color: 'white',
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              onClick={() => navigate(-1)}
              title="Back"
              sx={{
                color: 'white',
                minWidth: 'auto',
                p: 0.5,
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              ← Back
            </Button>
            <Box
              component="img"
              src="/src/assets/logo.png"
              alt="Expert Raah"
              sx={{ width: 32, height: 32, borderRadius: '8px' }}
            />
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
              EXPERT RAAH
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationDropdown />
            {currentUser?.profileImage ? (
              <Avatar
                src={currentUser.profileImage}
                alt={currentUser.name}
                sx={{ width: 36, height: 36 }}
              />
            ) : (
              <FaUserCircle style={{ fontSize: '36px' }} />
            )}
          </Box>
        </Box>

        <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a', flex: 1 }}>
              Messages{' '}
              {getTotalUnread() > 0 && (
                <Chip
                  label={getTotalUnread()}
                  size="small"
                  sx={{
                    background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                    color: 'white',
                    fontWeight: 700,
                    height: 24,
                    ml: 1,
                  }}
                />
              )}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: 2.5, py: 2 }}>
          <TextField
            fullWidth
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <FaSearch style={{ marginRight: '12px', color: '#9ca3af' }} />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.8)',
                '& fieldset': { border: '1px solid rgba(0, 0, 0, 0.08)' },
                '&:hover fieldset': { borderColor: '#0db4bc' },
                '&.Mui-focused fieldset': { borderColor: '#0db4bc' },
              },
            }}
          />
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '3px',
            },
          }}
        >
          {filteredConversations.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 2,
                px: 3,
                py: 8,
              }}
            >
              <FaComments style={{ fontSize: '72px', color: '#d1d5db', opacity: 0.5 }} />
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#6b7280',
                  textAlign: 'center',
                }}
              >
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </Typography>
              <Typography 
                sx={{ 
                  fontSize: '0.9rem', 
                  color: '#9ca3af',
                  textAlign: 'center',
                  maxWidth: '280px',
                }}
              >
                {searchQuery 
                  ? 'Try a different search term' 
                  : 'Start chatting with consultants by visiting their profiles'}
              </Typography>
            </Box>
          ) : (
            filteredConversations.map((conversation) => {
              const otherUser = getOtherUser(conversation);
              if (!otherUser) return null;

              const unreadCount = getUnreadCount(conversation);
              const isSelected = selectedUserId === otherUser._id;

              return (
                <Box
                  key={`conversation-${conversation._id}-${otherUser._id || otherUser._id}`}
                  onClick={() => {
                    const otherUserId = otherUser._id || otherUser._id;
                    setSelectedUserId(otherUserId);
                  }}
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    p: 2,
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(13, 180, 188, 0.08) 0%, rgba(10, 139, 145, 0.08) 100%)'
                      : 'transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(13, 180, 188, 0.12) 0%, rgba(10, 139, 145, 0.12) 100%)'
                        : 'rgba(13, 180, 188, 0.04)',
                    },
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    {otherUser.profileImage ? (
                      <Avatar src={otherUser.profileImage} alt={otherUser.name} sx={{ width: 48, height: 48 }} />
                    ) : (
                      <FaUserCircle style={{ fontSize: '48px', color: '#9ca3af' }} />
                    )}
                    {otherUser.isOnline && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 2,
                          right: 2,
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: '#22c55e',
                          border: '2px solid white',
                        }}
                      />
                    )}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography
                        sx={{
                          fontWeight: unreadCount > 0 ? 700 : 500,
                          color: '#1a1a1a',
                          fontSize: '0.95rem',
                        }}
                      >
                        {otherUser.name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {conversation.lastMessage?.createdAt
                          ? formatTime(conversation.lastMessage.createdAt)
                          : conversation.updatedAt
                            ? formatTime(conversation.updatedAt)
                            : ''}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography
                        sx={{
                          fontSize: '0.85rem',
                          color: unreadCount > 0 ? '#1a1a1a' : '#6b7280',
                          fontWeight: unreadCount > 0 ? 600 : 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}
                      >
                        {conversation.lastMessage?.content ||
                          'Such a great consultation session it was. WI...'}
                      </Typography>
                      {unreadCount > 0 && (
                        <Chip
                          label={unreadCount}
                          size="small"
                          sx={{
                            background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                            color: 'white',
                            fontWeight: 700,
                            height: 20,
                            minWidth: 20,
                            '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem' },
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </Box>

      {/* Right - Chat Area */}
      <Box
        sx={{
          display: selectedUserId ? 'flex' : { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          flex: 1,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          height: 'calc(100vh - 64px)',
        }}
      >
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                color: 'white',
                p: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {selectedUser.profileImage ? (
                  <Avatar src={selectedUser.profileImage} alt={selectedUser.name} sx={{ width: 40, height: 40 }} />
                ) : (
                  <FaUserCircle style={{ fontSize: '40px' }} />
                )}
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                    {selectedUser.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', opacity: 0.9 }}>
                    {selectedUser.isOnline ? (
                      <Box component="span" sx={{ color: '#22c55e', fontWeight: 600 }}>
                        Active Now
                      </Box>
                    ) : (
                      'Mon, 09:40 AM'
                    )}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  title="Call"
                  sx={{
                    color: 'white',
                    '&:hover': { background: 'rgba(255, 255, 255, 0.1)' },
                  }}
                >
                  <FaPhone />
                </IconButton>
                <IconButton
                  title="Video Call"
                  sx={{
                    color: 'white',
                    '&:hover': { background: 'rgba(255, 255, 255, 0.1)' },
                  }}
                >
                  <FaVideo />
                </IconButton>
                <IconButton
                  title="More"
                  sx={{
                    color: 'white',
                    '&:hover': { background: 'rgba(255, 255, 255, 0.1)' },
                  }}
                >
                  <FaEllipsisV />
                </IconButton>
              </Box>
            </Box>

            {/* Messages Container */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                background: '#f9fafb',
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '3px',
                },
              }}
            >
              {loading && messages.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#9ca3af',
                  }}
                >
                  <Typography>Loading messages...</Typography>
                </Box>
              ) : messages.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    gap: 1.5,
                    color: '#9ca3af',
                  }}
                >
                  <FaUserCircle style={{ fontSize: '60px', opacity: 0.3 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#6b7280' }}>
                    No messages yet
                  </Typography>
                  <Typography sx={{ fontSize: '0.9rem' }}>
                    Start the conversation by sending a message
                  </Typography>
                </Box>
              ) : (
                <>
                  {groupMessagesByDate(messages).map((group, groupIndex) => (
                    <Box key={`message-group-${groupIndex}-${group.date}`}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          my: 2,
                        }}
                      >
                        <Chip
                          label={group.date}
                          size="small"
                          sx={{
                            background: 'rgba(0, 0, 0, 0.05)',
                            color: '#6b7280',
                            fontSize: '0.75rem',
                          }}
                        />
                      </Box>
                      {group.messages.map((message) => {
                        const messageSender = message.sender || message.senderId;

                        const isSent =
                          messageSender?._id === currentUser?._id ||
                          messageSender?._id === currentUser?._id;

                        return (
                          <Box
                            key={`message-${message._id}-${message.createdAt}`}
                            sx={{
                              display: 'flex',
                              justifyContent: isSent ? 'flex-end' : 'flex-start',
                              gap: 1,
                              mb: 1.5,
                            }}
                          >
                            {!isSent && (
                              <Box sx={{ flexShrink: 0 }}>
                                {messageSender?.profileImage ? (
                                  <Avatar
                                    src={messageSender.profileImage}
                                    alt={messageSender?.name || 'User'}
                                    sx={{ width: 32, height: 32 }}
                                  />
                                ) : (
                                  <FaUserCircle style={{ fontSize: '32px', color: '#9ca3af' }} />
                                )}
                              </Box>
                            )}
                            <Box
                              sx={{
                                maxWidth: '70%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: isSent ? 'flex-end' : 'flex-start',
                              }}
                            >
                              <Box
                                sx={{
                                  background: isSent
                                    ? 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)'
                                    : 'white',
                                  color: isSent ? 'white' : '#1a1a1a',
                                  borderRadius: isSent ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                  p: 1.5,
                                  px: 2,
                                  boxShadow: isSent 
                                    ? '0 2px 12px rgba(13, 180, 188, 0.25)' 
                                    : '0 2px 8px rgba(0, 0, 0, 0.08)',
                                  wordBreak: 'break-word',
                                }}
                              >
                                <Typography 
                                  sx={{ 
                                    fontSize: '0.95rem', 
                                    lineHeight: 1.5,
                                    whiteSpace: 'pre-wrap',
                                  }}
                                >
                                  {message.content}
                                </Typography>
                                {message.attachments && message.attachments.length > 0 && (
                                  <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    {message.attachments.map((attachment, idx) => (
                                      <Button
                                        key={idx}
                                        component="a"
                                        href={`data:application/octet-stream;base64,${attachment}`}
                                        download={`file-${idx}`}
                                        title="Click to download"
                                        startIcon={<span>📥</span>}
                                        sx={{
                                          color: isSent ? 'white' : '#0db4bc',
                                          textTransform: 'none',
                                          fontSize: '0.85rem',
                                          justifyContent: 'flex-start',
                                          '&:hover': {
                                            background: isSent
                                              ? 'rgba(255, 255, 255, 0.1)'
                                              : 'rgba(13, 180, 188, 0.08)',
                                          },
                                        }}
                                      >
                                        Download
                                      </Button>
                                    ))}
                                  </Box>
                                )}
                              </Box>
                              <Typography 
                                sx={{ 
                                  fontSize: '0.7rem', 
                                  color: '#9ca3af',
                                  mt: 0.5,
                                  px: 0.5,
                                }}
                              >
                                {new Date(message.createdAt).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </Typography>
                            </Box>
                            {isSent && (
                              <Box sx={{ flexShrink: 0, alignSelf: 'flex-end', mb: 3 }}>
                                {currentUser?.profileImage ? (
                                  <Avatar
                                    src={currentUser.profileImage}
                                    alt={currentUser.name}
                                    sx={{ width: 32, height: 32 }}
                                  />
                                ) : (
                                  <FaUserCircle style={{ fontSize: '32px', color: '#9ca3af' }} />
                                )}
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </Box>

            {/* Message Input */}
            <Box
              component="form"
              onSubmit={sendMessage}
              sx={{
                p: 2,
                borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                background: 'white',
                display: 'flex',
                gap: 1,
                alignItems: 'flex-end',
              }}
            >
              <Box sx={{ flex: 1 }}>
                <TextField
                  inputRef={inputRef}
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="Type a message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sending || uploadingFile}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ display: 'flex', gap: 0.5, mr: 1 }}>
                        <input
                          ref={fileInputRef}
                          type="file"
                          style={{ display: 'none' }}
                          onChange={handleFileSelect}
                          disabled={uploadingFile}
                        />
                        <IconButton
                          size="small"
                          title="Attach file"
                          onClick={handleAttachmentClick}
                          disabled={uploadingFile}
                          sx={{ color: '#0db4bc' }}
                        >
                          <FaPaperclip />
                        </IconButton>
                        <IconButton size="small" title="Add emoji" sx={{ color: '#0db4bc' }}>
                          😊
                        </IconButton>
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '20px',
                      background: '#f9fafb',
                      '& fieldset': { border: '1px solid rgba(0, 0, 0, 0.08)' },
                      '&:hover fieldset': { borderColor: '#0db4bc' },
                      '&.Mui-focused fieldset': { borderColor: '#0db4bc' },
                    },
                  }}
                />
              </Box>
              <IconButton
                type="submit"
                disabled={sending || !newMessage.trim() || uploadingFile}
                title="Send message"
                sx={{
                  background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                  color: 'white',
                  width: 48,
                  height: 48,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0a8b91 0%, #2d5a5f 100%)',
                    transform: 'scale(1.05)',
                  },
                  '&:disabled': {
                    background: 'rgba(0, 0, 0, 0.12)',
                    color: 'rgba(0, 0, 0, 0.26)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <FaPaperPlane />
              </IconButton>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#9ca3af',
              gap: 2,
            }}
          >
            <FaUserCircle style={{ fontSize: '80px', opacity: 0.3 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#6b7280' }}>
              Select a conversation
            </Typography>
            <Typography sx={{ color: '#9ca3af' }}>
              Choose a conversation from the list to start messaging
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MessagingPage;
