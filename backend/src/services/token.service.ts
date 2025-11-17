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

export const tokenService = {
  generateToken,
};



