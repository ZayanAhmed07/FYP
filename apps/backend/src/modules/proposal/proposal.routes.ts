import { Router } from 'express';

import { authenticate, requireVerifiedConsultant } from '../../middleware/authMiddleware';
import { proposalValidation } from '../../middleware/validation';
import * as proposalController from './proposal.controller';

const router = Router();

// Create proposal - requires verified consultant
router.post('/', authenticate, requireVerifiedConsultant, ...proposalValidation.createProposal, proposalController.createProposal);

// View all proposals - authentication only
router.get('/', authenticate, proposalController.getAllProposals);

// Place more specific routes before dynamic :id route
router.get('/job/:jobId', authenticate, ...proposalValidation.mongoId('jobId'), proposalController.getProposalsByJob);
router.get('/consultant/:consultantId', authenticate, ...proposalValidation.mongoId('consultantId'), proposalController.getProposalsByConsultant);
router.get('/buyer/:buyerId', authenticate, ...proposalValidation.mongoId('buyerId'), proposalController.getProposalsByBuyer);

router.get('/:id', authenticate, ...proposalValidation.mongoId('id'), proposalController.getProposalById);

// Update/delete proposal - requires verified consultant
router.put('/:id', authenticate, requireVerifiedConsultant, ...proposalValidation.mongoId('id'), ...proposalValidation.updateProposal, proposalController.updateProposal);
router.delete('/:id', authenticate, requireVerifiedConsultant, ...proposalValidation.mongoId('id'), proposalController.deleteProposal);

// Accept/reject proposal - buyers can accept, consultants can withdraw
router.patch('/:id/accept', authenticate, ...proposalValidation.mongoId('id'), proposalController.acceptProposal);
router.patch('/:id/reject', authenticate, ...proposalValidation.mongoId('id'), proposalController.rejectProposal);

export default router;

