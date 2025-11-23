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
}

export const emailService = new EmailService();