import { httpClient } from '../api/httpClient';

export interface Message {
  _id: string;
  conversationId: string;
  senderId: {
    _id: string;
    name: string;
    profileImage?: string;
    isOnline?: boolean;
    accountType?: string;
  };
  receiverId: {
    _id: string;
    name: string;
    profileImage?: string;
    isOnline?: boolean;
    accountType?: string;
  };
  content: string;
  isRead: boolean;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
    isOnline?: boolean;
    accountType?: string;
  }>;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  otherUser?: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
    isOnline?: boolean;
    accountType?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SendMessagePayload {
  receiverId: string;
  content: string;
  attachments?: string[];
}

export const messagingService = {
  // Send a message
  async sendMessage(payload: SendMessagePayload): Promise<Message> {
    const { data } = await httpClient.post('/messages', payload);
    return data.data;
  },

  // Get all conversations
  async getConversations(): Promise<Conversation[]> {
    const { data } = await httpClient.get('/messages/conversations');
    return data.data;
  },

  // Get messages with a specific user
  async getMessages(
    otherUserId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    messages: Message[];
    pagination: { total: number; page: number; limit: number; pages: number };
    conversationId: string | null;
  }> {
    const { data } = await httpClient.get(`/messages/${otherUserId}`, {
      params: { page, limit },
    });
    return data.data;
  },

  // Mark messages as read
  async markAsRead(otherUserId: string): Promise<void> {
    await httpClient.patch(`/messages/${otherUserId}/read`);
  },

  // Get unread message count
  async getUnreadCount(): Promise<number> {
    const { data } = await httpClient.get('/messages/unread/count');
    return data.data.count;
  },

  // Delete a message
  async deleteMessage(messageId: string): Promise<void> {
    await httpClient.delete(`/messages/message/${messageId}`);
  },
};
