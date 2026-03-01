import { httpClient } from '../api/httpClient';

export interface Review {
  _id: string;
  jobId: string;
  buyerId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  consultantId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewData {
  jobId: string;
  consultantId: string;
  rating: number;
  comment: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  pages: number;
}

export interface CanReviewResponse {
  canReview: boolean;
  reason?: string;
  consultantId?: string;
}

const reviewService = {
  /**
   * Create a new review
   */
  createReview: async (data: CreateReviewData): Promise<Review> => {
    const response = await httpClient.post('/reviews', data);
    return response.data.data;
  },

  /**
   * Get reviews for a specific consultant
   */
  getConsultantReviews: async (
    consultantId: string,
    page = 1,
    limit = 10,
  ): Promise<ReviewsResponse> => {
    const response = await httpClient.get(
      `/reviews/consultant/${consultantId}?page=${page}&limit=${limit}`,
    );
    return response.data.data;
  },

  /**
   * Get all reviews (admin only)
   */
  getAllReviews: async (page = 1, limit = 20): Promise<ReviewsResponse> => {
    const response = await httpClient.get(`/reviews?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  /**
   * Get a single review by ID
   */
  getReviewById: async (reviewId: string): Promise<Review> => {
    const response = await httpClient.get(`/reviews/${reviewId}`);
    return response.data.data;
  },

  /**
   * Update a review
   */
  updateReview: async (
    reviewId: string,
    data: { rating?: number; comment?: string },
  ): Promise<Review> => {
    const response = await httpClient.put(`/reviews/${reviewId}`, data);
    return response.data.data;
  },

  /**
   * Delete a review
   */
  deleteReview: async (reviewId: string): Promise<void> => {
    await httpClient.delete(`/reviews/${reviewId}`);
  },

  /**
   * Check if user can review a job
   */
  canReview: async (jobId: string): Promise<CanReviewResponse> => {
    const response = await httpClient.get(`/reviews/can-review/${jobId}`);
    return response.data.data;
  },
};

export default reviewService;
