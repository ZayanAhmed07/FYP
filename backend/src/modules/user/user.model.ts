/**
 * User Model - Core entity representing all users in the system
 * Aligned with Class Diagram: User entity
 * 
 * This model represents both Buyers (Clients) and Consultants
 * The accountType field determines user role and available features
 */

import { Document, Model, Schema, model } from 'mongoose';

/**
 * User Interface - Core user attributes
 * Maps to 'user' entity in class diagram
 */
export interface IUser {
  name: string;              // Full name of the user
  email: string;             // Unique email address (used for authentication)
  password: string;          // Hashed password (bcrypt)
  accountType: 'buyer' | 'consultant';  // User role: Client or Admin in diagram
  phone?: string;            // Optional contact number
  profileImage?: string;     // URL to profile picture
  isVerified: boolean;       // Email/account verification status
  isOnline: boolean;         // Real-time online status for messaging
  isBanned: boolean;         // Admin can ban malicious users
  roles: string[];           // Additional role-based permissions
}

/**
 * User Document - Mongoose document with timestamps
 */
export interface UserDocument extends IUser, Document {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Model - Static methods for user operations
 */
export interface UserModel extends Model<UserDocument> {
  /**
   * 🔍 IMPORTANT: Check if email is already registered
   * Used during registration to prevent duplicate accounts
   */
  isEmailTaken(email: string, excludeUserId?: string): Promise<boolean>;
}

/**
 * User Schema Definition
 * Implements validation rules and data structure
 */
const userSchema = new Schema<UserDocument, UserModel>(
  {
    name: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true,        // Ensures no duplicate emails
      lowercase: true,     // Normalize to lowercase
      trim: true,
      index: true          // Index for faster queries
    },
    password: { 
      type: String, 
      required: true,
      select: false        // Don't include in queries by default (security)
    },
    accountType: { 
      type: String, 
      enum: ['buyer', 'consultant'],  // Maps to Client/Consultant inheritance
      required: true 
    },
    phone: { type: String, trim: true },
    profileImage: { type: String },
    isVerified: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date },
    isBanned: { type: Boolean, default: false },
    roles: {
      type: [String],
      default: ['user'],   // Default role, can add 'admin' for Admin class
    },
  },
  {
    timestamps: true,      // Auto-manage createdAt and updatedAt
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;  // Never expose password in JSON responses
        return ret;
      },
    },
  },
);

/**
 * 🔍 IMPORTANT STATIC METHOD: Check Email Availability
 * Implements unique email validation from class diagram
 * 
 * @param email - Email to check
 * @param excludeUserId - Optional user ID to exclude (for updates)
 * @returns true if email is taken, false if available
 */
userSchema.static('isEmailTaken', async function (email: string, excludeUserId?: string) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return Boolean(user);
});

export const User = model<UserDocument, UserModel>('User', userSchema);

