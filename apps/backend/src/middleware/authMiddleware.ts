import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { User } from '../modules/user/user.model';
import { Consultant } from '../models/consultant.model';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    roles: string[];
  };
}

export const authenticate = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  // Try to get token from cookie first (more secure), fallback to Authorization header
  let token = req.cookies?.authToken;
  
  if (!token) {
    const header = req.headers.authorization;
    if (!header) {
      throw new ApiError(401, 'Authentication required');
    }
    token = header.replace('Bearer ', '');
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret!) as AuthenticatedRequest['user'];
    if (!payload) {
      throw new ApiError(401, 'Invalid token payload');
    }
    req.user = payload;
    next();
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired token');
  }
};

/**
 * Middleware to require consultant verification
 * Use this on routes that should only be accessible to verified consultants
 */
export const requireVerifiedConsultant = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new ApiError(401, 'Authentication required');
    }

    // Check if user has consultant account type
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (user.accountType !== 'consultant') {
      throw new ApiError(403, 'This feature is only available to consultants');
    }

    // Check if consultant profile exists and is verified
    const consultant = await Consultant.findOne({ userId });
    if (!consultant) {
      throw new ApiError(404, 'Consultant profile not found. Please complete your consultant profile.');
    }

    if (!consultant.isVerified) {
      throw new ApiError(
        403, 
        'Your consultant account is pending verification. Please wait for admin approval before submitting proposals or accessing consultant features.'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user is a consultant (verified or not)
 * Use this for routes like profile creation/update where verification is not required
 */
export const requireConsultantRole = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new ApiError(401, 'Authentication required');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (user.accountType !== 'consultant') {
      throw new ApiError(403, 'This feature is only available to consultants');
    }

    next();
  } catch (error) {
    next(error);
  }
};





