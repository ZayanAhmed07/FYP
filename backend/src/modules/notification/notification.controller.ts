import { Request, Response } from 'express';
import { notificationService } from '../../services/notification.service';
import { catchAsync } from '../../utils/catchAsync';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';

export const getUserNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }

  const result = await notificationService.getNotificationsByUserId(userId, page, limit);

  res.status(200).json(
    ApiResponse.success(200, 'Notifications retrieved successfully', result)
  );
});

export const markNotificationAsRead = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }

  if (!id) {
    throw new ApiError(400, 'Notification ID is required');
  }

  const success = await notificationService.markAsRead(id, userId);

  if (!success) {
    throw new ApiError(404, 'Notification not found or already read');
  }

  res.status(200).json(
    ApiResponse.success(200, 'Notification marked as read', null)
  );
});

export const markAllNotificationsAsRead = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }

  const count = await notificationService.markAllAsRead(userId);

  res.status(200).json(
    ApiResponse.success(200, `${count} notifications marked as read`, { count })
  );
});

export const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }

  if (!id) {
    throw new ApiError(400, 'Notification ID is required');
  }

  const success = await notificationService.deleteNotification(id, userId);

  if (!success) {
    throw new ApiError(404, 'Notification not found');
  }

  res.status(200).json(
    ApiResponse.success(200, 'Notification deleted successfully', null)
  );
});