import { Types } from 'mongoose';

import { Consultant } from '../../models/consultant.model';
import { Proposal } from '../../models/proposal.model';
import { Order } from '../../models/order.model';
import { Analytics } from '../../models/analytics.model';
import { ApiError } from '../../utils/ApiError';
import { validateNICFromBase64, validateNICWithAI } from '../../services/nic-detection.service';

/**
 * Validate NIC/ID card image file types
 * Allowed: JPG, JPEG, PNG only - No other image types permitted
 */
const ALLOWED_NIC_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_NIC_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

export const validateNICImage = (fileType: string, fileName?: string): boolean => {
  if (!ALLOWED_NIC_MIME_TYPES.includes(fileType.toLowerCase())) {
    return false;
  }
  
  if (fileName) {
    const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
    return ALLOWED_NIC_EXTENSIONS.includes(ext);
  }
  
  return true;
};

/**
 * AI-based NIC validation using image classification
 * Detects if the uploaded image is actually an ID card and not a selfie/random photo
 */
export const validateNICWithAICheck = async (base64Image: string): Promise<void> => {
  const result = await validateNICFromBase64(base64Image);
  
  if (!result.isValid) {
    throw new ApiError(
      400,
      `Invalid NIC image: ${result.reason}. Detected: ${result.detectedLabels?.join(', ')}. Please upload a clear photo of your ID card.`
    );
  }
};

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
    city,
    search,
  } = query;

  const filter: any = {};
  
  if (specialization) filter.specialization = { $in: specialization.split(',') };
  if (availability) filter.availability = availability;
  if (minRating) filter.rating = { $gte: Number(minRating) };
  if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
  if (city) filter.city = city;

  let consultants;
  let total;

  // Use aggregation for search to include user name
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    
    const pipeline: any[] = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      {
        $unwind: '$userDetails',
      },
      {
        $match: {
          ...filter,
          $or: [
            { title: searchRegex },
            { bio: searchRegex },
            { specialization: searchRegex },
            { skills: searchRegex },
            { 'userDetails.name': searchRegex },
            { 'userDetails.email': searchRegex },
          ],
        },
      },
      { $sort: { rating: -1, createdAt: -1 } },
      { $skip: (Number(page) - 1) * Number(limit) },
      { $limit: Number(limit) },
      {
        $project: {
          _id: 1,
          userId: {
            _id: '$userDetails._id',
            name: '$userDetails.name',
            email: '$userDetails.email',
            profileImage: '$userDetails.profileImage',
            isOnline: '$userDetails.isOnline',
            isBanned: '$userDetails.isBanned',
          },
          title: 1,
          bio: 1,
          specialization: 1,
          hourlyRate: 1,
          experience: 1,
          skills: 1,
          city: 1,
          rating: 1,
          averageRating: 1,
          totalReviews: 1,
          availability: 1,
          isVerified: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ];

    consultants = await Consultant.aggregate(pipeline);
    
    // Count total matching documents
    const countPipeline = pipeline.slice(0, 3); // Only include lookup, unwind, and match stages
    const countResult = await Consultant.aggregate([...countPipeline, { $count: 'total' }]);
    total = countResult.length > 0 ? countResult[0].total : 0;
  } else {
    // Regular query without search
    consultants = await Consultant.find(filter)
      .populate('userId', 'name email profileImage isOnline isBanned')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ rating: -1, createdAt: -1 });

    total = await Consultant.countDocuments(filter);
  }

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
  // Convert string userId to ObjectId for proper matching
  const consultant = await Consultant.findOne({ userId: new Types.ObjectId(userId) }).populate('userId', 'name email profileImage isOnline isBanned');
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

export const uploadVerificationDocuments = async (id: string, documents: any) => {
  const consultant = await Consultant.findById(id);
  if (!consultant) {
    throw new ApiError(404, 'Consultant not found');
  }

  // Validate NIC images before saving
  if (documents.idCardFront && documents.idCardFrontMimeType) {
    // Step 1: Check file type
    if (!validateNICImage(documents.idCardFrontMimeType, documents.idCardFrontFileName)) {
      throw new ApiError(400, 'Invalid NIC front image format. Only JPG, JPEG, and PNG files are allowed.');
    }
    // Step 2: AI validation to detect if it's actually an ID card
    await validateNICWithAICheck(documents.idCardFront);
    consultant.idCardFront = documents.idCardFront;
  }
  
  if (documents.idCardBack && documents.idCardBackMimeType) {
    // Step 1: Check file type
    if (!validateNICImage(documents.idCardBackMimeType, documents.idCardBackFileName)) {
      throw new ApiError(400, 'Invalid NIC back image format. Only JPG, JPEG, and PNG files are allowed.');
    }
    // Step 2: AI validation to detect if it's actually an ID card
    await validateNICWithAICheck(documents.idCardBack);
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
  // Validate NIC images before creating profile
  if (profileData.idCardFront && profileData.idCardFrontMimeType) {
    // Step 1: Check file type
    if (!validateNICImage(profileData.idCardFrontMimeType, profileData.idCardFrontFileName)) {
      throw new ApiError(400, 'Invalid NIC front image format. Only JPG, JPEG, and PNG files are allowed.');
    }
    // Step 2: AI validation to detect if it's actually an ID card
    await validateNICWithAICheck(profileData.idCardFront);
  }
  
  if (profileData.idCardBack && profileData.idCardBackMimeType) {
    // Step 1: Check file type
    if (!validateNICImage(profileData.idCardBackMimeType, profileData.idCardBackFileName)) {
      throw new ApiError(400, 'Invalid NIC back image format. Only JPG, JPEG, and PNG files are allowed.');
    }
    // Step 2: AI validation to detect if it's actually an ID card
    await validateNICWithAICheck(profileData.idCardBack);
  }

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

export const getConsultantStats = async (consultantId: string) => {
  // Get current year
  const currentYear = new Date().getFullYear();
  console.log('Getting stats for consultant:', consultantId, 'year:', currentYear);

  // First, check if there are any proposals for this consultant at all
  const totalProposals = await Proposal.countDocuments({ consultantId: new Types.ObjectId(consultantId) });
  const totalProposalsString = await Proposal.countDocuments({ consultantId: consultantId });
  console.log('Total proposals for consultant (ObjectId):', totalProposals);
  console.log('Total proposals for consultant (string):', totalProposalsString);

  // Aggregate proposals by month for current year
  const proposalStats = await Proposal.aggregate([
    {
      $match: {
        $or: [
          { consultantId: new Types.ObjectId(consultantId) },
          { consultantId: consultantId },
          {
            createdAt: {
              $gte: new Date(currentYear, 0, 1), // January 1st of current year
              $lt: new Date(currentYear + 1, 0, 1) // January 1st of next year
            }
          },
          {
            createdAt: {
              $gte: new Date(currentYear - 1, 0, 1), // January 1st of previous year
              $lt: new Date(currentYear, 0, 1) // January 1st of current year
            }
          }
        ]
      }
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        proposals: { $sum: 1 },
        totalBidAmount: { $sum: '$bidAmount' }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);
  console.log('Proposal stats found:', proposalStats);

  // Aggregate profile views (impressions) by month for current year
  const impressionsStats = await Analytics.aggregate([
    {
      $match: {
        consultantId: new Types.ObjectId(consultantId),
        eventType: 'profile_view',
        createdAt: {
          $gte: new Date(currentYear, 0, 1), // January 1st of current year
          $lt: new Date(currentYear + 1, 0, 1) // January 1st of next year
        }
      }
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        impressions: { $sum: 1 }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  // Aggregate proposal clicks by month for current year
  const clicksStats = await Analytics.aggregate([
    {
      $match: {
        consultantId: new Types.ObjectId(consultantId),
        eventType: 'proposal_click',
        createdAt: {
          $gte: new Date(currentYear, 0, 1),
          $lt: new Date(currentYear + 1, 0, 1)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        clicks: { $sum: 1 }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  // Aggregate orders (earnings) by month for current year
  const earningsStats = await Order.aggregate([
    {
      $match: {
        consultantId: new Types.ObjectId(consultantId),
        createdAt: {
          $gte: new Date(currentYear, 0, 1),
          $lt: new Date(currentYear + 1, 0, 1)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        orders: { $sum: 1 },
        totalEarnings: { $sum: '$totalAmount' },
        pendingEarnings: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, '$amountPending', 0] } }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  // Create monthly data array (12 months)
  const monthlyData = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let month = 1; month <= 12; month++) {
    const proposalData = proposalStats.find(p => p._id === month) || { proposals: 0, totalBidAmount: 0 };
    const earningsData = earningsStats.find(e => e._id === month) || { orders: 0, totalEarnings: 0, pendingEarnings: 0 };
    const impressionsData = impressionsStats.find(i => i._id === month) || { impressions: 0 };
    const clicksData = clicksStats.find(c => c._id === month) || { clicks: 0 };

    monthlyData.push({
      month: monthNames[month - 1],
      proposals: proposalData.proposals,
      impressions: impressionsData.impressions,
      clicks: clicksData.clicks,
      earnings: earningsData.totalEarnings,
      pendingEarnings: earningsData.pendingEarnings,
      monthIndex: month - 1
    });
  }

  console.log('Returning monthly data:', monthlyData);
  return monthlyData;
};

