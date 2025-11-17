import { Document, Model, Schema, model, Types } from 'mongoose';

export interface IMessage {
  conversationId: string;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  content: string;
  isRead: boolean;
  attachments?: string[];
}

export interface MessageDocument extends IMessage, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageModel extends Model<MessageDocument> {}

const messageSchema = new Schema<MessageDocument, MessageModel>(
  {
    conversationId: { type: String, required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    attachments: { type: [String], default: [] },
  },
  {
    timestamps: true,
  },
);

// Index for efficient querying
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, isRead: 1 });

export const Message = model<MessageDocument, MessageModel>('Message', messageSchema);


