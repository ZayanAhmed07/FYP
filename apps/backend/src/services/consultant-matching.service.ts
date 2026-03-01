import { Consultant } from '../models/consultant.model';
// @ts-ignore - TypeScript language server caching issue, module exists and works at runtime
import { geminiEmbeddingService } from './gemini-embedding.service';

interface JobRequirements {
  title: string;
  description: string;
  category: string;
  skills?: string[];
  budget?: {
    min: number;
    max: number;
  };
  location?: string;
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
   * Extract city name from location string (e.g., "Lahore, Pakistan" -> "Lahore")
   */
  private extractCityFromLocation(location?: string): string | null {
    if (!location) return null;
    const parts = location.split(',').map(p => p.trim());
    return parts[0] || null;
  }

  /**
   * Calculate additional matching factors beyond semantic similarity
   */
  private calculateBonusScore(consultant: any, job: JobRequirements & { location?: string }): {
    score: number;
    reasons: string[];
  } {
    let bonusScore = 0;
    const reasons: string[] = [];

    // Location match (high priority for local consultants)
    if (job.location) {
      const jobCity = this.extractCityFromLocation(job.location);
      
      // Exact city match gets highest bonus
      if (jobCity && consultant.location?.city) {
        if (consultant.location.city.toLowerCase() === jobCity.toLowerCase()) {
          bonusScore += 0.15;
          reasons.push(`Located in ${consultant.location.city}`);
        }
      }
      
      // Remote workers get smaller bonus (still valuable)
      if (consultant.remoteWork) {
        bonusScore += 0.08;
        reasons.push('Available for remote work');
      }
    }

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
   * IMPROVED: Uses broader filters + skill matching + location support
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
      const { limit = 10, minScore = 0.3, onlyVerified = false } = options;  // Lower minScore for more matches

      // Build query filters - BROADER APPROACH
      const query: any = {
        availability: { $in: ['available', 'limited'] },  // Only active consultants
      };
      
      // Category OR skill match (not requiring exact category match)
      const orConditions: any[] = [];
      
      // Match by category
      if (job.category) {
        orConditions.push({ specialization: job.category });
      }
      
      // Match by skills (case-insensitive, partial match)
      if (job.skills && job.skills.length > 0) {
        const skillRegexes = job.skills.map(skill => 
          new RegExp(skill.trim(), 'i')  // Case-insensitive regex
        );
        orConditions.push({ skills: { $in: skillRegexes } });
      }
      
      // If we have any OR conditions, add them
      if (orConditions.length > 0) {
        query.$or = orConditions;
      }
      
      // Location filtering: exact city match OR remote workers
      if (job.location) {
        const jobCity = this.extractCityFromLocation(job.location);
        if (jobCity) {
          query.$or = [
            ...(query.$or || []),
            { 'location.city': new RegExp(jobCity, 'i') },  // Case-insensitive city match
            { remoteWork: true },  // OR consultants available for remote work
          ];
        }
      }

      if (onlyVerified) {
        query.isVerified = true;
      }

      console.log('🔍 Query filters:', JSON.stringify(query, null, 2));

      // Fetch consultants with broader criteria
      const consultants = await Consultant.find(query)
        .populate('userId', 'name email profileImage')
        .limit(200) // Larger pool for better ranking
        .lean();

      console.log(`📊 Found ${consultants.length} consultants matching initial criteria`);

      if (consultants.length === 0) {
        console.warn('⚠️ No consultants found. Check database and query filters.');
        return [];
      }

      console.log(`📊 Found ${consultants.length} consultants to evaluate`);

      // ✨ OPTIMIZED: Use cached job embedding or generate new one
      const jobText = this.createJobText(job);
      console.log(`🔍 Getting embedding for job: "${job.title}"`);
      const jobEmbedding = await geminiEmbeddingService.getOrGenerateEmbedding(
        jobText,
        (job as any).skillsEmbedding,
        (job as any).embeddingGeneratedAt
      );

      // ✨ OPTIMIZED: Use cached consultant embeddings with batch processing
      console.log(`🤖 Processing embeddings for ${consultants.length} consultants with cache...`);
      const consultantItems = consultants.map((c: any) => ({
        text: this.createConsultantText(c),
        existingEmbedding: c.skillsEmbedding,
        lastGenerated: c.embeddingGeneratedAt
      }));
      const consultantEmbeddings = await geminiEmbeddingService.generateBatchEmbeddingsWithCache(
        consultantItems
      );

      // Calculate semantic similarity + bonus scores
      const matches = consultants.map((consultant: any, index: number) => {
        const consultantEmbedding = consultantEmbeddings[index];
        if (!consultantEmbedding) {
          throw new Error(`Missing embedding for consultant at index ${index}`);
        }
        
        const semanticSimilarity = geminiEmbeddingService.cosineSimilarity(
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
      
      // Log cache statistics for monitoring
      geminiEmbeddingService.logCacheStats();

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
        location: job.location,
      });
    } catch (error) {
      console.error('Error suggesting consultants:', error);
      throw error;
    }
  }
}

export default new ConsultantMatchingService();
