import { Booking } from '../models/booking.model';
import { Invoice } from '../models/invoice.model';

export interface SMSConfig {
  provider: 'twilio' | 'vonage';
  apiKey: string;
  apiSecret: string;
  fromNumber: string;
  accountSid?: string; // For Twilio
}

export interface SMSData {
  to: string;
  message: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface SMSTemplate {
  bookingConfirmation: string;
  paymentReminder: string;
  statusUpdate: string;
  urgentReminder: string;
}

export class SMSService {
  private config: SMSConfig;
  private templates: SMSTemplate;

  constructor(config: SMSConfig) {
    this.config = config;
    this.templates = this.getDefaultTemplates();
  }

  private getDefaultTemplates(): SMSTemplate {
    return {
      bookingConfirmation: 'Hi {name}, your {service} booking for {date} has been confirmed. Total: ${total}, Deposit: ${deposit}. Reply STOP to unsubscribe.',
      paymentReminder: 'Hi {name}, payment reminder for {service} on {date}. Remaining: ${remaining}. Days until event: {days}. Reply STOP to unsubscribe.',
      statusUpdate: 'Hi {name}, your {service} booking status has been updated to {status}. Reply STOP to unsubscribe.',
      urgentReminder: 'URGENT: Hi {name}, payment due for {service} on {date}. Only {days} days left. Call us immediately. Reply STOP to unsubscribe.'
    };
  }

  async sendSMS(smsData: SMSData): Promise<boolean> {
    try {
      switch (this.config.provider) {
        case 'twilio':
          return await this.sendViaTwilio(smsData);
        case 'vonage':
          return await this.sendViaVonage(smsData);
        default:
          throw new Error(`Unsupported SMS provider: ${this.config.provider}`);
      }
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }

  private async sendViaTwilio(smsData: SMSData): Promise<boolean> {
    // Mock implementation - in production, use actual Twilio SDK
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`;
    
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.config.apiKey}:${this.config.apiSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: smsData.to,
        From: this.config.fromNumber,
        Body: smsData.message
      })
    });

    return response.ok;
  }

  private async sendViaVonage(smsData: SMSData): Promise<boolean> {
    // Mock implementation - in production, use actual Vonage SDK
    const vonageUrl = 'https://rest.nexmo.com/sms/json';
    
    const response = await fetch(vonageUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        api_key: this.config.apiKey,
        api_secret: this.config.apiSecret,
        to: smsData.to,
        from: this.config.fromNumber,
        text: smsData.message
      })
    });

    return response.ok;
  }

  async sendBookingConfirmation(booking: Booking): Promise<boolean> {
    const message = this.templates.bookingConfirmation
      .replace('{name}', booking.clientName)
      .replace('{service}', booking.serviceType)
      .replace('{date}', new Date(booking.date).toLocaleDateString())
      .replace('{total}', (booking.payment?.totalAmount || 0).toString())
      .replace('{deposit}', (booking.payment?.depositAmount || 0).toString());

    return this.sendSMS({
      to: booking.phone,
      message,
      priority: 'normal'
    });
  }

  async sendPaymentReminder(booking: Booking, invoice?: Invoice): Promise<boolean> {
    const daysUntilEvent = Math.ceil((new Date(booking.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const remaining = (booking.payment?.totalAmount || 0) - (booking.payment?.paidAmount || 0);
    
    const template = daysUntilEvent <= 3 ? this.templates.urgentReminder : this.templates.paymentReminder;
    
    const message = template
      .replace('{name}', booking.clientName)
      .replace('{service}', booking.serviceType)
      .replace('{date}', new Date(booking.date).toLocaleDateString())
      .replace('{remaining}', remaining.toString())
      .replace('{days}', daysUntilEvent.toString());

    return this.sendSMS({
      to: booking.phone,
      message,
      priority: daysUntilEvent <= 3 ? 'high' : 'normal'
    });
  }

  async sendStatusUpdate(booking: Booking, status: string): Promise<boolean> {
    const message = this.templates.statusUpdate
      .replace('{name}', booking.clientName)
      .replace('{service}', booking.serviceType)
      .replace('{status}', status);

    return this.sendSMS({
      to: booking.phone,
      message,
      priority: 'normal'
    });
  }

  async sendUrgentReminder(booking: Booking): Promise<boolean> {
    const daysUntilEvent = Math.ceil((new Date(booking.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    const message = this.templates.urgentReminder
      .replace('{name}', booking.clientName)
      .replace('{service}', booking.serviceType)
      .replace('{date}', new Date(booking.date).toLocaleDateString())
      .replace('{days}', daysUntilEvent.toString());

    return this.sendSMS({
      to: booking.phone,
      message,
      priority: 'high'
    });
  }

  async verifyConnection(): Promise<boolean> {
    try {
      // Mock verification - in production, make a test API call
      return true;
    } catch (error) {
      console.error('SMS service connection failed:', error);
      return false;
    }
  }

  setTemplates(templates: Partial<SMSTemplate>): void {
    this.templates = { ...this.templates, ...templates };
  }

  validatePhoneNumber(phone: string): boolean {
    // Basic US phone number validation
    const phoneRegex = /^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
    return phoneRegex.test(phone);
  }

  formatPhoneNumber(phone: string): string {
    // Format to E.164 for SMS sending
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    return phone;
  }
}
