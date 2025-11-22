import { Message } from '../../models/message.model';
import { Conversation } from '../../models/conversation.model';
import { User } from '../user/user.model';
import { ApiError } from '../../utils/ApiError';
import { Types } from 'mongoose';

export const createMessage = async (senderId: string, receiverId: string, content: string, attachments?: string[]) => {
  try {
    // Validate input
    if (!senderId || !receiverId) {
      throw new ApiError(400, 'Sender and receiver IDs are required');
    }

    if (!content || content.trim().length === 0) {
      throw new ApiError(400, 'Message content cannot be empty');
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(senderId) || !Types.ObjectId.isValid(receiverId)) {
      throw new ApiError(400, 'Invalid user ID format');
    }

    console.log('[messaging.service] createMessage', { senderId, receiverId, contentLength: content.length });

    // Validate users exist
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender) {
      throw new ApiError(404, `Sender with ID ${senderId} not found`);
    }

    if (!receiver) {
      throw new ApiError(404, `Receiver with ID ${receiverId} not found`);
    }

    if (senderId === receiverId) {
      throw new ApiError(400, 'Cannot send message to yourself');
    }

    // Find or create conversation
    // Build deterministic key for participant pair (order independent)
    const participantsKey = [senderId.toString(), receiverId.toString()].sort().join(':');

    let conversation = await Conversation.findOne({ participantsKey });

    if (!conversation) {
      const unreadMap: Record<string, number> = {} as any;
      unreadMap[receiverId.toString()] = 0;
      unreadMap[senderId.toString()] = 0;

      console.log('[messaging.service] creating conversation', { participantsKey, unreadMap });

      try {
        conversation = await Conversation.create({
          participants: [senderId, receiverId],
          participantsKey,
          unreadCount: unreadMap,
        });
        console.log('[messaging.service] conversation created', { conversationId: conversation._id });
      } catch (convError: any) {
        console.error('[messaging.service] Failed to create conversation:', convError);
        throw new ApiError(500, `Failed to create conversation: ${convError.message}`);
      }
    }

    // Create message
    let message;
    try {
      message = await Message.create({
        conversationId: conversation._id.toString(),
        senderId,
        receiverId,
        content,
        isRead: false,
        attachments: attachments || [],
      });
      console.log('[messaging.service] message document created', { messageId: message._id });
    } catch (msgError: any) {
      console.error('[messaging.service] Failed to create message:', msgError);
      throw new ApiError(500, `Failed to create message: ${msgError.message}`);
    }

    // Update conversation
    try {
      conversation.lastMessage = content.substring(0, 100); // Store preview
      conversation.lastMessageAt = new Date();
      const receiverUnreadCount = conversation.unreadCount.get(receiverId.toString()) || 0;
      conversation.unreadCount.set(receiverId.toString(), receiverUnreadCount + 1);
      await conversation.save();
      console.log('[messaging.service] conversation updated');
    } catch (convUpdateError: any) {
      console.error('[messaging.service] Failed to update conversation:', convUpdateError);
      // Don't throw error here, message is already created
    }

    // Populate and return
    try {
      const populatedMessage = await Message.findById(message._id)
        .populate('senderId', 'name email profileImage isOnline')
        .populate('receiverId', 'name email profileImage isOnline');

      console.log('[messaging.service] message created and populated', { 
        messageId: message._id.toString(), 
        conversationId: conversation._id.toString() 
      });

      return populatedMessage;
    } catch (populateError: any) {
      console.error('[messaging.service] Failed to populate message:', populateError);
      // Return unpopulated message as fallback
      return message;
    }
  } catch (error: any) {
    console.error('[messaging.service] createMessage error:', error);
    // Re-throw ApiError as-is, wrap others
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Internal error creating message: ${error.message}`);
  }
};

export const getConversations = async (userId: string) => {
  const conversations = await Conversation.find({ participants: userId })
    .populate('participants', 'name email profileImage isOnline accountType')
    .sort({ lastMessageAt: -1, updatedAt: -1 });

  // Format conversations with unread count for current user
  const formattedConversations = conversations.map((conv) => {
    const unreadCount = conv.unreadCount.get(userId.toString()) || 0;
    return {
      ...conv.toObject(),
      unreadCount,
      otherUser: conv.participants.find((p: any) => p._id.toString() !== userId.toString()),
    };
  });

  return formattedConversations;
};

export const getMessages = async (userId: string, otherUserId: string, page: number = 1, limit: number = 50) => {
  const conversation = await Conversation.findOne({
    participants: { $all: [userId, otherUserId] },
  });

  if (!conversation) {
    return { messages: [], pagination: { total: 0, page, limit, pages: 0 }, conversationId: null };
  }

  const messages = await Message.find({ conversationId: conversation._id.toString() })
    .populate('senderId', 'name profileImage isOnline accountType')
    .populate('receiverId', 'name profileImage isOnline accountType')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Message.countDocuments({ conversationId: conversation._id.toString() });

  return {
    messages: messages.reverse(),
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    conversationId: conversation._id.toString(),
  };
};

export const markMessagesAsRead = async (userId: string, otherUserId: string) => {
  const conversation = await Conversation.findOne({
    participants: { $all: [userId, otherUserId] },
  });

  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }

  // Get unread messages before marking as read
  const unreadMessages = await Message.find({
    conversationId: conversation._id.toString(),
    receiverId: userId,
    isRead: false,
  }).select('_id');

  const messageIds = unreadMessages.map(m => m._id.toString());

  // Mark all unread messages from otherUserId as read
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
    },
  );

  // Reset unread count for this user
  const previousUnreadCount = conversation.unreadCount.get(userId.toString()) || 0;
  conversation.unreadCount.set(userId.toString(), 0);
  await conversation.save();

  return { 
    success: true, 
    message: 'Messages marked as read',
    messageIds,
    conversationId: conversation._id.toString(),
    markedCount: messageIds.length,
    previousUnreadCount,
  };
};

export const getUnreadMessageCount = async (userId: string) => {
  const conversations = await Conversation.find({ participants: userId })
    .populate('participants', 'name profileImage');
  
  let totalUnread = 0;
  const conversationBreakdown: any[] = [];
  
  conversations.forEach((conv) => {
    const unreadCount = conv.unreadCount.get(userId.toString()) || 0;
    totalUnread += unreadCount;
    
    if (unreadCount > 0) {
      const otherUser = conv.participants.find((p: any) => p._id.toString() !== userId.toString());
      conversationBreakdown.push({
        conversationId: conv._id.toString(),
        otherUser: otherUser ? {
          id: (otherUser as any)._id.toString(),
          name: (otherUser as any).name,
          profileImage: (otherUser as any).profileImage,
        } : null,
        unreadCount,
        lastMessageAt: conv.lastMessageAt,
      });
    }
  });
  
  return { 
    count: totalUnread,
    conversations: conversationBreakdown,
  };
};

export const deleteMessage = async (messageId: string, userId: string) => {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, 'Message not found');
  }
  if (message.senderId.toString() !== userId.toString()) {
    throw new ApiError(403, 'Unauthorized to delete this message');
  }

  await Message.findByIdAndDelete(messageId);
  return { success: true, message: 'Message deleted' };
};
