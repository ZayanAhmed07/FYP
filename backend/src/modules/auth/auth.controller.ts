/**
 * Authentication Controller - Handles user authentication requests
 * Implements authentication operations from class diagram
 * 
 * Maps to User class methods:
 * - authenticate(): Validates user credentials and issues JWT token
 * - Changepassword(): Allows users to update their password
 */

import { Request, Response } from 'express';

import { ApiResponse } from '../../utils/ApiResponse';
import { catchAsync } from '../../utils/catchAsync';
import { authService } from './auth.service';
import { tokenService } from '../../services/token.service';
import { userService } from '../user/user.service';
import { env } from '../../config/env';

/**
 * 🔐 IMPORTANT: User Login/Authentication
 * Implements User.authenticate() from class diagram
 * 
 * @route POST /api/auth/login
 * @access Public
 * @returns JWT token and user data
 */
export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  
  // Set token in HttpOnly cookie for XSS protection
  res.cookie('authToken', result.token, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
  
  // Return user data without token
  res.status(200).json(ApiResponse.success(200, 'Login successful', { user: result.user }));
});

/**
 * 📝 IMPORTANT: User Registration
 * Creates new user account (Buyer or Consultant)
 * 
 * @route POST /api/auth/register
 * @access Public
 * @returns JWT token and newly created user data
 */
export const register = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  
  // Set token in HttpOnly cookie for XSS protection
  res.cookie('authToken', result.token, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
  
  // Return user data without token
  res.status(201).json(ApiResponse.success(201, 'Registration successful', { user: result.user }));
});

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await userService.getUserByEmail(email);

  // Always return success to avoid enumeration
  if (!user) {
    return res.status(200).json(ApiResponse.success(200, 'If the email exists, a reset link will be sent'));
  }

  const token = tokenService.generateResetToken({ id: user.id });

  // Build reset link (in prod you'd send an email)
  const resetLink = `${env.frontendUrl}/reset-password?token=${token}`;
  // For now we will log the reset link — replace with actual email sending
  // TODO: Implement email provider integration
  // Example: mailService.sendPasswordReset(email, resetLink)
  console.log('Password reset link:', resetLink);

  return res.status(200).json(ApiResponse.success(200, 'If the email exists, a reset link will be sent', { resetLink }));
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json(ApiResponse.error(400, 'Token and new password are required'));
  }

  const payload = tokenService.verifyResetToken(token);
  const user = await userService.getUserById(payload.id);
  if (!user) {
    return res.status(404).json(ApiResponse.error(404, 'Invalid token'));
  }

  await userService.updatePassword(user.id, password);

  return res.status(200).json(ApiResponse.success(200, 'Password updated successfully'));
});

/**
 * 🔐 Google OAuth Authentication
 * Initiates Google OAuth flow
 * 
 * @route GET /api/auth/google
 * @access Public
 */
export const googleAuth = (req: Request, res: Response) => {
  // This route is handled by Passport middleware
};

/**
 * 🔐 Google OAuth Callback
 * Handles Google OAuth callback and redirects to frontend
 * 
 * @route GET /api/auth/google/callback
 * @access Public
 */
export const googleAuthCallback = (req: Request, res: Response) => {
  const user = req.user as any;
  
  if (!user) {
    return res.redirect(`${env.frontendUrl}/login?error=google_auth_failed`);
  }

  // Generate JWT token for the authenticated user
  const token = tokenService.generateToken({ id: user._id.toString(), roles: user.roles });
  
  // Set token in HttpOnly cookie for security
  res.cookie('authToken', token, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
  
  // Redirect to frontend without token in URL
  res.redirect(`${env.frontendUrl}/auth/callback?user=${encodeURIComponent(JSON.stringify({
    id: user._id,
    name: user.name,
    email: user.email,
    accountType: user.accountType,
    roles: user.roles,
    isVerified: user.isVerified,
    profileImage: user.profileImage,
  }))}`);
};





