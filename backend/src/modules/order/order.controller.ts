import { Request, Response } from 'express';

import { catchAsync } from '../../utils/catchAsync';
import * as orderService from './order.service';

export const createOrder = catchAsync(async (req: Request, res: Response) => {
  const order = await orderService.createOrder(req.body);
  res.status(201).json({ success: true, data: order });
});

export const getAllOrders = catchAsync(async (req: Request, res: Response) => {
  const orders = await orderService.getAllOrders(req.query);
  res.status(200).json({ success: true, data: orders });
});

export const getOrderById = catchAsync(async (req: Request, res: Response) => {
  const order = await orderService.getOrderById(req.params.id!);
  res.status(200).json({ success: true, data: order });
});

export const getOrdersByBuyer = catchAsync(async (req: Request, res: Response) => {
  const orders = await orderService.getOrdersByBuyer(req.params.buyerId!);
  res.status(200).json({ success: true, data: orders });
});

export const getOrdersByConsultant = catchAsync(async (req: Request, res: Response) => {
  const orders = await orderService.getOrdersByConsultant(req.params.consultantId!);
  res.status(200).json({ success: true, data: orders });
});

export const updateOrder = catchAsync(async (req: Request, res: Response) => {
  const order = await orderService.updateOrder(req.params.id!, req.body);
  res.status(200).json({ success: true, data: order });
});

export const updateOrderProgress = catchAsync(async (req: Request, res: Response) => {
  const order = await orderService.updateOrderProgress(req.params.id!, req.body.progress);
  res.status(200).json({ success: true, data: order });
});

export const addMilestone = catchAsync(async (req: Request, res: Response) => {
  const order = await orderService.addMilestone(req.params.id!, req.body);
  res.status(200).json({ success: true, data: order });
});

export const completeMilestone = catchAsync(async (req: Request, res: Response) => {
  const { id, milestoneId } = req.params;
  const order = await orderService.completeMilestone(id!, milestoneId!);
  res.status(200).json({ success: true, data: order });
});

export const payMilestone = catchAsync(async (req: Request, res: Response) => {
  const { id, milestoneId } = req.params;
  const order = await orderService.payMilestone(id!, milestoneId!);
  res.status(200).json({ success: true, data: order });
});

export const requestCompletion = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const order = await orderService.requestCompletion(req.params.id!, userId!);
  res.status(200).json({ success: true, data: order, message: 'Completion request sent' });
});

export const confirmCompletion = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const order = await orderService.confirmCompletion(req.params.id!, userId!);
  res.status(200).json({ success: true, data: order, message: 'Order marked as completed' });
});

export const completeOrder = catchAsync(async (req: Request, res: Response) => {
  const order = await orderService.completeOrder(req.params.id!);
  res.status(200).json({ success: true, data: order });
});

export const cancelOrder = catchAsync(async (req: Request, res: Response) => {
  const order = await orderService.cancelOrder(req.params.id!);
  res.status(200).json({ success: true, data: order });
});

export const deleteOrder = catchAsync(async (req: Request, res: Response) => {
  await orderService.deleteOrder(req.params.id!);
  res.status(200).json({ success: true, message: 'Order deleted successfully' });
});

export const processPayment = catchAsync(async (req: Request, res: Response) => {
  const paymentSession = await orderService.processPayment(req.body);
  res.status(200).json({ success: true, data: paymentSession });
});

export const verifyPaymentOtp = catchAsync(async (req: Request, res: Response) => {
  const { paymentSessionId, otp } = req.body;
  const payment = await orderService.verifyPaymentOtp(paymentSessionId, otp);
  res.status(200).json({ success: true, data: payment });
});



