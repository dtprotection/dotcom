# DT Protection Backend

This is the backend service for DT Protection's security services booking system. It handles booking management, payment processing, and email notifications.

## Features

- Booking management system
- Payment processing with Stripe
- Email notifications for bookings and payments
- Admin dashboard for managing bookings
- Secure API endpoints

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- SMTP server for email notifications
- Stripe account for payment processing

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/dtprotection

   # Email Configuration
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@example.com
   SMTP_PASS=your-email-password
   SMTP_FROM=noreply@dtprotection.com

   # Stripe Configuration
   STRIPE_SECRET_KEY=your-stripe-secret-key
   STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

   # JWT Configuration (for future admin authentication)
   JWT_SECRET=your-jwt-secret
   JWT_EXPIRES_IN=7d
   ```

3. Build the TypeScript code:
   ```bash
   npm run build
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Bookings

- `POST /api/bookings` - Create a new booking
- `GET /api/bookings` - Get all bookings (admin only)
- `GET /api/bookings/:id` - Get a single booking
- `PATCH /api/bookings/:id/status` - Update booking status (admin only)

### Payments

- `POST /api/payments/deposit/:bookingId` - Create payment intent for deposit
- `POST /api/payments/final/:bookingId` - Create payment intent for final payment
- `POST /api/payments/webhook` - Stripe webhook endpoint

## Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript code
- `npm run test` - Run tests
- `npm run start` - Start production server

## Security

- All API endpoints are protected with appropriate middleware
- Input validation using express-validator
- Secure payment processing with Stripe
- Email notifications for important events
- Rate limiting and CORS protection

## Future Enhancements

- Admin authentication and authorization
- E-commerce integration for merchandise
- Analytics dashboard
- Automated scheduling system
- Mobile app integration 