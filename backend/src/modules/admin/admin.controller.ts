import { Request, Response } from 'express';

import { catchAsync } from '../../utils/catchAsync';
import * as adminService from './admin.service';

export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const users = await adminService.getAllUsers(req.query);
  res.status(200).json({ success: true, data: users });
});

export const getUsersByAccountType = catchAsync(async (req: Request, res: Response) => {
  const users = await adminService.getUsersByAccountType(req.params.accountType as 'buyer' | 'consultant');
  res.status(200).json({ success: true, data: users });
});

export const banUser = catchAsync(async (req: Request, res: Response) => {
  const user = await adminService.banUser(req.params.userId!);
  res.status(200).json({ success: true, data: user });
});

export const unbanUser = catchAsync(async (req: Request, res: Response) => {
  const user = await adminService.unbanUser(req.params.userId!);
  res.status(200).json({ success: true, data: user });
});

export const verifyConsultantAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.verifyConsultantAdmin(req.params.consultantId!);
  res.status(200).json({ success: true, data: result });
});

export const declineConsultant = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.declineConsultant(req.params.consultantId!);
  res.status(200).json({ success: true, data: result });
});

export const getPendingConsultants = catchAsync(async (req: Request, res: Response) => {
  const consultants = await adminService.getPendingConsultants();
  res.status(200).json({ success: true, data: consultants });
});

export const getAdminStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await adminService.getAdminStats();
  res.status(200).json({ success: true, data: stats });
});

export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  await adminService.deleteUser(req.params.userId!);
  res.status(200).json({ success: true, message: 'User deleted successfully' });
});



