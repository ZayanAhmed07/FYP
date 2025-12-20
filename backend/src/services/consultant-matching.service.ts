import { Consultant } from '../models/consultant.model';
import huggingFaceService from './huggingface.service';

interface JobRequirements {
  title: string;
  description: string;
  category: string;
  skills?: string[];
  budget?: {
    min: number;
    max: number;
  };
}

interface MatchedConsultant {
  consultant: any;
  matchScore: number;
  matchReasons: string[];
}

export class ConsultantMatchingService {
  /**
   * Create a text representation of job for embedding
   */
  private createJobText(job: JobRequirements): string {
    const parts = [
      `Job Title: ${job.title}`,
      `Category: ${job.category}`,
      `Description: ${job.description}`,
    ];

    if (job.skills && job.skills.length > 0) {
      parts.push(`Required Skills: ${job.skills.join(', ')}`);
    }

    return parts.join('. ');
  }

  /**
   * Create a text representation of consultant for embedding
   */
  private createConsultantText(consultant: any): string {
    const parts = [
      `Title: ${consultant.title}`,
      `Specialization: ${consultant.specialization.join(', ')}`,
      `Bio: ${consultant.bio}`,
      `Skills: ${consultant.skills.join(', ')}`,
      `Experience: ${consultant.experience}`,
    ];

    return parts.join('. ');
  }

  /**
   * Calculate additional matching factors beyond semantic similarity
   */
  private calculateBonusScore(consultant: any, job: JobRequirements): {
    score: number;
    reasons: string[];
  } {
    let bonusScore = 0;
    const reasons: string[] = [];

    // Category match (high weight)
    if (consultant.specialization.includes(job.category)) {
      bonusScore += 0.15;
      reasons.push(`Specializes in ${job.category}`);
    }

    // Skill overlap
    if (job.skills && job.skills.length > 0) {
      const matchingSkills = consultant.skills.filter((skill: string) =>
        job.skills!.some((jobSkill: string) =>
          skill.toLowerCase().includes(jobSkill.toLowerCase()) ||
          jobSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );

      if (matchingSkills.length > 0) {
        const skillMatchRatio = matchingSkills.length / job.skills.length;
        bonusScore += skillMatchRatio * 0.1;
        reasons.push(`Has ${matchingSkills.length} matching skills: ${matchingSkills.slice(0, 3).join(', ')}`);
      }
    }

    // Budget compatibility
    if (job.budget) {
      const avgBudget = (job.budget.min + job.budget.max) / 2;
      if (consultant.hourlyRate <= avgBudget) {
        bonusScore += 0.05;
        reasons.push(`Rate ($${consultant.hourlyRate}/hr) fits budget`);
      }
    }

    // Verification badge
    if (consultant.isVerified) {
      bonusScore += 0.03;
      reasons.push('Verified consultant');
    }

    // High rating
    if (consultant.rating >= 4.5) {
      bonusScore += 0.02;
      reasons.push(`Highly rated (${consultant.rating}/5.0)`);
    }

    // Experience with completed projects
    if (consultant.completedProjects > 20) {
      bonusScore += 0.02;
      reasons.push(`${consultant.completedProjects} completed projects`);
    }

    // Quick responder
    if (consultant.responseTime <= 6) {
      bonusScore += 0.02;
      reasons.push('Quick response time');
    }

    return { score: bonusScore, reasons };
  }

  /**
   * Find best matching consultants for a job using AI embeddings
   */
  async findBestMatches(
    job: JobRequirements,
    options: {
      limit?: number;
      minScore?: number;
      onlyVerified?: boolean;
    } = {}
  ): Promise<MatchedConsultant[]> {
    try {
      const { limit = 10, minScore = 0.4, onlyVerified = false } = options;

      // Build query filters
      const query: any = {};
      
      // Prefer consultants in the same category
      if (job.category) {
        query.specialization = job.category;
      }

      if (onlyVerified) {
        query.isVerified = true;
      }

      // Fetch consultants
      const consultants = await Consultant.find(query)
        .populate('userId', 'name email profileImage')
        .limit(100) // Get a larger pool to rank
        .lean();

      if (consultants.length === 0) {
        return [];
      }

      console.log(`📊 Found ${consultants.length} consultants to evaluate`);

      // Generate job embedding
      const jobText = this.createJobText(job);
      console.log(`🔍 Generating embedding for job: "${job.title}"`);
      const jobEmbedding = await huggingFaceService.generateEmbedding(jobText);

      // Generate consultant embeddings
      console.log(`🤖 Generating embeddings for ${consultants.length} consultants...`);
      const consultantTexts = consultants.map((c: any) => this.createConsultantText(c));
      const consultantEmbeddings = await huggingFaceService.generateBatchEmbeddings(
        consultantTexts
      );

      // Calculate semantic similarity + bonus scores
      const matches = consultants.map((consultant: any, index: number) => {
        const consultantEmbedding = consultantEmbeddings[index];
        if (!consultantEmbedding) {
          throw new Error(`Missing embedding for consultant at index ${index}`);
        }
        
        const semanticSimilarity = huggingFaceService.cosineSimilarity(
          jobEmbedding,
          consultantEmbedding
        );

        const { score: bonusScore, reasons } = this.calculateBonusScore(
          consultant,
          job
        );

        // Combine semantic similarity (70%) + bonus factors (30%)
        const finalScore = semanticSimilarity * 0.7 + bonusScore;

        return {
          consultant,
          matchScore: Math.round(finalScore * 100), // Convert to percentage
          matchReasons: [
            `${Math.round(semanticSimilarity * 100)}% semantic match`,
            ...reasons,
          ],
        };
      });

      // Filter by minimum score and sort
      const filteredMatches = matches
        .filter((m: MatchedConsultant) => m.matchScore / 100 >= minScore)
        .sort((a: MatchedConsultant, b: MatchedConsultant) => b.matchScore - a.matchScore)
        .slice(0, limit);

      console.log(`✅ Returning top ${filteredMatches.length} matches`);

      return filteredMatches;
    } catch (error) {
      console.error('Error finding consultant matches:', error);
      throw new Error('Failed to match consultants');
    }
  }

  /**
   * Get consultant suggestions when a job is posted
   */
  async suggestConsultantsForJob(jobId: string): Promise<MatchedConsultant[]> {
    try {
      const { Job } = await import('../models/job.model');
      
      console.log('Fetching job with ID:', jobId);
      const job = await Job.findById(jobId).lean();

      if (!job) {
        console.error('Job not found with ID:', jobId);
        throw new Error('Job not found');
      }

      console.log('Job found:', { 
        title: job.title, 
        category: job.category, 
        skills: job.skills 
      });

      return await this.findBestMatches({
        title: job.title,
        description: job.description,
        category: job.category,
        skills: job.skills || [],
        budget: job.budget,
      });
    } catch (error) {
      console.error('Error suggesting consultants:', error);
      throw error;
    }
  }
}

export default new ConsultantMatchingService();
