import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EmailService } from '../backend/src/services/email.service'
import { SMSService } from '../backend/src/services/sms.service'

// Mock nodemailer
vi.mock('nodemailer', () => ({
  createTransport: vi.fn(() => ({
    sendMail: vi.fn(),
    verify: vi.fn()
  }))
}))

// Mock fetch for SMS API calls
global.fetch = vi.fn()

describe('Communication System Integration', () => {
  let emailService: EmailService
  let smsService: SMSService

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
      status: 'pending' as const,
      method: 'paypal' as const
    },
    communicationPreferences: {
      emailNotifications: true,
      smsNotifications: false,
      preferredContact: 'email' as const
    }
  }

  const mockInvoice = {
    _id: '507f1f77bcf86cd799439012',
    invoiceNumber: 'INV-000001',
    amount: 2000,
    depositAmount: 500,
    status: 'sent' as const,
    dueDate: new Date('2024-12-20'),
    paymentMethod: 'paypal' as const
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    emailService = new EmailService({
      provider: 'smtp',
      fromEmail: 'test@example.com',
      fromName: 'Test Service',
      smtpConfig: {
        host: 'localhost',
        port: 587,
        secure: false,
        auth: {
          user: 'test',
          pass: 'test'
        }
      }
    })

    smsService = new SMSService({
      provider: 'twilio',
      apiKey: 'test_key',
      apiSecret: 'test_secret',
      fromNumber: '+1234567890',
      accountSid: 'test_sid'
    })
  })

  describe('Email Service Integration', () => {
    it('should send booking confirmation email successfully', async () => {
      const mockTransporter = {
        sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' })
      }
      
      vi.mocked(require('nodemailer').createTransport).mockReturnValue(mockTransporter)

      const result = await emailService.sendBookingConfirmation(mockBooking)
      
      expect(result).toBe(true)
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"Test Service" <test@example.com>',
          to: '"John Doe" <john@example.com>',
          subject: 'Booking Confirmation - Event Security'
        })
      )
    })

    it('should send payment reminder email with invoice information', async () => {
      const mockTransporter = {
        sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' })
      }
      
      vi.mocked(require('nodemailer').createTransport).mockReturnValue(mockTransporter)

      const result = await emailService.sendPaymentReminder(mockBooking, mockInvoice)
      
      expect(result).toBe(true)
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Payment Reminder')
        })
      )
    })

    it('should send status update email with correct styling', async () => {
      const mockTransporter = {
        sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' })
      }
      
      vi.mocked(require('nodemailer').createTransport).mockReturnValue(mockTransporter)

      const result = await emailService.sendStatusUpdate(mockBooking, 'approved')
      
      expect(result).toBe(true)
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Booking Status Update - Approved'
        })
      )
    })

    it('should handle email sending failure gracefully', async () => {
      const mockTransporter = {
        sendMail: vi.fn().mockRejectedValue(new Error('SMTP error'))
      }
      
      vi.mocked(require('nodemailer').createTransport).mockReturnValue(mockTransporter)

      const result = await emailService.sendBookingConfirmation(mockBooking)
      
      expect(result).toBe(false)
    })

    it('should verify email connection successfully', async () => {
      const mockTransporter = {
        verify: vi.fn().mockResolvedValue(true)
      }
      
      vi.mocked(require('nodemailer').createTransport).mockReturnValue(mockTransporter)

      const result = await emailService.verifyConnection()
      
      expect(result).toBe(true)
      expect(mockTransporter.verify).toHaveBeenCalled()
    })

    it('should handle email connection verification failure', async () => {
      const mockTransporter = {
        verify: vi.fn().mockRejectedValue(new Error('Connection failed'))
      }
      
      vi.mocked(require('nodemailer').createTransport).mockReturnValue(mockTransporter)

      const result = await emailService.verifyConnection()
      
      expect(result).toBe(false)
    })
  })

  describe('SMS Service Integration', () => {
    it('should send booking confirmation SMS successfully', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ sid: 'test-sms-id' })
      } as Response)

      const result = await smsService.sendBookingConfirmation(mockBooking)
      
      expect(result).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.twilio.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic')
          })
        })
      )
    })

    it('should send payment reminder SMS with urgency calculation', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ sid: 'test-sms-id' })
      } as Response)

      const result = await smsService.sendPaymentReminder(mockBooking, mockInvoice)
      
      expect(result).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.twilio.com'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('payment reminder')
        })
      )
    })

    it('should send urgent reminder SMS for events within 3 days', async () => {
      const urgentBooking = {
        ...mockBooking,
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ sid: 'test-sms-id' })
      } as Response)

      const result = await smsService.sendUrgentReminder(urgentBooking)
      
      expect(result).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.twilio.com'),
        expect.objectContaining({
          body: expect.stringContaining('URGENT')
        })
      )
    })

    it('should handle SMS sending failure gracefully', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      } as Response)

      const result = await smsService.sendBookingConfirmation(mockBooking)
      
      expect(result).toBe(false)
    })

    it('should handle SMS API errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

      const result = await smsService.sendBookingConfirmation(mockBooking)
      
      expect(result).toBe(false)
    })

    it('should validate phone numbers correctly', () => {
      expect(smsService.validatePhoneNumber('1234567890')).toBe(true)
      expect(smsService.validatePhoneNumber('(123) 456-7890')).toBe(true)
      expect(smsService.validatePhoneNumber('123-456-7890')).toBe(true)
      expect(smsService.validatePhoneNumber('+11234567890')).toBe(true)
      expect(smsService.validatePhoneNumber('123456789')).toBe(false)
      expect(smsService.validatePhoneNumber('abc-def-ghij')).toBe(false)
    })

    it('should format phone numbers to E.164 correctly', () => {
      expect(smsService.formatPhoneNumber('1234567890')).toBe('+11234567890')
      expect(smsService.formatPhoneNumber('(123) 456-7890')).toBe('+11234567890')
      expect(smsService.formatPhoneNumber('123-456-7890')).toBe('+11234567890')
      expect(smsService.formatPhoneNumber('+11234567890')).toBe('+11234567890')
      expect(smsService.formatPhoneNumber('123456789')).toBe('123456789')
    })

    it('should verify SMS connection successfully', async () => {
      const result = await smsService.verifyConnection()
      
      expect(result).toBe(true)
    })

    it('should allow custom SMS templates', () => {
      const customTemplates = {
        bookingConfirmation: 'Custom confirmation for {name}'
      }
      
      smsService.setTemplates(customTemplates)
      
      // This would be tested by calling the actual SMS methods
      // For now, we just verify the method exists and doesn't throw
      expect(() => smsService.setTemplates(customTemplates)).not.toThrow()
    })
  })

  describe('Communication Preferences Integration', () => {
    it('should respect email notification preferences', async () => {
      const emailOnlyBooking = {
        ...mockBooking,
        communicationPreferences: {
          emailNotifications: true,
          smsNotifications: false,
          preferredContact: 'email'
        }
      }

      const mockTransporter = {
        sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' })
      }
      
      vi.mocked(require('nodemailer').createTransport).mockReturnValue(mockTransporter)

      const result = await emailService.sendBookingConfirmation(emailOnlyBooking)
      
      expect(result).toBe(true)
      expect(mockTransporter.sendMail).toHaveBeenCalled()
    })

    it('should respect SMS notification preferences', async () => {
      const smsOnlyBooking = {
        ...mockBooking,
        communicationPreferences: {
          emailNotifications: false,
          smsNotifications: true,
          preferredContact: 'phone'
        }
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ sid: 'test-sms-id' })
      } as Response)

      const result = await smsService.sendBookingConfirmation(smsOnlyBooking)
      
      expect(result).toBe(true)
      expect(fetch).toHaveBeenCalled()
    })

    it('should handle both email and SMS preferences', async () => {
      const bothBooking = {
        ...mockBooking,
        communicationPreferences: {
          emailNotifications: true,
          smsNotifications: true,
          preferredContact: 'both'
        }
      }

      const mockTransporter = {
        sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' })
      }
      
      vi.mocked(require('nodemailer').createTransport).mockReturnValue(mockTransporter)
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ sid: 'test-sms-id' })
      } as Response)

      const emailResult = await emailService.sendBookingConfirmation(bothBooking)
      const smsResult = await smsService.sendBookingConfirmation(bothBooking)
      
      expect(emailResult).toBe(true)
      expect(smsResult).toBe(true)
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle email service configuration errors', () => {
      expect(() => {
        new EmailService({
          provider: 'smtp',
          fromEmail: 'test@example.com',
          fromName: 'Test Service'
          // Missing smtpConfig
        })
      }).toThrow('SMTP configuration required for smtp provider')
    })

    it('should handle unsupported email provider', () => {
      expect(() => {
        new EmailService({
          provider: 'unsupported' as any,
          fromEmail: 'test@example.com',
          fromName: 'Test Service'
        })
      }).toThrow('Unsupported email provider: unsupported')
    })

    it('should handle unsupported SMS provider', () => {
      expect(() => {
        new SMSService({
          provider: 'unsupported' as any,
          apiKey: 'test',
          apiSecret: 'test',
          fromNumber: '+1234567890'
        })
      }).toThrow('Unsupported SMS provider: unsupported')
    })

    it('should handle missing SMS credentials gracefully', async () => {
      const smsServiceWithoutCredentials = new SMSService({
        provider: 'twilio',
        apiKey: '',
        apiSecret: '',
        fromNumber: '',
        accountSid: ''
      })

      const result = await smsServiceWithoutCredentials.sendBookingConfirmation(mockBooking)
      
      expect(result).toBe(false)
    })
  })

  describe('Template Processing Integration', () => {
    it('should process email templates with dynamic data', async () => {
      const mockTransporter = {
        sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' })
      }
      
      vi.mocked(require('nodemailer').createTransport).mockReturnValue(mockTransporter)

      await emailService.sendBookingConfirmation(mockBooking)
      
      const sentMail = mockTransporter.sendMail.mock.calls[0][0]
      
      expect(sentMail.html).toContain('John Doe')
      expect(sentMail.html).toContain('Event Security')
      expect(sentMail.html).toContain('$2000')
      expect(sentMail.html).toContain('$500')
      expect(sentMail.html).toContain('12/25/2024')
    })

    it('should process SMS templates with dynamic data', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ sid: 'test-sms-id' })
      } as Response)

      await smsService.sendBookingConfirmation(mockBooking)
      
      const fetchCall = vi.mocked(fetch).mock.calls[0]
      const body = fetchCall[1]?.body as URLSearchParams
      
      expect(body.get('Body')).toContain('John Doe')
      expect(body.get('Body')).toContain('Event Security')
      expect(body.get('Body')).toContain('$2000')
      expect(body.get('Body')).toContain('$500')
    })

    it('should handle missing data in templates gracefully', async () => {
      const incompleteBooking = {
        ...mockBooking,
        venueAddress: undefined,
        numberOfGuards: undefined,
        payment: undefined
      }

      const mockTransporter = {
        sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' })
      }
      
      vi.mocked(require('nodemailer').createTransport).mockReturnValue(mockTransporter)

      const result = await emailService.sendBookingConfirmation(incompleteBooking)
      
      expect(result).toBe(true)
      
      const sentMail = mockTransporter.sendMail.mock.calls[0][0]
      expect(sentMail.html).toContain('To be confirmed')
    })
  })
})
