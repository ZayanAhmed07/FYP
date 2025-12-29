/**
 * Withdrawal Routes
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/authMiddleware';
import * as withdrawalController from './withdrawal.controller';


const router = Router();

// Admin routes (must be before :withdrawalId routes to avoid conflicts)
router.get('/admin/requests', authenticate, withdrawalController.getAllWithdrawalRequests);

// Public routes (authenticated users only)
router.get('/wallet/balance', authenticate, withdrawalController.getWalletBalance);
router.get('/history', authenticate, withdrawalController.getWithdrawalHistory);
router.get('/stats', authenticate, withdrawalController.getWithdrawalStats);
router.get('/transactions', authenticate, withdrawalController.getTransactionHistory);
router.get('/:withdrawalId', authenticate, withdrawalController.getWithdrawalDetails);

router.post('/request', authenticate, withdrawalController.createWithdrawalRequest);
router.post('/cancel/:withdrawalId', authenticate, withdrawalController.cancelWithdrawal);

router.post('/methods/save', authenticate, withdrawalController.saveWithdrawalMethod);
router.put('/methods/:methodId', authenticate, withdrawalController.updateWithdrawalMethod);
router.delete('/methods/:methodId', authenticate, withdrawalController.deleteWithdrawalMethod);

// Admin action routes
router.post('/:withdrawalId/approve', authenticate, withdrawalController.approveWithdrawal);
router.post('/:withdrawalId/process', authenticate, withdrawalController.startProcessing);
router.post('/:withdrawalId/complete', authenticate, withdrawalController.completeWithdrawal);
router.post('/:withdrawalId/reject', authenticate, withdrawalController.rejectWithdrawal);

export default router;
