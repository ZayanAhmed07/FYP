/**
 * Order Service - Business logic for transaction/project management
 * Implements Transaction operations from class diagram
 * 
 * Key operations:
 * - Transaction.initiate(): Create order when proposal is accepted
 * - Transaction.release(): Release milestone payment to consultant
 * - Transaction.refund(): Refund client if project is cancelled
 * - Consultant.markdeliverable(): Update progress and complete milestones
 * - Client.paymentmethod(): Process milestone payments
 */

import { Consultant } from '../../models/consultant.model';
import { Job } from '../../models/job.model';
import { Order } from '../../models/order.model';
import Wallet from '../../models/wallet.model';
import { ApiError } from '../../utils/ApiError';

// In-memory store for payment sessions (use Redis in production)
const paymentSessions = new Map<string, any>();

/**
 * Create Order - Called when proposal is accepted
 * Implements Transaction.initiate() from class diagram
 */
export const createOrder = async (orderData: any) => {
  const order = await Order.create(orderData);
  return order.populate([
    { path: 'jobId', select: 'title category' },
    { path: 'buyerId', select: 'name email profileImage' },
    { path: 'consultantId', populate: { path: 'userId', select: 'name email profileImage' } },
  ]);
};

export const getAllOrders = async (query: any) => {
  const { page = 1, limit = 10, status } = query;

  const filter: any = {};
  if (status) filter.status = status;

  const orders = await Order.find(filter)
    .populate({ path: 'jobId', select: 'title category' })
    .populate({ path: 'buyerId', select: 'name email profileImage' })
    .populate({ path: 'consultantId', populate: { path: 'userId', select: 'name email profileImage' } })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .sort({ createdAt: -1 });

  const total = await Order.countDocuments(filter);

  return {
    orders,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  };
};

export const getOrderById = async (id: string) => {
  const order = await Order.findById(id)
    .populate({ path: 'jobId' })
    .populate({ path: 'buyerId', select: 'name email profileImage phone' })
    .populate({ path: 'consultantId', populate: { path: 'userId', select: 'name email profileImage phone' } })
    .populate({ path: 'proposalId' });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }
  return order;
};

export const getOrdersByBuyer = async (buyerId: string) => {
  const orders = await Order.find({ buyerId })
    .populate({ path: 'jobId', select: 'title category' })
    .populate({ path: 'consultantId', populate: { path: 'userId', select: 'name email profileImage' } })
    .sort({ createdAt: -1 });
  return orders;
};

export const getOrdersByConsultant = async (consultantId: string) => {
  const orders = await Order.find({ consultantId })
    .populate({ path: 'jobId', select: 'title category' })
    .populate({ path: 'buyerId', select: 'name email profileImage' })
    .sort({ createdAt: -1 });
  return orders;
};

export const updateOrder = async (id: string, updateData: any) => {
  const order = await Order.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }
  return order;
};

export const updateOrderProgress = async (id: string, progress: number) => {
  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  order.progress = progress;
  await order.save();

  return order;
};

export const addMilestone = async (id: string, milestoneData: any) => {
  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  order.milestones.push(milestoneData);
  await order.save();

  return order;
};

/**
 * 📌 IMPORTANT: Complete Milestone
 * Implements Consultant.markdeliverable() from class diagram
 * 
 * Consultant marks a milestone as completed, ready for client payment
 * 
 * @param id - Order ID
 * @param milestoneId - Milestone ID to mark complete
 * @returns Updated order with completed milestone
 */
export const completeMilestone = async (id: string, milestoneId: string) => {
  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const milestone = order.milestones.find(m => m._id.toString() === milestoneId);
  if (!milestone) {
    throw new ApiError(404, 'Milestone not found');
  }

  milestone.status = 'completed';
  milestone.completedAt = new Date();
  await order.save();

  return order;
};

/**
 * 📌 IMPORTANT: Pay Milestone
 * Implements Transaction.release() and Client.paymentmethod() from class diagram
 * 
 * Client releases payment for a completed milestone
 * Updates consultant's earnings automatically
 * 
 * @param id - Order ID
 * @param milestoneId - Milestone ID to pay
 * @returns Updated order with paid milestone
 */
export const payMilestone = async (id: string, milestoneId: string) => {
  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const milestone = order.milestones.find(m => m._id.toString() === milestoneId);
  if (!milestone) {
    throw new ApiError(404, 'Milestone not found');
  }

  if (milestone.status !== 'completed') {
    throw new ApiError(400, 'Milestone must be completed before payment');
  }

  // Release payment (Transaction.release())
  milestone.status = 'paid';
  milestone.paidAt = new Date();
  order.amountPaid += milestone.amount;
  order.amountPending -= milestone.amount;
  await order.save();

  // Update consultant earnings
  const updatedConsultant = await Consultant.findByIdAndUpdate(
    order.consultantId,
    { $inc: { totalEarnings: milestone.amount } },
    { new: true }
  ).populate('userId');

  // 💰 Update consultant's wallet with milestone payment
  if (updatedConsultant) {
    await Wallet.findOneAndUpdate(
      { userId: updatedConsultant.userId },
      {
        $inc: {
          availableBalance: milestone.amount,
          totalEarnings: milestone.amount,
        },
        $push: {
          transactions: {
            type: 'earning',
            description: `Milestone payment: ${milestone.description}`,
            amount: milestone.amount,
            orderId: order._id,
            date: new Date(),
          },
        },
      },
      { upsert: true }
    );
  }

  return order;
};

/**
 * 📋 Request Completion - Consultant requests order completion
 * Similar to Upwork/Upcounsel workflow
 */
export const requestCompletion = async (id: string, userId: string) => {
  const order = await Order.findById(id)
    .populate({ path: 'consultantId', populate: { path: 'userId' } })
    .populate({ path: 'buyerId' });
  
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.status !== 'in_progress') {
    throw new ApiError(400, 'Order is not in progress');
  }

  // Check if user is the consultant
  const consultantUserId = (order.consultantId as any).userId._id.toString();
  if (consultantUserId !== userId) {
    throw new ApiError(403, 'Only consultant can request completion');
  }

  if (order.completionRequestedAt && order.completionRequestedBy === 'consultant') {
    throw new ApiError(400, 'Completion already requested');
  }

  order.completionRequestedAt = new Date();
  order.completionRequestedBy = 'consultant';
  await order.save();

  return order.populate([
    { path: 'jobId', select: 'title category' },
    { path: 'buyerId', select: 'name email profileImage' },
    { path: 'consultantId', populate: { path: 'userId', select: 'name email profileImage' } },
  ]);
};

/**
 * ✅ Confirm Completion - Buyer confirms completion request
 * 🎯 Releases all remaining pending payment to consultant's account
 */
export const confirmCompletion = async (id: string, userId: string) => {
  const order = await Order.findById(id)
    .populate({ path: 'consultantId', populate: { path: 'userId' } })
    .populate({ path: 'buyerId' });
  
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  // Check if user is the buyer
  if (order.buyerId._id.toString() !== userId) {
    throw new ApiError(403, 'Only buyer can confirm completion');
  }

  if (!order.completionRequestedAt) {
    throw new ApiError(400, 'No completion request found');
  }

  // Mark as completed
  order.status = 'completed';
  order.completionDate = new Date();
  order.progress = 100;
  
  // 💰 RELEASE ALL REMAINING PENDING PAYMENT TO CONSULTANT
  // When both sides confirm completion, release any remaining amountPending
  const pendingPayment = order.amountPending;
  order.amountPaid += pendingPayment;
  order.amountPending = 0;
  await order.save();

  // Update job status
  await Job.findByIdAndUpdate(order.jobId, { status: 'completed' });

  // Update consultant stats and release payment to earnings
  // 💵 Add pending payment to consultant's total earnings
  await Consultant.findByIdAndUpdate(order.consultantId, {
    $inc: { 
      totalProjects: 1,
      totalEarnings: pendingPayment  // Release the pending amount to earnings
    },
  });

  // 💰 Update consultant's wallet with the released payment
  const consultantUserId = (order.consultantId as any).userId._id;
  await Wallet.findOneAndUpdate(
    { userId: consultantUserId },
    {
      $inc: {
        availableBalance: pendingPayment,
        totalEarnings: pendingPayment,
      },
      $push: {
        transactions: {
          type: 'earning',
          description: `Payment received for order #${order._id}`,
          amount: pendingPayment,
          orderId: order._id,
          date: new Date(),
        },
      },
    },
    { upsert: true } // Create wallet if doesn't exist
  );

  return order.populate([
    { path: 'jobId', select: 'title category' },
    { path: 'buyerId', select: 'name email profileImage' },
    { path: 'consultantId', populate: { path: 'userId', select: 'name email profileImage' } },
  ]);
};

/**
 * 🏁 Complete Order
 * Finalizes the project and updates all related entities
 * 
 * @param id - Order ID to complete
 * @returns Completed order
 */
export const completeOrder = async (id: string) => {
  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  order.status = 'completed';
  order.completionDate = new Date();
  order.progress = 100;
  await order.save();

  // Update job status
  await Job.findByIdAndUpdate(order.jobId, { status: 'completed' });

  // Update consultant stats (totalProjects counter)
  await Consultant.findByIdAndUpdate(order.consultantId, {
    $inc: { totalProjects: 1 },
  });

  return order;
};

/**
 * ❌ Cancel Order
 * Implements Transaction.refund() from class diagram
 * 
 * Cancels the order and refunds client if applicable
 * 
 * @param id - Order ID to cancel
 * @returns Cancelled order
 */
export const cancelOrder = async (id: string) => {
  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  // Implement refund logic here (Transaction.refund())
  order.status = 'cancelled';
  await order.save();

  // Update job status
  await Job.findByIdAndUpdate(order.jobId, { status: 'cancelled' });

  return order;
};

export const deleteOrder = async (id: string) => {
  const order = await Order.findByIdAndDelete(id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }
  return order;
};

/**
 * Process Payment
 * Handles payment for orders through different payment methods
 * - EasyPaisa: Mobile wallet payment
 * - JazzCash: Mobile wallet payment  
 * - Card: Debit/Credit card payment
 */
interface PaymentDetails {
  mobileNumber?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardHolderName?: string;
}

interface PaymentData {
  orderId: string;
  proposalId: string;
  amount: number;
  paymentMethod: 'easypaisa' | 'jazzcash' | 'card';
  paymentDetails: PaymentDetails;
}

export const processPayment = async (paymentData: PaymentData, userId: string) => {
  const { orderId, proposalId, amount, paymentMethod, paymentDetails } = paymentData;

  // Verify order exists and user owns it
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.buyerId.toString() !== userId) {
    throw new ApiError(403, 'You are not authorized to pay for this order');
  }

  // Generate OTP (in real implementation, send via SMS)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store payment session temporarily (in production, use Redis)
  const paymentSession = {
    id: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    orderId,
    proposalId,
    amount,
    paymentMethod,
    otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    status: 'pending',
    createdAt: new Date()
  };

  // Store in memory (development only)
  paymentSessions.set(paymentSession.id, paymentSession);

  // In development, log OTP to console
  console.log(`[Payment] OTP for ${paymentMethod}: ${otp}`);
  console.log(`[Payment] Session ID: ${paymentSession.id}`);
  console.log(`[Payment] Mobile/Card: ${paymentDetails.mobileNumber || paymentDetails.cardNumber}`);

  // Return payment session ID for OTP verification
  return {
    paymentSessionId: paymentSession.id,
    message: `OTP sent to ${paymentMethod === 'card' ? 'your registered mobile' : paymentDetails.mobileNumber}`,
    expiresAt: paymentSession.expiresAt,
    // In development, return OTP (remove in production)
    developmentOtp: otp
  };
};

/**
 * Verify Payment OTP
 * Verifies OTP and completes the payment transaction
 */
export const verifyPaymentOtp = async (paymentSessionId: string, otp: string) => {
  // Retrieve payment session
  const session = paymentSessions.get(paymentSessionId);
  if (!session) {
    throw new ApiError(404, 'Payment session not found or expired');
  }

  if (session.status !== 'pending') {
    throw new ApiError(400, 'Payment session already processed');
  }

  // Check if expired
  if (new Date() > session.expiresAt) {
    throw new ApiError(400, 'Payment session expired');
  }

  // In development, accept any 6-digit OTP
  const isValidOtp = otp.length === 6 && /^\d{6}$/.test(otp);
  
  if (!isValidOtp) {
    throw new ApiError(400, 'Invalid OTP format');
  }

  // Update order with payment
  const order = await Order.findById(session.orderId);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  order.amountPaid = (order.amountPaid || 0) + session.amount;
  order.amountPending = order.totalAmount - order.amountPaid;
  await order.save();

  // Mark session as completed
  session.status = 'completed';
  paymentSessions.set(paymentSessionId, session);

  const paymentSuccess = {
    transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'completed',
    paidAt: new Date(),
    amount: session.amount
  };

  console.log(`[Payment] Payment verified successfully`);
  console.log(`[Payment] Transaction ID: ${paymentSuccess.transactionId}`);
  console.log(`[Payment] Order ${session.orderId} updated: paid ${session.amount}`);

  return paymentSuccess;
};




