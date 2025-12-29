/**
 * Withdrawal Controller
 * Handles withdrawal API requests
 */

import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { WithdrawalService } from '../../services/withdrawal.service';
import Wallet from '../../models/wallet.model';
import Withdrawal from '../../models/withdrawal.model';
import { Types } from 'mongoose';
import { ApiError } from '../../utils/ApiError';
import { Order } from '../../models/order.model';

/**
 * Get wallet balance and withdrawal methods
 */
export const getWalletBalance = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  // Find or create wallet for the user
  let wallet = await Wallet.findOne({ userId: new Types.ObjectId(userId) });
  
  // Also get consultant profile to sync earnings
  const consultant = await require('../../models/consultant.model').Consultant.findOne({ 
    userId: new Types.ObjectId(userId) 
  });

  // Fallback: derive paid earnings from orders if consultant.totalEarnings is missing/stale
  let consultantEarnings = consultant?.totalEarnings || 0;
  if (!consultantEarnings && consultant?._id) {
    const orders = await Order.find({ consultantId: consultant._id }).select('amountPaid status amountPending');
    const paidSum = orders.reduce((sum, o) => sum + (o.amountPaid || 0), 0);
    consultantEarnings = paidSum;
  }

  const targetAvailable = Math.max(consultantEarnings - (wallet?.totalWithdrawn || 0), 0);

  if (!wallet) {
    // Auto-create wallet for new consultant with existing earnings
    wallet = await Wallet.create({
      userId: new Types.ObjectId(userId),
      availableBalance: targetAvailable,
      pendingBalance: 0,
      totalEarnings: consultantEarnings,
      totalWithdrawn: 0,
      withdrawalMethods: [],
      transactions: consultantEarnings > 0 ? [{
        type: 'deposit',
        description: 'Initial balance from consultant earnings sync',
        amount: targetAvailable,
        date: new Date(),
      }] : [],
    });
  } else {
    // Keep wallet aligned with consultant earnings and withdrawals
    const needsSync =
      wallet.totalEarnings !== consultantEarnings ||
      wallet.availableBalance !== targetAvailable;

    if (needsSync) {
      const delta = targetAvailable - wallet.availableBalance;
      wallet.availableBalance = targetAvailable;
      wallet.totalEarnings = consultantEarnings;
      if (Math.abs(delta) > 0) {
        wallet.transactions.push({
          type: delta >= 0 ? 'deposit' : 'fee',
          description: 'Earnings sync adjustment',
          amount: delta,
          date: new Date(),
        } as any);
      }
      // Ensure pending balance never negative
      if (wallet.pendingBalance < 0) {
        wallet.pendingBalance = 0;
      }
      await wallet.save();
    }
  }

  res.status(200).json({
    success: true,
    data: {
      availableBalance: wallet.availableBalance,
      pendingBalance: wallet.pendingBalance,
      totalEarnings: wallet.totalEarnings,
      totalWithdrawn: wallet.totalWithdrawn,
      withdrawalMethods: wallet.withdrawalMethods,
      canWithdraw: wallet.availableBalance >= 2000,
    },
  });
});

/**
 * Create withdrawal request
 */
export const createWithdrawalRequest = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { amount, withdrawalMethod } = req.body;

  if (!amount || !withdrawalMethod) {
    throw new ApiError(400, 'Amount and withdrawal method are required');
  }

  if (typeof amount !== 'number' || amount <= 0) {
    throw new ApiError(400, 'Amount must be a positive number');
  }

  const withdrawal = await WithdrawalService.createWithdrawalRequest(
    new Types.ObjectId(userId),
    amount,
    withdrawalMethod,
    req.ip,
    req.get('user-agent')
  );

  res.status(201).json({
    success: true,
    message: 'Withdrawal request created successfully',
    data: withdrawal,
  });
});

/**
 * Get withdrawal history
 */
export const getWithdrawalHistory = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const skip = (page - 1) * limit;

  const { withdrawals, total } = await WithdrawalService.getWithdrawalHistory(
    new Types.ObjectId(userId),
    limit,
    skip
  );

  res.status(200).json({
    success: true,
    data: {
      withdrawals,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * Get withdrawal statistics
 */
export const getWithdrawalStats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const stats = await WithdrawalService.getWithdrawalStats(new Types.ObjectId(userId));

  res.status(200).json({
    success: true,
    data: stats,
  });
});

/**
 * Get single withdrawal details
 */
export const getWithdrawalDetails = catchAsync(async (req: Request, res: Response) => {
  const { withdrawalId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const withdrawal = await Wallet.findOne({
    _id: new Types.ObjectId(withdrawalId),
    userId: new Types.ObjectId(userId),
  });

  if (!withdrawal) {
    throw new ApiError(404, 'Withdrawal not found');
  }

  res.status(200).json({
    success: true,
    data: withdrawal,
  });
});

/**
 * Cancel withdrawal request (only pending)
 */
export const cancelWithdrawal = catchAsync(async (req: Request, res: Response) => {
  const { withdrawalId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const withdrawal = await Wallet.findOne({
    _id: new Types.ObjectId(withdrawalId),
    userId: new Types.ObjectId(userId),
  });

  if (!withdrawal) {
    throw new ApiError(404, 'Withdrawal not found');
  }

  const updated = await WithdrawalService.rejectWithdrawal(
    new Types.ObjectId(withdrawalId),
    'Cancelled by user'
  );

  res.status(200).json({
    success: true,
    message: 'Withdrawal cancelled successfully',
    data: updated,
  });
});

/**
 * Save withdrawal method
 */
export const saveWithdrawalMethod = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { withdrawalMethod, setAsDefault } = req.body;

  if (!withdrawalMethod) {
    throw new ApiError(400, 'Withdrawal method is required');
  }

  const wallet = await Wallet.findOne({ userId: new Types.ObjectId(userId) });
  if (!wallet) {
    throw new ApiError(404, 'Wallet not found');
  }

  if (setAsDefault) {
    wallet.withdrawalMethods.forEach((method) => {
      method.isDefault = false;
    });
  }

  withdrawalMethod.isDefault = setAsDefault || wallet.withdrawalMethods.length === 0;
  withdrawalMethod.addedAt = new Date();

  wallet.withdrawalMethods.push(withdrawalMethod);
  await wallet.save();

  res.status(201).json({
    success: true,
    message: 'Withdrawal method saved successfully',
    data: wallet.withdrawalMethods,
  });
});

/**
 * Update withdrawal method
 */
export const updateWithdrawalMethod = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { methodId } = req.params;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { withdrawalMethod, setAsDefault } = req.body;

  const wallet = await Wallet.findOne({ userId: new Types.ObjectId(userId) });
  if (!wallet) {
    throw new ApiError(404, 'Wallet not found');
  }

  const methodIndex = wallet.withdrawalMethods.findIndex(
    (m) => m._id?.toString() === methodId
  );

  if (methodIndex === -1) {
    throw new ApiError(404, 'Withdrawal method not found');
  }

  if (setAsDefault) {
    wallet.withdrawalMethods.forEach((method) => {
      method.isDefault = false;
    });
  }

  wallet.withdrawalMethods[methodIndex] = {
    ...wallet.withdrawalMethods[methodIndex],
    ...withdrawalMethod,
    isDefault: setAsDefault || wallet.withdrawalMethods[methodIndex]?.isDefault || false,
  };

  await wallet.save();

  res.status(200).json({
    success: true,
    message: 'Withdrawal method updated successfully',
    data: wallet.withdrawalMethods,
  });
});

/**
 * Delete withdrawal method
 */
export const deleteWithdrawalMethod = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { methodId } = req.params;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const wallet = await Wallet.findOne({ userId: new Types.ObjectId(userId) });
  if (!wallet) {
    throw new ApiError(404, 'Wallet not found');
  }

  const methodIndex = wallet.withdrawalMethods.findIndex(
    (m) => m._id?.toString() === methodId
  );

  if (methodIndex === -1) {
    throw new ApiError(404, 'Withdrawal method not found');
  }

  const deletedMethod = wallet.withdrawalMethods[methodIndex];
  wallet.withdrawalMethods.splice(methodIndex, 1);

  // If deleted method was default and there are other methods, set first one as default
  if (deletedMethod?.isDefault && wallet.withdrawalMethods.length > 0) {
    const firstMethod = wallet.withdrawalMethods[0];
    if (firstMethod) {
      firstMethod.isDefault = true;
    }
  }

  await wallet.save();

  res.status(200).json({
    success: true,
    message: 'Withdrawal method deleted successfully',
  });
});

/**
 * Get transaction history
 */
export const getTransactionHistory = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const wallet = await Wallet.findOne({ userId: new Types.ObjectId(userId) });
  if (!wallet) {
    throw new ApiError(404, 'Wallet not found');
  }

  res.status(200).json({
    success: true,
    data: wallet.transactions || [],
  });
});

/**
 * Admin: Approve withdrawal
 */
export const approveWithdrawal = catchAsync(async (req: Request, res: Response) => {
  const { withdrawalId } = req.params;
  const { adminNotes } = (req.body || {}) as { adminNotes?: string };

  // Check if user is admin (you can add this check based on your auth system)
  const withdrawal = await WithdrawalService.approveWithdrawal(
    new Types.ObjectId(withdrawalId),
    adminNotes
  );

  res.status(200).json({
    success: true,
    message: 'Withdrawal approved successfully',
    data: withdrawal,
  });
});

/**
 * Admin: Start processing withdrawal
 */
export const startProcessing = catchAsync(async (req: Request, res: Response) => {
  const { withdrawalId } = req.params;

  const withdrawal = await WithdrawalService.startProcessing(
    new Types.ObjectId(withdrawalId)
  );

  res.status(200).json({
    success: true,
    message: 'Withdrawal processing started',
    data: withdrawal,
  });
});

/**
 * Admin: Complete withdrawal
 */
export const completeWithdrawal = catchAsync(async (req: Request, res: Response) => {
  const { withdrawalId } = req.params;
  const { transactionId, bankReference } = (req.body || {}) as { transactionId?: string; bankReference?: string };

  const withdrawal = await WithdrawalService.completeWithdrawal(
    new Types.ObjectId(withdrawalId),
    transactionId,
    bankReference
  );

  res.status(200).json({
    success: true,
    message: 'Withdrawal completed successfully',
    data: withdrawal,
  });
});

/**
 * Admin: Reject withdrawal
 */
export const rejectWithdrawal = catchAsync(async (req: Request, res: Response) => {
  const { withdrawalId } = req.params;
  const { reason } = req.body;

  if (!reason) {
    throw new ApiError(400, 'Reason is required');
  }

  const withdrawal = await WithdrawalService.rejectWithdrawal(
    new Types.ObjectId(withdrawalId),
    reason
  );

  res.status(200).json({
    success: true,
    message: 'Withdrawal rejected successfully',
    data: withdrawal,
  });
});

/**
 * Admin: Get all withdrawal requests with consultant details
 */
export const getAllWithdrawalRequests = catchAsync(async (req: Request, res: Response) => {
  // Get all withdrawals with populated consultant and user data
  const withdrawals = await Withdrawal.find()
    .populate({
      path: 'consultantId',
      select: 'name email profileImage',
    })
    .sort({ requestedAt: -1 });

  // Transform the data for frontend
  const transformedWithdrawals = withdrawals.map((w: any) => ({
    _id: w._id,
    amount: w.amount,
    status: w.status,
    withdrawalMethod: w.withdrawalMethod,
    consultantName: w.consultantId?.name || 'Unknown',
    email: w.consultantId?.email || 'N/A',
    consultantProfile: {
      profileImage: w.consultantId?.profileImage,
    },
    requestedAt: w.requestedAt,
    approvedAt: w.approvedAt,
    processedAt: w.processedAt,
    completedAt: w.completedAt,
  }));

  res.status(200).json({
    success: true,
    count: transformedWithdrawals.length,
    data: transformedWithdrawals,
  });
});
