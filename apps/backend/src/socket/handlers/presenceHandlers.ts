/**
 * Socket.IO Presence/Status Handlers
 * Handles user online/offline status and activity tracking
 */

import { Server, Socket } from 'socket.io';
import { User } from '../../modules/user/user.model';
import logger from '../../config/logger';

/**
 * Register presence-related socket handlers
 */
export const registerPresenceHandlers = (
  io: Server,
  socket: Socket,
  activeUsers: Map<string, string>
) => {
  const userId = (socket as any).userId;

  /**
   * Handle user status update
   * Event: status:update
   */
  socket.on('status:update', async (data: { status: string }) => {
    try {
      const { status } = data;

      // Update user status in database
      await User.findByIdAndUpdate(userId, {
        isOnline: status === 'online',
        lastSeen: new Date(),
      });

      // Broadcast status to all connected users
      socket.broadcast.emit('user:status-changed', {
        userId,
        status,
        timestamp: new Date(),
      });

      logger.debug(`[Socket] User ${userId} status updated to: ${status}`);
    } catch (error: any) {
      logger.error('[Socket] status:update error:', error);
    }
  });

  /**
   * Get online users
   * Event: users:get-online
   */
  socket.on('users:get-online', (callback?: (response: any) => void) => {
    const onlineUserIds = Array.from(activeUsers.keys());
    callback?.({ success: true, users: onlineUserIds });
    logger.debug(`[Socket] User ${userId} requested online users: ${onlineUserIds.length} online`);
  });

  /**
   * Check if specific user is online
   * Event: user:check-online
   */
  socket.on('user:check-online', (data: { userId: string }, callback?: (response: any) => void) => {
    const { userId: targetUserId } = data;
    const isOnline = activeUsers.has(targetUserId);
    callback?.({ success: true, isOnline, userId: targetUserId });
  });
};
