import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../backend/src/index'

// Mock mongoose
vi.mock('mongoose', () => ({
  default: {
    model: vi.fn(),
    Types: {
      ObjectId: vi.fn((id) => id)
    }
  }
}))

// Mock models
const mockBooking = {
  _id: '507f1f77bcf86cd799439011',
  clientName: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  serviceType: 'Event Security',
  date: new Date('2024-12-25'),
  venueAddress: '123 Main St',
  numberOfGuards: 4,
  payment: {
    totalAmount: 2000,
    depositAmount: 500,
    paidAmount: 0,
    status: 'pending',
    method: 'paypal'
  },
  communicationPreferences: {
    emailNotifications: true,
    smsNotifications: false,
    preferredContact: 'email'
  }
}

const mockInvoice = {
  _id: '507f1f77bcf86cd799439012',
  invoiceNumber: 'INV-000001',
  amount: 2000,
  depositAmount: 500,
  status: 'sent',
  dueDate: new Date('2024-12-20'),
  paymentMethod: 'paypal'
}

const mockAdmin = {
  _id: '507f1f77bcf86cd799439013',
  username: 'admin',
  email: 'admin@dtprotection.com',
  role: 'admin',
  isActive: true
}

// Mock JWT token
const mockToken = 'mock-jwt-token'

// Mock services
vi.mock('../backend/src/services/email.service', () => ({
  EmailService: vi.fn().mockImplementation(() => ({
    sendBookingConfirmation: vi.fn().mockResolvedValue(true),
    sendPaymentReminder: vi.fn().mockResolvedValue(true),
    sendInvoiceNotification: vi.fn().mockResolvedValue(true),
    sendStatusUpdate: vi.fn().mockResolvedValue(true),
    sendEmail: vi.fn().mockResolvedValue(true),
    verifyConnection: vi.fn().mockResolvedValue(true)
  }))
}))

vi.mock('../backend/src/services/sms.service', () => ({
  SMSService: vi.fn().mockImplementation(() => ({
    sendBookingConfirmation: vi.fn().mockResolvedValue(true),
    sendPaymentReminder: vi.fn().mockResolvedValue(true),
    sendStatusUpdate: vi.fn().mockResolvedValue(true),
    sendUrgentReminder: vi.fn().mockResolvedValue(true),
    sendSMS: vi.fn().mockResolvedValue(true),
    verifyConnection: vi.fn().mockResolvedValue(true),
    validatePhoneNumber: vi.fn().mockReturnValue(true),
    formatPhoneNumber: vi.fn().mockImplementation((phone) => phone)
  }))
}))

// Mock models
const Booking = {
  findById: vi.fn(),
  findByIdAndUpdate: vi.fn()
}

const Invoice = {
  findById: vi.fn()
}

const Admin = {
  findById: vi.fn()
}

vi.mock('../backend/src/models/booking.model', () => ({
  Booking
}))

vi.mock('../backend/src/models/invoice.model', () => ({
  Invoice
}))

vi.mock('../backend/src/models/admin.model', () => ({
  Admin
}))

// Mock middleware
vi.mock('../backend/src/middleware/auth.middleware', () => ({
  authenticateToken: vi.fn((req, res, next) => {
    req.user = mockAdmin
    next()
  }),
  requireAdmin: vi.fn((req, res, next) => next())
}))

describe('Communication Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Email Routes', () => {
    describe('POST /api/communication/email/booking-confirmation', () => {
      it('should send booking confirmation email successfully', async () => {
        Booking.findById.mockResolvedValue(mockBooking)

        const response = await request(app)
          .post('/api/communication/email/booking-confirmation')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({
            bookingId: '507f1f77bcf86cd799439011'
          })

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Booking confirmation email sent successfully'
        })
        expect(Booking.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
      })

      it('should return 404 when booking not found', async () => {
        Booking.findById.mockResolvedValue(null)

        const response = await request(app)
          .post('/api/communication/email/booking-confirmation')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({
            bookingId: '507f1f77bcf86cd799439011'
          })

        expect(response.status).toBe(404)
        expect(response.body).toEqual({
          error: 'Booking not found'
        })
      })

      it('should return 400 for invalid booking ID', async () => {
        const response = await request(app)
          .post('/api/communication/email/booking-confirmation')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({
            bookingId: 'invalid-id'
          })

        expect(response.status).toBe(400)
        expect(response.body.errors).toBeDefined()
      })
    })

    describe('POST /api/communication/email/payment-reminder', () => {
      it('should send payment reminder email successfully', async () => {
        Booking.findById.mockResolvedValue(mockBooking)
        Invoice.findById.mockResolvedValue(mockInvoice)

        const response = await request(app)
          .post('/api/communication/email/payment-reminder')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({
            bookingId: '507f1f77bcf86cd799439011',
            invoiceId: '507f1f77bcf86cd799439012'
          })

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Payment reminder email sent successfully'
        })
      })

      it('should send payment reminder without invoice', async () => {
        Booking.findById.mockResolvedValue(mockBooking)

        const response = await request(app)
          .post('/api/communication/email/payment-reminder')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({
            bookingId: '507f1f77bcf86cd799439011'
          })

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Payment reminder email sent successfully'
        })
      })
    })

    describe('POST /api/communication/email/invoice-notification', () => {
      it('should send invoice notification email successfully', async () => {
        Booking.findById.mockResolvedValue(mockBooking)
        Invoice.findById.mockResolvedValue(mockInvoice)

        const response = await request(app)
          .post('/api/communication/email/invoice-notification')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({
            bookingId: '507f1f77bcf86cd799439011',
            invoiceId: '507f1f77bcf86cd799439012'
          })

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Invoice notification email sent successfully'
        })
      })

      it('should return 404 when invoice not found', async () => {
        Booking.findById.mockResolvedValue(mockBooking)
        Invoice.findById.mockResolvedValue(null)

        const response = await request(app)
          .post('/api/communication/email/invoice-notification')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({
            bookingId: '507f1f77bcf86cd799439011',
            invoiceId: '507f1f77bcf86cd799439012'
          })

        expect(response.status).toBe(404)
        expect(response.body).toEqual({
          error: 'Invoice not found'
        })
      })
    })

    describe('POST /api/communication/email/status-update', () => {
      it('should send status update email successfully', async () => {
        Booking.findById.mockResolvedValue(mockBooking)

        const response = await request(app)
          .post('/api/communication/email/status-update')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({
            bookingId: '507f1f77bcf86cd799439011',
            status: 'approved'
          })

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Status update email sent successfully'
        })
      })

      it('should return 400 for invalid status', async () => {
        const response = await request(app)
          .post('/api/communication/email/status-update')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({
            bookingId: '507f1f77bcf86cd799439011',
            status: 'invalid-status'
          })

        expect(response.status).toBe(400)
        expect(response.body.errors).toBeDefined()
      })
    })

    describe('POST /api/communication/email/custom', () => {
      it('should send custom email successfully', async () => {
        const response = await request(app)
          .post('/api/communication/email/custom')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({
            to: 'test@example.com',
            subject: 'Test Subject',
            message: 'Test message'
          })

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Custom email sent successfully'
        })
      })

      it('should return 400 for invalid email', async () => {
        const response = await request(app)
          .post('/api/communication/email/custom')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({
            to: 'invalid-email',
            subject: 'Test Subject',
            message: 'Test message'
          })

        expect(response.status).toBe(400)
        expect(response.body.errors).toBeDefined()
      })
    })
  })

  describe('SMS Routes', () => {
    describe('POST /api/communication/sms/booking-confirmation', () => {
      it('should send booking confirmation SMS successfully', async () => {
        Booking.findById.mockResolvedValue(mockBooking)

        const response = await request(app)
          .post('/api/communication/sms/booking-confirmation')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({
            bookingId: '507f1f77bcf86cd799439011'
          })

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Booking confirmation SMS sent successfully'
        })
      })
    })

    describe('POST /api/communication/sms/payment-reminder', () => {
      it('should send payment reminder SMS successfully', async () => {
        Booking.findById.mockResolvedValue(mockBooking)

        const response = await request(app)
          .post('/api/communication/sms/payment-reminder')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({
            bookingId: '507f1f77bcf86cd799439011'
          })

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Payment reminder SMS sent successfully'
        })
      })
    })

    describe('POST /api/communication/sms/status-update', () => {
      it('should send status update SMS successfully', async () => {
        Booking.findById.mockResolvedValue(mockBooking)

        const response = await request(app)
          .post('/api/communication/sms/status-update')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({
            bookingId: '507f1f77bcf86cd799439011',
            status: 'approved'
          })

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Status update SMS sent successfully'
        })
      })
    })

    describe('POST /api/communication/sms/urgent-reminder', () => {
      it('should send urgent reminder SMS successfully', async () => {
        Booking.findById.mockResolvedValue(mockBooking)

        const response = await request(app)
          .post('/api/communication/sms/urgent-reminder')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({
            bookingId: '507f1f77bcf86cd799439011'
          })

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Urgent reminder SMS sent successfully'
        })
      })
    })

    describe('POST /api/communication/sms/custom', () => {
      it('should send custom SMS successfully', async () => {
        const response = await request(app)
          .post('/api/communication/sms/custom')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({
            to: '+1234567890',
            message: 'Test SMS message'
          })

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Custom SMS sent successfully'
        })
      })

      it('should return 400 for invalid phone number', async () => {
        const response = await request(app)
          .post('/api/communication/sms/custom')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({
            to: 'invalid-phone',
            message: 'Test SMS message'
          })

        expect(response.status).toBe(400)
        expect(response.body.errors).toBeDefined()
      })
    })
  })

  describe('Connection Test Routes', () => {
    describe('GET /api/communication/email/test-connection', () => {
      it('should test email connection successfully', async () => {
        const response = await request(app)
          .get('/api/communication/email/test-connection')
          .set('Authorization', `Bearer ${mockToken}`)

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Email service connection successful'
        })
      })
    })

    describe('GET /api/communication/sms/test-connection', () => {
      it('should test SMS connection successfully', async () => {
        const response = await request(app)
          .get('/api/communication/sms/test-connection')
          .set('Authorization', `Bearer ${mockToken}`)

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'SMS service connection successful'
        })
      })
    })
  })

  describe('Communication Preferences Routes', () => {
    describe('GET /api/communication/preferences/:bookingId', () => {
      it('should get communication preferences successfully', async () => {
        Booking.findById.mockResolvedValue(mockBooking)

        const response = await request(app)
          .get('/api/communication/preferences/507f1f77bcf86cd799439011')
          .set('Authorization', `Bearer ${mockToken}`)

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          preferences: mockBooking.communicationPreferences
        })
      })

      it('should return 404 when booking not found', async () => {
        Booking.findById.mockResolvedValue(null)

        const response = await request(app)
          .get('/api/communication/preferences/507f1f77bcf86cd799439011')
          .set('Authorization', `Bearer ${mockToken}`)

        expect(response.status).toBe(404)
        expect(response.body).toEqual({
          error: 'Booking not found'
        })
      })
    })

    describe('PATCH /api/communication/preferences/:bookingId', () => {
      it('should update communication preferences successfully', async () => {
        const updatedPreferences = {
          emailNotifications: false,
          smsNotifications: true,
          preferredContact: 'phone'
        }

        Booking.findByIdAndUpdate.mockResolvedValue({
          ...mockBooking,
          communicationPreferences: updatedPreferences
        })

        const response = await request(app)
          .patch('/api/communication/preferences/507f1f77bcf86cd799439011')
          .set('Authorization', `Bearer ${mockToken}`)
          .send(updatedPreferences)

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          preferences: updatedPreferences
        })
        expect(Booking.findByIdAndUpdate).toHaveBeenCalledWith(
          '507f1f77bcf86cd799439011',
          { $set: { communicationPreferences: updatedPreferences } },
          { new: true }
        )
      })

      it('should return 400 for invalid preference values', async () => {
        const response = await request(app)
          .patch('/api/communication/preferences/507f1f77bcf86cd799439011')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({
            emailNotifications: 'yes', // Should be boolean
            preferredContact: 'fax' // Should be email, phone, or both
          })

        expect(response.status).toBe(400)
        expect(response.body.errors).toBeDefined()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      Booking.findById.mockRejectedValue(new Error('Database error'))

      const response = await request(app)
        .post('/api/communication/email/booking-confirmation')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          bookingId: '507f1f77bcf86cd799439011'
        })

      expect(response.status).toBe(500)
      expect(response.body).toEqual({
        error: 'Internal server error'
      })
    })

    it('should handle service errors gracefully', async () => {
      Booking.findById.mockResolvedValue(mockBooking)
      
      // Mock service to return false (failure)
      const { EmailService } = require('../backend/src/services/email.service')
      EmailService.mockImplementation(() => ({
        sendBookingConfirmation: vi.fn().mockResolvedValue(false)
      }))

      const response = await request(app)
        .post('/api/communication/email/booking-confirmation')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          bookingId: '507f1f77bcf86cd799439011'
        })

      expect(response.status).toBe(500)
      expect(response.body).toEqual({
        error: 'Failed to send booking confirmation email'
      })
    })
  })

  describe('Authentication and Authorization', () => {
    it('should require authentication for all routes', async () => {
      const routes = [
        { method: 'post', path: '/api/communication/email/booking-confirmation' },
        { method: 'post', path: '/api/communication/sms/booking-confirmation' },
        { method: 'get', path: '/api/communication/email/test-connection' },
        { method: 'get', path: '/api/communication/preferences/507f1f77bcf86cd799439011' }
      ]

      for (const route of routes) {
        const response = await request(app)[route.method](route.path)
        expect(response.status).toBe(401)
      }
    })

    it('should require admin role for all routes', async () => {
      // Mock middleware to simulate non-admin user
      const { authenticateToken, requireAdmin } = require('../backend/src/middleware/auth.middleware')
      requireAdmin.mockImplementation((req, res, next) => {
        res.status(403).json({ error: 'Admin access required' })
      })

      const response = await request(app)
        .post('/api/communication/email/booking-confirmation')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          bookingId: '507f1f77bcf86cd799439011'
        })

      expect(response.status).toBe(403)
      expect(response.body).toEqual({
        error: 'Admin access required'
      })
    })
  })
})
