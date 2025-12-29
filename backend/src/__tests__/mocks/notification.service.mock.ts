/**
 * Mock Notification Service
 * Prevents actual push notifications during tests
 */

export const mockNotificationService = {
  sendPushNotification: jest.fn().mockResolvedValue({
    success: true,
    messageId: 'mock-notification-id',
  }),

  sendBulkNotifications: jest.fn().mockResolvedValue({
    success: true,
    sent: 5,
    failed: 0,
  }),

  createNotification: jest.fn().mockImplementation((userId, data) => {
    return Promise.resolve({
      _id: 'mock-notification-id',
      userId,
      ...data,
      read: false,
      createdAt: new Date(),
    });
  }),

  markAsRead: jest.fn().mockResolvedValue(true),

  getUnreadCount: jest.fn().mockResolvedValue(3),

  reset: () => {
    mockNotificationService.sendPushNotification.mockClear();
    mockNotificationService.sendBulkNotifications.mockClear();
    mockNotificationService.createNotification.mockClear();
    mockNotificationService.markAsRead.mockClear();
    mockNotificationService.getUnreadCount.mockClear();
  },

  simulateFailure: () => {
    mockNotificationService.sendPushNotification.mockRejectedValueOnce(
      new Error('Push notification service unavailable')
    );
  },
};

export default mockNotificationService;
