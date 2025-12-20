import { Request, Response } from 'express';

import { catchAsync } from '../../utils/catchAsync';
import * as consultantService from './consultant.service';
import consultantMatchingService from '../../services/consultant-matching.service';

export const createConsultant = catchAsync(async (req: Request, res: Response) => {
  const consultant = await consultantService.createConsultant(req.body);
  res.status(201).json({ success: true, data: consultant });
});

export const getAllConsultants = catchAsync(async (req: Request, res: Response) => {
  const consultants = await consultantService.getAllConsultants(req.query);
  res.status(200).json({ success: true, data: consultants });
});

export const getConsultantById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, error: 'Consultant ID is required' });
  }
  const consultant = await consultantService.getConsultantById(id);
  res.status(200).json({ success: true, data: consultant });
});

export const getConsultantByUserId = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ success: false, error: 'User ID is required' });
  }
  const consultant = await consultantService.getConsultantByUserId(userId);
  
  // Return null data if no consultant profile found (not an error for profile page)
  if (!consultant) {
    return res.status(200).json({ success: true, data: null });
  }
  
  res.status(200).json({ success: true, data: consultant });
});

export const updateConsultant = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, error: 'Consultant ID is required' });
  }
  const consultant = await consultantService.updateConsultant(id, req.body);
  res.status(200).json({ success: true, data: consultant });
});

export const deleteConsultant = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, error: 'Consultant ID is required' });
  }
  await consultantService.deleteConsultant(id);
  res.status(200).json({ success: true, message: 'Consultant deleted successfully' });
});

export const verifyConsultant = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, error: 'Consultant ID is required' });
  }
  const consultant = await consultantService.verifyConsultant(id);
  res.status(200).json({ success: true, data: consultant });
});

export const uploadVerificationDocuments = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const documents = req.body;
  
  if (!id) {
    return res.status(400).json({ success: false, error: 'Consultant ID is required' });
  }
  
  const consultant = await consultantService.uploadVerificationDocuments(id, documents);
  res.status(200).json({ success: true, data: consultant });
});

export const createCompleteProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ success: false, error: 'User not authenticated' });
  }
  
  const profileData = {
    userId,
    ...req.body,
  };
  
  const consultant = await consultantService.createCompleteProfile(profileData);
  res.status(201).json({ success: true, data: consultant, message: 'Profile submitted for verification' });
});

export const getConsultantStats = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, error: 'Consultant ID is required' });
  }
  
  const stats = await consultantService.getConsultantStats(id);
  res.status(200).json({ success: true, data: stats });
});

export const suggestConsultantsForJob = catchAsync(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  
  if (!jobId) {
    return res.status(400).json({ success: false, error: 'Job ID is required' });
  }
  
  const matches = await consultantMatchingService.suggestConsultantsForJob(jobId);
  res.status(200).json({ 
    success: true, 
    data: matches,
    message: `Found ${matches.length} matching consultants`
  });
});

export const findBestMatches = catchAsync(async (req: Request, res: Response) => {
  const { title, description, category, skills, budget } = req.body;
  
  if (!title || !description || !category) {
    return res.status(400).json({ 
      success: false, 
      error: 'Title, description, and category are required' 
    });
  }
  
  const matches = await consultantMatchingService.findBestMatches({
    title,
    description,
    category,
    skills,
    budget,
  }, {
    limit: req.body.limit || 10,
    minScore: req.body.minScore || 0.4,
    onlyVerified: req.body.onlyVerified || false,
  });
  
  res.status(200).json({ 
    success: true, 
    data: matches,
    message: `Found ${matches.length} matching consultants`
  });
});


