/**
 * Socket.IO Client Hook
 * Manages real-time socket connection and messaging events
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { env } from '../config/env';
import { authService } from '../services/authService';

interface UseSocketOptions {
  onMessageReceive?: (data: any) => void;
  onMessageDelivered?: (data: any) => void;
  onMessageSeen?: (data: any) => void;
  onTypingStart?: (data: any) => void;
  onTypingStop?: (data: any) => void;
  onUserOnline?: (data: any) => void;
  onUserOffline?: (data: any) => void;
  onUserStatusChanged?: (data: any) => void;
  onNewMessageNotification?: (data: any) => void;
  onMessagesRead?: (data: any) => void;
  onUnreadCountUpdate?: (data: any) => void;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  /**
   * Initialize socket connection
   */
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return socketRef.current;
    }

    const token = authService.getToken();
    if (!token) {
      console.warn('[Socket] No auth token available');
      return null;
    }

    setIsConnecting(true);

    const socket = io(env.apiBaseUrl.replace('/api', ''), {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection events
    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      setIsConnected(true);
      setIsConnecting(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      setIsConnecting(false);
      setIsConnected(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('[Socket] Reconnection attempt:', attemptNumber);
    });

    socket.on('reconnect_failed', () => {
      console.error('[Socket] Reconnection failed');
      setIsConnecting(false);
    });

    // Message events
    socket.on('message:receive', (data) => {
      console.log('[Socket] Message received:', data);
      options.onMessageReceive?.(data);
    });

    socket.on('message:delivered', (data) => {
      console.log('[Socket] Message delivered:', data);
      options.onMessageDelivered?.(data);
    });

    socket.on('message:seen', (data) => {
      console.log('[Socket] Message seen:', data);
      options.onMessageSeen?.(data);
    });

    // Typing events
    socket.on('typing:start', (data) => {
      console.log('[Socket] User started typing:', data);
      options.onTypingStart?.(data);
    });

    socket.on('typing:stop', (data) => {
      console.log('[Socket] User stopped typing:', data);
      options.onTypingStop?.(data);
    });

    // Presence events
    socket.on('user:online', (data) => {
      console.log('[Socket] User online:', data);
      options.onUserOnline?.(data);
    });

    socket.on('user:offline', (data) => {
      console.log('[Socket] User offline:', data);
      options.onUserOffline?.(data);
    });

    socket.on('user:status-changed', (data) => {
      console.log('[Socket] User status changed:', data);
      options.onUserStatusChanged?.(data);
    });

    // Notification events
    socket.on('notification:new-message', (data) => {
      console.log('[Socket] New message notification:', data);
      options.onNewMessageNotification?.(data);
    });

    // Read receipt events
    socket.on('messages:read', (data) => {
      console.log('[Socket] Messages marked as read:', data);
      options.onMessagesRead?.(data);
    });

    // Unread count update events
    socket.on('unread-count:update', (data) => {
      console.log('[Socket] Unread count updated:', data);
      options.onUnreadCountUpdate?.(data);
    });

    socketRef.current = socket;
    return socket;
  }, [options]);

  /**
   * Disconnect socket
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  /**
   * Send a message
   */
  const sendMessage = useCallback((data: { receiverId: string; content: string; tempId?: string }) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      console.log('[Socket] Sending message:', data);
      
      socketRef.current.emit('message:send', data, (response: any) => {
        if (response.success) {
          console.log('[Socket] Message sent successfully:', response);
          resolve(response);
        } else {
          console.error('[Socket] Failed to send message:', response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  /**
   * Mark messages as seen
   */
  const markMessagesSeen = useCallback((messageIds: string[]) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      socketRef.current.emit('message:mark-seen', { messageIds }, (response: any) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  /**
   * Mark conversation as read
   */
  const markConversationAsRead = useCallback((otherUserId: string) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      console.log('[Socket] Marking conversation as read:', otherUserId);
      socketRef.current.emit('conversation:mark-read', { otherUserId }, (response: any) => {
        if (response.success) {
          console.log('[Socket] Conversation marked as read:', response);
          resolve(response);
        } else {
          console.error('[Socket] Failed to mark conversation as read:', response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  /**
   * Emit typing start
   */
  const startTyping = useCallback((receiverId: string, conversationId?: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing:start', { receiverId, conversationId });
    }
  }, []);

  /**
   * Emit typing stop
   */
  const stopTyping = useCallback((receiverId: string, conversationId?: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing:stop', { receiverId, conversationId });
    }
  }, []);

  /**
   * Join conversation room
   */
  const joinConversation = useCallback((conversationId: string) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      socketRef.current.emit('conversation:join', { conversationId }, (response: any) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  /**
   * Leave conversation room
   */
  const leaveConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('conversation:leave', { conversationId });
    }
  }, []);

  /**
   * Get online users
   */
  const getOnlineUsers = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      socketRef.current.emit('users:get-online', (response: any) => {
        if (response.success) {
          resolve(response.users);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  /**
   * Check if user is online
   */
  const checkUserOnline = useCallback((userId: string) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      socketRef.current.emit('user:check-online', { userId }, (response: any) => {
        if (response.success) {
          resolve(response.isOnline);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    const socket = connect();
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    sendMessage,
    markMessagesSeen,
    markConversationAsRead,
    startTyping,
    stopTyping,
    joinConversation,
    leaveConversation,
    getOnlineUsers,
    checkUserOnline,
  };
};
