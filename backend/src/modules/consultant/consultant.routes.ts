import { Router } from 'express';

import * as consultantController from './consultant.controller';

const router = Router();

router.post('/', consultantController.createConsultant);
router.get('/', consultantController.getAllConsultants);
// Place more specific routes before the generic :id route
router.get('/user/:userId', consultantController.getConsultantByUserId);
router.get('/:id', consultantController.getConsultantById);
router.put('/:id', consultantController.updateConsultant);
router.delete('/:id', consultantController.deleteConsultant);
router.patch('/:id/verify', consultantController.verifyConsultant);

export default router;

