import { Router } from 'express';

import * as consultantController from './consultant.controller';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();

router.post('/', consultantController.createConsultant);
router.post('/verify-profile', authenticate, consultantController.createCompleteProfile);
router.get('/', consultantController.getAllConsultants);
// Place more specific routes before the generic :id route
router.get('/user/:userId', consultantController.getConsultantByUserId);
router.patch('/:id/verify', consultantController.verifyConsultant);
router.patch('/:id/documents', consultantController.uploadVerificationDocuments);
router.get('/:id', consultantController.getConsultantById);
router.put('/:id', consultantController.updateConsultant);
router.patch('/:id', consultantController.updateConsultant);
router.delete('/:id', consultantController.deleteConsultant);

export default router;

