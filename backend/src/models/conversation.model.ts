import { Document, Model, Schema, model, Types } from 'mongoose';

export interface IConversation {
  participants: Types.ObjectId[];
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: Map<string, number>;
}

export interface ConversationDocument extends IConversation, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationModel extends Model<ConversationDocument> {}

const conversationSchema = new Schema<ConversationDocument, ConversationModel>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

// Ensure unique conversation between two users
conversationSchema.index({ participants: 1 }, { unique: true });

export const Conversation = model<ConversationDocument, ConversationModel>(
  'Conversation',
  conversationSchema,
);


