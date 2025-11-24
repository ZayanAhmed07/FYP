import { Schema, model, Document } from 'mongoose';

export interface INotification extends Document {
  userId?: Schema.Types.ObjectId; // Optional for guest notifications
  guestEmail?: string; // For guest users
  title: string;
  message: string;
  type: 'contact_form' | 'general' | 'admin' | 'order' | 'proposal';
  isRead: boolean;
  relatedId?: Schema.Types.ObjectId;
  relatedType?: string;
  createdAt: Date;
  readAt?: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Made optional for guest notifications
    },
    guestEmail: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: ['contact_form', 'general', 'admin', 'order', 'proposal'],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedId: {
      type: Schema.Types.ObjectId,
    },
    relatedType: {
      type: String,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });

export const Notification = model<INotification>('Notification', notificationSchema);