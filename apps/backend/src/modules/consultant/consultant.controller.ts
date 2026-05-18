import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import * as consultantService from './consultant.service';
import { verifyCNICWithGroq, verifyCNICBatch } from '../../services/groq-cnic-verification.service';
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

/**
 * Verify CNIC image using Groq AI
 * POST /api/consultants/verify-cnic
 * Body: { image: "base64_string" } or { front: "base64", back: "base64" }
 */
export const verifyCNIC = catchAsync(async (req: Request, res: Response) => {
  const { image, front, back } = req.body;

  if (!image && !front) {
    return res.status(400).json({ 
      success: false, 
      error: 'CNIC image is required. Provide either "image" or "front" field.' 
    });
  }

  // Single image verification
  if (image) {
    const result = await verifyCNICWithGroq(image);
    return res.status(200).json({ 
      success: true, 
      data: result 
    });
  }

  // Batch verification (front and optionally back)
  if (front) {
    const result = await verifyCNICBatch({ front, back });
    return res.status(200).json({ 
      success: true, 
      data: result 
    });
  }
});

/**
 * Get AI-powered consultant suggestions for a job
 * GET /api/consultants/suggest/:jobId
 */
export const suggestConsultantsForJob = catchAsync(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  
  if (!jobId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Job ID is required' 
    });
  }

  try {
    // Try AI-powered matching first
    const matches = await consultantMatchingService.suggestConsultantsForJob(jobId);
    
    res.status(200).json({ 
      success: true, 
      data: matches,
      message: `Found ${matches.length} matching consultants`
    });
  } catch (error: any) {
    console.error('AI matching failed, using fallback:', error.message);
    
    // Fallback to simple keyword matching if AI fails
    const { Job } = await import('../../models/job.model');
    const { Consultant } = await import('../../models/consultant.model');
    
    const job = await Job.findById(jobId).lean();
    if (!job) {
      return res.status(404).json({ 
        success: false, 
        error: 'Job not found' 
      });
    }

    // Simple matching based on category and skills
    const query: any = {
      availability: { $in: ['available', 'limited'] },
      isVerified: true,
    };

    // Match by category
    if (job.category) {
      query.specialization = job.category;
    }

    // Fetch consultants
    const consultants = await Consultant.find(query)
      .populate('userId', 'name email profileImage')
      .limit(10)
      .lean();

    // Simple scoring based on skill overlap
    const matches = consultants.map((consultant: any) => {
      let matchScore = 50; // Base score
      const matchReasons = ['Matches job category'];

      // Check skill overlap
      if (job.skills && job.skills.length > 0 && consultant.skills) {
        const matchingSkills = consultant.skills.filter((skill: string) =>
          job.skills.some((jobSkill: string) =>
            skill.toLowerCase().includes(jobSkill.toLowerCase()) ||
            jobSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
        
        if (matchingSkills.length > 0) {
          matchScore += matchingSkills.length * 10;
          matchReasons.push(`Has ${matchingSkills.length} matching skills`);
        }
      }

      // Location match
      if (job.location && consultant.location?.city) {
        const jobCity = job.location.split(',')[0].trim();
        if (consultant.location.city.toLowerCase() === jobCity.toLowerCase()) {
          matchScore += 15;
          matchReasons.push(`Located in ${consultant.location.city}`);
        }
      }

      // Rating bonus
      if (consultant.rating >= 4.5) {
        matchScore += 10;
        matchReasons.push(`Highly rated (${consultant.rating}/5.0)`);
      }

      return {
        consultant,
        matchScore: Math.min(matchScore, 100),
        matchReasons,
      };
    });

    // Sort by score
    matches.sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({ 
      success: true, 
      data: matches,
      message: `Found ${matches.length} matching consultants (using fallback matching)`
    });
  }
});
