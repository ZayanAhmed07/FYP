import { Contact, IContact } from '../../models/contact.model';
import { emailService } from '../../services/email.service';
import { notificationService } from '../../services/notification.service';
import { ApiError } from '../../utils/ApiError';

export interface CreateContactData {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  ipAddress?: string;
  userId?: string;
}

export interface UpdateContactData {
  status?: 'pending' | 'reviewed' | 'responded';
  adminResponse?: string;
  reviewedBy?: string;
}

class ContactService {
  async createContact(data: CreateContactData): Promise<IContact> {
    // Create contact entry
    const contact = new Contact(data);
    await contact.save();

    // Send confirmation email to user (non-blocking)
    emailService.sendContactFormConfirmation(
      data.email,
      `${data.firstName} ${data.lastName}`
    ).catch(error => {
      console.error('Failed to send confirmation email:', error);
    });

    // Send notification email to admin (non-blocking)
    emailService.sendContactFormNotificationToAdmin(data).catch(error => {
      console.error('Failed to send admin notification email:', error);
    });

    return contact;
  }

  async getAllContacts(
    page = 1,
    limit = 20,
    status?: string
  ): Promise<{
    contacts: IContact[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const skip = (page - 1) * limit;
    const filter: any = {};
    
    if (status) {
      filter.status = status;
    }

    const [contacts, total] = await Promise.all([
      Contact.find(filter)
        .sort({ submissionDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('reviewedBy', 'firstName lastName email')
        .lean(),
      Contact.countDocuments(filter),
    ]);

    return {
      contacts: contacts as unknown as IContact[],
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  async getContactById(id: string): Promise<IContact | null> {
    return Contact.findById(id)
      .populate('reviewedBy', 'firstName lastName email');
  }

  async updateContact(id: string, data: UpdateContactData, adminId?: string): Promise<IContact> {
    const updateData: any = { ...data };
    
    if (adminId) {
      updateData.reviewedBy = adminId;
    }

    if (data.status === 'responded' && data.adminResponse) {
      updateData.adminResponseDate = new Date();
    }

    const contact = await Contact.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('reviewedBy', 'firstName lastName email');

    if (!contact) {
      throw new ApiError(404, 'Contact not found');
    }

    // Send email response to user if admin responded
    if (data.status === 'responded' && data.adminResponse) {
      await emailService.sendContactFormResponse(
        contact.email,
        `${contact.firstName} ${contact.lastName}`,
        data.adminResponse
      );
    }

    // Create notification for user about status change
    if (data.status && data.status !== 'pending') {
      await notificationService.createContactFormStatusNotification(
        contact.email,
        data.status,
        contact._id.toString(),
        contact.userId?.toString()
      );
    }

    return contact;
  }

  async deleteContact(id: string): Promise<boolean> {
    const result = await Contact.findByIdAndDelete(id);
    return !!result;
  }

  async getContactStats(): Promise<{
    total: number;
    pending: number;
    reviewed: number;
    responded: number;
  }> {
    const [total, pending, reviewed, responded] = await Promise.all([
      Contact.countDocuments(),
      Contact.countDocuments({ status: 'pending' }),
      Contact.countDocuments({ status: 'reviewed' }),
      Contact.countDocuments({ status: 'responded' }),
    ]);

    return { total, pending, reviewed, responded };
  }
}

export const contactService = new ContactService();