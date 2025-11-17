import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    roles: string[];
  };
}

export const authenticate = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header) {
    throw new ApiError(401, 'Authentication required');
  }

  const token = header.replace('Bearer ', '');

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthenticatedRequest['user'];
    req.user = payload;
    next();
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired token');
  }
};



