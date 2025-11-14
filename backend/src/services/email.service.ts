import nodemailer from 'nodemailer';
import { Booking } from '../models/booking.model';
import { Invoice } from '../models/invoice.model';

export interface EmailConfig {
  provider: 'sendgrid' | 'resend' | 'mailgun' | 'smtp';
  apiKey?: string;
  fromEmail: string;
  fromName: string;
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailData {
  to: string;
  toName?: string;
  template: EmailTemplate;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export class EmailService {
  private config: EmailConfig;
  private transporter: nodemailer.Transporter;

  constructor(config: EmailConfig) {
    this.config = config;
    this.transporter = this.createTransporter();
  }

  private createTransporter(): nodemailer.Transporter {
    switch (this.config.provider) {
      case 'sendgrid':
        return nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: this.config.apiKey
          }
        });

      case 'mailgun':
        return nodemailer.createTransport({
          host: this.config.smtpConfig?.host || 'smtp.mailgun.org',
          port: this.config.smtpConfig?.port || 587,
          secure: false,
          auth: {
            user: this.config.smtpConfig?.auth.user || '',
            pass: this.config.smtpConfig?.auth.pass || ''
          }
        });

      case 'resend':
        return nodemailer.createTransport({
          host: 'smtp.resend.com',
          port: 587,
          secure: false,
          auth: {
            user: 'resend',
            pass: this.config.apiKey
          }
        });

      case 'smtp':
        if (!this.config.smtpConfig) {
          throw new Error('SMTP configuration required for smtp provider');
        }
        return nodemailer.createTransport(this.config.smtpConfig);

      default:
        throw new Error(`Unsupported email provider: ${this.config.provider}`);
    }
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to: emailData.toName ? `"${emailData.toName}" <${emailData.to}>` : emailData.to,
        subject: emailData.template.subject,
        text: emailData.template.text,
        html: emailData.template.html,
        attachments: emailData.attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  async sendBookingConfirmation(booking: Booking): Promise<boolean> {
    const template = this.generateBookingConfirmationTemplate(booking);
    
    return this.sendEmail({
      to: booking.email,
      toName: booking.clientName,
      template
    });
  }

  async sendPaymentReminder(booking: Booking, invoice?: Invoice): Promise<boolean> {
    const template = this.generatePaymentReminderTemplate(booking, invoice);
    
    return this.sendEmail({
      to: booking.email,
      toName: booking.clientName,
      template
    });
  }

  async sendInvoiceNotification(booking: Booking, invoice: Invoice): Promise<boolean> {
    const template = this.generateInvoiceTemplate(booking, invoice);
    
    return this.sendEmail({
      to: booking.email,
      toName: booking.clientName,
      template
    });
  }

  async sendStatusUpdate(booking: Booking, status: string): Promise<boolean> {
    const template = this.generateStatusUpdateTemplate(booking, status);
    
    return this.sendEmail({
      to: booking.email,
      toName: booking.clientName,
      template
    });
  }

  private generateBookingConfirmationTemplate(booking: Booking): EmailTemplate {
    const subject = `Booking Confirmation - ${booking.serviceType}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Booking Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; }
          .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmation</h1>
            <p>DT Protection Services</p>
          </div>
          <div class="content">
            <h2>Hello ${booking.clientName},</h2>
            <p>Thank you for choosing DT Protection Services. Your booking has been confirmed.</p>
            
            <h3>Booking Details:</h3>
            <ul>
              <li><strong>Service Type:</strong> ${booking.serviceType}</li>
              <li><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</li>
              <li><strong>Venue:</strong> ${booking.venueAddress || 'To be confirmed'}</li>
              <li><strong>Number of Guards:</strong> ${booking.numberOfGuards || 'To be confirmed'}</li>
            </ul>
            
            <h3>Payment Information:</h3>
            <ul>
              <li><strong>Total Amount:</strong> $${booking.payment?.totalAmount || 0}</li>
              <li><strong>Deposit Required:</strong> $${booking.payment?.depositAmount || 0}</li>
              <li><strong>Payment Status:</strong> ${booking.payment?.status || 'pending'}</li>
            </ul>
            
            <p>We will contact you shortly with further details and payment instructions.</p>
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
          </div>
          <div class="footer">
            <p>DT Protection Services<br>
            Email: admin@dtprotection.com<br>
            Phone: (555) 123-4567</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Booking Confirmation - ${booking.serviceType}
      
      Hello ${booking.clientName},
      
      Thank you for choosing DT Protection Services. Your booking has been confirmed.
      
      Booking Details:
      - Service Type: ${booking.serviceType}
      - Date: ${new Date(booking.date).toLocaleDateString()}
      - Venue: ${booking.venueAddress || 'To be confirmed'}
      - Number of Guards: ${booking.numberOfGuards || 'To be confirmed'}
      
      Payment Information:
      - Total Amount: $${booking.payment?.totalAmount || 0}
      - Deposit Required: $${booking.payment?.depositAmount || 0}
      - Payment Status: ${booking.payment?.status || 'pending'}
      
      We will contact you shortly with further details and payment instructions.
      
      If you have any questions, please don't hesitate to contact us.
      
      DT Protection Services
      Email: admin@dtprotection.com
      Phone: (555) 123-4567
    `;

    return { subject, html, text };
  }

  private generatePaymentReminderTemplate(booking: Booking, invoice?: Invoice): EmailTemplate {
    const daysUntilEvent = Math.ceil((new Date(booking.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const urgency = daysUntilEvent <= 7 ? 'URGENT' : daysUntilEvent <= 14 ? 'Important' : 'Reminder';
    
    const subject = `${urgency}: Payment Reminder - ${booking.serviceType}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${daysUntilEvent <= 7 ? '#dc3545' : '#ffc107'}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; }
          .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
          .urgent { color: #dc3545; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Reminder</h1>
            <p>DT Protection Services</p>
          </div>
          <div class="content">
            <h2>Hello ${booking.clientName},</h2>
            <p>This is a reminder that your payment for <strong>${booking.serviceType}</strong> is due.</p>
            
            <div class="urgent">
              <h3>Event Date: ${new Date(booking.date).toLocaleDateString()}</h3>
              <p>Days until event: <strong>${daysUntilEvent}</strong></p>
            </div>
            
            <h3>Payment Details:</h3>
            <ul>
              <li><strong>Total Amount:</strong> $${booking.payment?.totalAmount || 0}</li>
              <li><strong>Amount Paid:</strong> $${booking.payment?.paidAmount || 0}</li>
              <li><strong>Remaining Balance:</strong> $${(booking.payment?.totalAmount || 0) - (booking.payment?.paidAmount || 0)}</li>
            </ul>
            
            ${invoice ? `
            <h3>Invoice Information:</h3>
            <ul>
              <li><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</li>
              <li><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</li>
            </ul>
            ` : ''}
            
            <p>Please complete your payment to confirm your booking. You can pay online through the provided payment link or contact us for alternative payment methods.</p>
            
            <p>If you have already made a payment, please disregard this reminder.</p>
          </div>
          <div class="footer">
            <p>DT Protection Services<br>
            Email: admin@dtprotection.com<br>
            Phone: (555) 123-4567</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${urgency}: Payment Reminder - ${booking.serviceType}
      
      Hello ${booking.clientName},
      
      This is a reminder that your payment for ${booking.serviceType} is due.
      
      Event Date: ${new Date(booking.date).toLocaleDateString()}
      Days until event: ${daysUntilEvent}
      
      Payment Details:
      - Total Amount: $${booking.payment?.totalAmount || 0}
      - Amount Paid: $${booking.payment?.paidAmount || 0}
      - Remaining Balance: $${(booking.payment?.totalAmount || 0) - (booking.payment?.paidAmount || 0)}
      
      ${invoice ? `
      Invoice Information:
      - Invoice Number: ${invoice.invoiceNumber}
      - Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
      ` : ''}
      
      Please complete your payment to confirm your booking. You can pay online through the provided payment link or contact us for alternative payment methods.
      
      If you have already made a payment, please disregard this reminder.
      
      DT Protection Services
      Email: admin@dtprotection.com
      Phone: (555) 123-4567
    `;

    return { subject, html, text };
  }

  private generateInvoiceTemplate(booking: Booking, invoice: Invoice): EmailTemplate {
    const subject = `Invoice #${invoice.invoiceNumber} - ${booking.serviceType}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; }
          .invoice-details { background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .amount { font-size: 18px; font-weight: bold; color: #007bff; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Invoice</h1>
            <p>DT Protection Services</p>
          </div>
          <div class="content">
            <h2>Hello ${booking.clientName},</h2>
            <p>Please find attached your invoice for <strong>${booking.serviceType}</strong>.</p>
            
            <div class="invoice-details">
              <h3>Invoice Details:</h3>
              <ul>
                <li><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</li>
                <li><strong>Service:</strong> ${booking.serviceType}</li>
                <li><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</li>
                <li><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</li>
                <li><strong>Total Amount:</strong> <span class="amount">$${invoice.amount}</span></li>
                <li><strong>Deposit Amount:</strong> $${invoice.depositAmount}</li>
              </ul>
            </div>
            
            <p>You can pay this invoice online through the provided payment link or contact us for alternative payment methods.</p>
            
            <p>Thank you for choosing DT Protection Services.</p>
          </div>
          <div class="footer">
            <p>DT Protection Services<br>
            Email: admin@dtprotection.com<br>
            Phone: (555) 123-4567</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Invoice #${invoice.invoiceNumber} - ${booking.serviceType}
      
      Hello ${booking.clientName},
      
      Please find attached your invoice for ${booking.serviceType}.
      
      Invoice Details:
      - Invoice Number: ${invoice.invoiceNumber}
      - Service: ${booking.serviceType}
      - Date: ${new Date(booking.date).toLocaleDateString()}
      - Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
      - Total Amount: $${invoice.amount}
      - Deposit Amount: $${invoice.depositAmount}
      
      You can pay this invoice online through the provided payment link or contact us for alternative payment methods.
      
      Thank you for choosing DT Protection Services.
      
      DT Protection Services
      Email: admin@dtprotection.com
      Phone: (555) 123-4567
    `;

    return { subject, html, text };
  }

  private generateStatusUpdateTemplate(booking: Booking, status: string): EmailTemplate {
    const statusMessages = {
      'approved': 'Your booking has been approved!',
      'rejected': 'Your booking has been rejected.',
      'completed': 'Your service has been completed.',
      'cancelled': 'Your booking has been cancelled.'
    };

    const subject = `Booking Status Update - ${status.charAt(0).toUpperCase() + status.slice(1)}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Status Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${status === 'approved' ? '#28a745' : status === 'rejected' ? '#dc3545' : '#6c757d'}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Status Update</h1>
            <p>DT Protection Services</p>
          </div>
          <div class="content">
            <h2>Hello ${booking.clientName},</h2>
            <p>${statusMessages[status as keyof typeof statusMessages] || 'Your booking status has been updated.'}</p>
            
            <h3>Booking Details:</h3>
            <ul>
              <li><strong>Service Type:</strong> ${booking.serviceType}</li>
              <li><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</li>
              <li><strong>Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</li>
            </ul>
            
            ${status === 'approved' ? `
            <p>Your booking is now confirmed. We will contact you shortly with further details and payment instructions.</p>
            ` : status === 'rejected' ? `
            <p>If you have any questions about this decision, please contact us.</p>
            ` : status === 'completed' ? `
            <p>Thank you for choosing DT Protection Services. We hope you were satisfied with our service.</p>
            ` : `
            <p>If you have any questions, please don't hesitate to contact us.</p>
            `}
          </div>
          <div class="footer">
            <p>DT Protection Services<br>
            Email: admin@dtprotection.com<br>
            Phone: (555) 123-4567</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Booking Status Update - ${status.charAt(0).toUpperCase() + status.slice(1)}
      
      Hello ${booking.clientName},
      
      ${statusMessages[status as keyof typeof statusMessages] || 'Your booking status has been updated.'}
      
      Booking Details:
      - Service Type: ${booking.serviceType}
      - Date: ${new Date(booking.date).toLocaleDateString()}
      - Status: ${status.charAt(0).toUpperCase() + status.slice(1)}
      
      ${status === 'approved' ? `
      Your booking is now confirmed. We will contact you shortly with further details and payment instructions.
      ` : status === 'rejected' ? `
      If you have any questions about this decision, please contact us.
      ` : status === 'completed' ? `
      Thank you for choosing DT Protection Services. We hope you were satisfied with our service.
      ` : `
      If you have any questions, please don't hesitate to contact us.
      `}
      
      DT Protection Services
      Email: admin@dtprotection.com
      Phone: (555) 123-4567
    `;

    return { subject, html, text };
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
} 