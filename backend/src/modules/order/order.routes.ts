import { Router } from 'express';

import { authenticate } from '../../middleware/authMiddleware';
import { commonValidations } from '../../middleware/validation';
import * as orderController from './order.controller';

const router = Router();

// Stripe webhook route (must be BEFORE authenticate middleware and BEFORE JSON parsing)
// This will be registered in the main app with raw body parser
router.post('/payment/stripe/webhook', orderController.handleStripeWebhook);

// All other order routes require authentication
router.use(authenticate);

router.post('/', orderController.createOrder);
router.get('/', orderController.getAllOrders);

// Place specific routes BEFORE dynamic :id routes
router.get('/buyer/:buyerId', ...commonValidations.mongoId('buyerId'), orderController.getOrdersByBuyer);
router.get('/consultant/:consultantId', ...commonValidations.mongoId('consultantId'), orderController.getOrdersByConsultant);

router.get('/:id', ...commonValidations.mongoId('id'), orderController.getOrderById);
router.put('/:id', ...commonValidations.mongoId('id'), orderController.updateOrder);
router.patch('/:id/progress', ...commonValidations.mongoId('id'), orderController.updateOrderProgress);
router.post('/:id/milestones', ...commonValidations.mongoId('id'), orderController.addMilestone);
router.patch('/:id/milestones/:milestoneId/complete', ...commonValidations.mongoId('id'), ...commonValidations.mongoId('milestoneId'), orderController.completeMilestone);
router.patch('/:id/milestones/:milestoneId/pay', ...commonValidations.mongoId('id'), ...commonValidations.mongoId('milestoneId'), orderController.payMilestone);
router.patch('/:id/request-completion', ...commonValidations.mongoId('id'), orderController.requestCompletion);
router.patch('/:id/confirm-completion', ...commonValidations.mongoId('id'), orderController.confirmCompletion);
router.patch('/:id/complete', ...commonValidations.mongoId('id'), orderController.completeOrder);
router.patch('/:id/cancel', ...commonValidations.mongoId('id'), orderController.cancelOrder);
router.delete('/:id', ...commonValidations.mongoId('id'), orderController.deleteOrder);

// Payment routes
router.post('/payment/process', orderController.processPayment);
router.post('/payment/verify', orderController.verifyPaymentOtp);

// Stripe payment routes
router.post('/payment/stripe/payment-intent', orderController.createStripePaymentIntent);
router.post('/payment/stripe/checkout-session', orderController.createStripeCheckoutSession);
router.post('/payment/stripe/verify', orderController.verifyStripePayment);
router.post('/payment/stripe/refund', orderController.createStripeRefund);
// Note: webhook route is defined at the top before authentication middleware

export default router;




