import { Document, Model, Schema, model, Types } from 'mongoose';

export interface IProposal {
  jobId: Types.ObjectId;
  consultantId: Types.ObjectId;
  bidAmount: number;
  deliveryTime: string;
  coverLetter: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface ProposalDocument extends IProposal, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface ProposalModel extends Model<ProposalDocument> {}

const proposalSchema = new Schema<ProposalDocument, ProposalModel>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    consultantId: { type: Schema.Types.ObjectId, ref: 'Consultant', required: true },
    bidAmount: { type: Number, required: true, min: 0 },
    deliveryTime: { type: String, required: true },
    coverLetter: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  },
  {
    timestamps: true,
  },
);

// Ensure a consultant can only submit one proposal per job
proposalSchema.index({ jobId: 1, consultantId: 1 }, { unique: true });

export const Proposal = model<ProposalDocument, ProposalModel>('Proposal', proposalSchema);


