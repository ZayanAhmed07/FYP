import { Notification, INotification } from '../models/notification.model';
import { Types } from 'mongoose';

export interface CreateNotificationData {
  userId?: string | Types.ObjectId; // Made optional for guest notifications
  guestEmail?: string; // For guest users
  title: string;
  message: string;
  type: 'contact_form' | 'general' | 'admin' | 'order' | 'proposal';
  relatedId?: string | Types.ObjectId;
  relatedType?: string;
}

class NotificationService {
  async createNotification(data: CreateNotificationData): Promise<INotification> {
    // Validate that either userId or guestEmail is provided
    if (!data.userId && !data.guestEmail) {
      throw new Error('Either userId or guestEmail must be provided');
    }

    const notification = new Notification({
      userId: data.userId,
      guestEmail: data.guestEmail,
      title: data.title,
      message: data.message,
      type: data.type,
      relatedId: data.relatedId,
      relatedType: data.relatedType,
    });

    return await notification.save();
  }

  async getNotificationsByUserId(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<{
    notifications: INotification[];
    total: number;
    unreadCount: number;
  }> {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    return { notifications: notifications as unknown as INotification[], total, unreadCount };
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const result = await Notification.findOneAndUpdate(
      { _id: notificationId, userId, isRead: false },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    return !!result;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return result.modifiedCount;
  }

  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const result = await Notification.findOneAndDelete({
      _id: notificationId,
      userId,
    });

    return !!result;
  }

  async createContactFormStatusNotification(
    userEmail: string,
    status: 'reviewed' | 'responded',
    contactId: string,
    userId?: string
  ): Promise<void> {
    console.log(`Creating notification for ${userEmail}, status: ${status}, contactId: ${contactId}, userId: ${userId}`);
    
    const title = status === 'reviewed' 
      ? 'Contact Form Reviewed' 
      : 'Response to Your Contact Form';
    
    const message = status === 'reviewed'
      ? 'Your message has been reviewed and you will receive an email later.'
      : 'We have responded to your contact form inquiry. Please check your email.';

    if (userId) {
      console.log(`Using provided userId ${userId}, creating notification`);
      // Create notification for registered user
      await this.createNotification({
        userId,
        title,
        message,
        type: 'contact_form',
        relatedId: contactId,
        relatedType: 'contact',
      });
    } else {
      // Try to find a registered user first
      const User = await import('../modules/user/user.model').then(m => m.User);
      const user = await User.findOne({ email: userEmail });

      if (user) {
        console.log(`Found registered user ${user._id}, creating notification`);
        // Create notification for registered user
        await this.createNotification({
          userId: user._id,
          title,
          message,
          type: 'contact_form',
          relatedId: contactId,
          relatedType: 'contact',
        });
      } else {
        console.log(`No registered user found, creating guest notification`);
        // Create guest notification
        await this.createNotification({
          guestEmail: userEmail,
          title,
          message,
          type: 'contact_form',
          relatedId: contactId,
          relatedType: 'contact',
        });
      }
    }
    console.log('Notification created successfully');
  }
}

export const notificationService = new NotificationService();