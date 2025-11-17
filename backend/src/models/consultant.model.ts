import { Document, Model, Schema, model, Types } from 'mongoose';

export interface IConsultant {
  userId: Types.ObjectId;
  title: string;
  bio: string;
  specialization: string[];
  hourlyRate: number;
  availability: 'available' | 'limited' | 'unavailable';
  experience: string;
  skills: string[];
  idCardFront?: string;
  idCardBack?: string;
  supportingDocuments?: string[];
  isVerified: boolean;
  rating: number;
  totalProjects: number;
  totalEarnings: number;
}

export interface ConsultantDocument extends IConsultant, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsultantModel extends Model<ConsultantDocument> {}

const consultantSchema = new Schema<ConsultantDocument, ConsultantModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    title: { type: String, required: true, trim: true },
    bio: { type: String, required: true },
    specialization: { type: [String], required: true },
    hourlyRate: { type: Number, required: true, min: 0 },
    availability: { type: String, enum: ['available', 'limited', 'unavailable'], default: 'available' },
    experience: { type: String, required: true },
    skills: { type: [String], default: [] },
    idCardFront: { type: String },
    idCardBack: { type: String },
    supportingDocuments: { type: [String], default: [] },
    isVerified: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalProjects: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

export const Consultant = model<ConsultantDocument, ConsultantModel>('Consultant', consultantSchema);


