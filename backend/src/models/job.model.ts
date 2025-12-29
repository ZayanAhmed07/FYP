/**
 * Job Model - Represents projects posted by clients
 * Aligned with Class Diagram: Project entity
 * 
 * Jobs are created by Buyers (Clients) and receive Bids (Proposals) from Consultants
 * Relationship: Client (1) posts (*) Projects
 * Relationship: Project (1) receives (*) Bids
 */

import { Document, Model, Schema, model, Types } from 'mongoose';

/**
 * Job Interface - Project posting details
 * Maps to 'Project' class in diagram
 */
export interface IJob {
  buyerId: Types.ObjectId;          // Client who posted this project (clientid in diagram)
  category: string;                 // Project category/type
  title: string;                    // Project title/headline
  description: string;              // Detailed project description
  budget: {                         // Budget range (budgetmin, budgetmax in diagram)
    min: number;                    
    max: number;
  };
  timeline: string;                 // Expected delivery timeline
  location: string;                 // Project location/region
  skills: string[];                 // Required skills for the project
  skillsEmbedding?: number[];       // Cached embedding vector for AI matching (avoids API calls)
  embeddingGeneratedAt?: Date;      // Timestamp of last embedding generation (for cache freshness)
  attachments?: string[];           // URLs to attached files/documents
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';  // Project status (projectstatus in diagram)
  proposalsCount: number;           // Number of bids received
  hiredConsultantId?: Types.ObjectId;  // Consultant hired for this project
}

export interface JobDocument extends IJob, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface JobModel extends Model<JobDocument> {}

/**
 * Job Schema Definition
 * Implements project posting structure and validations
 */
const jobSchema = new Schema<JobDocument, JobModel>(
  {
    buyerId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',           // Links to Client (User with accountType='buyer')
      required: true,
      index: true            // Index for faster client-specific queries
    },
    category: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    budget: {
      min: { type: Number, required: true, min: 0 },
      max: { type: Number, required: true, min: 0 },
    },
    timeline: { type: String, required: true },
    location: { type: String, required: true },
    skills: { type: [String], default: [] },
    skillsEmbedding: { type: [Number], default: undefined },  // Cached embedding for semantic matching
    embeddingGeneratedAt: { type: Date, default: undefined }, // Timestamp for cache invalidation
    attachments: { type: [String], default: [] },
    status: { 
      type: String, 
      enum: ['open', 'in_progress', 'completed', 'cancelled'], 
      default: 'open',
      index: true            // Index for status-based filtering
    },
    proposalsCount: { type: Number, default: 0 },
    hiredConsultantId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Consultant'      // Links to hired consultant
    },
  },
  {
    timestamps: true,        // Auto-manage createdAt (createdat in diagram)
  },
);

/**
 * 📌 IMPORTANT METHODS (implemented in job.service.ts and related):
 * - Client.postproject(): Creates a new Job (implemented in job.service.ts)
 * - Client.acceptbid(): Accepts a Proposal and creates an Order (in proposal.service.ts)
 * - publish(): Makes the job visible to consultants
 * - close(): Marks the job as completed or cancelled
 */
export const Job = model<JobDocument, JobModel>('Job', jobSchema);




