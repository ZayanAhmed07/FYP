import { Request, Response } from 'express';
import { reviewService } from './review.service';
import { catchAsync } from '../../utils/catchAsync';
import { ApiResponse } from '../../utils/ApiResponse';

export const reviewController = {
  /**
   * Create a new review
   * POST /api/reviews
   */
  createReview: catchAsync(async (req: Request, res: Response) => {
    const { jobId, consultantId, rating, comment } = req.body;
    const buyerId = req.user!.id;

    const review = await reviewService.createReview({
      jobId,
      buyerId,
      consultantId,
      rating,
      comment,
    });

    res.status(201).json(ApiResponse.success(201, 'Review submitted successfully', review));
  }),

  /**
   * Get reviews for a specific consultant
   * GET /api/reviews/consultant/:consultantId
   */
  getConsultantReviews: catchAsync(async (req: Request, res: Response) => {
    const { consultantId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await reviewService.getConsultantReviews(consultantId!, page, limit);

    res.json(ApiResponse.success(200, 'Consultant reviews retrieved successfully', result));
  }),

  /**
   * Get all reviews (admin only)
   * GET /api/reviews
   */
  getAllReviews: catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await reviewService.getAllReviews(page, limit);

    res.json(ApiResponse.success(200, 'All reviews retrieved successfully', result));
  }),

  /**
   * Get a single review by ID
   * GET /api/reviews/:reviewId
   */
  getReviewById: catchAsync(async (req: Request, res: Response) => {
    const { reviewId } = req.params;

    const review = await reviewService.getReviewById(reviewId!);

    res.json(ApiResponse.success(200, 'Review retrieved successfully', review));
  }),

  /**
   * Update a review
   * PUT /api/reviews/:reviewId
   */
  updateReview: catchAsync(async (req: Request, res: Response) => {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const buyerId = req.user!.id;

    const review = await reviewService.updateReview(reviewId!, buyerId, { rating, comment });

    res.json(ApiResponse.success(200, 'Review updated successfully', review));
  }),

  /**
   * Delete a review
   * DELETE /api/reviews/:reviewId
   */
  deleteReview: catchAsync(async (req: Request, res: Response) => {
    const { reviewId } = req.params;
    const userId = req.user!.id;
    const isAdmin = req.user!.roles.includes('admin');

    const result = await reviewService.deleteReview(reviewId!, userId, isAdmin);

    res.json(ApiResponse.success(200, 'Review deleted successfully', result));
  }),

  /**
   * Check if user can review a job
   * GET /api/reviews/can-review/:jobId
   */
  canReview: catchAsync(async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const buyerId = req.user!.id;

    const result = await reviewService.canReview(jobId!, buyerId);

    res.json(ApiResponse.success(200, 'Can review check completed', result));
  }),
};
