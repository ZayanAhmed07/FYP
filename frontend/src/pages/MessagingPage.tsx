import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FaSearch, FaPaperPlane, FaUserCircle, FaPhone, FaVideo, FaEllipsisV, FaPaperclip } from 'react-icons/fa';
import { authService } from '../services/authService';
import { httpClient } from '../api/httpClient';
import styles from './MessagingPage.module.css';

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
  sender: User;
  receiver: User;
  content: string;
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize and fetch user
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);
    fetchConversations();

    // Poll conversations every 5 seconds
    const conversationInterval = setInterval(() => {
      fetchConversations();
    }, 5000);

    return () => clearInterval(conversationInterval);
  }, [navigate]);

  // Handle URL parameter changes
  useEffect(() => {
    if (selectedUserIdParam) {
      setSelectedUserId(selectedUserIdParam);
    }
  }, [selectedUserIdParam]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (selectedUserId && currentUser) {
      fetchMessages(selectedUserId);
      markAsRead(selectedUserId);

      // Poll messages every 2 seconds
      const messageInterval = setInterval(() => {
        fetchMessages(selectedUserId);
      }, 2000);

      return () => clearInterval(messageInterval);
    }
  }, [selectedUserId, currentUser]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await httpClient.get('/messages/conversations');
      setConversations(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch conversations', error);
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    try {
      setLoading(true);
      const response = await httpClient.get(`/messages/${otherUserId}`);
      const data = response.data?.data;
      if (data?.messages) {
        setMessages(data.messages);
      } else if (Array.isArray(data)) {
        setMessages(data);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to fetch messages', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (otherUserId: string) => {
    try {
      await httpClient.patch(`/messages/${otherUserId}/read`);
      fetchConversations();
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedUserId || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    
    try {
      setSending(true);
      await httpClient.post('/messages', {
        receiverId: selectedUserId,
        content: messageContent,
      });

      await fetchMessages(selectedUserId);
      await fetchConversations();
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message', error);
      setNewMessage(messageContent);
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

  const getOtherUser = (conversation: Conversation): User | null => {
    if (!currentUser || !Array.isArray(conversation.participants)) return null;
    return conversation.participants.find((p) => p._id !== currentUser.id) || null;
  };

  const getUnreadCount = (conversation: Conversation): number => {
    if (!currentUser || !conversation.unreadCount) return 0;
    return conversation.unreadCount[currentUser.id] || 0;
  };

  const selectedUserFromConversations = conversations
    .flatMap((c) => c.participants || [])
    .find((p) => p._id === selectedUserId);

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

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
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
    <div className={styles.messagingPage}>
      {/* Right Sidebar - Conversations List */}
      <aside className={styles.conversationsSidebar}>
        <div className={styles.conversationsHeader}>
          <h2 className={styles.conversationsTitle}>
            Messages {getTotalUnread() > 0 && <span className={styles.unreadBadge}>{getTotalUnread()}</span>}
          </h2>
        </div>

        <div className={styles.searchContainer}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search Projects"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.conversationsList}>
          {filteredConversations.length === 0 ? (
            <div className={styles.emptyConversations}>
              <p>No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const otherUser = getOtherUser(conversation);
              if (!otherUser) return null;

              const unreadCount = getUnreadCount(conversation);
              const isSelected = selectedUserId === otherUser._id;

              return (
                <div
                  key={conversation._id}
                  className={`${styles.conversationItem} ${isSelected ? styles.activeConversation : ''}`}
                  onClick={() => setSelectedUserId(otherUser._id)}
                >
                  <div className={styles.conversationAvatar}>
                    {otherUser.profileImage ? (
                      <img src={otherUser.profileImage} alt={otherUser.name} />
                    ) : (
                      <FaUserCircle className={styles.defaultAvatar} />
                    )}
                    {otherUser.isOnline && <span className={styles.onlineIndicator}></span>}
                  </div>

                  <div className={styles.conversationContent}>
                    <div className={styles.conversationTop}>
                      <span className={styles.conversationName}>{otherUser.name}</span>
                      <span className={styles.conversationTime}>
                        {conversation.lastMessage?.createdAt
                          ? formatTime(conversation.lastMessage.createdAt)
                          : conversation.updatedAt
                            ? formatTime(conversation.updatedAt)
                            : ''}
                      </span>
                    </div>
                    <div className={styles.conversationBottom}>
                      <p className={styles.conversationPreview}>
                        {conversation.lastMessage?.content || 'No messages yet'}
                      </p>
                      {unreadCount > 0 && <span className={styles.unreadCount}>{unreadCount}</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Center - Chat Area */}
      <main className={styles.chatArea}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <header className={styles.chatHeader}>
              <div className={styles.chatHeaderLeft}>
                <div className={styles.chatHeaderAvatar}>
                  {selectedUser.profileImage ? (
                    <img src={selectedUser.profileImage} alt={selectedUser.name} />
                  ) : (
                    <FaUserCircle className={styles.chatHeaderDefaultAvatar} />
                  )}
                </div>
                <div className={styles.chatHeaderInfo}>
                  <h3 className={styles.chatHeaderName}>{selectedUser.name}</h3>
                  <span className={styles.chatHeaderStatus}>
                    {selectedUser.isOnline ? (
                      <span className={styles.activeStatus}>● Active Now</span>
                    ) : (
                      'Offline'
                    )}
                  </span>
                </div>
              </div>
              <div className={styles.chatHeaderActions}>
                <button className={styles.headerActionBtn} title="Call">
                  <FaPhone />
                </button>
                <button className={styles.headerActionBtn} title="Video Call">
                  <FaVideo />
                </button>
                <button className={styles.headerActionBtn} title="More">
                  <FaEllipsisV />
                </button>
              </div>
            </header>

            {/* Messages Container */}
            <div className={styles.messagesContainer}>
              {loading && messages.length === 0 ? (
                <div className={styles.loadingMessages}>Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className={styles.emptyMessages}>
                  <FaUserCircle className={styles.emptyMessagesIcon} />
                  <p>No messages yet</p>
                  <span>Start the conversation by sending a message</span>
                </div>
              ) : (
                <>
                  {groupMessagesByDate(messages).map((group, groupIndex) => (
                    <div key={groupIndex}>
                      <div className={styles.dateDivider}>
                        <span>{group.date}</span>
                      </div>
                      {group.messages.map((message) => {
                        const isSent = message.sender?._id === currentUser?.id;
                        return (
                          <div
                            key={message._id}
                            className={`${styles.messageRow} ${isSent ? styles.sentMessage : styles.receivedMessage}`}
                          >
                            {!isSent && (
                              <div className={styles.messageAvatar}>
                                {message.sender?.profileImage ? (
                                  <img src={message.sender.profileImage} alt={message.sender?.name || 'User'} />
                                ) : (
                                  <FaUserCircle className={styles.messageDefaultAvatar} />
                                )}
                              </div>
                            )}
                            <div className={styles.messageBubble}>
                              <div className={styles.messageText}>{message.content}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className={styles.messageInputContainer}>
              <button type="button" className={styles.attachmentBtn} title="Attach file">
                <FaPaperclip />
              </button>
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className={styles.messageInput}
                disabled={sending}
              />
              <button
                type="submit"
                className={styles.sendBtn}
                disabled={sending || !newMessage.trim()}
                title="Send message"
              >
                <FaPaperPlane />
              </button>
            </form>
          </>
        ) : (
          <div className={styles.noConversationSelected}>
            <FaUserCircle className={styles.noConversationIcon} />
            <h3>Select a conversation</h3>
            <p>Choose a conversation from the list to start messaging</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default MessagingPage;
