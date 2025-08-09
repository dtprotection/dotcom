import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoice extends Document {
  bookingId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  paypalInvoiceId?: string;
  amount: number;
  depositAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidDate?: Date;
  paymentMethod: 'paypal' | 'cash' | 'other';
  paypalPaymentId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>({
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  paypalInvoiceId: {
    type: String,
    sparse: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  depositAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['paypal', 'cash', 'other'],
    default: 'paypal'
  },
  paypalPaymentId: {
    type: String,
    sparse: true
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Generate invoice number
invoiceSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoiceNumber) {
    const count = await this.constructor.countDocuments();
    this.invoiceNumber = `INV-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Update booking payment status when invoice is paid
invoiceSchema.post('save', async function(doc) {
  if (doc.status === 'paid' && doc.isModified('status')) {
    const Booking = mongoose.model('Booking');
    await Booking.findByIdAndUpdate(doc.bookingId, {
      $set: {
        'payment.status': 'paid',
        'payment.paidAmount': doc.amount,
        'payment.paidDate': doc.paidDate || new Date()
      }
    });
  }
});

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
