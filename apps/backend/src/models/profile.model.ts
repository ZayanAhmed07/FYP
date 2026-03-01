/**
 * Profile Model - Extended user profile information
 * Aligned with Class Diagram: Profile entity
 * 
 * Stores additional user information beyond basic authentication
 * Relationship: User (1) has (1) Profile
 */

import { Document, Model, Schema, model, Types } from 'mongoose';

/**
 * Profile Interface - Extended user information
 * Maps to 'Profile' class in diagram
 */
export interface IProfile {
  userId: Types.ObjectId;           // Reference to User entity (userid in diagram)
  fullname: string;                 // Complete name of the user
  bio: string;                      // User biography/description
  contactNumber: string;            // Phone number (ContactNumber in diagram)
  portfolioLinks: string[];         // URLs to portfolio/work samples (portfoliolinks in diagram)
  verificationDocs: string[];       // Verification documents URLs (verificationdocs in diagram)
}

/**
 * Profile Document - Mongoose document with timestamps
 */
export interface ProfileDocument extends IProfile, Document {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Profile Model Interface
 */
export interface ProfileModel extends Model<ProfileDocument> {}

/**
 * Profile Schema Definition
 * Implements extended user profile data storage
 */
const profileSchema = new Schema<ProfileDocument, ProfileModel>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',           // Links to User entity (1-to-1 relationship)
      required: true, 
      unique: true,          // Each user has exactly one profile
      index: true
    },
    fullname: { type: String, required: true, trim: true },
    bio: { type: String, default: '', trim: true },
    contactNumber: { type: String, required: true, trim: true },
    portfolioLinks: { 
      type: [String], 
      default: [],
      validate: {
        validator: function(links: string[]) {
          // Validate URL format
          return links.every(link => /^https?:\/\/.+/.test(link));
        },
        message: 'Invalid URL format in portfolio links'
      }
    },
    verificationDocs: { type: [String], default: [] },
  },
  {
    timestamps: true,
  },
);

/**
 * 📌 IMPORTANT METHODS (implemented in user.service.ts):
 * - Profile.updateprofile(): Updates user profile information
 * - Profile.uploadverificationdocs(): Uploads verification documents for admin review
 */
export const Profile = model<ProfileDocument, ProfileModel>('Profile', profileSchema);
