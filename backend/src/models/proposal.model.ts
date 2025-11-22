/**
 * Proposal Model - Represents bids submitted by consultants for projects
 * Aligned with Class Diagram: Bid entity
 * 
 * Consultants submit proposals (bids) for jobs posted by clients
 * Relationship: Consultant (1) submits (*) Bids via submitbid()
 * Relationship: Project (1) receives (*) Bids
 */

import { Document, Model, Schema, model, Types } from 'mongoose';

/**
 * Proposal Interface - Bid submission details
 * Maps to 'Bid' class in diagram
 */
export interface IProposal {
  jobId: Types.ObjectId;            // Reference to Project (Job) - projectid in diagram
  consultantId: Types.ObjectId;     // Consultant submitting the bid
  bidAmount: number;                // Proposed price (amount in diagram)
  deliveryTime: string;             // Estimated delivery timeline
  coverLetter: string;              // Proposal message/pitch (message in diagram)
  status: 'pending' | 'accepted' | 'rejected';  // Bid status (bidstatus in diagram)
}

export interface ProposalDocument extends IProposal, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface ProposalModel extends Model<ProposalDocument> {}

/**
 * Proposal Schema Definition
 * Implements bid submission structure with unique constraint
 */
const proposalSchema = new Schema<ProposalDocument, ProposalModel>(
  {
    jobId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Job',            // Links to Project (Job)
      required: true,
      index: true            // Index for job-specific queries
    },
    consultantId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Consultant',     // Links to Consultant who submitted bid
      required: true,
      index: true            // Index for consultant-specific queries
    },
    bidAmount: { type: Number, required: true, min: 0 },
    deliveryTime: { type: String, required: true },
    coverLetter: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'accepted', 'rejected'], 
      default: 'pending',
      index: true            // Index for status filtering
    },
  },
  {
    timestamps: true,        // Auto-manage createdat (in diagram)
  },
);

// Ensure a consultant can only submit one proposal per job
proposalSchema.index({ jobId: 1, consultantId: 1 }, { unique: true });

/**
 * 📌 IMPORTANT METHODS (implemented in proposal.service.ts):
 * - Consultant.submitbid(): Creates a new Proposal (implemented in proposal.service.ts)
 * - Client.acceptbid(): Accepts this proposal and creates an Order
 * - withdraw(): Consultant can withdraw their pending bid
 */
export const Proposal = model<ProposalDocument, ProposalModel>('Proposal', proposalSchema);



