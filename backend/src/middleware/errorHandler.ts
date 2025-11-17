import { NextFunction, Request, Response } from 'express';

import logger from '../config/logger';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    logger.warn(err.message, { statusCode: err.statusCode, details: err.details });
    return res
      .status(err.statusCode)
      .json(ApiResponse.error(err.statusCode, err.message, err.details ?? undefined));
  }

  logger.error(err.message, { stack: err.stack });
  return res.status(500).json(ApiResponse.error(500, 'Internal server error'));
};



