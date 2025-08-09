import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PayPalService } from '../services/paypal.service';
import { Booking } from '../models/booking.model';
import { Invoice } from '../models/invoice.model';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Initialize PayPal service
const paypalService = new PayPalService({
  clientId: process.env.PAYPAL_CLIENT_ID || '',
  clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
  environment: (process.env.PAYPAL_ENVIRONMENT as 'sandbox' | 'live') || 'sandbox'
});

// Validation middleware
const validateCreateInvoice = [
  body('bookingId').isMongoId().withMessage('Valid booking ID is required'),
  body('totalAmount').isFloat({ min: 0 }).withMessage('Total amount must be a positive number'),
  body('depositAmount').isFloat({ min: 0 }).withMessage('Deposit amount must be a positive number'),
  body('serviceType').notEmpty().withMessage('Service type is required'),
  body('date').isISO8601().withMessage('Valid date is required')
];

const validateWebhook = [
  body('event_type').notEmpty().withMessage('Event type is required'),
  body('resource').isObject().withMessage('Resource data is required')
];

// Create PayPal invoice for booking
router.post('/create-invoice', authenticateToken, requireAdmin, validateCreateInvoice, async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId, totalAmount, depositAmount, serviceType, date } = req.body;

    // Validate deposit amount
    paypalService.validateDeposit({ totalAmount, depositAmount });

    // Get booking details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Create PayPal invoice
    const paypalInvoice = await paypalService.createInvoice({
      id: bookingId,
      clientName: booking.clientName,
      email: booking.email,
      totalAmount,
      depositAmount,
      serviceType,
      date: new Date(date)
    });

    // Create local invoice record
    const invoice = new Invoice({
      bookingId,
      paypalInvoiceId: paypalInvoice.id,
      amount: totalAmount,
      depositAmount,
      dueDate: new Date(date),
      paymentMethod: 'paypal'
    });

    await invoice.save();

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice: {
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        paypalInvoiceId: paypalInvoice.id,
        amount: totalAmount,
        depositAmount,
        status: invoice.status
      }
    });
  } catch (error) {
    console.error('Invoice creation error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Send invoice to client
router.post('/send-invoice/:invoiceId', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (!invoice.paypalInvoiceId) {
      return res.status(400).json({ error: 'PayPal invoice ID not found' });
    }

    // Send invoice via PayPal
    await paypalService.sendInvoice(invoice.paypalInvoiceId);

    // Update local invoice status
    invoice.status = 'sent';
    await invoice.save();

    res.json({
      message: 'Invoice sent successfully',
      invoice: {
        id: invoice._id,
        status: invoice.status,
        sentAt: new Date()
      }
    });
  } catch (error) {
    console.error('Invoice send error:', error);
    res.status(500).json({ error: 'Failed to send invoice' });
  }
});

// Process PayPal webhook
router.post('/webhook', validateWebhook, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const webhookResult = await paypalService.processWebhook(req.body);

    // Handle different webhook events
    switch (webhookResult.type) {
      case 'payment_completed':
        // Update booking payment status
        const booking = await Booking.findOne({ 'payment.paypalPaymentId': webhookResult.paymentId });
        if (booking) {
          booking.payment.status = 'paid';
          booking.payment.paidAmount = webhookResult.amount || 0;
          booking.payment.paidDate = new Date();
          await booking.save();
        }
        break;

      case 'invoice_paid':
        // Update invoice status
        const invoice = await Invoice.findOne({ paypalPaymentId: webhookResult.paymentId });
        if (invoice) {
          invoice.status = 'paid';
          invoice.paidDate = new Date();
          await invoice.save();
        }
        break;
    }

    res.json({ message: 'Webhook processed successfully', result: webhookResult });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Get payment status
router.get('/status/:paymentId', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId } = req.params;
    const paymentResult = await paypalService.processPayment(paymentId);
    
    res.json({
      paymentId: paymentResult.paymentId,
      status: paymentResult.status,
      amount: paymentResult.amount
    });
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
});

// Get invoice status
router.get('/invoice/:invoiceId', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await Invoice.findById(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    let paypalStatus = null;
    if (invoice.paypalInvoiceId) {
      try {
        const paypalInvoice = await paypalService.getInvoiceStatus(invoice.paypalInvoiceId);
        paypalStatus = paypalInvoice.status;
      } catch (error) {
        console.error('PayPal invoice status error:', error);
      }
    }

    res.json({
      invoice: {
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        depositAmount: invoice.depositAmount,
        status: invoice.status,
        paypalStatus,
        dueDate: invoice.dueDate,
        paidDate: invoice.paidDate
      }
    });
  } catch (error) {
    console.error('Invoice status error:', error);
    res.status(500).json({ error: 'Failed to get invoice status' });
  }
});

// Get all invoices for a booking
router.get('/invoices/:bookingId', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    const invoices = await Invoice.find({ bookingId }).sort({ createdAt: -1 });
    
    res.json({
      invoices: invoices.map(invoice => ({
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        depositAmount: invoice.depositAmount,
        status: invoice.status,
        dueDate: invoice.dueDate,
        paidDate: invoice.paidDate,
        paymentMethod: invoice.paymentMethod
      }))
    });
  } catch (error) {
    console.error('Invoices fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Update payment method (for manual payments)
router.patch('/payment-method/:bookingId', authenticateToken, requireAdmin, [
  body('method').isIn(['paypal', 'cash', 'other']).withMessage('Valid payment method is required'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId } = req.params;
    const { method, notes } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    booking.payment.method = method;
    if (notes) {
      booking.specialRequirements = notes;
    }

    await booking.save();

    res.json({
      message: 'Payment method updated successfully',
      booking: {
        id: booking._id,
        paymentMethod: booking.payment.method
      }
    });
  } catch (error) {
    console.error('Payment method update error:', error);
    res.status(500).json({ error: 'Failed to update payment method' });
  }
});

export const paymentRoutes = router; 