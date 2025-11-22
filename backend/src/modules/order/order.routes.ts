import { Router } from 'express';

import { authenticate } from '../../middleware/authMiddleware';
import * as orderController from './order.controller';

const router = Router();

// All order routes require authentication
router.use(authenticate);

router.post('/', orderController.createOrder);
router.get('/', orderController.getAllOrders);

// Place specific routes BEFORE dynamic :id routes
router.get('/buyer/:buyerId', orderController.getOrdersByBuyer);
router.get('/consultant/:consultantId', orderController.getOrdersByConsultant);

router.get('/:id', orderController.getOrderById);
router.put('/:id', orderController.updateOrder);
router.patch('/:id/progress', orderController.updateOrderProgress);
router.post('/:id/milestones', orderController.addMilestone);
router.patch('/:id/milestones/:milestoneId/complete', orderController.completeMilestone);
router.patch('/:id/milestones/:milestoneId/pay', orderController.payMilestone);
router.patch('/:id/request-completion', orderController.requestCompletion);
router.patch('/:id/confirm-completion', orderController.confirmCompletion);
router.patch('/:id/complete', orderController.completeOrder);
router.patch('/:id/cancel', orderController.cancelOrder);
router.delete('/:id', orderController.deleteOrder);

// Payment routes
router.post('/payment/process', orderController.processPayment);
router.post('/payment/verify', orderController.verifyPaymentOtp);

export default router;



