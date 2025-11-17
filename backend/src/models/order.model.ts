import { Document, Model, Schema, model, Types } from 'mongoose';

export interface IMilestone {
  description: string;
  amount: number;
  status: 'pending' | 'completed' | 'paid';
  completedAt?: Date;
  paidAt?: Date;
}

export interface IOrder {
  jobId: Types.ObjectId;
  buyerId: Types.ObjectId;
  consultantId: Types.ObjectId;
  proposalId: Types.ObjectId;
  totalAmount: number;
  status: 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  milestones: IMilestone[];
  amountPaid: number;
  amountPending: number;
  startDate: Date;
  completionDate?: Date;
}

export interface OrderDocument extends IOrder, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderModel extends Model<OrderDocument> {}

const milestoneSchema = new Schema<IMilestone>(
  {
    description: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'completed', 'paid'], default: 'pending' },
    completedAt: { type: Date },
    paidAt: { type: Date },
  },
  { _id: true },
);

const orderSchema = new Schema<OrderDocument, OrderModel>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    consultantId: { type: Schema.Types.ObjectId, ref: 'Consultant', required: true },
    proposalId: { type: Schema.Types.ObjectId, ref: 'Proposal', required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['in_progress', 'completed', 'cancelled'], default: 'in_progress' },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    milestones: { type: [milestoneSchema], default: [] },
    amountPaid: { type: Number, default: 0 },
    amountPending: { type: Number, required: true },
    startDate: { type: Date, default: Date.now },
    completionDate: { type: Date },
  },
  {
    timestamps: true,
  },
);

export const Order = model<OrderDocument, OrderModel>('Order', orderSchema);


