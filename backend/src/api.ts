import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { bookingRoutes } from './routes/booking.routes';
import { paymentRoutes } from './routes/payment.routes';
import { communicationRoutes } from './routes/communication.routes';
import { adminRoutes } from './routes/admin.routes';
import dashboardRoutes from './routes/dashboard.routes';
import clientRoutes from './routes/client.routes';
import { errorHandler } from './middleware/error.middleware';

// Load environment variables
dotenv.config();

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.warn('⚠️  MONGODB_URI not set - database features will not work');
      return;
    }
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // Don't exit process - allow app to start even if DB fails
    // This allows UI to be visible for initial deployment
    console.warn('⚠️  Continuing without database connection');
  }
};

// Connect to MongoDB (non-blocking)
connectDB();

/**
 * Creates and configures the Express API app
 * This is used by the custom Next.js server
 */
export function createApiApp() {
  const app = express();

  // CORS configuration - relaxed for same-origin in monolith
  const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL || 'https://dtprotection.com'
      : true, // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  };

  // Middleware
  app.use(cors(corsOptions));
  app.use(helmet({
    contentSecurityPolicy: false, // Next.js handles CSP
  }));
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/communication', communicationRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/client', clientRoutes);

  // Error handling
  app.use(errorHandler);

  return app;
}

