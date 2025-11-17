import { Router } from 'express';

import * as orderController from './order.controller';

const router = Router();

router.post('/', orderController.createOrder);
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);
router.get('/buyer/:buyerId', orderController.getOrdersByBuyer);
router.get('/consultant/:consultantId', orderController.getOrdersByConsultant);
router.put('/:id', orderController.updateOrder);
router.patch('/:id/progress', orderController.updateOrderProgress);
router.post('/:id/milestones', orderController.addMilestone);
router.patch('/:id/milestones/complete', orderController.completeMilestone);
router.patch('/:id/milestones/pay', orderController.payMilestone);
router.patch('/:id/complete', orderController.completeOrder);
router.patch('/:id/cancel', orderController.cancelOrder);
router.delete('/:id', orderController.deleteOrder);

export default router;


