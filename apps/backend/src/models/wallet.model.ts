/**
 * Wallet Model - Tracks consultant earnings and available balance
 * Maintains cleared (available for withdrawal) and pending (from ongoing projects) funds
 */

import { Document, Model, Schema, model, Types } from 'mongoose';

export interface IWalletTransaction {
  type: 'deposit' | 'withdrawal' | 'earning' | 'fee' | 'refund';
  description: string;
  amount: number;
  orderId?: Types.ObjectId;
  withdrawalId?: Types.ObjectId;
  relatedId?: string; // Generic ID for relating to other documents
  date: Date;
  _id?: Types.ObjectId;
}

export interface IWallet extends Document {
  userId: Types.ObjectId; // Reference to consultant (User)
  
  // Balance breakdown
  availableBalance: number; // Cleared funds ready for withdrawal
  pendingBalance: number; // Earnings from ongoing projects (locked until completion)
  totalEarnings: number; // Lifetime earnings
  totalWithdrawn: number; // Lifetime amount withdrawn
  
  // Withdrawal methods
  withdrawalMethods: Array<{
    type: 'bank_transfer' | 'paypal' | 'stripe' | 'crypto';
    accountHolderName?: string;
    accountNumber?: string;
    bankName?: string;
    swiftCode?: string;
    email?: string;
    walletAddress?: string;
    isDefault?: boolean;
    addedAt: Date;
    _id?: Types.ObjectId;
  }>;
  
  // Transaction history
  transactions: IWalletTransaction[];
  
  // Status
  isActive: boolean;
  lastTransactionAt?: Date;
}

export interface WalletDocument extends IWallet, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletModel extends Model<WalletDocument> {
  findOrCreateByUserId(userId: Types.ObjectId): Promise<WalletDocument>;
  addTransaction(userId: Types.ObjectId, transaction: IWalletTransaction): Promise<WalletDocument>;
  updateBalance(userId: Types.ObjectId, availableDelta?: number, pendingDelta?: number): Promise<WalletDocument>;
}

const walletTransactionSchema = new Schema<IWalletTransaction>(
  {
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'earning', 'fee', 'refund'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    withdrawalId: {
      type: Schema.Types.ObjectId,
      ref: 'Withdrawal',
    },
    relatedId: String,
    date: {
      type: Date,
      default: () => new Date(),
    },
  },
  { _id: true }
);

const withdrawalMethodSchema = new Schema(
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
    addedAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  { _id: true }
);

const walletSchema = new Schema<WalletDocument, WalletModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    
    // Balance
    availableBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Withdrawal methods
    withdrawalMethods: {
      type: [withdrawalMethodSchema],
      default: [],
    },
    
    // Transaction history (limited to last 100 for performance)
    transactions: {
      type: [walletTransactionSchema],
      default: [],
    },
    
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    lastTransactionAt: Date,
  },
  {
    timestamps: true,
  }
);

// Index for common queries
walletSchema.index({ userId: 1, createdAt: -1 });

// Static methods
walletSchema.statics.findOrCreateByUserId = async function (userId: Types.ObjectId) {
  let wallet = await this.findOne({ userId });
  if (!wallet) {
    wallet = await this.create({ userId });
  }
  return wallet;
};

walletSchema.statics.addTransaction = async function (userId: Types.ObjectId, transaction: IWalletTransaction) {
  const wallet = await this.findOne({ userId });
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  // Add transaction and keep only last 100
  wallet.transactions.push(transaction);
  if (wallet.transactions.length > 100) {
    wallet.transactions = wallet.transactions.slice(-100);
  }

  wallet.lastTransactionAt = new Date();
  return wallet.save();
};

walletSchema.statics.updateBalance = async function (
  userId: Types.ObjectId,
  availableDelta?: number,
  pendingDelta?: number
) {
  const wallet = await this.findOne({ userId });
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  if (availableDelta) {
    wallet.availableBalance = Math.max(0, wallet.availableBalance + availableDelta);
  }
  if (pendingDelta) {
    wallet.pendingBalance = Math.max(0, wallet.pendingBalance + pendingDelta);
  }

  return wallet.save();
};

export const Wallet = model<WalletDocument, WalletModel>('Wallet', walletSchema);
export default Wallet;
