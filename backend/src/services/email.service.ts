import nodemailer from 'nodemailer';
import { IBooking } from '../models/booking.model';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendBookingConfirmation = async (booking: IBooking): Promise<void> => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: booking.email,
    subject: 'DT Protection - Booking Confirmation',
    html: `
      <h1>Booking Confirmation</h1>
      <p>Dear ${booking.clientName},</p>
      <p>Thank you for choosing DT Protection for your security needs. We have received your booking request for:</p>
      <ul>
        <li>Event Date: ${booking.eventDate.toLocaleDateString()}</li>
        <li>Event Type: ${booking.eventType}</li>
        <li>Venue: ${booking.venueAddress}</li>
        <li>Number of Guards: ${booking.numberOfGuards}</li>
      </ul>
      <p>Your booking is currently pending approval. Once approved, you will receive a payment link for the 25% deposit.</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>DT Protection Team</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

export const sendPaymentReminder = async (booking: IBooking): Promise<void> => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: booking.email,
    subject: 'DT Protection - Payment Reminder',
    html: `
      <h1>Payment Reminder</h1>
      <p>Dear ${booking.clientName},</p>
      <p>This is a reminder that your event is approaching, and the remaining balance for your security services is due.</p>
      <p>Event Details:</p>
      <ul>
        <li>Event Date: ${booking.eventDate.toLocaleDateString()}</li>
        <li>Event Type: ${booking.eventType}</li>
        <li>Venue: ${booking.venueAddress}</li>
      </ul>
      <p>Please ensure the remaining payment is made before the event date.</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>DT Protection Team</p>
    `
  };

  await transporter.sendMail(mailOptions);
}; 