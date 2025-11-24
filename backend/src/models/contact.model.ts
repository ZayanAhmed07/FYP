import { Schema, model, Document } from 'mongoose';

export interface IContact extends Document {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  status: 'pending' | 'reviewed' | 'responded';
  adminResponse?: string;
  adminResponseDate?: Date;
  reviewedBy?: Schema.Types.ObjectId;
  userId?: Schema.Types.ObjectId; // Reference to User if submitted by authenticated user
  submissionDate: Date;
  ipAddress?: string;
}

const contactSchema = new Schema<IContact>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (email: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: 'Please provide a valid email address',
      },
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'responded'],
      default: 'pending',
    },
    adminResponse: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    adminResponseDate: {
      type: Date,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    submissionDate: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
contactSchema.index({ status: 1, submissionDate: -1 });
contactSchema.index({ email: 1 });

export const Contact = model<IContact>('Contact', contactSchema);