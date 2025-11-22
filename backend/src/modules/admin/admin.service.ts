/**
 * Admin Service - Administrative operations and user management
 * Implements Admin class operations from class diagram
 * 
 * Key operations:
 * - Admin.VerifyConsultant(): Approve consultant verification documents
 * - Admin.resolve dispute(): Handle disputes between clients and consultants
 * - User management: Ban/unban users, view all users
 */

import { User } from '../user/user.model';
import { Consultant } from '../../models/consultant.model';
import { Job } from '../../models/job.model';
import { Proposal } from '../../models/proposal.model';
import { Order } from '../../models/order.model';
import { ApiError } from '../../utils/ApiError';

export const getAllUsers = async (query: any) => {
  const { page = 1, limit = 50, accountType, isVerified } = query;

  const filter: any = {};
  if (accountType) filter.accountType = accountType;
  if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

  const users = await User.find(filter)
    .select('-password')
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(filter);

  return {
    users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  };
};

export const getUsersByAccountType = async (accountType: 'buyer' | 'consultant') => {
  const users = await User.find({ accountType }).select('-password').sort({ createdAt: -1 });
  return users;
};

export const banUser = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Add isBanned field to user model if not exists
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { isBanned: true, isOnline: false } },
    { new: true },
  ).select('-password');

  return updatedUser;
};

export const unbanUser = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { isBanned: false } },
    { new: true },
  ).select('-password');

  return updatedUser;
};

/**
 * 📌 IMPORTANT: Verify Consultant
 * Implements Admin.VerifyConsultant() from class diagram
 * 
 * Admin reviews and approves consultant verification documents
 * Updates consultant's isVerified status to true
 * 
 * @param consultantId - Consultant ID to verify
 * @returns Verified consultant profile
 */
export const verifyConsultantAdmin = async (consultantId: string) => {
  const consultant = await Consultant.findByIdAndUpdate(
    consultantId,
    { isVerified: true },
    { new: true },
  ).populate('userId', 'name email');

  if (!consultant) {
    throw new ApiError(404, 'Consultant not found');
  }

  // Update user verification status
  await User.findByIdAndUpdate(consultant.userId, { isVerified: true });

  return consultant;
};

/**
 * Decline Consultant Verification
 * Rejects consultant's verification request
 */
export const declineConsultant = async (consultantId: string) => {
  const consultant = await Consultant.findByIdAndUpdate(
    consultantId,
    { isVerified: false, $set: { declinedAt: new Date() } },
    { new: true },
  ).populate('userId', 'name email');

  if (!consultant) {
    throw new ApiError(404, 'Consultant not found');
  }

  return consultant;
};

/**
 * Get Pending Consultant Verifications
 * Lists all consultants awaiting admin approval
 */
export const getPendingConsultants = async () => {
  const consultants = await Consultant.find({ isVerified: false })
    .populate('userId', 'name email profileImage phone')
    .sort({ createdAt: -1 });

  return consultants;
};

export const getAdminStats = async () => {
  const [totalUsers, totalConsultants, totalBuyers, totalJobs, totalOrders, pendingConsultants] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ accountType: 'consultant' }),
      User.countDocuments({ accountType: 'buyer' }),
      Job.countDocuments(),
      Order.countDocuments(),
      Consultant.countDocuments({ isVerified: false }),
    ]);

  const totalRevenue = await Order.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: '$totalAmount' },
      },
    },
  ]);

  return {
    totalUsers,
    totalConsultants,
    totalBuyers,
    totalJobs,
    totalOrders,
    pendingConsultants,
    totalRevenue: totalRevenue[0]?.total || 0,
  };
};

export const deleteUser = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Delete related data
  if (user.accountType === 'consultant') {
    const consultant = await Consultant.findOne({ userId });
    if (consultant) {
      await Proposal.deleteMany({ consultantId: consultant._id });
      await Order.deleteMany({ consultantId: consultant._id });
      await Consultant.findByIdAndDelete(consultant._id);
    }
  } else if (user.accountType === 'buyer') {
    await Job.deleteMany({ buyerId: userId });
    await Order.deleteMany({ buyerId: userId });
  }

  await User.findByIdAndDelete(userId);
  return user;
};



