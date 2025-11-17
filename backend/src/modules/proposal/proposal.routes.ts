import { Router } from 'express';

import { authenticate } from '../../middleware/authMiddleware';
import * as proposalController from './proposal.controller';

const router = Router();

// All proposal routes require authentication
router.post('/', authenticate, proposalController.createProposal);
router.get('/', authenticate, proposalController.getAllProposals);

// Place more specific routes before dynamic :id route
router.get('/job/:jobId', authenticate, proposalController.getProposalsByJob);
router.get('/consultant/:consultantId', authenticate, proposalController.getProposalsByConsultant);
router.get('/buyer/:buyerId', authenticate, proposalController.getProposalsByBuyer);

router.get('/:id', authenticate, proposalController.getProposalById);
router.put('/:id', authenticate, proposalController.updateProposal);
router.patch('/:id/accept', authenticate, proposalController.acceptProposal);
router.patch('/:id/reject', authenticate, proposalController.rejectProposal);
router.delete('/:id', authenticate, proposalController.deleteProposal);

export default router;

