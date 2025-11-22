import { Request, Response } from 'express';

import { ApiResponse } from '../utils/ApiResponse';

export const notFoundHandler = (req: Request, res: Response) => {
  return res.status(404).json(ApiResponse.error(404, `Route ${req.originalUrl} not found`));
};




