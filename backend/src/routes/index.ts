import { Router } from 'express';

import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/user/user.routes';
import consultantRoutes from '../modules/consultant/consultant.routes';
import jobRoutes from '../modules/job/job.routes';
import proposalRoutes from '../modules/proposal/proposal.routes';
import orderRoutes from '../modules/order/order.routes';
import adminRoutes from '../modules/admin/admin.routes';
import messagingRoutes from '../modules/messaging/messaging.routes';
import reviewRoutes from '../modules/review/review.routes';

const router = Router();

// Authentication & Users
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Core Platform Features
router.use('/consultants', consultantRoutes);
router.use('/jobs', jobRoutes);
router.use('/proposals', proposalRoutes);
router.use('/orders', orderRoutes);
router.use('/messages', messagingRoutes);
router.use('/reviews', reviewRoutes);

// Admin
router.use('/admin', adminRoutes);

export default router;


