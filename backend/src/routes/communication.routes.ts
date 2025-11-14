import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { EmailService, EmailConfig } from '../services/email.service';
import { SMSService, SMSConfig } from '../services/sms.service';
import { Booking } from '../models/booking.model';
import { Invoice } from '../models/invoice.model';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Initialize services
const emailService = new EmailService({
  provider: (process.env.EMAIL_PROVIDER as 'sendgrid' | 'resend' | 'mailgun' | 'smtp') || 'mailgun',
  apiKey: process.env.EMAIL_API_KEY,
  fromEmail: process.env.EMAIL_FROM || 'admin@dtprotection.com',
  fromName: process.env.EMAIL_FROM_NAME || 'DT Protection Services',
  smtpConfig: (process.env.EMAIL_PROVIDER === 'smtp' || process.env.EMAIL_PROVIDER === 'mailgun' || !process.env.EMAIL_PROVIDER) ? {
    host: process.env.MAILGUN_SMTP_SERVER || process.env.SMTP_HOST || 'smtp.mailgun.org',
    port: parseInt(process.env.MAILGUN_SMTP_PORT || process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.MAILGUN_SMTP_LOGIN || process.env.SMTP_USER || '',
      pass: process.env.MAILGUN_SMTP_PASSWORD || process.env.SMTP_PASS || ''
    }
  } : undefined
});

const smsService = new SMSService({
  provider: (process.env.SMS_PROVIDER as 'twilio' | 'vonage') || 'twilio',
  apiKey: process.env.SMS_API_KEY || '',
  apiSecret: process.env.SMS_API_SECRET || '',
  fromNumber: process.env.SMS_FROM_NUMBER || '',
  accountSid: process.env.TWILIO_ACCOUNT_SID
});

// Validation middleware
const validateBookingId = [
  body('bookingId').isMongoId().withMessage('Valid booking ID is required')
];

const validateCustomMessage = [
  body('to').isEmail().withMessage('Valid email is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required')
];

const validateSMSMessage = [
  body('to').matches(/^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/).withMessage('Valid phone number is required'),
  body('message').notEmpty().withMessage('Message is required')
];

// Send booking confirmation email
router.post('/email/booking-confirmation', authenticateToken, requireAdmin, validateBookingId, async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const success = await emailService.sendBookingConfirmation(booking);
    
    if (success) {
      res.json({ message: 'Booking confirmation email sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send booking confirmation email' });
    }
  } catch (error) {
    console.error('Booking confirmation email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send payment reminder email
router.post('/email/payment-reminder', authenticateToken, requireAdmin, validateBookingId, async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId, invoiceId } = req.body;
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    let invoice = undefined;
    if (invoiceId) {
      invoice = await Invoice.findById(invoiceId);
    }

    const success = await emailService.sendPaymentReminder(booking, invoice);
    
    if (success) {
      res.json({ message: 'Payment reminder email sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send payment reminder email' });
    }
  } catch (error) {
    console.error('Payment reminder email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send invoice notification email
router.post('/email/invoice-notification', authenticateToken, requireAdmin, [
  ...validateBookingId,
  body('invoiceId').isMongoId().withMessage('Valid invoice ID is required')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId, invoiceId } = req.body;
    const booking = await Booking.findById(bookingId);
    const invoice = await Invoice.findById(invoiceId);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const success = await emailService.sendInvoiceNotification(booking, invoice);
    
    if (success) {
      res.json({ message: 'Invoice notification email sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send invoice notification email' });
    }
  } catch (error) {
    console.error('Invoice notification email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send status update email
router.post('/email/status-update', authenticateToken, requireAdmin, [
  ...validateBookingId,
  body('status').isIn(['approved', 'rejected', 'completed', 'cancelled']).withMessage('Valid status is required')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId, status } = req.body;
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const success = await emailService.sendStatusUpdate(booking, status);
    
    if (success) {
      res.json({ message: 'Status update email sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send status update email' });
    }
  } catch (error) {
    console.error('Status update email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send custom email
router.post('/email/custom', authenticateToken, requireAdmin, validateCustomMessage, async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { to, toName, subject, message, html } = req.body;

    const success = await emailService.sendEmail({
      to,
      toName,
      template: {
        subject,
        html: html || message,
        text: message
      }
    });
    
    if (success) {
      res.json({ message: 'Custom email sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send custom email' });
    }
  } catch (error) {
    console.error('Custom email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send booking confirmation SMS
router.post('/sms/booking-confirmation', authenticateToken, requireAdmin, validateBookingId, async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const success = await smsService.sendBookingConfirmation(booking);
    
    if (success) {
      res.json({ message: 'Booking confirmation SMS sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send booking confirmation SMS' });
    }
  } catch (error) {
    console.error('Booking confirmation SMS error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send payment reminder SMS
router.post('/sms/payment-reminder', authenticateToken, requireAdmin, validateBookingId, async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId, invoiceId } = req.body;
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    let invoice = undefined;
    if (invoiceId) {
      invoice = await Invoice.findById(invoiceId);
    }

    const success = await smsService.sendPaymentReminder(booking, invoice);
    
    if (success) {
      res.json({ message: 'Payment reminder SMS sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send payment reminder SMS' });
    }
  } catch (error) {
    console.error('Payment reminder SMS error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send status update SMS
router.post('/sms/status-update', authenticateToken, requireAdmin, [
  ...validateBookingId,
  body('status').isIn(['approved', 'rejected', 'completed', 'cancelled']).withMessage('Valid status is required')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId, status } = req.body;
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const success = await smsService.sendStatusUpdate(booking, status);
    
    if (success) {
      res.json({ message: 'Status update SMS sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send status update SMS' });
    }
  } catch (error) {
    console.error('Status update SMS error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send urgent reminder SMS
router.post('/sms/urgent-reminder', authenticateToken, requireAdmin, validateBookingId, async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const success = await smsService.sendUrgentReminder(booking);
    
    if (success) {
      res.json({ message: 'Urgent reminder SMS sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send urgent reminder SMS' });
    }
  } catch (error) {
    console.error('Urgent reminder SMS error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send custom SMS
router.post('/sms/custom', authenticateToken, requireAdmin, validateSMSMessage, async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { to, message, priority } = req.body;

    const success = await smsService.sendSMS({
      to: smsService.formatPhoneNumber(to),
      message,
      priority: priority || 'normal'
    });
    
    if (success) {
      res.json({ message: 'Custom SMS sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send custom SMS' });
    }
  } catch (error) {
    console.error('Custom SMS error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test email service connection
router.get('/email/test-connection', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const isConnected = await emailService.verifyConnection();
    
    if (isConnected) {
      res.json({ message: 'Email service connection successful' });
    } else {
      res.status(500).json({ error: 'Email service connection failed' });
    }
  } catch (error) {
    console.error('Email connection test error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test SMS service connection
router.get('/sms/test-connection', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const isConnected = await smsService.verifyConnection();
    
    if (isConnected) {
      res.json({ message: 'SMS service connection successful' });
    } else {
      res.status(500).json({ error: 'SMS service connection failed' });
    }
  } catch (error) {
    console.error('SMS connection test error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get communication preferences for a booking
router.get('/preferences/:bookingId', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).select('communicationPreferences');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ preferences: booking.communicationPreferences });
  } catch (error) {
    console.error('Get communication preferences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update communication preferences for a booking
router.patch('/preferences/:bookingId', authenticateToken, requireAdmin, [
  body('emailNotifications').optional().isBoolean(),
  body('smsNotifications').optional().isBoolean(),
  body('preferredContact').optional().isIn(['email', 'phone', 'both'])
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId } = req.params;
    const updates = req.body;

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { $set: { communicationPreferences: updates } },
      { new: true }
    ).select('communicationPreferences');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ preferences: booking.communicationPreferences });
  } catch (error) {
    console.error('Update communication preferences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const communicationRoutes = router;
