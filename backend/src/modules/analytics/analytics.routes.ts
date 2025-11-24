import { Router } from 'express';

import * as analyticsController from './analytics.controller';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();

// Public routes (no authentication required for tracking)
router.post('/profile-view/:consultantId', analyticsController.recordProfileView);
router.post('/proposal-click/:consultantId/:proposalId', analyticsController.recordProposalClick);

// Protected routes (require authentication)
router.get('/consultant/:consultantId', authenticate, analyticsController.getConsultantAnalytics);
router.get('/consultant/:consultantId/totals', authenticate, analyticsController.getConsultantTotals);

export default router;