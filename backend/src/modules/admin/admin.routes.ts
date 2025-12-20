import { Router } from 'express';

import * as adminController from './admin.controller';
import { authenticate } from '../../middleware/authMiddleware';
import { commonValidations } from '../../middleware/validation';
import {
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact,
  getContactStats,
} from '../contact/contact.controller';

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:accountType', ...commonValidations.enumValue(['buyer', 'consultant'], 'accountType'), adminController.getUsersByAccountType);
router.patch('/users/:userId/ban', ...commonValidations.mongoId('userId'), adminController.banUser);
router.patch('/users/:userId/unban', ...commonValidations.mongoId('userId'), adminController.unbanUser);
router.delete('/users/:userId', ...commonValidations.mongoId('userId'), adminController.deleteUser);

// Consultant verification
router.get('/consultants/pending', adminController.getPendingConsultants);
router.patch('/consultants/:consultantId/verify', ...commonValidations.mongoId('consultantId'), adminController.verifyConsultantAdmin);
router.patch('/consultants/:consultantId/decline', ...commonValidations.mongoId('consultantId'), adminController.declineConsultant);

// Contact management
router.get('/contacts', getAllContacts);
router.get('/contacts/stats', getContactStats);
router.get('/contacts/:id', ...commonValidations.mongoId('id'), getContactById);
router.patch('/contacts/:id', ...commonValidations.mongoId('id'), updateContact);
router.delete('/contacts/:id', ...commonValidations.mongoId('id'), deleteContact);

// Statistics
router.get('/stats', adminController.getAdminStats);

export default router;

