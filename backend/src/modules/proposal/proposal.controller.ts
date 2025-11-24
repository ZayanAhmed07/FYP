import { Request, Response } from 'express';

import { ApiError } from '../../utils/ApiError';
import { catchAsync } from '../../utils/catchAsync';
import * as proposalService from './proposal.service';
import { Consultant } from '../../models/consultant.model';

export const createProposal = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  // Find the consultant profile for this user
  const consultant = await Consultant.findOne({ userId });
  if (!consultant) {
    throw new ApiError(404, 'Consultant profile not found. Please create a consultant profile first.');
  }

  const proposal = await proposalService.createProposal({
    ...req.body,
    consultantId: consultant._id,
  });

  res.status(201).json({ success: true, data: proposal });
});

export const getAllProposals = catchAsync(async (req: Request, res: Response) => {
  const proposals = await proposalService.getAllProposals(req.query);
  res.status(200).json({ success: true, data: proposals });
});

export const getProposalById = catchAsync(async (req: Request, res: Response) => {
  const proposal = await proposalService.getProposalById(req.params.id!);
  res.status(200).json({ success: true, data: proposal });
});

export const getProposalsByJob = catchAsync(async (req: Request, res: Response) => {
  const proposals = await proposalService.getProposalsByJob(req.params.jobId!);
  res.status(200).json({ success: true, data: proposals });
});

export const getProposalsByConsultant = catchAsync(async (req: Request, res: Response) => {
  const proposals = await proposalService.getProposalsByConsultant(req.params.consultantId!);
  res.status(200).json({ success: true, data: proposals });
});

export const getProposalsByBuyer = catchAsync(async (req: Request, res: Response) => {
  const proposals = await proposalService.getProposalsByBuyer(req.params.buyerId!);
  res.status(200).json({ success: true, data: proposals });
});

export const updateProposal = catchAsync(async (req: Request, res: Response) => {
  const proposal = await proposalService.updateProposal(req.params.id!, req.body);
  res.status(200).json({ success: true, data: proposal });
});

export const acceptProposal = catchAsync(async (req: Request, res: Response) => {
  const result = await proposalService.acceptProposal(req.params.id!);
  res.status(200).json({ success: true, data: result });
});

export const rejectProposal = catchAsync(async (req: Request, res: Response) => {
  const proposal = await proposalService.rejectProposal(req.params.id!);
  res.status(200).json({ success: true, data: proposal });
});

export const deleteProposal = catchAsync(async (req: Request, res: Response) => {
  await proposalService.deleteProposal(req.params.id!);
  res.status(200).json({ success: true, message: 'Proposal deleted successfully' });
});

