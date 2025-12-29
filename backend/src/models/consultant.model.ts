/**
 * Consultant Model - Specialized user profile for consultants
 * Aligned with Class Diagram: Consultant entity (inherits from User)
 * 
 * Represents consultant-specific data and verification status
 * Links to User model via userId reference (1-to-1 relationship)
 */

import { Document, Model, Schema, model, Types } from 'mongoose';

/**
 * Consultant Interface - Extended profile for consultant users
 * Maps to 'Consultant' class in diagram
 */
export interface IConsultant {
  userId: Types.ObjectId;           // Reference to User entity (1-to-1 relationship)
  title: string;                    // Professional title/headline
  bio: string;                      // Detailed professional biography
  specialization: string[];         // Areas of expertise
  hourlyRate: number;               // Hourly billing rate (maps to 'rating: float' in diagram)
  availability: 'available' | 'limited' | 'unavailable';  // Current availability status
  experience: string;               // Years/description of experience
  skills: string[];                 // Technical skills and competencies (maps to diagram)
  skillsEmbedding?: number[];       // Cached embedding vector for AI matching (avoids API calls)
  embeddingGeneratedAt?: Date;      // Timestamp of last embedding generation (for cache freshness)
  location?: {                      // Consultant location (supports remote work)
    country: string;
    city: string;
  };
  remoteWork?: boolean;             // Available for remote/national work
  
  // Verification Documents (for Admin verification via VerifyConsultant())
  idCardFront?: string;             // URL to ID card front image
  idCardBack?: string;              // URL to ID card back image
  supportingDocuments?: string[];   // Additional verification documents (verificationdocs in diagram)
  
  // Verification Status (managed by Admin.VerifyConsultant())
  isVerified: boolean;              // Admin approval status (verificationstatus in diagram)
  
  // Performance Metrics
  rating: number;                   // Average rating from reviews (0-5 stars)
  totalProjects: number;            // Number of completed projects
  totalEarnings: number;            // Lifetime earnings
  averageRating?: number;           // Calculated from reviews (0-5 stars, rounded to 1 decimal)
  totalReviews?: number;            // Total number of reviews received
}

export interface ConsultantDocument extends IConsultant, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsultantModel extends Model<ConsultantDocument> {}

/**
 * Consultant Schema Definition
 * Implements validation and relationships for consultant profiles
 */
const consultantSchema = new Schema<ConsultantDocument, ConsultantModel>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',           // Links to User model (parent class)
      required: true, 
      unique: true,          // Each user can have only one consultant profile
      index: true            // Index for faster lookups
    },
    title: { type: String, required: true, trim: true },
    bio: { type: String, required: true },
    specialization: { type: [String], required: true },
    hourlyRate: { type: Number, required: true, min: 0 },
    availability: { 
      type: String, 
      enum: ['available', 'limited', 'unavailable'], 
      default: 'available' 
    },
    experience: { type: String, required: true },
    skills: { type: [String], default: [], index: true },  // Index for skill-based queries
    skillsEmbedding: { type: [Number], default: undefined },  // Cached embedding for semantic matching
    embeddingGeneratedAt: { type: Date, default: undefined }, // Timestamp for cache invalidation
    location: {
      country: { type: String },
      city: { type: String, index: true },  // Index for location matching
    },
    remoteWork: { type: Boolean, default: false },  // Remote work availability
    
    // Verification documents (uploadverificationdocs() in diagram)
    idCardFront: { type: String },
    idCardBack: { type: String },
    supportingDocuments: { type: [String], default: [] },
    
    // Admin verification (Admin.VerifyConsultant())
    isVerified: { type: Boolean, default: false },
    
    // Performance tracking
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalProjects: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

/**
 * 📌 IMPORTANT METHODS (implemented in consultant.service.ts):
 * - submitbid(): Creates a new Proposal (Bid) for a Project (Job)
 * - markdeliverable(): Updates Order progress and milestones
 * 
 * These operations are handled through the service layer
 */
export const Consultant = model<ConsultantDocument, ConsultantModel>('Consultant', consultantSchema);




