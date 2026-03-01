import { httpClient } from '../api/httpClient';

/**
 * Analytics service for tracking user interactions
 */
export const analyticsService = {
  /**
   * Record when a buyer views a consultant's profile
   */
  recordProfileView: async (consultantId: string) => {
    try {
      await httpClient.post(`/analytics/profile-view/${consultantId}`);
    } catch (error) {
      // Silently fail - analytics shouldn't break the user experience
      console.log('Failed to record profile view:', error);
    }
  },

  /**
   * Record when a buyer clicks on a proposal
   */
  recordProposalClick: async (consultantId: string, proposalId: string) => {
    try {
      await httpClient.post(`/analytics/proposal-click/${consultantId}/${proposalId}`);
    } catch (error) {
      // Silently fail - analytics shouldn't break the user experience
      console.log('Failed to record proposal click:', error);
    }
  },

  /**
   * Get analytics data for a consultant (admin/consultant only)
   */
  getConsultantAnalytics: async (consultantId: string, startDate?: Date, endDate?: Date) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    const response = await httpClient.get(`/analytics/consultant/${consultantId}?${params}`);
    return response.data;
  },

  /**
   * Get total analytics counts for a consultant
   */
  getConsultantTotals: async (consultantId: string) => {
    const response = await httpClient.get(`/analytics/consultant/${consultantId}/totals`);
    return response.data;
  }
};