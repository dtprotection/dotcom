import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Booking } from '../models/booking.model';
import { sendBookingConfirmation } from '../services/email.service';

const router = Router();

// Validation middleware
const validateBooking = [
  body('clientName').trim().notEmpty().withMessage('Client name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('eventDate').isISO8601().withMessage('Valid event date is required'),
  body('eventType').trim().notEmpty().withMessage('Event type is required'),
  body('venueAddress').trim().notEmpty().withMessage('Venue address is required'),
  body('numberOfGuards').isInt({ min: 1 }).withMessage('Number of guards must be at least 1'),
  body('specialRequirements').optional().trim()
];

// Create a new booking
router.post('/', validateBooking, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const booking = new Booking(req.body);
    await booking.save();

    // Send confirmation email
    await sendBookingConfirmation(booking);

    res.status(201).json(booking);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred' });
    }
  }
});

// Get all bookings (admin only)
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ eventDate: 1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// Get a single booking
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching booking' });
  }
});

// Update booking status (admin only)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking status' });
  }
});

export const bookingRoutes = router; 