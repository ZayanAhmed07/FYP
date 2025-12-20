import { Router } from 'express';

import { authenticate } from '../../middleware/authMiddleware';
import { proposalValidation } from '../../middleware/validation';
import * as proposalController from './proposal.controller';

const router = Router();

// All proposal routes require authentication
router.post('/', authenticate, ...proposalValidation.createProposal, proposalController.createProposal);
router.get('/', authenticate, proposalController.getAllProposals);

// Place more specific routes before dynamic :id route
router.get('/job/:jobId', authenticate, ...proposalValidation.mongoId('jobId'), proposalController.getProposalsByJob);
router.get('/consultant/:consultantId', authenticate, ...proposalValidation.mongoId('consultantId'), proposalController.getProposalsByConsultant);
router.get('/buyer/:buyerId', authenticate, ...proposalValidation.mongoId('buyerId'), proposalController.getProposalsByBuyer);

router.get('/:id', authenticate, ...proposalValidation.mongoId('id'), proposalController.getProposalById);
router.put('/:id', authenticate, ...proposalValidation.mongoId('id'), ...proposalValidation.updateProposal, proposalController.updateProposal);
router.patch('/:id/accept', authenticate, ...proposalValidation.mongoId('id'), proposalController.acceptProposal);
router.patch('/:id/reject', authenticate, ...proposalValidation.mongoId('id'), proposalController.rejectProposal);
router.delete('/:id', authenticate, ...proposalValidation.mongoId('id'), proposalController.deleteProposal);

export default router;

