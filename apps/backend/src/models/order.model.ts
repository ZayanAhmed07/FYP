/**
 * Order Model - Represents active projects/transactions
 * Aligned with Class Diagram: Transaction entity
 * 
 * Created when a Client accepts a Consultant's Proposal
 * Tracks project progress, milestones, and payments
 * Relationship: Transaction (0..1) linked to (1) Project
 */

import { Document, Model, Schema, model, Types } from 'mongoose';

/**
 * Milestone Interface - Project deliverable milestones
 * Sub-entity within Order/Transaction
 */
export interface IMilestone extends Document {
  description: string;              // Milestone deliverable description
  amount: number;                   // Payment amount for this milestone (float in diagram)
  status: 'pending' | 'completed' | 'paid';  // Milestone completion/payment status
  completedAt?: Date;               // When consultant marked as complete
  paidAt?: Date;                    // When client released payment
}

/**
 * Order Interface - Active project transaction
 * Maps to 'Transaction' class in diagram
 */
export interface IOrder {
  jobId: Types.ObjectId;            // Reference to Project (projectid in diagram)
  buyerId: Types.ObjectId;          // Client who posted the job (clientid in diagram)
  consultantId: Types.ObjectId;     // Hired consultant
  proposalId: Types.ObjectId;       // Accepted proposal/bid
  totalAmount: number;              // Total project value (amount: float in diagram)
  status: 'in_progress' | 'completed' | 'cancelled';  // Transaction status (transactionstatus in diagram)
  progress: number;                 // Project completion percentage (0-100)
  milestones: IMilestone[];         // Payment milestones
  amountPaid: number;               // Total amount released to consultant
  amountPending: number;            // Amount pending payment
  startDate: Date;                  // Project start date
  completionDate?: Date;            // Project completion date
  completionRequestedAt?: Date;     // When consultant requested completion
  completionRequestedBy?: 'consultant' | 'buyer';  // Who requested completion
}

export interface OrderDocument extends IOrder, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderModel extends Model<OrderDocument> {}

/**
 * Milestone Schema - Sub-document for order milestones
 */
const milestoneSchema = new Schema<IMilestone>(
  {
    description: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'completed', 'paid'], default: 'pending' },
    completedAt: { type: Date },
    paidAt: { type: Date },
  },
  { _id: true },           // Each milestone has unique ID
);

/**
 * Order Schema Definition
 * Implements transaction/project execution tracking
 */
const orderSchema = new Schema<OrderDocument, OrderModel>(
  {
    jobId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Job',            // Links to Project (Job)
      required: true,
      index: true
    },
    buyerId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',           // Links to Client (buyer)
      required: true,
      index: true
    },
    consultantId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Consultant',     // Links to hired Consultant
      required: true,
      index: true
    },
    proposalId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Proposal',       // Links to accepted bid
      required: true 
    },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { 
      type: String, 
      enum: ['in_progress', 'completed', 'cancelled'], 
      default: 'in_progress',
      index: true
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    milestones: { type: [milestoneSchema], default: [] },
    amountPaid: { type: Number, default: 0 },
    amountPending: { type: Number, required: true },
    startDate: { type: Date, default: Date.now },
    completionDate: { type: Date },
    completionRequestedAt: { type: Date },
    completionRequestedBy: { type: String, enum: ['consultant', 'buyer'] },
  },
  {
    timestamps: true,        // Auto-manage createdat (in diagram)
  },
);

/**
 * 📌 IMPORTANT METHODS (implemented in order.service.ts):
 * - Transaction.initiate(): Creates a new order when bid is accepted
 * - Transaction.release(): Releases milestone payment to consultant
 * - Transaction.refund(): Refunds money to client if cancelled
 * - Client.paymentmethod(): Processes payment for milestones
 * - Consultant.markdeliverable(): Updates progress and marks milestones complete
 */
export const Order = model<OrderDocument, OrderModel>('Order', orderSchema);




