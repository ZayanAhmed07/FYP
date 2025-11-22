import jwt from 'jsonwebtoken';

import { env } from '../config/env';

type TokenPayload = {
  id: string;
  roles: string[];
};

export const generateToken = (payload: TokenPayload) => {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
};

export const generateResetToken = (payload: { id: string }) => {
  return jwt.sign({ id: payload.id, purpose: 'password-reset' }, env.jwtSecret, {
    expiresIn: env.passwordResetExpiresIn,
  });
};

export const verifyResetToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as any;
    if (decoded && decoded.purpose === 'password-reset' && decoded.id) {
      return { id: decoded.id };
    }
    throw new Error('Invalid or expired password reset token');
  } catch (err) {
    throw new Error('Invalid or expired password reset token');
  }
};

export const tokenService = {
  generateToken,
  generateResetToken,
  verifyResetToken,
};




