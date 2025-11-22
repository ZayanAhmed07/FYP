import { Router } from 'express';
import { reviewController } from './review.controller';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();

// All review routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/reviews
 * @desc    Create a new review
 * @access  Private (Buyer only)
 */
router.post('/', reviewController.createReview);

/**
 * @route   GET /api/reviews
 * @desc    Get all reviews (Admin only)
 * @access  Private (Admin)
 */
router.get('/', reviewController.getAllReviews);

/**
 * @route   GET /api/reviews/consultant/:consultantId
 * @desc    Get reviews for a specific consultant
 * @access  Private
 */
router.get('/consultant/:consultantId', reviewController.getConsultantReviews);

/**
 * @route   GET /api/reviews/can-review/:jobId
 * @desc    Check if user can review a job
 * @access  Private
 */
router.get('/can-review/:jobId', reviewController.canReview);

/**
 * @route   GET /api/reviews/:reviewId
 * @desc    Get a single review by ID
 * @access  Private
 */
router.get('/:reviewId', reviewController.getReviewById);

/**
 * @route   PUT /api/reviews/:reviewId
 * @desc    Update a review
 * @access  Private (Owner only)
 */
router.put('/:reviewId', reviewController.updateReview);

/**
 * @route   DELETE /api/reviews/:reviewId
 * @desc    Delete a review
 * @access  Private (Owner or Admin)
 */
router.delete('/:reviewId', reviewController.deleteReview);

export default router;
