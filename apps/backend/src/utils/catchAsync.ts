import { NextFunction, Request, Response } from 'express';

export const catchAsync =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void | unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    handler(req, res, next).catch(next);





