import { Request, Response } from 'express';

import { ApiError } from '../../utils/ApiError';
import { catchAsync } from '../../utils/catchAsync';
import * as jobService from './job.service';

export const createJob = catchAsync(async (req: Request, res: Response) => {
  const buyerId = req.user?.id;

  if (!buyerId) {
    throw new ApiError(401, 'Authentication required');
  }

  const job = await jobService.createJob({
    ...req.body,
    buyerId,
  });

  res.status(201).json({ success: true, data: job });
});

export const getAllJobs = catchAsync(async (req: Request, res: Response) => {
  const jobs = await jobService.getAllJobs(req.query);
  res.status(200).json({ success: true, data: jobs });
});

export const getJobById = catchAsync(async (req: Request, res: Response) => {
  const job = await jobService.getJobById(req.params.id!);
  res.status(200).json({ success: true, data: job });
});

export const updateJob = catchAsync(async (req: Request, res: Response) => {
  const job = await jobService.updateJob(req.params.id!, req.body);
  res.status(200).json({ success: true, data: job });
});

export const deleteJob = catchAsync(async (req: Request, res: Response) => {
  await jobService.deleteJob(req.params.id!);
  res.status(200).json({ success: true, message: 'Job deleted successfully' });
});

export const getJobsByBuyer = catchAsync(async (req: Request, res: Response) => {
  const jobs = await jobService.getJobsByBuyer(req.params.buyerId!);
  res.status(200).json({ success: true, data: jobs });
});

