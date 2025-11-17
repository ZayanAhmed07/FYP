import { Message } from '../../models/message.model';
import { Conversation } from '../../models/conversation.model';
import { User } from '../user/user.model';
import { ApiError } from '../../utils/ApiError';
import { Types } from 'mongoose';

export const createMessage = async (senderId: string, receiverId: string, content: string) => {
  // Validate users exist
  const sender = await User.findById(senderId);
  const receiver = await User.findById(receiverId);

  if (!sender || !receiver) {
    throw new ApiError(404, 'User not found');
  }

  // Find or create conversation
  let conversation = await Conversation.findOne({
    participants: { $all: [senderId, receiverId] },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [senderId, receiverId],
      unreadCount: new Map([[receiverId, 0]]),
    });
  }

  // Create message
  const message = await Message.create({
    conversationId: conversation._id,
    sender: senderId,
    receiver: receiverId,
    content,
    readBy: [senderId], // Sender has read their own message
  });

  // Update conversation
  conversation.lastMessage = message._id;
  const receiverUnreadCount = conversation.unreadCount.get(receiverId.toString()) || 0;
  conversation.unreadCount.set(receiverId.toString(), receiverUnreadCount + 1);
  await conversation.save();

  // Populate and return
  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name email profileImage isOnline')
    .populate('receiver', 'name email profileImage isOnline');

  return populatedMessage;
};

export const getConversations = async (userId: string) => {
  const conversations = await Conversation.find({ participants: userId })
    .populate('participants', 'name email profileImage isOnline')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'name profileImage',
      },
    })
    .sort({ updatedAt: -1 });

  return conversations;
};

export const getMessages = async (userId: string, otherUserId: string, page: number = 1, limit: number = 50) => {
  const conversation = await Conversation.findOne({
    participants: { $all: [userId, otherUserId] },
  });

  if (!conversation) {
    return { messages: [], pagination: { total: 0, page, limit, pages: 0 } };
  }

  const messages = await Message.find({ conversationId: conversation._id, isDeleted: false })
    .populate('sender', 'name profileImage isOnline')
    .populate('receiver', 'name profileImage isOnline')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Message.countDocuments({ conversationId: conversation._id, isDeleted: false });

  return {
    messages: messages.reverse(),
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

export const markMessagesAsRead = async (userId: string, otherUserId: string) => {
  const conversation = await Conversation.findOne({
    participants: { $all: [userId, otherUserId] },
  });

  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }

  await Message.updateMany(
    {
      conversationId: conversation._id,
      receiver: userId,
      readBy: { $ne: userId },
    },
    {
      $addToSet: { readBy: userId },
    },
  );

  conversation.unreadCount.set(userId.toString(), 0);
  await conversation.save();

  return { success: true, message: 'Messages marked as read' };
};

export const getUnreadMessageCount = async (userId: string) => {
  const conversations = await Conversation.find({ participants: userId });
  let totalUnread = 0;
  conversations.forEach((conv) => {
    totalUnread += conv.unreadCount.get(userId.toString()) || 0;
  });
  return { count: totalUnread };
};

export const deleteMessage = async (messageId: string, userId: string) => {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, 'Message not found');
  }
  if (message.sender.toString() !== userId.toString()) {
    throw new ApiError(403, 'Unauthorized to delete this message');
  }

  message.isDeleted = true;
  await message.save();
  return { success: true, message: 'Message deleted' };
};
