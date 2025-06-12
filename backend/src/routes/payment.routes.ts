import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Booking } from '../models/booking.model';
import { sendPaymentReminder } from '../services/email.service';
import Stripe from 'stripe';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

// Create payment intent for deposit
router.post('/deposit/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'approved') {
      return res.status(400).json({ message: 'Booking must be approved before payment' });
    }

    if (booking.depositPaid) {
      return res.status(400).json({ message: 'Deposit already paid' });
    }

    // Calculate deposit amount (25% of total)
    const totalAmount = calculateTotalAmount(booking);
    const depositAmount = Math.round(totalAmount * 0.25);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: depositAmount,
      currency: 'inr',
      metadata: {
        bookingId: booking._id.toString(),
        paymentType: 'deposit'
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: depositAmount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating payment intent' });
  }
});

// Create payment intent for final payment
router.post('/final/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!booking.depositPaid) {
      return res.status(400).json({ message: 'Deposit must be paid first' });
    }

    if (booking.fullPaymentPaid) {
      return res.status(400).json({ message: 'Full payment already paid' });
    }

    // Calculate remaining amount (75% of total)
    const totalAmount = calculateTotalAmount(booking);
    const remainingAmount = Math.round(totalAmount * 0.75);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: remainingAmount,
      currency: 'inr',
      metadata: {
        bookingId: booking._id.toString(),
        paymentType: 'final'
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: remainingAmount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating payment intent' });
  }
});

// Webhook to handle successful payments
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig || '',
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const { bookingId, paymentType } = paymentIntent.metadata;

    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      if (paymentType === 'deposit') {
        booking.depositPaid = true;
        await booking.save();
      } else if (paymentType === 'final') {
        booking.fullPaymentPaid = true;
        await booking.save();
      }

      // Send payment confirmation email
      await sendPaymentReminder(booking);
    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).json({ message: 'Error processing payment' });
    }
  }

  res.json({ received: true });
});

// Helper function to calculate total amount
function calculateTotalAmount(booking: any): number {
  // Base rate per guard per hour
  const baseRate = 1000; // ₹1000 per guard per hour
  const hours = 8; // Assuming 8-hour shifts
  return booking.numberOfGuards * baseRate * hours;
}

export const paymentRoutes = router; 