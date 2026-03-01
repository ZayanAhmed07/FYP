import { Review } from '../../models/review.model';
import { Consultant } from '../../models/consultant.model';
import { Order } from '../../models/order.model';
import { ApiError } from '../../utils/ApiError';

export const reviewService = {
  /**
   * Create a new review after order completion
   */
  async createReview(data: {
    jobId: string;
    buyerId: string;
    consultantId: string;
    rating: number;
    comment: string;
  }) {
    const { jobId, buyerId, consultantId, rating, comment } = data;

    // Verify the order exists and is completed
    const order = await Order.findOne({
      jobId,
      buyerId,
      consultantId,
      status: 'completed',
    });

    if (!order) {
      throw new ApiError(404, 'Completed order not found for this job');
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ jobId, buyerId });
    if (existingReview) {
      throw new ApiError(400, 'You have already reviewed this consultant for this job');
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new ApiError(400, 'Rating must be between 1 and 5');
    }

    // Create review
    const review = await Review.create({
      jobId,
      buyerId,
      consultantId,
      rating,
      comment,
    });

    // Update consultant's average rating
    await this.updateConsultantRating(consultantId);

    return review;
  },

  /**
   * Update consultant's average rating and total reviews count
   */
  async updateConsultantRating(consultantId: string) {
    const reviews = await Review.find({ consultantId });

    if (reviews.length === 0) {
      await Consultant.findByIdAndUpdate(consultantId, {
        averageRating: 0,
        totalReviews: 0,
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await Consultant.findByIdAndUpdate(consultantId, {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: reviews.length,
    });
  },

  /**
   * Get reviews for a specific consultant
   */
  async getConsultantReviews(consultantId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ consultantId })
        .populate('buyerId', 'firstName lastName email')
        .populate('jobId', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ consultantId }),
    ]);

    return {
      reviews,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  },

  /**
   * Get all reviews (for admin)
   */
  async getAllReviews(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find()
        .populate('buyerId', 'firstName lastName email')
        .populate('consultantId', 'firstName lastName email')
        .populate('jobId', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(),
    ]);

    return {
      reviews,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  },

  /**
   * Get a single review by ID
   */
  async getReviewById(reviewId: string) {
    const review = await Review.findById(reviewId)
      .populate('buyerId', 'firstName lastName email')
      .populate('consultantId', 'firstName lastName email')
      .populate('jobId', 'title');

    if (!review) {
      throw new ApiError(404, 'Review not found');
    }

    return review;
  },

  /**
   * Update a review (only by the buyer who created it)
   */
  async updateReview(reviewId: string, buyerId: string, data: { rating?: number; comment?: string }) {
    const review = await Review.findById(reviewId);

    if (!review) {
      throw new ApiError(404, 'Review not found');
    }

    if (review.buyerId.toString() !== buyerId) {
      throw new ApiError(403, 'You can only update your own reviews');
    }

    if (data.rating !== undefined) {
      if (data.rating < 1 || data.rating > 5) {
        throw new ApiError(400, 'Rating must be between 1 and 5');
      }
      review.rating = data.rating;
    }

    if (data.comment !== undefined) {
      review.comment = data.comment;
    }

    await review.save();

    // Update consultant's average rating
    await this.updateConsultantRating(review.consultantId.toString());

    return review;
  },

  /**
   * Delete a review (admin only or buyer who created it)
   */
  async deleteReview(reviewId: string, userId: string, isAdmin: boolean) {
    const review = await Review.findById(reviewId);

    if (!review) {
      throw new ApiError(404, 'Review not found');
    }

    // Only admin or the buyer who created the review can delete it
    if (!isAdmin && review.buyerId.toString() !== userId) {
      throw new ApiError(403, 'You do not have permission to delete this review');
    }

    const consultantId = review.consultantId.toString();
    await review.deleteOne();

    // Update consultant's average rating
    await this.updateConsultantRating(consultantId);

    return { message: 'Review deleted successfully' };
  },

  /**
   * Check if a buyer can review a specific job
   */
  async canReview(jobId: string, buyerId: string) {
    // Check if order is completed
    const order = await Order.findOne({
      jobId,
      buyerId,
      status: 'completed',
    });

    if (!order) {
      return { canReview: false, reason: 'Order not completed' };
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ jobId, buyerId });

    if (existingReview) {
      return { canReview: false, reason: 'Review already submitted' };
    }

    return { canReview: true, consultantId: order.consultantId };
  },
};
