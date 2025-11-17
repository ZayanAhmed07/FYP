import { Router } from 'express';

import { authenticate } from '../../middleware/authMiddleware';
import * as adminController from './admin.controller';

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:accountType', adminController.getUsersByAccountType);
router.patch('/users/:userId/ban', adminController.banUser);
router.patch('/users/:userId/unban', adminController.unbanUser);
router.delete('/users/:userId', adminController.deleteUser);

// Consultant verification
router.get('/consultants/pending', adminController.getPendingConsultants);
router.patch('/consultants/:consultantId/verify', adminController.verifyConsultantAdmin);
router.patch('/consultants/:consultantId/decline', adminController.declineConsultant);

// Statistics
router.get('/stats', adminController.getAdminStats);

export default router;

