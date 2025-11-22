/**
 * Socket.IO Server Setup and Configuration
 * Handles real-time messaging with optimized room management
 */

import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import logger from '../config/logger';

// Import Socket.IO event handlers
import { registerMessageHandlers } from './handlers/messageHandlers';
import { registerPresenceHandlers } from './handlers/presenceHandlers';
import { registerTypingHandlers } from './handlers/typingHandlers';

// Store active user connections: userId -> socketId
const activeUsers = new Map<string, string>();

// Store user socket instances: socketId -> Socket
const userSockets = new Map<string, Socket>();

/**
 * Socket.IO Authentication Middleware
 * Validates JWT token and attaches user info to socket
 */
const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      logger.warn('[Socket.IO] Connection attempted without token');
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, env.jwtSecret) as { id: string; email: string };
    
    // Attach user info to socket
    (socket as any).userId = decoded.id;
    (socket as any).userEmail = decoded.email;
    
    logger.info(`[Socket.IO] User authenticated: ${decoded.id}`);
    next();
  } catch (error: any) {
    logger.error('[Socket.IO] Authentication failed:', error.message);
    next(new Error('Invalid authentication token'));
  }
};

/**
 * Initialize Socket.IO server with HTTP server
 */
export const initializeSocket = (httpServer: HTTPServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  // Handle socket connections
  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    
    logger.info(`[Socket.IO] User connected: ${userId} (socket: ${socket.id})`);

    // Track active user
    activeUsers.set(userId, socket.id);
    userSockets.set(socket.id, socket);

    // Join user's personal room for direct messages
    socket.join(`user:${userId}`);
    
    // Notify about online status
    socket.broadcast.emit('user:online', { userId });

    // Register event handlers
    registerMessageHandlers(io, socket, activeUsers);
    registerPresenceHandlers(io, socket, activeUsers);
    registerTypingHandlers(io, socket, activeUsers);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`[Socket.IO] User disconnected: ${userId} (${reason})`);
      
      activeUsers.delete(userId);
      userSockets.delete(socket.id);
      
      // Notify about offline status
      socket.broadcast.emit('user:offline', { userId });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`[Socket.IO] Socket error for user ${userId}:`, error);
    });
  });

  logger.info('[Socket.IO] Server initialized successfully');
  return io;
};

/**
 * Get active users map (for external access)
 */
export const getActiveUsers = () => activeUsers;

/**
 * Get user sockets map (for external access)
 */
export const getUserSockets = () => userSockets;

/**
 * Check if user is online
 */
export const isUserOnline = (userId: string): boolean => {
  return activeUsers.has(userId);
};

/**
 * Get socket ID for a user
 */
export const getUserSocketId = (userId: string): string | undefined => {
  return activeUsers.get(userId);
};

/**
 * Emit event to specific user
 */
export const emitToUser = (io: Server, userId: string, event: string, data: any): boolean => {
  const socketId = activeUsers.get(userId);
  if (socketId) {
    io.to(`user:${userId}`).emit(event, data);
    return true;
  }
  return false;
};
