import { Router } from 'express';
import { authenticate } from '../../middleware/authMiddleware';
import { commonValidations } from '../../middleware/validation';
import * as consultantController from './consultant.controller';

const router = Router();

router.post('/', consultantController.createConsultant);
router.post('/verify-profile', authenticate, consultantController.createCompleteProfile);
router.post('/verify-cnic', consultantController.verifyCNIC);
router.get('/', consultantController.getAllConsultants);
router.get('/user/:userId', ...commonValidations.mongoId('userId'), consultantController.getConsultantByUserId);
router.get('/:id', ...commonValidations.mongoId('id'), consultantController.getConsultantById);
router.patch('/:id', authenticate, ...commonValidations.mongoId('id'), consultantController.updateConsultant);
router.delete('/:id', authenticate, ...commonValidations.mongoId('id'), consultantController.deleteConsultant);

export default router;
