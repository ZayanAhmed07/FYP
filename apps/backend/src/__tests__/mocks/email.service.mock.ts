/**
 * Mock Email Service
 * Prevents actual email sending during tests
 */

export const mockEmailService = {
  sendEmail: jest.fn().mockResolvedValue({
    messageId: 'test-message-id-123',
    accepted: ['test@example.com'],
    rejected: [],
  }),

  sendOrderConfirmation: jest.fn().mockResolvedValue(true),
  
  sendProposalNotification: jest.fn().mockResolvedValue(true),
  
  sendPasswordReset: jest.fn().mockResolvedValue(true),
  
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  
  sendOrderCompletionRequest: jest.fn().mockResolvedValue(true),
  
  sendReviewRequest: jest.fn().mockResolvedValue(true),

  // Utility to reset all mocks
  reset: () => {
    mockEmailService.sendEmail.mockClear();
    mockEmailService.sendOrderConfirmation.mockClear();
    mockEmailService.sendProposalNotification.mockClear();
    mockEmailService.sendPasswordReset.mockClear();
    mockEmailService.sendWelcomeEmail.mockClear();
    mockEmailService.sendOrderCompletionRequest.mockClear();
    mockEmailService.sendReviewRequest.mockClear();
  },

  // Utility to simulate email failure
  simulateFailure: () => {
    mockEmailService.sendEmail.mockRejectedValueOnce(
      new Error('Email service temporarily unavailable')
    );
  },
};

// Export for jest.mock()
export default mockEmailService;
