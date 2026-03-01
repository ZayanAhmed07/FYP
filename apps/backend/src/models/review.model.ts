/**
 * Review Model - Represents client feedback for consultants
 * Aligned with Class Diagram: Review entity
 * 
 * Clients can leave reviews for consultants after project completion
 * Relationship: Client (1) places (*) Reviews
 * Relationship: Consultant (1) receives (*) Reviews
 */

import { Document, Model, Schema, model, Types } from 'mongoose';

/**
 * Review Interface - Client feedback and rating
 * Maps to 'Review' class in diagram
 */
export interface IReview {
  jobId: Types.ObjectId;            // Reference to completed project (projectid in diagram)
  buyerId: Types.ObjectId;          // Client who wrote the review (clientid in diagram)
  consultantId: Types.ObjectId;     // Consultant being reviewed
  rating: number;                   // Star rating (1-5, integer in diagram)
  comment: string;                  // Written feedback/review text
}

/**
 * Review Document - Mongoose document with timestamps
 */
export interface ReviewDocument extends IReview, Document {
  createdAt: Date;                  // Review submission date (createdat in diagram)
  updatedAt: Date;
}

/**
 * Review Model Interface
 */
export interface ReviewModel extends Model<ReviewDocument> {}

/**
 * Review Schema Definition
 * Implements review submission and rating system
 */
const reviewSchema = new Schema<ReviewDocument, ReviewModel>(
  {
    jobId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Job',            // Links to completed Project
      required: true,
      index: true
    },
    buyerId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',           // Links to Client (reviewer)
      required: true,
      index: true
    },
    consultantId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Consultant',     // Links to Consultant being reviewed
      required: true,
      index: true            // Index for consultant rating aggregation
    },
    rating: { 
      type: Number, 
      required: true, 
      min: 1,                // Minimum 1 star
      max: 5                 // Maximum 5 stars
    },
    comment: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
  },
);

// Ensure a client can only review a consultant once per project
reviewSchema.index({ jobId: 1, buyerId: 1 }, { unique: true });

/**
 * 📌 IMPORTANT METHODS (implemented in review.service.ts):
 * - Review.submit(): Client submits a review after project completion
 * - calculateAverageRating(): Updates consultant's overall rating
 */
export const Review = model<ReviewDocument, ReviewModel>('Review', reviewSchema);
