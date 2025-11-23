/**
 * Analytics Model - Tracks user interactions and engagement metrics
 *
 * Tracks impressions (profile views) and clicks (proposal interactions)
 * for analytics and performance measurement
 */

import { Document, Model, Schema, model, Types } from 'mongoose';

/**
 * Analytics Event Types
 */
export type AnalyticsEventType = 'profile_view' | 'proposal_click';

/**
 * Analytics Interface - Individual tracking events
 */
export interface IAnalytics {
  consultantId: Types.ObjectId;     // Consultant whose profile/proposal was interacted with
  userId?: Types.ObjectId;          // User who performed the action (null for anonymous)
  eventType: AnalyticsEventType;    // Type of interaction
  proposalId?: Types.ObjectId;      // Proposal ID (for proposal_click events)
  ipAddress?: string;               // IP address for rate limiting/duplicate prevention
  userAgent?: string;               // Browser/device info
  referrer?: string;                // Where the user came from
  metadata?: Record<string, any>;   // Additional tracking data
}

export interface AnalyticsDocument extends IAnalytics, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsModel extends Model<AnalyticsDocument> {}

/**
 * Analytics Schema Definition
 * Tracks individual user interactions for aggregation
 */
const analyticsSchema = new Schema<AnalyticsDocument, AnalyticsModel>(
  {
    consultantId: {
      type: Schema.Types.ObjectId,
      ref: 'Consultant',
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    eventType: {
      type: String,
      enum: ['profile_view', 'proposal_click'],
      required: true,
      index: true
    },
    proposalId: {
      type: Schema.Types.ObjectId,
      ref: 'Proposal',
      index: true
    },
    ipAddress: { type: String },
    userAgent: { type: String },
    referrer: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for efficient queries
analyticsSchema.index({ consultantId: 1, eventType: 1, createdAt: -1 });
analyticsSchema.index({ consultantId: 1, createdAt: -1 });
analyticsSchema.index({ createdAt: -1 });

/**
 * Prevent duplicate events within a short time window
 * (same user, same consultant, same event type within 5 minutes)
 */
analyticsSchema.pre('save', async function(next) {
  if (this.userId && this.consultantId && this.eventType) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const existingEvent = await Analytics.findOne({
      consultantId: this.consultantId,
      userId: this.userId,
      eventType: this.eventType,
      createdAt: { $gte: fiveMinutesAgo }
    });

    if (existingEvent) {
      // Skip duplicate event
      const error = new Error('Duplicate event within time window');
      (error as any).code = 'DUPLICATE_EVENT';
      return next(error);
    }
  }
  next();
});

export const Analytics = model<AnalyticsDocument, AnalyticsModel>('Analytics', analyticsSchema);