import { Request, Response } from 'express';

import { ApiError } from '../../utils/ApiError';
import { catchAsync } from '../../utils/catchAsync';
import * as proposalService from './proposal.service';
import { Consultant } from '../../models/consultant.model';
import { Job } from '../../models/job.model';
import groqService from '../../services/groq.service';
import env from '../../config/env';

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

  // Map frontend field names to model field names
  const { proposedAmount, estimatedDelivery, ...rest } = req.body;
  
  const proposal = await proposalService.createProposal({
    ...rest,
    bidAmount: proposedAmount,
    deliveryTime: estimatedDelivery,
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
  // The buyerId param is the User ID (buyerId in Job model references User._id)
  const buyerId = req.params.buyerId!;
  
  const proposals = await proposalService.getProposalsByBuyer(buyerId);
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

export const enhanceCoverLetter = catchAsync(async (req: Request, res: Response) => {
  const { coverLetter, jobTitle, jobDescription } = req.body || {};

  if (!coverLetter || !String(coverLetter).trim()) {
    throw new ApiError(400, 'Cover letter text is required');
  }

  if (!jobTitle || !String(jobTitle).trim()) {
    throw new ApiError(400, 'Job title is required');
  }

  if (!env.GROQ_API_KEY) {
    throw new ApiError(503, 'AI enhancement service is not configured');
  }

  try {
    const enhancedText = await groqService.enhanceProposalCoverLetter({
      coverLetter: String(coverLetter),
      jobTitle: String(jobTitle),
      jobDescription: jobDescription ? String(jobDescription) : '',
    });

    res.status(200).json({
      success: true,
      data: {
        originalText: String(coverLetter),
        enhancedText,
      },
    });
  } catch (error: any) {
    const message = error?.message || 'Unable to enhance cover letter right now';
    throw new ApiError(502, message);
  }
});

