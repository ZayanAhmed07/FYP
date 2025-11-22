/**
 * Socket.IO Typing Indicator Handlers
 * Handles typing status events for real-time feedback
 */

import { Server, Socket } from 'socket.io';
import logger from '../../config/logger';

interface TypingData {
  receiverId: string;
  conversationId?: string;
}

/**
 * Register typing-related socket handlers
 */
export const registerTypingHandlers = (
  io: Server,
  socket: Socket,
  activeUsers: Map<string, string>
) => {
  const userId = (socket as any).userId;

  /**
   * Handle user started typing
   * Event: typing:start
   */
  socket.on('typing:start', (data: TypingData) => {
    const { receiverId, conversationId } = data;

    if (!receiverId) {
      return;
    }

    const receiverSocketId = activeUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(`user:${receiverId}`).emit('typing:start', {
        userId,
        conversationId,
      });

      logger.debug(`[Socket] User ${userId} started typing to ${receiverId}`);
    }
  });

  /**
   * Handle user stopped typing
   * Event: typing:stop
   */
  socket.on('typing:stop', (data: TypingData) => {
    const { receiverId, conversationId } = data;

    if (!receiverId) {
      return;
    }

    const receiverSocketId = activeUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(`user:${receiverId}`).emit('typing:stop', {
        userId,
        conversationId,
      });

      logger.debug(`[Socket] User ${userId} stopped typing to ${receiverId}`);
    }
  });
};
