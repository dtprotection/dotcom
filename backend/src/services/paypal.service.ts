import paypal from '@paypal/paypal-server-sdk';
import { Invoice } from '../models/invoice.model';
import { Booking } from '../models/booking.model';

interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'live';
}

interface BookingData {
  id: string;
  clientName: string;
  email: string;
  totalAmount: number;
  depositAmount: number;
  serviceType: string;
  date: Date;
}

interface PaymentResult {
  paymentId: string;
  status: string;
  amount: number;
}

interface WebhookResult {
  type: string;
  paymentId?: string;
  bookingId?: string;
  amount?: number;
  message?: string;
}

export class PayPalService {
  private client: paypal.core.PayPalHttpClient;

  constructor(config: PayPalConfig) {
    const environment = config.environment === 'live' 
      ? new paypal.core.LiveEnvironment(config.clientId, config.clientSecret)
      : new paypal.core.SandboxEnvironment(config.clientId, config.clientSecret);
    
    this.client = new paypal.core.PayPalHttpClient(environment);
  }

  async createInvoice(bookingData: BookingData): Promise<any> {
    try {
      const request = new paypal.invoices.InvoicesCreateRequest();
      request.requestBody({
        detail: {
          currency_code: 'USD',
          note: `Invoice for ${bookingData.serviceType} service`,
          terms_and_conditions: 'Payment due within 30 days'
        },
        invoicer: {
          name: {
            given_name: 'DT Protection',
            surname: 'Services'
          },
          email_address: 'admin@dtprotection.com',
          phone_contacts: [
            {
              phone_number_details: {
                national_number: '5551234567'
              }
            }
          ]
        },
        primary_recipients: [
          {
            billing_info: {
              name: {
                given_name: bookingData.clientName.split(' ')[0],
                surname: bookingData.clientName.split(' ').slice(1).join(' ')
              },
              email_address: bookingData.email
            }
          }
        ],
        items: [
          {
            name: bookingData.serviceType,
            quantity: '1',
            unit_amount: {
              currency_code: 'USD',
              value: bookingData.totalAmount.toString()
            }
          }
        ],
        configuration: {
          partial_payment: {
            allow_partial_payment: true,
            minimum_amount_due: {
              currency_code: 'USD',
              value: bookingData.depositAmount.toString()
            }
          }
        }
      });

      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      console.error('PayPal invoice creation error:', error);
      throw new Error('Failed to create PayPal invoice');
    }
  }

  async sendInvoice(invoiceId: string): Promise<any> {
    try {
      const request = new paypal.invoices.InvoicesSendRequest(invoiceId);
      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      console.error('PayPal invoice send error:', error);
      throw new Error('Failed to send PayPal invoice');
    }
  }

  async processPayment(paymentId: string): Promise<PaymentResult> {
    try {
      const request = new paypal.orders.OrdersGetRequest(paymentId);
      const response = await this.client.execute(request);
      const order = response.result;
      
      return {
        paymentId: order.id,
        status: order.status,
        amount: parseFloat(order.purchase_units[0].amount.value)
      };
    } catch (error) {
      console.error('PayPal payment processing error:', error);
      throw new Error('Failed to process PayPal payment');
    }
  }

  validateDeposit(booking: { totalAmount: number; depositAmount: number }): void {
    const minDeposit = booking.totalAmount * 0.25;
    if (booking.depositAmount < minDeposit || booking.totalAmount <= 0) {
      throw new Error('Deposit must be at least 25% of total amount');
    }
  }

  async processWebhook(webhookData: any): Promise<WebhookResult> {
    try {
      const eventType = webhookData.event_type;
      const resource = webhookData.resource;

      switch (eventType) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          return {
            type: 'payment_completed',
            paymentId: resource.id,
            amount: parseFloat(resource.amount.value),
            message: 'Payment completed successfully'
          };
        
        case 'INVOICE.PAID':
          return {
            type: 'invoice_paid',
            paymentId: resource.id,
            amount: parseFloat(resource.total_amount.value),
            message: 'Invoice paid successfully'
          };
        
        default:
          return {
            type: 'unknown',
            message: `Unhandled event type: ${eventType}`
          };
      }
    } catch (error) {
      console.error('Webhook processing error:', error);
      throw new Error('Failed to process webhook');
    }
  }

  async getInvoiceStatus(invoiceId: string): Promise<any> {
    try {
      const request = new paypal.invoices.InvoicesGetRequest(invoiceId);
      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      console.error('PayPal invoice status error:', error);
      throw new Error('Failed to get invoice status');
    }
  }

  async getInvoice(invoiceId: string): Promise<any> {
    try {
      const request = new paypal.invoices.InvoicesGetRequest(invoiceId);
      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      console.error('PayPal invoice retrieval error:', error);
      throw new Error('Failed to get invoice');
    }
  }

  getSupportedPaymentMethods(): string[] {
    return ['paypal', 'credit_card', 'debit_card', 'bank_transfer'];
  }

  isValidPaymentMethod(method: string): boolean {
    return this.getSupportedPaymentMethods().includes(method);
  }

  calculatePaymentSchedule(totalAmount: number, depositPercentage: number = 0.25) {
    const depositAmount = Math.round(totalAmount * depositPercentage * 100) / 100;
    const finalPaymentAmount = Math.round((totalAmount - depositAmount) * 100) / 100;
    
    return {
      totalAmount,
      depositAmount,
      finalPaymentAmount,
      depositPercentage,
      paymentSchedule: [
        {
          type: 'deposit',
          amount: depositAmount,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        },
        {
          type: 'final',
          amount: finalPaymentAmount,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
      ]
    };
  }

  generatePaymentReminder(booking: any) {
    const daysUntilEvent = Math.ceil((new Date(booking.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    return {
      subject: `Payment Reminder - ${booking.serviceType}`,
      message: `Dear ${booking.clientName},\n\nThis is a reminder that your payment of $${booking.payment.totalAmount} for ${booking.serviceType} is due.\n\nEvent Date: ${new Date(booking.date).toLocaleDateString()}\nDays until event: ${daysUntilEvent}\n\nPlease complete your payment to confirm your booking.\n\nBest regards,\nDT Protection Services`,
      urgency: daysUntilEvent <= 7 ? 'high' : daysUntilEvent <= 14 ? 'medium' : 'low'
    };
  }
}
