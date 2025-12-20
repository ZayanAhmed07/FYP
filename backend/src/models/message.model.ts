/**
 * Message Model - Represents chat messages between users
 * Aligned with Class Diagram: ChatMessage entity
 * 
 * Enables real-time communication between Clients and Consultants
 * Relationship: User (0..*) sends (*) ChatMessages
 */

import { Document, Model, Schema, model, Types } from 'mongoose';

/**
 * Message Interface - Chat message details
 * Maps to 'ChatMessage' class in diagram
 */
export interface IMessage {
  conversationId: string;           // Groups messages between two users
  senderId: Types.ObjectId;         // User who sent the message (maps to 'send' relationship)
  receiverId: Types.ObjectId;       // User who receives the message
  content: string;                  // Message text content (text in diagram)
  isRead: boolean;                  // Message read status
  status?: 'sent' | 'delivered' | 'seen';  // Message delivery status
  deliveredAt?: Date;               // When message was delivered
  readAt?: Date;                    // When message was read
  attachments?: string[];           // File attachments (URLs)
}

/**
 * Message Document - Mongoose document with timestamps
 */
export interface MessageDocument extends IMessage, Document {
  createdAt: Date;                  // Message sent time (timestamp in diagram)
  updatedAt: Date;
}

/**
 * Message Model Interface
 */
export interface MessageModel extends Model<MessageDocument> {}

/**
 * Message Schema Definition
 * Implements real-time messaging system
 */
const messageSchema = new Schema<MessageDocument, MessageModel>(
  {
    conversationId: { 
      type: String, 
      required: true, 
      index: true            // Index for conversation queries
    },
    senderId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',           // Links to sender (User entity)
      required: true,
      index: true
    },
    receiverId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',           // Links to receiver (User entity)
      required: true,
      index: true
    },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    status: { 
      type: String, 
      enum: ['sent', 'delivered', 'seen'], 
      default: 'sent' 
    },
    deliveredAt: { type: Date },
    readAt: { type: Date },
    attachments: { type: [String], default: [] },
  },
  {
    timestamps: true,        // Auto-manage timestamp (in diagram)
  },
);

// Compound indexes for efficient querying
messageSchema.index({ conversationId: 1, createdAt: -1 });  // Get conversation history
messageSchema.index({ receiverId: 1, isRead: 1 });          // Get unread messages

/**
 * 📌 IMPORTANT METHODS (implemented in messaging.service.ts):
 * - ChatMessage.send(): Sends a new message between users
 * - markAsRead(): Updates isRead status when recipient views message
 * - getUnreadCount(): Counts unread messages for a user
 */
export const Message = model<MessageDocument, MessageModel>('Message', messageSchema);




