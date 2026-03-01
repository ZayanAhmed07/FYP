/**
 * Socket.IO Client Hook
 * Uses singleton socket service to prevent duplicate connections
 * Safe for React 18 Strict Mode and component re-renders
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { Socket } from 'socket.io-client';
import { socketService } from '../services/socket.service';
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
  const [isConnected, setIsConnected] = useState(socketService.isConnected());
  const [isConnecting, setIsConnecting] = useState(false);
  const listenersRegisteredRef = useRef(false);

  /**
   * Register event listeners on the singleton socket
   * Only registers once per hook instance
   */
  const registerListeners = useCallback((socket: Socket) => {
    if (listenersRegisteredRef.current) {
      return; // Already registered
    }

    console.log('[useSocket] Registering event listeners');

    // Connection events
    socket.on('connect', () => {
      console.log('[useSocket] Connected:', socket.id);
      setIsConnected(true);
      setIsConnecting(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('[useSocket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[useSocket] Connection error:', error.message);
      setIsConnecting(false);
      setIsConnected(false);
    });

    // Message events
    if (options.onMessageReceive) {
      socket.on('message:receive', (data) => {
        console.log('[useSocket] Message received:', data);
        options.onMessageReceive?.(data);
      });
    }

    if (options.onMessageDelivered) {
      socket.on('message:delivered', (data) => {
        console.log('[useSocket] Message delivered:', data);
        options.onMessageDelivered?.(data);
      });
    }

    if (options.onMessageSeen) {
      socket.on('message:seen', (data) => {
        console.log('[useSocket] Message seen:', data);
        options.onMessageSeen?.(data);
      });
    }

    // Typing events
    if (options.onTypingStart) {
      socket.on('typing:start', (data) => {
        console.log('[useSocket] User started typing:', data);
        options.onTypingStart?.(data);
      });
    }

    if (options.onTypingStop) {
      socket.on('typing:stop', (data) => {
        console.log('[useSocket] User stopped typing:', data);
        options.onTypingStop?.(data);
      });
    }

    // Presence events
    if (options.onUserOnline) {
      socket.on('user:online', (data) => {
        console.log('[useSocket] User online:', data);
        options.onUserOnline?.(data);
      });
    }

    if (options.onUserOffline) {
      socket.on('user:offline', (data) => {
        console.log('[useSocket] User offline:', data);
        options.onUserOffline?.(data);
      });
    }

    if (options.onUserStatusChanged) {
      socket.on('user:status-changed', (data) => {
        console.log('[useSocket] User status changed:', data);
        options.onUserStatusChanged?.(data);
      });
    }

    // Notification events
    if (options.onNewMessageNotification) {
      socket.on('notification:new-message', (data) => {
        console.log('[useSocket] New message notification:', data);
        options.onNewMessageNotification?.(data);
      });
    }

    // Read receipt events
    if (options.onMessagesRead) {
      socket.on('messages:read', (data) => {
        console.log('[useSocket] Messages marked as read:', data);
        options.onMessagesRead?.(data);
      });
    }

    // Unread count update events
    if (options.onUnreadCountUpdate) {
      socket.on('unread-count:update', (data) => {
        console.log('[useSocket] Unread count updated:', data);
        options.onUnreadCountUpdate?.(data);
      });
    }

    listenersRegisteredRef.current = true;
  }, [options]);

  /**
   * Remove event listeners from socket
   */
  const removeListeners = useCallback((socket: Socket) => {
    if (!listenersRegisteredRef.current) {
      return; // Nothing to remove
    }

    console.log('[useSocket] Removing event listeners');

    // Remove connection events
    socket.off('connect');
    socket.off('disconnect');
    socket.off('connect_error');

    // Remove message events
    socket.off('message:receive');
    socket.off('message:delivered');
    socket.off('message:seen');

    // Remove typing events
    socket.off('typing:start');
    socket.off('typing:stop');

    // Remove presence events
    socket.off('user:online');
    socket.off('user:offline');
    socket.off('user:status-changed');

    // Remove notification events
    socket.off('notification:new-message');
    socket.off('messages:read');
    socket.off('unread-count:update');

    listenersRegisteredRef.current = false;
  }, []);

  /**
   * Connect to socket (idempotent)
   */
  const connect = useCallback(() => {
    const token = authService.getToken();
    if (!token) {
      console.warn('[useSocket] No auth token available');
      return null;
    }

    // Get or create singleton socket
    const socket = socketService.connect(token);
    
    if (socket) {
      // Register listeners for this hook instance
      registerListeners(socket);
      setIsConnected(socket.connected);
    }

    return socket;
  }, [registerListeners]);

  /**
   * Disconnect socket
   * Note: This removes listeners but doesn't destroy the socket
   * The socket remains available for other components
   */
  const disconnect = useCallback(() => {
    const socket = socketService.getSocket();
    if (socket) {
      removeListeners(socket);
    }
  }, [removeListeners]);

  /**
   * Send a message
   */
  const sendMessage = useCallback((data: { receiverId: string; content: string; tempId?: string }) => {
    return new Promise((resolve, reject) => {
      const socket = socketService.getSocket();
      
      if (!socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      console.log('[useSocket] Sending message:', data);
      
      socket.emit('message:send', data, (response: any) => {
        if (response.success) {
          console.log('[useSocket] Message sent successfully:', response);
          resolve(response);
        } else {
          console.error('[useSocket] Failed to send message:', response.error);
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
      const socket = socketService.getSocket();
      
      if (!socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      socket.emit('message:mark-seen', { messageIds }, (response: any) => {
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
      const socket = socketService.getSocket();
      
      if (!socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      console.log('[useSocket] Marking conversation as read:', otherUserId);
      socket.emit('conversation:mark-read', { otherUserId }, (response: any) => {
        if (response.success) {
          console.log('[useSocket] Conversation marked as read:', response);
          resolve(response);
        } else {
          console.error('[useSocket] Failed to mark conversation as read:', response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  /**
   * Emit typing start
   */
  const startTyping = useCallback((receiverId: string, conversationId?: string) => {
    const socket = socketService.getSocket();
    if (socket?.connected) {
      socket.emit('typing:start', { receiverId, conversationId });
    }
  }, []);

  /**
   * Emit typing stop
   */
  const stopTyping = useCallback((receiverId: string, conversationId?: string) => {
    const socket = socketService.getSocket();
    if (socket?.connected) {
      socket.emit('typing:stop', { receiverId, conversationId });
    }
  }, []);

  /**
   * Join conversation room
   */
  const joinConversation = useCallback((conversationId: string) => {
    return new Promise((resolve, reject) => {
      const socket = socketService.getSocket();
      
      if (!socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      socket.emit('conversation:join', { conversationId }, (response: any) => {
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
    const socket = socketService.getSocket();
    if (socket?.connected) {
      socket.emit('conversation:leave', { conversationId });
    }
  }, []);

  /**
   * Get online users
   */
  const getOnlineUsers = useCallback(() => {
    return new Promise((resolve, reject) => {
      const socket = socketService.getSocket();
      
      if (!socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      socket.emit('users:get-online', (response: any) => {
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
      const socket = socketService.getSocket();
      
      if (!socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      socket.emit('user:check-online', { userId }, (response: any) => {
        if (response.success) {
          resolve(response.isOnline);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  /**
   * Connect once on mount, cleanup on unmount
   * Idempotent for React 18 Strict Mode
   * Socket is already connected by SocketInitializer, just register listeners
   */
  useEffect(() => {
    let mounted = true;

    const initSocket = () => {
      if (!mounted) return;

      const socket = socketService.getSocket();
      
      if (socket) {
        // Socket already exists (from SocketInitializer), just register listeners
        console.log('[useSocket] Registering listeners on existing socket...');
        registerListeners(socket);
        setIsConnected(socket.connected);
      } else {
        // Fallback: socket doesn't exist yet, try to connect
        console.log('[useSocket] No socket found, attempting to connect...');
        const token = authService.getToken();
        if (token) {
          const newSocket = socketService.connect(token);
          if (newSocket) {
            registerListeners(newSocket);
            setIsConnected(newSocket.connected);
          }
        }
      }
    };

    initSocket();

    // Cleanup: remove listeners but keep socket alive for other components
    return () => {
      mounted = false;
      console.log('[useSocket] Component unmounting, removing listeners...');
      const socket = socketService.getSocket();
      if (socket) {
        removeListeners(socket);
      }
    };
  }, []); // Empty deps - run once per component mount

  return {
    socket: socketService.getSocket(),
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
