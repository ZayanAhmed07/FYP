import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { ApiResponse } from '../../utils/ApiResponse';

/**
 * Logout endpoint - clears authentication cookie
 * @route POST /api/auth/logout
 * @access Private
 */
export const logout = catchAsync(async (req: Request, res: Response) => {
  // Clear the authentication cookie
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  
  res.status(200).json(ApiResponse.success(200, 'Logout successful', null));
});
