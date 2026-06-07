/**
 * Socket.IO Singleton Service
 * Creates and manages a SINGLE socket connection per user session
 * Prevents duplicate connections from React re-renders and Strict Mode
 */

import { io, Socket } from 'socket.io-client';
import { env } from '../config/env';

class SocketService {
  private socket: Socket | null = null;
  private isConnecting = false;
  private userId: string | null = null;

  /**
   * Get the singleton socket instance
   * Creates it if it doesn't exist, otherwise returns existing
   */
  getInstance(token?: string): Socket | null {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.socket && !this.socket.connected) {
      console.log('[SocketService] Socket exists but disconnected, reconnecting...');
      this.socket.connect();
      return this.socket;
    }

    if (this.isConnecting) {
      console.log('[SocketService] Connection already in progress...');
      return this.socket;
    }

    return this.createSocket(token);
  }

  /**
   * Create a new socket instance (private method)
   */
  private createSocket(token?: string): Socket {
    console.log('[SocketService] Creating new socket instance');
    this.isConnecting = true;

    this.socket = io(env.apiBaseUrl.replace('/api', ''), {
      auth: token ? { token } : {},
      withCredentials: true, // send auth cookie automatically
      transports: ['websocket', 'polling'],
      autoConnect: false, // Manual control over connection
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Setup connection event handlers
    this.socket.on('connect', () => {
      console.log('[SocketService] ✅ Connected:', this.socket?.id);
      this.isConnecting = false;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketService] ❌ Disconnected:', reason);
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SocketService] Connection error:', error.message);
      this.isConnecting = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('[SocketService] 🔄 Reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('[SocketService] 🔄 Reconnection attempt:', attemptNumber);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('[SocketService] ⚠️ Reconnection failed');
      this.isConnecting = false;
    });

    // Manually connect
    this.socket.connect();

    return this.socket;
  }

  /**
   * Connect socket (idempotent - safe to call multiple times)
   */
  connect(token?: string): Socket | null {
    if (this.socket?.connected) {
      console.log('[SocketService] Already connected');
      return this.socket;
    }

    if (this.socket && !this.socket.connected) {
      console.log('[SocketService] Reconnecting existing socket...');
      this.socket.connect();
      return this.socket;
    }

    return this.getInstance(token);
  }

  /**
   * Disconnect socket properly
   */
  disconnect(): void {
    if (this.socket) {
      console.log('[SocketService] Disconnecting socket...');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
      this.isConnecting = false;
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get current socket (may be null or disconnected)
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Get user ID
   */
  getUserId(): string | null {
    return this.userId;
  }
}

// Export singleton instance
export const socketService = new SocketService();
