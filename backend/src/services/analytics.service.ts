import { Types } from 'mongoose';

import { Analytics, AnalyticsEventType } from '../models/analytics.model';
import { ApiError } from '../utils/ApiError';

/**
 * Record a profile view (impression)
 */
export const recordProfileView = async (
  consultantId: string,
  userId?: string,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
  }
) => {
  try {
    // Validate consultant ID
    if (!Types.ObjectId.isValid(consultantId)) {
      throw new ApiError(400, 'Invalid consultant ID format');
    }

    const analyticsData = {
      consultantId: new Types.ObjectId(consultantId),
      eventType: 'profile_view' as AnalyticsEventType,
      userId: userId ? new Types.ObjectId(userId) : undefined,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      referrer: metadata?.referrer,
    };

    await Analytics.create(analyticsData);
  } catch (error: any) {
    // Skip duplicate events (expected behavior)
    if (error.code === 'DUPLICATE_EVENT') {
      return;
    }
    throw error;
  }
};

/**
 * Record a proposal click
 */
export const recordProposalClick = async (
  consultantId: string,
  proposalId: string,
  userId?: string,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
  }
) => {
  try {
    // Validate IDs
    if (!Types.ObjectId.isValid(consultantId)) {
      throw new ApiError(400, 'Invalid consultant ID format');
    }
    if (!Types.ObjectId.isValid(proposalId)) {
      throw new ApiError(400, 'Invalid proposal ID format');
    }

    const analyticsData = {
      consultantId: new Types.ObjectId(consultantId),
      proposalId: new Types.ObjectId(proposalId),
      eventType: 'proposal_click' as AnalyticsEventType,
      userId: userId ? new Types.ObjectId(userId) : undefined,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      referrer: metadata?.referrer,
    };

    await Analytics.create(analyticsData);
  } catch (error: any) {
    // Skip duplicate events (expected behavior)
    if (error.code === 'DUPLICATE_EVENT') {
      return;
    }
    throw error;
  }
};

/**
 * Get analytics summary for a consultant (for a specific time period)
 */
export const getConsultantAnalytics = async (
  consultantId: string,
  startDate?: Date,
  endDate?: Date
) => {
  const currentYear = new Date().getFullYear();
  const start = startDate || new Date(currentYear, 0, 1); // January 1st of current year
  const end = endDate || new Date(currentYear + 1, 0, 1); // January 1st of next year

  // Aggregate profile views by month
  const profileViews = await Analytics.aggregate([
    {
      $match: {
        consultantId: new Types.ObjectId(consultantId),
        eventType: 'profile_view',
        createdAt: { $gte: start, $lt: end }
      }
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  // Aggregate proposal clicks by month
  const proposalClicks = await Analytics.aggregate([
    {
      $match: {
        consultantId: new Types.ObjectId(consultantId),
        eventType: 'proposal_click',
        createdAt: { $gte: start, $lt: end }
      }
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  return {
    profileViews,
    proposalClicks,
    period: { start, end }
  };
};

/**
 * Get total counts for a consultant (all time)
 */
export const getConsultantTotals = async (consultantId: string) => {
  const [profileViewsResult, proposalClicksResult] = await Promise.all([
    Analytics.countDocuments({
      consultantId: new Types.ObjectId(consultantId),
      eventType: 'profile_view'
    }),
    Analytics.countDocuments({
      consultantId: new Types.ObjectId(consultantId),
      eventType: 'proposal_click'
    })
  ]);

  return {
    totalProfileViews: profileViewsResult,
    totalProposalClicks: proposalClicksResult
  };
};