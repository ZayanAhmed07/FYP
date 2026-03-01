import { Request, Response } from 'express';

import { ApiResponse } from '../../utils/ApiResponse';
import { catchAsync } from '../../utils/catchAsync';
import { userService } from './user.service';

export const getProfile = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json(ApiResponse.error(401, 'Authentication required'));
  }
  const user = await userService.getUserById(userId);
  if (!user) {
    return res.status(404).json(ApiResponse.error(404, 'User not found'));
  }
  return res.status(200).json(ApiResponse.success(200, 'Profile fetched', user));
});

export const getUsers = catchAsync(async (_req: Request, res: Response) => {
  const users = await userService.listUsers();
  return res.status(200).json(ApiResponse.success(200, 'Users fetched', users));
});

export const updateProfile = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json(ApiResponse.error(401, 'Authentication required'));
  }
  const updates = req.body;
  const user = await userService.updateUser(userId, updates);
  return res.status(200).json(ApiResponse.success(200, 'Profile updated', user));
});

