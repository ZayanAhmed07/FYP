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
import Wallet from '../../models/wallet.model';
import Withdrawal from '../../models/withdrawal.model';
import { emailService } from '../../services/email.service';

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

  // Send approval email notification
  if (consultant.userId && (consultant.userId as any).email && (consultant.userId as any).name) {
    await emailService.sendConsultantVerificationApproved(
      (consultant.userId as any).email,
      (consultant.userId as any).name
    ).catch(err => console.error('Failed to send approval email:', err));
  }

  return consultant;
};

/**
 * Decline Consultant Verification
 * Rejects consultant's verification request
 */
export const declineConsultant = async (consultantId: string, reason?: string) => {
  const consultant = await Consultant.findByIdAndUpdate(
    consultantId,
    { isVerified: false, $set: { declinedAt: new Date() } },
    { new: true },
  ).populate('userId', 'name email');

  if (!consultant) {
    throw new ApiError(404, 'Consultant not found');
  }

  // Send rejection email notification
  if (consultant.userId && (consultant.userId as any).email && (consultant.userId as any).name) {
    await emailService.sendConsultantVerificationRejected(
      (consultant.userId as any).email,
      (consultant.userId as any).name,
      reason
    );
  }

  return consultant;
};

/**
 * Get Pending Consultant Verifications
 * Lists all consultants awaiting admin approval with all details
 */
export const getPendingConsultants = async () => {
  const consultants = await Consultant.find({ isVerified: false })
    .populate('userId', 'name email profileImage accountType phone createdAt')
    .sort({ createdAt: -1 })
    .lean();

  const consultantsWithMethods = await Promise.all(
    consultants.map(async (consultant: any) => {
      const wallet = await Wallet.findOne({ userId: consultant.userId })
        .select('withdrawalMethods')
        .lean();
      return {
        _id: consultant._id,
        userId: consultant.userId,
        name: consultant.userId?.name,
        email: consultant.userId?.email,
        phone: consultant.userId?.phone,
        profileImage: consultant.userId?.profileImage,
        title: consultant.title,
        bio: consultant.bio,
        specialization: consultant.specialization,
        skills: consultant.skills,
        experience: consultant.experience,
        hourlyRate: consultant.hourlyRate,
        availability: consultant.availability,
        location: consultant.location,
        remoteWork: consultant.remoteWork,
        idCardFront: consultant.idCardFront,
        idCardBack: consultant.idCardBack,
        supportingDocuments: consultant.supportingDocuments,
        rating: consultant.rating,
        totalProjects: consultant.totalProjects,
        totalEarnings: consultant.totalEarnings,
        averageRating: consultant.averageRating,
        totalReviews: consultant.totalReviews,
        isVerified: consultant.isVerified,
        createdAt: consultant.userId?.createdAt,
        withdrawalMethods: wallet?.withdrawalMethods || [],
      };
    })
  );

  return consultantsWithMethods;
};

/**
 * Get Consultant Detail for Admin
 * Returns full consultant profile with NIC images and all details
 */
export const getConsultantDetailForAdmin = async (consultantId: string) => {
  const consultant = await Consultant.findById(consultantId)
    .populate('userId', 'name email phone profileImage accountType isBanned createdAt')
    .lean();

  if (!consultant) {
    throw new ApiError(404, 'Consultant not found');
  }

  const wallet = await Wallet.findOne({ userId: consultant.userId })
    .select('withdrawalMethods availableBalance pendingBalance totalEarnings totalWithdrawn')
    .lean();

  return {
    _id: consultant._id,
    userId: consultant.userId,
    name: (consultant.userId as any)?.name || '',
    email: (consultant.userId as any)?.email || '',
    phone: (consultant.userId as any)?.phone || '',
    profileImage: (consultant.userId as any)?.profileImage || '',
    accountType: (consultant.userId as any)?.accountType || 'consultant',
    isBanned: (consultant.userId as any)?.isBanned || false,
    createdAt: (consultant.userId as any)?.createdAt || new Date(),
    title: consultant.title,
    bio: consultant.bio,
    specialization: consultant.specialization,
    skills: consultant.skills,
    experience: consultant.experience,
    hourlyRate: consultant.hourlyRate,
    availability: consultant.availability,
    location: consultant.location,
    remoteWork: consultant.remoteWork,
    idCardFront: consultant.idCardFront,
    idCardBack: consultant.idCardBack,
    supportingDocuments: consultant.supportingDocuments,
    rating: consultant.rating,
    totalProjects: consultant.totalProjects,
    totalEarnings: consultant.totalEarnings,
    averageRating: consultant.averageRating,
    totalReviews: consultant.totalReviews,
    isVerified: consultant.isVerified,
    withdrawalMethods: wallet?.withdrawalMethods || [],
    walletInfo: {
      availableBalance: wallet?.availableBalance || 0,
      pendingBalance: wallet?.pendingBalance || 0,
      totalEarnings: wallet?.totalEarnings || 0,
      totalWithdrawn: wallet?.totalWithdrawn || 0,
    },
  };
};

/**
 * Get Verified Consultants
 * Returns all verified consultants with all their details and withdrawal methods
 */
export const getVerifiedConsultants = async () => {
  const consultants = await Consultant.find({ isVerified: true })
    .populate('userId', 'name email profileImage accountType phone createdAt')
    .sort({ createdAt: -1 })
    .lean();

  const consultantsWithMethods = await Promise.all(
    consultants.map(async (consultant: any) => {
      const wallet = await Wallet.findOne({ userId: consultant.userId })
        .select('withdrawalMethods')
        .lean();
      return {
        _id: consultant._id,
        userId: consultant.userId,
        name: consultant.userId?.name,
        email: consultant.userId?.email,
        phone: consultant.userId?.phone,
        profileImage: consultant.userId?.profileImage,
        title: consultant.title,
        bio: consultant.bio,
        specialization: consultant.specialization,
        skills: consultant.skills,
        experience: consultant.experience,
        hourlyRate: consultant.hourlyRate,
        availability: consultant.availability,
        location: consultant.location,
        remoteWork: consultant.remoteWork,
        idCardFront: consultant.idCardFront,
        idCardBack: consultant.idCardBack,
        supportingDocuments: consultant.supportingDocuments,
        rating: consultant.rating,
        totalProjects: consultant.totalProjects,
        totalEarnings: consultant.totalEarnings,
        averageRating: consultant.averageRating,
        totalReviews: consultant.totalReviews,
        isVerified: consultant.isVerified,
        createdAt: consultant.userId?.createdAt,
        withdrawalMethods: wallet?.withdrawalMethods || [],
      };
    })
  );

  return consultantsWithMethods;
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




