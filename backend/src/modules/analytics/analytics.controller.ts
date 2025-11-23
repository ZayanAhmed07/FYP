import { Request, Response } from 'express';

import { catchAsync } from '../../utils/catchAsync';
import * as analyticsService from '../../services/analytics.service';

/**
 * Record a profile view (impression)
 * POST /api/analytics/profile-view/:consultantId
 */
export const recordProfileView = catchAsync(async (req: Request, res: Response) => {
  const { consultantId } = req.params;
  const userId = req.user?.id; // From auth middleware (optional)

  // Get client information
  const metadata: { ipAddress?: string; userAgent?: string; referrer?: string } = {};
  const ipAddress = req.ip || req.connection.remoteAddress;
  if (ipAddress) metadata.ipAddress = ipAddress;
  const userAgent = req.get('User-Agent');
  if (userAgent) metadata.userAgent = userAgent;
  const referrer = req.get('Referrer');
  if (referrer) metadata.referrer = referrer;

  await analyticsService.recordProfileView(consultantId!, userId, metadata);

  res.status(200).json({
    success: true,
    message: 'Profile view recorded'
  });
});

/**
 * Record a proposal click
 * POST /api/analytics/proposal-click/:consultantId/:proposalId
 */
export const recordProposalClick = catchAsync(async (req: Request, res: Response) => {
  const { consultantId, proposalId } = req.params;
  const userId = req.user?.id; // From auth middleware (optional)

  // Get client information
  const metadata: { ipAddress?: string; userAgent?: string; referrer?: string } = {};
  const ipAddress = req.ip || req.connection.remoteAddress;
  if (ipAddress) metadata.ipAddress = ipAddress;
  const userAgent = req.get('User-Agent');
  if (userAgent) metadata.userAgent = userAgent;
  const referrer = req.get('Referrer');
  if (referrer) metadata.referrer = referrer;

  await analyticsService.recordProposalClick(consultantId!, proposalId!, userId, metadata);

  res.status(200).json({
    success: true,
    message: 'Proposal click recorded'
  });
});

/**
 * Get analytics data for a consultant
 * GET /api/analytics/consultant/:consultantId
 */
export const getConsultantAnalytics = catchAsync(async (req: Request, res: Response) => {
  const { consultantId } = req.params;
  const { startDate, endDate } = req.query;

  const start = startDate ? new Date(startDate as string) : undefined;
  const end = endDate ? new Date(endDate as string) : undefined;

  const analytics = await analyticsService.getConsultantAnalytics(consultantId!, start, end);

  res.status(200).json({
    success: true,
    data: analytics
  });
});

/**
 * Get total analytics counts for a consultant
 * GET /api/analytics/consultant/:consultantId/totals
 */
export const getConsultantTotals = catchAsync(async (req: Request, res: Response) => {
  const { consultantId } = req.params;

  const totals = await analyticsService.getConsultantTotals(consultantId!);

  res.status(200).json({
    success: true,
    data: totals
  });
});