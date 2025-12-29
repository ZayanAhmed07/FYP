/**
 * Withdrawal Service
 * Handles withdrawal requests, processing, and notifications
 */

import { Types } from 'mongoose';
import Withdrawal, { IWithdrawal, IWithdrawalMethod } from '../models/withdrawal.model';
import Wallet from '../models/wallet.model';
import { User } from '../modules/user/user.model';
import { emailService } from './email.service';
import { ApiError } from '../utils/ApiError';

const MINIMUM_WITHDRAWAL = 2000; // PKR
const PLATFORM_FEE_PERCENT = 2; // 2% platform fee
const PROCESSING_DAYS = 5; // 3-5 business days

export class WithdrawalService {
  /**
   * Create a withdrawal request
   */
  static async createWithdrawalRequest(
    consultantId: Types.ObjectId,
    amount: number,
    withdrawalMethod: IWithdrawalMethod,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IWithdrawal> {
    // Validate amount
    if (amount < MINIMUM_WITHDRAWAL) {
      throw new ApiError(400, `Minimum withdrawal amount is PKR ${MINIMUM_WITHDRAWAL}`);
    }

    // Check available balance
    const wallet = await Wallet.findOne({ userId: consultantId });
    if (!wallet) {
      throw new ApiError(404, 'Wallet not found');
    }

    if (wallet.availableBalance < amount) {
      throw new ApiError(400, `Insufficient available balance. You have PKR ${wallet.availableBalance} available`);
    }

    // Create withdrawal request
    const withdrawal = new Withdrawal({
      consultantId,
      amount,
      withdrawalMethod,
      estimatedProcessingDays: PROCESSING_DAYS,
      ipAddress,
      userAgent,
    });

    await withdrawal.save();

    // 💰 Deduct amount from available balance - move to pending withdrawal
    await Wallet.findOneAndUpdate(
      { userId: consultantId },
      {
        $inc: {
          availableBalance: -amount, // Deduct from available
          pendingBalance: amount, // Add to pending
        },
        $push: {
          transactions: {
            type: 'withdrawal',
            description: `Withdrawal request for ${amount} PKR`,
            amount: -amount,
            withdrawalId: withdrawal._id,
            date: new Date(),
          },
        },
      }
    );

    // Send confirmation email to consultant
    await this.sendWithdrawalRequestEmail(consultantId, withdrawal);

    // Send notification to admin
    await this.sendAdminNotification('withdrawal_requested', withdrawal);

    return withdrawal;
  }

  /**
   * Approve a withdrawal request (Admin)
   */
  static async approveWithdrawal(withdrawalId: Types.ObjectId, adminNotes?: string): Promise<IWithdrawal> {
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      throw new ApiError(404, 'Withdrawal request not found');
    }

    if (withdrawal.status !== 'pending') {
      throw new ApiError(400, `Cannot approve withdrawal with status: ${withdrawal.status}`);
    }

    withdrawal.status = 'approved';
    withdrawal.approvedAt = new Date();
    if (adminNotes) {
      withdrawal.adminNotes = adminNotes;
    }

    await withdrawal.save();

    // Send approval email to consultant
    await this.sendWithdrawalApprovedEmail(withdrawal);

    return withdrawal;
  }

  /**
   * Mark withdrawal as processing
   */
  static async startProcessing(withdrawalId: Types.ObjectId): Promise<IWithdrawal> {
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      throw new ApiError(404, 'Withdrawal request not found');
    }

    if (withdrawal.status !== 'approved') {
      throw new ApiError(400, `Cannot start processing withdrawal with status: ${withdrawal.status}`);
    }

    withdrawal.status = 'processing';
    withdrawal.processedAt = new Date();

    await withdrawal.save();

    // Send processing email to consultant
    await this.sendWithdrawalProcessingEmail(withdrawal);

    return withdrawal;
  }

  /**
   * Complete a withdrawal
   */
  static async completeWithdrawal(
    withdrawalId: Types.ObjectId,
    transactionId?: string,
    bankReference?: string
  ): Promise<IWithdrawal> {
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      throw new ApiError(404, 'Withdrawal request not found');
    }

    if (withdrawal.status !== 'processing') {
      throw new ApiError(400, `Cannot complete withdrawal with status: ${withdrawal.status}`);
    }

    withdrawal.status = 'completed';
    withdrawal.completedAt = new Date();
    if (transactionId) {
      withdrawal.transactionId = transactionId;
    }
    if (bankReference) {
      withdrawal.bankReference = bankReference;
    }

    await withdrawal.save();

    // Update wallet balances: move amount out of pending and into totalWithdrawn
    await Wallet.findOneAndUpdate(
      { userId: withdrawal.consultantId },
      {
        $inc: {
          pendingBalance: -withdrawal.amount,
          totalWithdrawn: withdrawal.actualAmountPaid || withdrawal.amount,
        },
        $push: {
          transactions: {
            type: 'withdrawal',
            description: `Withdrawal processed to ${withdrawal.withdrawalMethod.type}`,
            amount: -(withdrawal.actualAmountPaid || withdrawal.amount),
            withdrawalId: withdrawal._id,
            date: new Date(),
          },
        },
      }
    );

    // Send completion email to consultant
    await this.sendWithdrawalCompletedEmail(withdrawal);

    return withdrawal;
  }

  /**
   * Reject/Cancel a withdrawal
   */
  static async rejectWithdrawal(withdrawalId: Types.ObjectId, reason: string): Promise<IWithdrawal> {
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      throw new ApiError(404, 'Withdrawal request not found');
    }

    if (!['pending', 'approved'].includes(withdrawal.status)) {
      throw new ApiError(400, `Cannot reject withdrawal with status: ${withdrawal.status}`);
    }

    withdrawal.status = 'cancelled';
    withdrawal.adminNotes = reason;

    await withdrawal.save();

    // 💰 Restore balance to available since withdrawal is cancelled
    await Wallet.findOneAndUpdate(
      { userId: withdrawal.consultantId },
      {
        $inc: {
          availableBalance: withdrawal.amount, // Restore to available
          pendingBalance: -withdrawal.amount, // Remove from pending
        },
        $push: {
          transactions: {
            type: 'deposit',
            description: `Withdrawal cancelled - refunded ${withdrawal.amount} PKR`,
            amount: withdrawal.amount,
            withdrawalId: withdrawal._id,
            date: new Date(),
          },
        },
      }
    );

    // Send rejection email to consultant
    await this.sendWithdrawalRejectedEmail(withdrawal, reason);

    return withdrawal;
  }

  /**
   * Get withdrawal history for consultant
   */
  static async getWithdrawalHistory(
    consultantId: Types.ObjectId,
    limit = 20,
    skip = 0
  ): Promise<{ withdrawals: IWithdrawal[]; total: number }> {
    const withdrawals = await Withdrawal.find({ consultantId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Withdrawal.countDocuments({ consultantId });

    return { withdrawals, total };
  }

  /**
   * Get withdrawal statistics for consultant
   */
  static async getWithdrawalStats(consultantId: Types.ObjectId) {
    const [pending, approved, processing, completed, cancelled] = await Promise.all([
      Withdrawal.countDocuments({ consultantId, status: 'pending' }),
      Withdrawal.countDocuments({ consultantId, status: 'approved' }),
      Withdrawal.countDocuments({ consultantId, status: 'processing' }),
      Withdrawal.countDocuments({ consultantId, status: 'completed' }),
      Withdrawal.countDocuments({ consultantId, status: 'cancelled' }),
    ]);

    const totalWithdrawn = await Withdrawal.aggregate([
      { $match: { consultantId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$actualAmountPaid' } } },
    ]);

    return {
      pending,
      approved,
      processing,
      completed,
      cancelled,
      totalWithdrawn: totalWithdrawn[0]?.total || 0,
    };
  }

  /**
   * Email notification methods
   */

  static async sendWithdrawalRequestEmail(
    consultantId: Types.ObjectId,
    withdrawal: IWithdrawal
  ): Promise<void> {
    try {
      const user = await User.findById(consultantId);
      if (!user) return;

      const subject = 'Withdrawal Request Received - Raah Consultants';
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Withdrawal Request Received</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <p>Hi ${user.name || 'Consultant'},</p>
            
            <p>We've received your withdrawal request for <strong>PKR ${withdrawal.amount.toLocaleString()}</strong>.</p>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Request Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Amount:</td>
                  <td style="padding: 8px 0; font-weight: bold;">PKR ${withdrawal.amount.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Platform Fee (2%):</td>
                  <td style="padding: 8px 0; font-weight: bold;">PKR ${(withdrawal.platformFee || 0).toLocaleString()}</td>
                </tr>
                <tr style="border-top: 1px solid #eee;">
                  <td style="padding: 8px 0; color: #666;">You'll Receive:</td>
                  <td style="padding: 8px 0; font-weight: bold; color: #0db4bc; font-size: 18px;">PKR ${(withdrawal.actualAmountPaid || 0).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Method:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${this.getMethodLabel(withdrawal.withdrawalMethod.type)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Processing Time:</td>
                  <td style="padding: 8px 0;">3-5 business days</td>
                </tr>
              </table>
            </div>
            
            <p>Your withdrawal request is now pending admin review. We'll notify you via email at each stage of the process.</p>
            
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              This is an automated email. Please do not reply to this email. Contact support@raahconsultants.com for assistance.
            </p>
          </div>
        </div>
      `;

      await emailService.sendEmail({
        to: user.email,
        subject,
        html: htmlContent,
      });
    } catch (error) {
      console.error('Error sending withdrawal request email:', error);
    }
  }

  static async sendWithdrawalApprovedEmail(withdrawal: IWithdrawal): Promise<void> {
    try {
      const user = await User.findById(withdrawal.consultantId);
      if (!user) return;

      const subject = 'Withdrawal Request Approved - Raah Consultants';
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">✓ Withdrawal Approved</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <p>Hi ${user.name || 'Consultant'},</p>
            
            <p>Great news! Your withdrawal request of <strong>PKR ${withdrawal.amount.toLocaleString()}</strong> has been approved.</p>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4caf50;">
              <p style="margin: 0; color: #666;">Your funds will be transferred within <strong>3-5 business days</strong> to your ${this.getMethodLabel(withdrawal.withdrawalMethod.type)} account.</p>
            </div>
            
            <p>You can track your withdrawal status in your Raah dashboard anytime.</p>
            
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              This is an automated email. Please do not reply to this email. Contact support@raahconsultants.com for assistance.
            </p>
          </div>
        </div>
      `;

      await emailService.sendEmail({
        to: user.email,
        subject,
        html: htmlContent,
      });
    } catch (error) {
      console.error('Error sending withdrawal approved email:', error);
    }
  }

  static async sendWithdrawalProcessingEmail(withdrawal: IWithdrawal): Promise<void> {
    try {
      const user = await User.findById(withdrawal.consultantId);
      if (!user) return;

      const subject = 'Your Withdrawal is Being Processed - Raah Consultants';
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Processing Your Withdrawal</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <p>Hi ${user.name || 'Consultant'},</p>
            
            <p>Your withdrawal request of <strong>PKR ${withdrawal.amount.toLocaleString()}</strong> is now being processed.</p>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Processing Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Amount to Receive:</td>
                  <td style="padding: 8px 0; font-weight: bold;">PKR ${(withdrawal.actualAmountPaid || 0).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Processing Started:</td>
                  <td style="padding: 8px 0;">${new Date().toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Expected Completion:</td>
                  <td style="padding: 8px 0;">3-5 business days</td>
                </tr>
              </table>
            </div>
            
            <p>We'll send you a confirmation email once the transfer is complete. Thank you for your patience!</p>
            
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              This is an automated email. Please do not reply to this email. Contact support@raahconsultants.com for assistance.
            </p>
          </div>
        </div>
      `;

      await emailService.sendEmail({
        to: user.email,
        subject,
        html: htmlContent,
      });
    } catch (error) {
      console.error('Error sending withdrawal processing email:', error);
    }
  }

  static async sendWithdrawalCompletedEmail(withdrawal: IWithdrawal): Promise<void> {
    try {
      const user = await User.findById(withdrawal.consultantId);
      if (!user) return;

      const subject = 'Your Withdrawal is Complete - Raah Consultants';
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">✓ Withdrawal Complete</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <p>Hi ${user.name || 'Consultant'},</p>
            
            <p>Excellent news! Your withdrawal of <strong>PKR ${(withdrawal.actualAmountPaid || 0).toLocaleString()}</strong> has been successfully completed.</p>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4caf50;">
              <h3 style="margin-top: 0;">Transfer Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Amount Transferred:</td>
                  <td style="padding: 8px 0; font-weight: bold;">PKR ${(withdrawal.actualAmountPaid || 0).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Method:</td>
                  <td style="padding: 8px 0;">${this.getMethodLabel(withdrawal.withdrawalMethod.type)}</td>
                </tr>
                ${withdrawal.transactionId ? `<tr>
                  <td style="padding: 8px 0; color: #666;">Transaction ID:</td>
                  <td style="padding: 8px 0; font-family: monospace; font-size: 12px;">${withdrawal.transactionId}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #666;">Date Completed:</td>
                  <td style="padding: 8px 0;">${withdrawal.completedAt?.toLocaleDateString()}</td>
                </tr>
              </table>
            </div>
            
            <p>The funds should appear in your account within 1-2 business days. If you don't see the funds after this period, please contact our support team.</p>
            
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              This is an automated email. Please do not reply to this email. Contact support@raahconsultants.com for assistance.
            </p>
          </div>
        </div>
      `;

      await emailService.sendEmail({
        to: user.email,
        subject,
        html: htmlContent,
      });
    } catch (error) {
      console.error('Error sending withdrawal completed email:', error);
    }
  }

  static async sendWithdrawalRejectedEmail(withdrawal: IWithdrawal, reason: string): Promise<void> {
    try {
      const user = await User.findById(withdrawal.consultantId);
      if (!user) return;

      const subject = 'Withdrawal Request Cancelled - Raah Consultants';
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Withdrawal Request Cancelled</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <p>Hi ${user.name || 'Consultant'},</p>
            
            <p>Unfortunately, your withdrawal request for <strong>PKR ${withdrawal.amount.toLocaleString()}</strong> has been cancelled.</p>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f44336;">
              <h3 style="margin-top: 0;">Reason:</h3>
              <p style="margin: 0;">${reason}</p>
            </div>
            
            <p>Please contact our support team if you need more information or if you believe this is an error.</p>
            
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              This is an automated email. Please do not reply to this email. Contact support@raahconsultants.com for assistance.
            </p>
          </div>
        </div>
      `;

      await emailService.sendEmail({
        to: user.email,
        subject,
        html: htmlContent,
      });
    } catch (error) {
      console.error('Error sending withdrawal rejected email:', error);
    }
  }

  static async sendAdminNotification(type: string, withdrawal: IWithdrawal): Promise<void> {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@raahconsultants.com';
      let subject = '';
      let htmlContent = '';

      if (type === 'withdrawal_requested') {
        subject = 'New Withdrawal Request - Admin Review Required';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Withdrawal Request</h2>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
              <tr style="background: #f5f5f5;">
                <td style="padding: 10px; border: 1px solid #ddd;">Withdrawal ID:</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${withdrawal._id}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">Consultant ID:</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${withdrawal.consultantId}</td>
              </tr>
              <tr style="background: #f5f5f5;">
                <td style="padding: 10px; border: 1px solid #ddd;">Amount:</td>
                <td style="padding: 10px; border: 1px solid #ddd;">PKR ${withdrawal.amount.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">Method:</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${this.getMethodLabel(withdrawal.withdrawalMethod.type)}</td>
              </tr>
              <tr style="background: #f5f5f5;">
                <td style="padding: 10px; border: 1px solid #ddd;">Requested At:</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${withdrawal.requestedAt.toLocaleString()}</td>
              </tr>
            </table>
          </div>
        `;
      }

      await emailService.sendEmail({
        to: adminEmail,
        subject,
        html: htmlContent,
      });
    } catch (error) {
      console.error('Error sending admin notification:', error);
    }
  }

  private static getMethodLabel(type: string): string {
    const labels: Record<string, string> = {
      bank_transfer: 'Bank Transfer',
      paypal: 'PayPal',
      stripe: 'Stripe',
      crypto: 'Cryptocurrency',
    };
    return labels[type] || type;
  }
}

export default WithdrawalService;

