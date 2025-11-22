import { Types } from 'mongoose';

import { Consultant } from '../../models/consultant.model';
import { ApiError } from '../../utils/ApiError';

export const createConsultant = async (consultantData: any) => {
  const consultant = await Consultant.create(consultantData);
  return consultant.populate('userId', 'name email profileImage isBanned');
};

export const getAllConsultants = async (query: any) => {
  const {
    page = 1,
    limit = 10,
    specialization,
    availability,
    minRating,
    isVerified,
  } = query;

  const filter: any = {};
  
  if (specialization) filter.specialization = { $in: specialization.split(',') };
  if (availability) filter.availability = availability;
  if (minRating) filter.rating = { $gte: Number(minRating) };
  if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

  const consultants = await Consultant.find(filter)
    .populate('userId', 'name email profileImage isOnline isBanned')
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .sort({ rating: -1, createdAt: -1 });

  const total = await Consultant.countDocuments(filter);

  return {
    consultants,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  };
};

export const getConsultantById = async (id: string) => {
  // Validate ObjectId format
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid consultant ID format');
  }
  
  const consultant = await Consultant.findById(id).populate('userId', 'name email profileImage isOnline phone isBanned');
  if (!consultant) {
    throw new ApiError(404, 'Consultant not found');
  }
  return consultant;
};

export const getConsultantByUserId = async (userId: string) => {
  const consultant = await Consultant.findOne({ userId }).populate('userId', 'name email profileImage isOnline isBanned');
  // Return null if not found instead of throwing error (for profile page)
  return consultant;
};

export const updateConsultant = async (id: string, updateData: any) => {
  const consultant = await Consultant.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  if (!consultant) {
    throw new ApiError(404, 'Consultant not found');
  }
  return consultant.populate('userId', 'name email profileImage isBanned');
};

export const uploadVerificationDocuments = async (id: string, documents: { idCardFront?: string; idCardBack?: string; supportingDocuments?: string[] }) => {
  const consultant = await Consultant.findById(id);
  if (!consultant) {
    throw new ApiError(404, 'Consultant not found');
  }

  if (documents.idCardFront) {
    consultant.idCardFront = documents.idCardFront;
  }
  if (documents.idCardBack) {
    consultant.idCardBack = documents.idCardBack;
  }
  if (documents.supportingDocuments) {
    consultant.supportingDocuments = [...(consultant.supportingDocuments || []), ...documents.supportingDocuments];
  }

  await consultant.save();
  return consultant.populate('userId', 'name email profileImage isBanned');
};

export const deleteConsultant = async (id: string) => {
  const consultant = await Consultant.findByIdAndDelete(id);
  if (!consultant) {
    throw new ApiError(404, 'Consultant not found');
  }
  return consultant;
};

export const verifyConsultant = async (id: string) => {
  const consultant = await Consultant.findByIdAndUpdate(
    id,
    { isVerified: true },
    { new: true, runValidators: true },
  );
  if (!consultant) {
    throw new ApiError(404, 'Consultant not found');
  }
  return consultant;
};

export const createCompleteProfile = async (profileData: any) => {
  // Check if consultant profile already exists for this user
  const existingConsultant = await Consultant.findOne({ userId: profileData.userId });
  if (existingConsultant) {
    throw new ApiError(400, 'Consultant profile already exists for this user');
  }

  // Parse specialization and skills if they come as comma-separated strings from FormData
  if (profileData['specialization[]']) {
    profileData.specialization = Array.isArray(profileData['specialization[]']) 
      ? profileData['specialization[]'] 
      : [profileData['specialization[]']];
    delete profileData['specialization[]'];
  }

  if (profileData['skills[]']) {
    profileData.skills = Array.isArray(profileData['skills[]']) 
      ? profileData['skills[]'] 
      : [profileData['skills[]']];
    delete profileData['skills[]'];
  }

  // Set isVerified to false by default (admin will verify)
  profileData.isVerified = false;

  const consultant = await Consultant.create(profileData);
  return consultant.populate('userId', 'name email profileImage isBanned');
};

