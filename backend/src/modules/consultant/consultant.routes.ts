import { Router } from 'express';

import * as consultantController from './consultant.controller';
import { authenticate } from '../../middleware/authMiddleware';
import { commonValidations } from '../../middleware/validation';

const router = Router();

router.post('/', consultantController.createConsultant);
router.post('/verify-profile', authenticate, consultantController.createCompleteProfile);
router.post('/match', consultantController.findBestMatches);
router.get('/', consultantController.getAllConsultants);
// Place more specific routes before the generic :id route
router.get('/user/:userId', ...commonValidations.mongoId('userId'), consultantController.getConsultantByUserId);
router.get('/suggest/:jobId', ...commonValidations.mongoId('jobId'), consultantController.suggestConsultantsForJob);
router.get('/:id/stats', ...commonValidations.mongoId('id'), consultantController.getConsultantStats);
router.patch('/:id/verify', authenticate, ...commonValidations.mongoId('id'), consultantController.verifyConsultant);
router.patch('/:id/documents', authenticate, ...commonValidations.mongoId('id'), consultantController.uploadVerificationDocuments);
router.get('/:id', ...commonValidations.mongoId('id'), consultantController.getConsultantById);
router.put('/:id', authenticate, ...commonValidations.mongoId('id'), consultantController.updateConsultant);
router.patch('/:id', authenticate, ...commonValidations.mongoId('id'), consultantController.updateConsultant);
router.delete('/:id', authenticate, ...commonValidations.mongoId('id'), consultantController.deleteConsultant);

export default router;

