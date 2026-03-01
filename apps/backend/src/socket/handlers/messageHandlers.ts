/**
 * Socket.IO Message Event Handlers
 * Handles real-time message sending, delivery, and status updates
 */

import { Server, Socket } from 'socket.io';
import { Message } from '../../models/message.model';
import { Conversation } from '../../models/conversation.model';
import { User } from '../../modules/user/user.model';
import { Types } from 'mongoose';
import logger from '../../config/logger';

interface MessageData {
  receiverId: string;
  content: string;
  conversationId?: string;
  tempId?: string; // Client-generated temporary ID for optimistic updates
}

interface MessageStatusData {
  messageId: string;
  status: 'delivered' | 'seen';
}

/**
 * Register all message-related socket handlers
 */
export const registerMessageHandlers = (
  io: Server,
  socket: Socket,
  activeUsers: Map<string, string>
) => {
  const userId = (socket as any).userId;

  /**
   * Handle sending a new message
   * Event: message:send
   */
  socket.on('message:send', async (data: MessageData, callback?: (response: any) => void) => {
    try {
      const { receiverId, content, tempId } = data;

      logger.info(`[Socket] message:send from ${userId} to ${receiverId}`);

      // Validate input types and format
      if (!receiverId || !content) {
        const error = { success: false, error: 'Receiver ID and content are required' };
        callback?.(error);
        return;
      }

      // Validate MongoDB ObjectId format
      if (!Types.ObjectId.isValid(receiverId)) {
        const error = { success: false, error: 'Invalid receiver ID format' };
        callback?.(error);
        return;
      }

      // Sanitize content: trim whitespace and limit length
      const sanitizedContent = content.trim();
      if (sanitizedContent.length === 0) {
        const error = { success: false, error: 'Message content cannot be empty' };
        callback?.(error);
        return;
      }

      if (sanitizedContent.length > 5000) {
        const error = { success: false, error: 'Message content exceeds maximum length' };
        callback?.(error);
        return;
      }

      // Check receiver exists
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        const error = { success: false, error: 'Receiver not found' };
        callback?.(error);
        return;
      }

      // Find or create conversation
      const participantsKey = [userId, receiverId].sort().join(':');
      let conversation = await Conversation.findOne({ participantsKey });

      if (!conversation) {
        const unreadMap: Record<string, number> = {};
        unreadMap[receiverId] = 0;
        unreadMap[userId] = 0;

        conversation = await Conversation.create({
          participants: [userId, receiverId],
          participantsKey,
          unreadCount: unreadMap,
        });

        logger.info(`[Socket] Created conversation: ${conversation._id}`);
      }

      // Create message
      const message = await Message.create({
        conversationId: conversation._id.toString(),
        senderId: userId,
        receiverId,
        content: sanitizedContent,
        isRead: false,
        status: 'sent',
      });

      // Update conversation
      conversation.lastMessage = sanitizedContent.substring(0, 100);
      conversation.lastMessageAt = new Date();
      const receiverUnreadCount = conversation.unreadCount.get(receiverId) || 0;
      conversation.unreadCount.set(receiverId, receiverUnreadCount + 1);
      await conversation.save();

      // Populate message
      const populatedMessage = await Message.findById(message._id)
        .populate('senderId', 'name email profileImage isOnline')
        .populate('receiverId', 'name email profileImage isOnline')
        .lean();

      logger.info(`[Socket] Message created: ${message._id}`);

      // Emit to sender (confirmation)
      const responseData = {
        success: true,
        data: populatedMessage,
        tempId,
        conversationId: conversation._id.toString(),
      };
      
      callback?.(responseData);

      // Emit to receiver if online
      const receiverSocketId = activeUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(`user:${receiverId}`).emit('message:receive', {
          message: populatedMessage,
          conversationId: conversation._id.toString(),
        });

        // Send notification to receiver
        const sender = await User.findById(userId).select('name');
        io.to(`user:${receiverId}`).emit('notification:new-message', {
          senderName: sender?.name || 'Someone',
          senderId: userId,
          content: content.substring(0, 50),
          conversationId: conversation._id.toString(),
        });

        logger.info(`[Socket] Message delivered to ${receiverId}`);
        
        // Auto-mark as delivered
        message.status = 'delivered';
        message.deliveredAt = new Date();
        await message.save();

        // Notify sender about delivery
        socket.emit('message:delivered', {
          messageId: message._id.toString(),
          deliveredAt: message.deliveredAt,
        });
      } else {
        logger.info(`[Socket] Receiver ${receiverId} is offline, message will be delivered later`);
      }

    } catch (error: any) {
      logger.error('[Socket] message:send error:', error);
      callback?.({ success: false, error: error.message || 'Failed to send message' });
    }
  });

  /**
   * Handle marking messages as delivered
   * Event: message:delivered
   */
  socket.on('message:mark-delivered', async (data: { messageId: string }, callback?: (response: any) => void) => {
    try {
      const { messageId } = data;

      if (!Types.ObjectId.isValid(messageId)) {
        callback?.({ success: false, error: 'Invalid message ID' });
        return;
      }

      const message = await Message.findById(messageId);
      if (!message) {
        callback?.({ success: false, error: 'Message not found' });
        return;
      }

      // Only receiver can mark as delivered
      if (message.receiverId.toString() !== userId) {
        callback?.({ success: false, error: 'Unauthorized' });
        return;
      }

      if (message.status === 'sent') {
        message.status = 'delivered';
        message.deliveredAt = new Date();
        await message.save();

        // Notify sender
        const senderSocketId = activeUsers.get(message.senderId.toString());
        if (senderSocketId) {
          io.to(`user:${message.senderId.toString()}`).emit('message:delivered', {
            messageId: message._id.toString(),
            deliveredAt: message.deliveredAt,
          });
        }
      }

      callback?.({ success: true });
    } catch (error: any) {
      logger.error('[Socket] message:mark-delivered error:', error);
      callback?.({ success: false, error: error.message });
    }
  });

  /**
   * Handle marking messages as seen
   * Event: message:mark-seen
   */
  socket.on('message:mark-seen', async (data: { messageIds: string[] }, callback?: (response: any) => void) => {
    try {
      const { messageIds } = data;

      if (!messageIds || !Array.isArray(messageIds)) {
        callback?.({ success: false, error: 'Message IDs array is required' });
        return;
      }

      // Limit array size to prevent abuse
      if (messageIds.length > 100) {
        callback?.({ success: false, error: 'Too many message IDs (max 100)' });
        return;
      }

      const validIds = messageIds.filter(id => Types.ObjectId.isValid(id));
      if (validIds.length === 0) {
        callback?.({ success: false, error: 'No valid message IDs' });
        return;
      }

      // Update messages to seen
      const result = await Message.updateMany(
        {
          _id: { $in: validIds },
          receiverId: userId,
          isRead: false,
        },
        {
          $set: {
            isRead: true,
            status: 'seen',
            readAt: new Date(),
          },
        }
      );

      logger.info(`[Socket] Marked ${result.modifiedCount} messages as seen for user ${userId}`);

      // Get unique sender IDs
      const messages = await Message.find({ _id: { $in: validIds } }).select('senderId');
      const senderIds = [...new Set(messages.map(m => m.senderId.toString()))];

      // Notify senders
      senderIds.forEach(senderId => {
        const senderSocketId = activeUsers.get(senderId);
        if (senderSocketId) {
          io.to(`user:${senderId}`).emit('message:seen', {
            messageIds: validIds,
            seenBy: userId,
            seenAt: new Date(),
          });
        }
      });

      // Update conversation unread count
      const conversations = await Conversation.find({
        participants: userId,
      });

      for (const conv of conversations) {
        conv.unreadCount.set(userId, 0);
        await conv.save();
      }

      callback?.({ success: true, count: result.modifiedCount });
    } catch (error: any) {
      logger.error('[Socket] message:mark-seen error:', error);
      callback?.({ success: false, error: error.message });
    }
  });

  /**
   * Handle marking conversation messages as read
   * Event: conversation:mark-read
   */
  socket.on('conversation:mark-read', async (data: { otherUserId: string }, callback?: (response: any) => void) => {
    try {
      const { otherUserId } = data;

      if (!Types.ObjectId.isValid(otherUserId)) {
        callback?.({ success: false, error: 'Invalid user ID' });
        return;
      }

      // Find conversation
      const conversation = await Conversation.findOne({
        participants: { $all: [userId, otherUserId] },
      });

      if (!conversation) {
        callback?.({ success: false, error: 'Conversation not found' });
        return;
      }

      // Get unread messages
      const unreadMessages = await Message.find({
        conversationId: conversation._id.toString(),
        receiverId: userId,
        isRead: false,
      }).select('_id senderId');

      if (unreadMessages.length === 0) {
        callback?.({ success: true, markedCount: 0 });
        return;
      }

      const messageIds = unreadMessages.map(m => m._id.toString());

      // Mark messages as read
      await Message.updateMany(
        {
          conversationId: conversation._id.toString(),
          receiverId: userId,
          isRead: false,
        },
        {
          $set: {
            isRead: true,
            status: 'seen',
            readAt: new Date(),
          },
        }
      );

      // Reset unread count
      const previousUnread = conversation.unreadCount.get(userId) || 0;
      conversation.unreadCount.set(userId, 0);
      await conversation.save();

      // Notify sender that messages were read
      const senderSocketId = activeUsers.get(otherUserId);
      if (senderSocketId) {
        io.to(`user:${otherUserId}`).emit('messages:read', {
          messageIds,
          readBy: userId,
          readAt: new Date(),
          conversationId: conversation._id.toString(),
        });
      }

      // Emit unread count update to current user
      socket.emit('unread-count:update', {
        conversationId: conversation._id.toString(),
        unreadCount: 0,
        previousCount: previousUnread,
      });

      logger.info(`[Socket] User ${userId} marked ${messageIds.length} messages as read in conversation with ${otherUserId}`);

      callback?.({ success: true, markedCount: messageIds.length });
    } catch (error: any) {
      logger.error('[Socket] conversation:mark-read error:', error);
      callback?.({ success: false, error: error.message });
    }
  });

  /**
   * Join a conversation room
   * Event: conversation:join
   */
  socket.on('conversation:join', async (data: { conversationId: string }, callback?: (response: any) => void) => {
    try {
      const { conversationId } = data;

      if (!Types.ObjectId.isValid(conversationId)) {
        callback?.({ success: false, error: 'Invalid conversation ID' });
        return;
      }

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        callback?.({ success: false, error: 'Conversation not found' });
        return;
      }

      // Verify user is participant
      const participantIds = conversation.participants.map(p => p.toString());
      if (!participantIds.includes(userId)) {
        callback?.({ success: false, error: 'Not a participant of this conversation' });
        return;
      }

      // Join conversation room
      socket.join(`conversation:${conversationId}`);
      logger.info(`[Socket] User ${userId} joined conversation: ${conversationId}`);

      callback?.({ success: true });
    } catch (error: any) {
      logger.error('[Socket] conversation:join error:', error);
      callback?.({ success: false, error: error.message });
    }
  });

  /**
   * Leave a conversation room
   * Event: conversation:leave
   */
  socket.on('conversation:leave', (data: { conversationId: string }) => {
    const { conversationId } = data;
    socket.leave(`conversation:${conversationId}`);
    logger.info(`[Socket] User ${userId} left conversation: ${conversationId}`);
  });
};
