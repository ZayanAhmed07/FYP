import { Document, Model, Schema, model, Types } from 'mongoose';

export interface IJob {
  buyerId: Types.ObjectId;
  category: string;
  title: string;
  description: string;
  budget: {
    min: number;
    max: number;
  };
  timeline: string;
  location: string;
  skills: string[];
  attachments?: string[];
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  proposalsCount: number;
  hiredConsultantId?: Types.ObjectId;
}

export interface JobDocument extends IJob, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface JobModel extends Model<JobDocument> {}

const jobSchema = new Schema<JobDocument, JobModel>(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    budget: {
      min: { type: Number, required: true, min: 0 },
      max: { type: Number, required: true, min: 0 },
    },
    timeline: { type: String, required: true },
    location: { type: String, required: true },
    skills: { type: [String], default: [] },
    attachments: { type: [String], default: [] },
    status: { type: String, enum: ['open', 'in_progress', 'completed', 'cancelled'], default: 'open' },
    proposalsCount: { type: Number, default: 0 },
    hiredConsultantId: { type: Schema.Types.ObjectId, ref: 'Consultant' },
  },
  {
    timestamps: true,
  },
);

export const Job = model<JobDocument, JobModel>('Job', jobSchema);


