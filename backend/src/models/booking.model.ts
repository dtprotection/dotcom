import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  clientName: string;
  email: string;
  phone: string;
  eventDate: Date;
  eventType: string;
  venueAddress: string;
  numberOfGuards: number;
  specialRequirements?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  depositPaid: boolean;
  fullPaymentPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  clientName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  eventDate: { type: Date, required: true },
  eventType: { type: String, required: true },
  venueAddress: { type: String, required: true },
  numberOfGuards: { type: Number, required: true, min: 1 },
  specialRequirements: { type: String },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  depositPaid: { type: Boolean, default: false },
  fullPaymentPaid: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Add validation to ensure event date is at least 7 days in the future
bookingSchema.pre('save', function(next) {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  
  if (this.eventDate < sevenDaysFromNow) {
    next(new Error('Event date must be at least 7 days in the future'));
  }
  next();
});

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema); 