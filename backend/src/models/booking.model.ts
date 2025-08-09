import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  clientName: string;
  email: string;
  phone: string;
  serviceType: string;
  date: Date;
  venueAddress?: string;
  numberOfGuards?: number;
  specialRequirements?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  payment: {
    totalAmount: number;
    depositAmount: number;
    status: 'pending' | 'partial' | 'paid' | 'overdue';
    paidAmount: number;
    paidDate?: Date;
    method: 'paypal' | 'cash' | 'other';
    paypalPaymentId?: string;
  };
  communicationPreferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    preferredContact: 'email' | 'phone' | 'both';
  };
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  clientName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  serviceType: { type: String, required: true },
  date: { type: Date, required: true },
  venueAddress: { type: String },
  numberOfGuards: { type: Number, min: 1 },
  specialRequirements: { type: String },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  payment: {
    totalAmount: { type: Number, required: true, min: 0 },
    depositAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'overdue'],
      default: 'pending'
    },
    paidAmount: { type: Number, default: 0 },
    paidDate: { type: Date },
    method: {
      type: String,
      enum: ['paypal', 'cash', 'other'],
      default: 'paypal'
    },
    paypalPaymentId: { type: String }
  },
  communicationPreferences: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    preferredContact: {
      type: String,
      enum: ['email', 'phone', 'both'],
      default: 'email'
    }
  }
}, {
  timestamps: true
});

// Add validation to ensure event date is at least 7 days in the future
bookingSchema.pre('save', function(next) {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  
  if (this.date < sevenDaysFromNow) {
    next(new Error('Event date must be at least 7 days in the future'));
  }
  next();
});

// Validate deposit amount is at least 25% of total
bookingSchema.pre('save', function(next) {
  if (this.payment && this.payment.totalAmount && this.payment.depositAmount) {
    const minDeposit = this.payment.totalAmount * 0.25;
    if (this.payment.depositAmount < minDeposit) {
      next(new Error('Deposit must be at least 25% of total amount'));
    }
  }
  next();
});

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema); 