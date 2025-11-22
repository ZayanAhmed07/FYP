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
    // Deterministic key for uniqueness regardless of order of participants
    participantsKey: { type: String, required: true },
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

// Ensure unique conversation between the same set of participants (order-independent)
conversationSchema.index({ participantsKey: 1 }, { unique: true });

// Pre-save hook to populate participantsKey as sorted concatenation of participant ids
conversationSchema.pre('validate', function (next) {
  const doc: any = this;
  if (Array.isArray(doc.participants) && doc.participants.length > 0) {
    try {
      const ids = doc.participants.map((p: any) => p.toString()).sort();
      doc.participantsKey = ids.join(':');
    } catch (err) {
      // ignore
    }
  }
  next();
});

export const Conversation = model<ConversationDocument, ConversationModel>(
  'Conversation',
  conversationSchema,
);



