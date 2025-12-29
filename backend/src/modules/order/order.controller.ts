import { Request, Response } from 'express';

import { catchAsync } from '../../utils/catchAsync';
import * as orderService from './order.service';
import * as stripeService from '../../services/stripe.service';

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
  console.log('🔍 getOrdersByBuyer called with buyerId:', req.params.buyerId);
  const orders = await orderService.getOrdersByBuyer(req.params.buyerId!);
  console.log('📊 Found orders for buyer:', orders.length);
  res.status(200).json({ success: true, data: orders });
});

export const getOrdersByConsultant = catchAsync(async (req: Request, res: Response) => {
  console.log('🔍 getOrdersByConsultant called with consultantId:', req.params.consultantId);
  const orders = await orderService.getOrdersByConsultant(req.params.consultantId!);
  console.log('📊 Found orders for consultant:', orders.length);
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
  const userId = req.user?.id;
  const paymentSession = await orderService.processPayment(req.body, userId!);
  res.status(200).json({ success: true, data: paymentSession });
});

export const verifyPaymentOtp = catchAsync(async (req: Request, res: Response) => {
  const { paymentSessionId, otp } = req.body;
  const payment = await orderService.verifyPaymentOtp(paymentSessionId, otp);
  res.status(200).json({ success: true, data: payment });
});

// ==================== STRIPE PAYMENT ENDPOINTS ====================

/**
 * Create Stripe Payment Intent
 * Used for direct card payments with Stripe Elements
 */
export const createStripePaymentIntent = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { orderId, amount } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // Verify order ownership
  const order = await orderService.getOrderById(orderId);
  if (order.buyerId._id.toString() !== userId) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const paymentIntent = await stripeService.createPaymentIntent({
    amount,
    orderId,
    customerId: userId,
    metadata: {
      orderTitle: (order.jobId as any).title || 'Order Payment',
    },
  });

  res.status(200).json({
    success: true,
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    },
  });
});

/**
 * Create Stripe Checkout Session
 * Used for hosted Stripe Checkout page
 */
export const createStripeCheckoutSession = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { orderId, proposalId, amount } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // Verify order ownership
  const order = await orderService.getOrderById(orderId);
  if (order.buyerId._id.toString() !== userId) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const user = req.user;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  const session = await stripeService.createCheckoutSession({
    orderId,
    proposalId,
    amount,
    successUrl: `${frontendUrl}/buyer-dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${frontendUrl}/buyer-dashboard?payment=cancelled`,
    customerEmail: user?.email || undefined,
    metadata: {
      userId,
    },
  });

  res.status(200).json({
    success: true,
    data: {
      sessionId: session.id,
      url: session.url,
    },
  });
});

/**
 * Verify Stripe Payment
 * Called after successful payment to update order
 */
export const verifyStripePayment = catchAsync(async (req: Request, res: Response) => {
  const { paymentIntentId, sessionId } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  let orderId: string;
  let amount: number;

  // Retrieve payment details from Stripe
  if (paymentIntentId) {
    const paymentIntent = await stripeService.retrievePaymentIntent(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ success: false, message: 'Payment not completed' });
    }

    orderId = paymentIntent.metadata.orderId;
    amount = paymentIntent.amount / 100; // Convert from cents
  } else if (sessionId) {
    const session = await stripeService.retrieveCheckoutSession(sessionId);
    
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Payment not completed' });
    }

    orderId = session.metadata?.orderId || '';
    amount = (session.amount_total || 0) / 100; // Convert from cents
  } else {
    return res.status(400).json({ success: false, message: 'Payment ID required' });
  }

  // Update order with payment
  const order = await orderService.getOrderById(orderId);
  
  if (order.buyerId._id.toString() !== userId) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  order.amountPaid = (order.amountPaid || 0) + amount;
  order.amountPending = order.totalAmount - order.amountPaid;
  await order.save();

  console.log(`[Stripe] Payment verified for Order ${orderId}: ${amount} PKR`);

  res.status(200).json({
    success: true,
    data: {
      orderId,
      amountPaid: order.amountPaid,
      amountPending: order.amountPending,
      transactionId: paymentIntentId || sessionId,
    },
    message: 'Payment verified successfully',
  });
});

/**
 * Stripe Webhook Handler
 * Handles Stripe events (payment success, refunds, etc.)
 */
export const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  if (!signature) {
    return res.status(400).json({ success: false, message: 'Webhook signature required' });
  }

  if (!webhookSecret) {
    console.warn('[Stripe] STRIPE_WEBHOOK_SECRET not configured, skipping signature verification');
    return res.status(200).json({ received: true, warning: 'Webhook secret not configured' });
  }

  const event = stripeService.constructWebhookEvent(req.body, signature, webhookSecret);

  console.log(`[Stripe] Webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any;
        console.log(`[Stripe] PaymentIntent succeeded: ${paymentIntent.id}`);
        
        // Update order with payment
        const orderId = paymentIntent.metadata?.orderId;
        if (orderId) {
          const order = await orderService.getOrderById(orderId);
          const amount = paymentIntent.amount / 100; // Convert from cents
          
          order.amountPaid = (order.amountPaid || 0) + amount;
          order.amountPending = order.totalAmount - order.amountPaid;
          await order.save();
          
          console.log(`[Stripe] Order ${orderId} updated with payment: ${amount} PKR`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const failedPayment = event.data.object as any;
        console.log(`[Stripe] PaymentIntent failed: ${failedPayment.id}`);
        // You can add logic here to notify the user or update order status
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as any;
        console.log(`[Stripe] Checkout session completed: ${session.id}`);
        
        // Update order with payment
        const orderId = session.metadata?.orderId;
        if (orderId && session.payment_status === 'paid') {
          const order = await orderService.getOrderById(orderId);
          const amount = (session.amount_total || 0) / 100; // Convert from cents
          
          order.amountPaid = (order.amountPaid || 0) + amount;
          order.amountPending = order.totalAmount - order.amountPaid;
          await order.save();
          
          console.log(`[Stripe] Order ${orderId} updated with payment: ${amount} PKR`);
        }
        break;
      }

      default:
        console.log(`[Stripe] Unhandled event type: ${event.type}`);
    }
  } catch (error: any) {
    console.error('[Stripe] Error processing webhook:', error);
    return res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }

  res.status(200).json({ received: true });
});

/**
 * Create Refund
 * Refund a payment for cancelled orders
 */
export const createStripeRefund = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { orderId, paymentIntentId, amount } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // Verify order ownership
  const order = await orderService.getOrderById(orderId);
  if (order.buyerId._id.toString() !== userId) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const refund = await stripeService.createRefund(paymentIntentId, amount);

  res.status(200).json({
    success: true,
    data: {
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
    },
    message: 'Refund processed successfully',
  });
});




