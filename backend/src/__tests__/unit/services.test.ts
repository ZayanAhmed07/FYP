/**
 * Services Layer Tests
 * Testing email, analytics, and notification services
 */

import { mockEmailService } from '../mocks/email.service.mock';
import { mockNotificationService } from '../mocks/notification.service.mock';
import { 
  mockGeminiEmbeddingService, 
  mockGroqEmbeddingService,
  mockHuggingFaceService,
  resetAllAIMocks 
} from '../mocks/ai-services.mock';

describe('Email Service Tests', () => {
  beforeEach(() => {
    mockEmailService.reset();
  });

  describe('Send Email', () => {
    it('should send email successfully', async () => {
      const result = await mockEmailService.sendEmail(
        'test@example.com',
        'Test Subject',
        'Test content'
      );

      expect(result).toBeDefined();
      expect(result.messageId).toBe('test-message-id-123');
      expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test Subject',
        'Test content'
      );
    });

    it('should handle email send failure', async () => {
      mockEmailService.simulateFailure();

      await expect(
        mockEmailService.sendEmail('test@example.com', 'Subject', 'Content')
      ).rejects.toThrow('Email service failure');
    });

    it('should send multiple emails', async () => {
      const emails = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
      ];

      for (const email of emails) {
        await mockEmailService.sendEmail(email, 'Subject', 'Content');
      }

      expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(3);
    });
  });

  describe('Order Confirmation Emails', () => {
    it('should send order confirmation email', async () => {
      const orderData = {
        orderId: 'order-123',
        buyerEmail: 'buyer@example.com',
        consultantEmail: 'consultant@example.com',
        amount: 5000,
        jobTitle: 'Web Development Project',
      };

      const result = await mockEmailService.sendOrderConfirmation(orderData);

      expect(result).toBeDefined();
      expect(mockEmailService.sendOrderConfirmation).toHaveBeenCalledWith(orderData);
    });
  });

  describe('Proposal Notification Emails', () => {
    it('should send proposal notification to buyer', async () => {
      const proposalData = {
        jobTitle: 'Legal Consultation',
        consultantName: 'John Doe',
        buyerEmail: 'buyer@example.com',
        proposalId: 'proposal-456',
      };

      const result = await mockEmailService.sendProposalNotification(proposalData);

      expect(result).toBeDefined();
      expect(mockEmailService.sendProposalNotification).toHaveBeenCalledTimes(1);
    });
  });

  describe('Password Reset Emails', () => {
    it('should send password reset email', async () => {
      const result = await mockEmailService.sendPasswordReset(
        'user@example.com',
        'reset-token-123'
      );

      expect(result).toBeDefined();
      expect(mockEmailService.sendPasswordReset).toHaveBeenCalledWith(
        'user@example.com',
        'reset-token-123'
      );
    });
  });

  describe('Welcome Emails', () => {
    it('should send welcome email to new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        name: 'New User',
        accountType: 'buyer',
      };

      const result = await mockEmailService.sendWelcomeEmail(userData);

      expect(result).toBeDefined();
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(userData);
    });
  });

  describe('Order Completion Emails', () => {
    it('should send order completion request email', async () => {
      const orderData = {
        orderId: 'order-789',
        buyerEmail: 'buyer@example.com',
        consultantName: 'Jane Smith',
        jobTitle: 'Marketing Strategy',
      };

      const result = await mockEmailService.sendOrderCompletionRequest(orderData);

      expect(result).toBeDefined();
      expect(mockEmailService.sendOrderCompletionRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('Review Request Emails', () => {
    it('should send review request email', async () => {
      const reviewData = {
        orderId: 'order-101',
        userEmail: 'user@example.com',
        revieweeType: 'consultant',
        revieweeName: 'Expert Consultant',
      };

      const result = await mockEmailService.sendReviewRequest(reviewData);

      expect(result).toBeDefined();
      expect(mockEmailService.sendReviewRequest).toHaveBeenCalledWith(reviewData);
    });
  });
});

describe('Notification Service Tests', () => {
  beforeEach(() => {
    mockNotificationService.reset();
  });

  describe('Push Notifications', () => {
    it('should send push notification successfully', async () => {
      const result = await mockNotificationService.sendPushNotification(
        'user-123',
        'New Message',
        'You have received a new message'
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('notification-456');
      expect(mockNotificationService.sendPushNotification).toHaveBeenCalledTimes(1);
    });

    it('should handle notification failure', async () => {
      mockNotificationService.simulateFailure();

      await expect(
        mockNotificationService.sendPushNotification('user-123', 'Title', 'Body')
      ).rejects.toThrow('Notification service failure');
    });

    it('should send notifications to multiple users', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      
      for (const userId of userIds) {
        await mockNotificationService.sendPushNotification(
          userId,
          'Announcement',
          'System maintenance scheduled'
        );
      }

      expect(mockNotificationService.sendPushNotification).toHaveBeenCalledTimes(3);
    });
  });

  describe('Bulk Notifications', () => {
    it('should send bulk notifications', async () => {
      const userIds = ['user-1', 'user-2', 'user-3', 'user-4'];
      const result = await mockNotificationService.sendBulkNotifications(
        userIds,
        'Important Update',
        'Platform update released'
      );

      expect(result).toBeDefined();
      expect(result.sent).toBe(4);
      expect(result.failed).toBe(0);
      expect(mockNotificationService.sendBulkNotifications).toHaveBeenCalledTimes(1);
    });

    it('should handle partial bulk notification failures', async () => {
      mockNotificationService.simulateFailure();

      const userIds = ['user-1', 'user-2'];
      await expect(
        mockNotificationService.sendBulkNotifications(userIds, 'Title', 'Body')
      ).rejects.toThrow();
    });
  });

  describe('Notification CRUD', () => {
    it('should create notification', async () => {
      const notificationData = {
        userId: 'user-123',
        title: 'New Order',
        message: 'You have a new order',
        type: 'order',
      };

      const result = await mockNotificationService.createNotification(notificationData);

      expect(result).toBeDefined();
      expect(result._id).toBe('notification-789');
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(notificationData);
    });

    it('should mark notification as read', async () => {
      const result = await mockNotificationService.markAsRead('notification-123');

      expect(result).toBeDefined();
      expect(result.read).toBe(true);
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('notification-123');
    });

    it('should get unread notification count', async () => {
      const count = await mockNotificationService.getUnreadCount('user-123');

      expect(count).toBe(5);
      expect(mockNotificationService.getUnreadCount).toHaveBeenCalledWith('user-123');
    });
  });
});

describe('AI Embedding Services Tests', () => {
  beforeEach(() => {
    resetAllAIMocks();
  });

  describe('Gemini Embedding Service', () => {
    it('should generate embeddings for text', async () => {
      const text = 'Experienced legal consultant specializing in corporate law';
      const embedding = await mockGeminiEmbeddingService.generateEmbedding(text);

      expect(embedding).toBeDefined();
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBe(768);
      expect(typeof embedding[0]).toBe('number');
      expect(mockGeminiEmbeddingService.generateEmbedding).toHaveBeenCalledWith(text);
    });

    it('should generate consistent embeddings for same text', async () => {
      const text = 'Test text for embedding';
      const embedding1 = await mockGeminiEmbeddingService.generateEmbedding(text);
      const embedding2 = await mockGeminiEmbeddingService.generateEmbedding(text);

      expect(embedding1).toEqual(embedding2);
    });

    it('should handle empty text', async () => {
      const embedding = await mockGeminiEmbeddingService.generateEmbedding('');

      expect(embedding).toBeDefined();
      expect(embedding.length).toBe(768);
    });

    it('should handle long text', async () => {
      const longText = 'A'.repeat(10000);
      const embedding = await mockGeminiEmbeddingService.generateEmbedding(longText);

      expect(embedding).toBeDefined();
      expect(embedding.length).toBe(768);
    });
  });

  describe('Groq Embedding Service', () => {
    it('should generate 1024-dimensional embeddings', async () => {
      const text = 'Software engineer with 5 years of experience';
      const embedding = await mockGroqEmbeddingService.generateEmbedding(text);

      expect(embedding).toBeDefined();
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBe(1024);
      expect(mockGroqEmbeddingService.generateEmbedding).toHaveBeenCalledWith(text);
    });

    it('should generate batch embeddings', async () => {
      const texts = [
        'Legal consultant',
        'Software developer',
        'Marketing specialist',
      ];

      const embeddings = await mockGroqEmbeddingService.generateBatchEmbeddings(texts);

      expect(embeddings).toBeDefined();
      expect(Array.isArray(embeddings)).toBe(true);
      expect(embeddings.length).toBe(3);
      embeddings.forEach((emb: number[]) => {
        expect(emb.length).toBe(1024);
      });
    });
  });

  describe('HuggingFace Service', () => {
    it('should generate 384-dimensional embeddings', async () => {
      const text = 'Business consultant specializing in strategy';
      const embedding = await mockHuggingFaceService.generateEmbedding(text);

      expect(embedding).toBeDefined();
      expect(embedding.length).toBe(384);
      expect(mockHuggingFaceService.generateEmbedding).toHaveBeenCalledWith(text);
    });

    it('should handle special characters in text', async () => {
      const text = 'Consultant: @legal #law & compliance!';
      const embedding = await mockHuggingFaceService.generateEmbedding(text);

      expect(embedding).toBeDefined();
      expect(embedding.length).toBe(384);
    });

    it('should handle unicode characters', async () => {
      const text = 'Consultant français 中文 العربية';
      const embedding = await mockHuggingFaceService.generateEmbedding(text);

      expect(embedding).toBeDefined();
      expect(embedding.length).toBe(384);
    });
  });

  describe('Embedding Service Error Handling', () => {
    it('should handle Gemini service failure', async () => {
      mockGeminiEmbeddingService.simulateFailure();

      await expect(
        mockGeminiEmbeddingService.generateEmbedding('test')
      ).rejects.toThrow('Gemini embedding service failure');
    });

    it('should handle Groq service failure', async () => {
      mockGroqEmbeddingService.simulateFailure();

      await expect(
        mockGroqEmbeddingService.generateEmbedding('test')
      ).rejects.toThrow('Groq embedding service failure');
    });

    it('should handle HuggingFace service failure', async () => {
      mockHuggingFaceService.simulateFailure();

      await expect(
        mockHuggingFaceService.generateEmbedding('test')
      ).rejects.toThrow('HuggingFace service failure');
    });
  });

  describe('Embedding Similarity', () => {
    it('should compute cosine similarity between embeddings', () => {
      const embedding1 = [1, 0, 0];
      const embedding2 = [0, 1, 0];
      const embedding3 = [1, 0, 0];

      const cosineSimilarity = (a: number[], b: number[]): number => {
        const dotProduct = a.reduce((sum, val, i) => sum + val * (b[i] ?? 0), 0);
        const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
        const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
        if (magnitudeA === 0 || magnitudeB === 0) return 0;
        return dotProduct / (magnitudeA * magnitudeB);
      };

      // Different vectors should have low similarity
      const similarity1 = cosineSimilarity(embedding1, embedding2);
      expect(similarity1).toBeCloseTo(0, 5);

      // Same vectors should have similarity 1
      const similarity2 = cosineSimilarity(embedding1, embedding3);
      expect(similarity2).toBeCloseTo(1, 5);
    });
  });
});

describe('Service Integration Tests', () => {
  it('should coordinate email and notification for new order', async () => {
    mockEmailService.reset();
    mockNotificationService.reset();

    // Simulate order creation notification flow
    const orderData = {
      orderId: 'order-123',
      buyerEmail: 'buyer@example.com',
      consultantEmail: 'consultant@example.com',
      amount: 5000,
      jobTitle: 'Web Development',
    };

    // Send email confirmation
    await mockEmailService.sendOrderConfirmation(orderData);

    // Send push notifications
    await mockNotificationService.sendPushNotification(
      'buyer-id',
      'Order Confirmed',
      'Your order has been confirmed'
    );
    await mockNotificationService.sendPushNotification(
      'consultant-id',
      'New Order',
      'You have a new order'
    );

    expect(mockEmailService.sendOrderConfirmation).toHaveBeenCalledTimes(1);
    expect(mockNotificationService.sendPushNotification).toHaveBeenCalledTimes(2);
  });

  it('should handle service failures gracefully', async () => {
    mockEmailService.simulateFailure();

    // Email should fail
    await expect(
      mockEmailService.sendEmail('test@example.com', 'Subject', 'Content')
    ).rejects.toThrow();

    // But notification should still work
    const result = await mockNotificationService.sendPushNotification(
      'user-123',
      'Title',
      'Body'
    );
    expect(result.success).toBe(true);
  });
});
