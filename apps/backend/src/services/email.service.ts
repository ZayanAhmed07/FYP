import nodemailer from 'nodemailer';
import { env } from '../config/env';
import logger from '../config/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Only create transporter if SMTP credentials are configured
    if (env.smtpUser && env.smtpPass && env.smtpHost) {
      this.transporter = nodemailer.createTransport({
        host: env.smtpHost,
        port: env.smtpPort,
        secure: false, // true for 465, false for other ports
        auth: {
          user: env.smtpUser,
          pass: env.smtpPass,
        },
      });
    } else {
      console.warn('SMTP credentials not configured. Email sending will be disabled.');
      this.transporter = null as any;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    // Check if transporter is configured
    if (!this.transporter) {
      console.warn('Email service not configured. Skipping email send.');
      return false;
    }

    try {
      const mailOptions = {
        from: `"Expert Raah" <${env.smtpUser}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async sendContactFormNotificationToAdmin(contactData: {
    firstName: string;
    lastName: string;
    email: string;
    message: string;
  }): Promise<boolean> {
    const subject = 'New Contact Form Submission';
    const html = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${contactData.firstName} ${contactData.lastName}</p>
      <p><strong>Email:</strong> ${contactData.email}</p>
      <p><strong>Message:</strong></p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
        ${contactData.message.replace(/\n/g, '<br>')}
      </div>
      <p><em>Please review and respond to this inquiry through the admin panel.</em></p>
    `;

    return this.sendEmail({
      to: env.adminEmail || 'admin@expertraah.com',
      subject,
      html,
    });
  }

  async sendContactFormConfirmation(userEmail: string, userName: string): Promise<boolean> {
    const subject = 'Thank you for contacting Expert Raah';
    const html = `
      <h2>Thank you for reaching out!</h2>
      <p>Dear ${userName},</p>
      <p>We have received your message and will get back to you within 24-48 hours.</p>
      <p>Our team is committed to providing you with the best possible assistance.</p>
      <br>
      <p>Best regards,<br>
      The Expert Raah Team</p>
      <hr>
      <p style="font-size: 12px; color: #666;">
        This is an automated message. Please do not reply to this email.
      </p>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  async sendContactFormResponse(
    userEmail: string,
    userName: string,
    adminResponse: string
  ): Promise<boolean> {
    const subject = 'Response to your Expert Raah inquiry';
    const html = `
      <h2>Response from Expert Raah</h2>
      <p>Dear ${userName},</p>
      <p>Thank you for contacting us. Here's our response to your inquiry:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        ${adminResponse.replace(/\n/g, '<br>')}
      </div>
      <p>If you have any further questions, please don't hesitate to contact us again.</p>
      <br>
      <p>Best regards,<br>
      The Expert Raah Team</p>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  async sendConsultantVerificationApproved(
    consultantEmail: string,
    consultantName: string
  ): Promise<boolean> {
    const subject = '✅ Congratulations! Your Expert Raah Consultant Account is Verified';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0db4bc 0%, #0a8a91 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Verification Approved!</h1>
        </div>
        
        <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">Dear ${consultantName},</p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Great news! Your consultant account has been successfully verified by our admin team. 
            You can now access all consultant features on Expert Raah.
          </p>
          
          <div style="background-color: #e0f7f8; border-left: 4px solid #0db4bc; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h3 style="color: #0db4bc; margin-top: 0;">What's Next?</h3>
            <ul style="color: #333; line-height: 1.8;">
              <li>Complete your profile to attract more clients</li>
              <li>Browse available job postings and submit proposals</li>
              <li>Start connecting with clients and grow your business</li>
              <li>Build your reputation through quality work and reviews</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${env.frontendUrl || 'http://localhost:5173'}/consultant/dashboard" 
               style="display: inline-block; background-color: #0db4bc; color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Go to Dashboard
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6; margin-top: 30px;">
            Best regards,<br>
            <strong>The Expert Raah Team</strong>
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: consultantEmail,
      subject,
      html,
    });
  }

  async sendConsultantVerificationRejected(
    consultantEmail: string,
    consultantName: string,
    reason?: string
  ): Promise<boolean> {
    const subject = 'Expert Raah Consultant Verification Status Update';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Verification Status Update</h1>
        </div>
        
        <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">Dear ${consultantName},</p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Thank you for your interest in becoming a verified consultant on Expert Raah. 
            After reviewing your application, we regret to inform you that your verification request could not be approved at this time.
          </p>
          
          ${reason ? `
          <div style="background-color: #fee; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h3 style="color: #ef4444; margin-top: 0;">Reason for Rejection:</h3>
            <p style="color: #333; margin: 0;">${reason}</p>
          </div>
          ` : ''}
          
          <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h3 style="color: #f59e0b; margin-top: 0;">What You Can Do:</h3>
            <ul style="color: #333; line-height: 1.8;">
              <li>Review and update your profile information</li>
              <li>Ensure all verification documents are clear and valid</li>
              <li>Double-check that your ID card and supporting documents meet our requirements</li>
              <li>Resubmit your verification request with updated information</li>
            </ul>
          </div>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            If you believe this decision was made in error or if you have questions about the verification process, 
            please don't hesitate to contact our support team.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${env.frontendUrl || 'http://localhost:5173'}/consultant/profile" 
               style="display: inline-block; background-color: #0db4bc; color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Update Profile & Reapply
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6; margin-top: 30px;">
            Best regards,<br>
            <strong>The Expert Raah Verification Team</strong>
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>For support, contact us at support@expertraah.com</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: consultantEmail,
      subject,
      html,
    });
  }
}

export const emailService = new EmailService();