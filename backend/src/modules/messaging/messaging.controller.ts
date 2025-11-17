import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import * as messagingService from './messaging.service';
import { ApiError } from '../../utils/ApiError';

export const createMessage = catchAsync(async (req: Request, res: Response) => {
  const senderId = req.user?.id;
  const { receiverId, content } = req.body;

  if (!senderId) {
    throw new ApiError(401, 'Authentication required');
  }
  if (!receiverId || !content) {
    throw new ApiError(400, 'Receiver ID and content are required');
  }

  const message = await messagingService.createMessage(senderId, receiverId, content);
  res.status(201).json({ success: true, data: message });
});

export const getConversations = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }
  const conversations = await messagingService.getConversations(userId);
  res.status(200).json({ success: true, data: conversations });
});

export const getMessages = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { otherUserId } = req.params;
  const { page, limit } = req.query;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }
  if (!otherUserId) {
    throw new ApiError(400, 'Other user ID is required');
  }

  const messages = await messagingService.getMessages(userId, otherUserId, Number(page), Number(limit));
  res.status(200).json({ success: true, data: messages });
});

export const markMessagesAsRead = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { otherUserId } = req.params;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }
  if (!otherUserId) {
    throw new ApiError(400, 'Other user ID is required');
  }

  await messagingService.markMessagesAsRead(userId, otherUserId);
  res.status(200).json({ success: true, message: 'Messages marked as read' });
});

export const getUnreadMessageCount = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }
  const unreadCount = await messagingService.getUnreadMessageCount(userId);
  res.status(200).json({ success: true, data: unreadCount });
});

export const deleteMessage = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { messageId } = req.params;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }
  if (!messageId) {
    throw new ApiError(400, 'Message ID is required');
  }

  await messagingService.deleteMessage(messageId, userId);
  res.status(200).json({ success: true, message: 'Message deleted successfully' });
});
