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
import contactRoutes from '../modules/contact/contact.routes';
import notificationRoutes from '../modules/notification/notification.routes';
import { authenticate } from '../middleware/authMiddleware';
import * as messagingController from '../modules/messaging/messaging.controller';

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
router.use('/contacts', contactRoutes);
router.use('/notifications', notificationRoutes);

// Conversations endpoint
router.get('/conversations', authenticate, messagingController.getConversations);

// Admin
router.use('/admin', adminRoutes);

export default router;


