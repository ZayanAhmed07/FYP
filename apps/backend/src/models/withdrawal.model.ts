/**
 * Withdrawal Model - Consultant payment withdrawal system
 * Handles withdrawal requests, processing, and transaction history
 */

import { Document, Model, Schema, model, Types } from 'mongoose';

export interface IWithdrawalMethod {
  type: 'bank_transfer' | 'paypal' | 'stripe' | 'crypto'; // Same methods as deposits
  accountHolderName?: string;
  accountNumber?: string;
  bankName?: string;
  swiftCode?: string;
  email?: string; // For PayPal
  walletAddress?: string; // For crypto
  isDefault?: boolean;
}

export interface IWithdrawal extends Document {
  consultantId: Types.ObjectId; // Reference to User (consultant)
  amount: number; // Withdrawal amount in PKR
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'failed' | 'cancelled';
  withdrawalMethod: IWithdrawalMethod;
  
  // Processing details
  requestedAt: Date;
  approvedAt?: Date;
  processedAt?: Date;
  completedAt?: Date;
  
  // Processing information
  adminNotes?: string;
  transactionId?: string; // Stripe, bank reference, etc.
  bankReference?: string; // Bank transfer reference
  estimatedProcessingDays?: number; // e.g., 3-5 business days
  
  // Financial details
  platformFeePercent?: number; // Platform fee percentage (default: 2%)
  platformFee?: number; // Calculated fee
  actualAmountPaid?: number; // Amount minus fees
  
  // Metadata
  ipAddress?: string;
  userAgent?: string;
}

export interface WithdrawalDocument extends IWithdrawal, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface WithdrawalModel extends Model<WithdrawalDocument> {}

const withdrawalMethodSchema = new Schema<IWithdrawalMethod>(
  {
    type: {
      type: String,
      enum: ['bank_transfer', 'paypal', 'stripe', 'crypto'],
      required: true,
    },
    accountHolderName: String,
    accountNumber: String,
    bankName: String,
    swiftCode: String,
    email: String,
    walletAddress: String,
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const withdrawalSchema = new Schema<WithdrawalDocument, WithdrawalModel>(
  {
    consultantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 2000, // Minimum withdrawal threshold
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    withdrawalMethod: {
      type: withdrawalMethodSchema,
      required: true,
    },
    
    // Timeline
    requestedAt: {
      type: Date,
      default: () => new Date(),
    },
    approvedAt: Date,
    processedAt: Date,
    completedAt: Date,
    
    // Processing info
    adminNotes: String,
    transactionId: {
      type: String,
      sparse: true,
      index: true,
    },
    bankReference: String,
    estimatedProcessingDays: {
      type: Number,
      default: 5, // 3-5 business days
    },
    
    // Fees
    platformFeePercent: {
      type: Number,
      default: 2, // 2% platform fee
    },
    platformFee: Number,
    actualAmountPaid: Number,
    
    // Metadata
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

// Index for common queries
withdrawalSchema.index({ consultantId: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1, createdAt: -1 });
withdrawalSchema.index({ consultantId: 1, status: 1 });

// Calculate platform fee before saving
withdrawalSchema.pre('save', function (next) {
  if (!this.isModified('amount') && !this.isModified('platformFeePercent')) {
    return next();
  }

  this.platformFee = Math.round((this.amount * (this.platformFeePercent || 2)) / 100);
  this.actualAmountPaid = this.amount - this.platformFee;

  next();
});

export const Withdrawal = model<WithdrawalDocument, WithdrawalModel>('Withdrawal', withdrawalSchema);
export default Withdrawal;
