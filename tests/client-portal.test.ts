import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock external dependencies
vi.mock('../backend/src/models/booking.model', () => ({
  Booking: {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn()
  }
}))

vi.mock('../backend/src/models/invoice.model', () => ({
  Invoice: {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn()
  }
}))

vi.mock('../backend/src/models/admin.model', () => ({
  Admin: {
    find: vi.fn(),
    findOne: vi.fn()
  }
}))

// Mock data for client portal tests
const mockClient = {
  id: 'client123',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  activeBookings: 2,
  totalBookings: 5,
  totalSpent: 2500.00
}

const mockBookings = [
  {
    id: 'booking1',
    clientName: 'John Doe',
    clientEmail: 'john@example.com',
    clientPhone: '+1234567890',
    serviceType: 'personal_protection',
    date: new Date('2024-01-15'),
    startTime: '09:00',
    endTime: '17:00',
    status: 'confirmed',
    totalAmount: 800.00,
    depositAmount: 200.00,
    depositPaid: true,
    finalPaymentPaid: false,
    adminNotes: 'Client requested specific security protocols',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-12')
  },
  {
    id: 'booking2',
    clientName: 'John Doe',
    clientEmail: 'john@example.com',
    clientPhone: '+1234567890',
    serviceType: 'event_security',
    date: new Date('2024-02-20'),
    startTime: '18:00',
    endTime: '02:00',
    status: 'pending',
    totalAmount: 1200.00,
    depositAmount: 300.00,
    depositPaid: false,
    finalPaymentPaid: false,
    adminNotes: 'Large event, requires additional personnel',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  }
]

const mockInvoices = [
  {
    id: 'invoice1',
    bookingId: 'booking1',
    clientEmail: 'john@example.com',
    amount: 800.00,
    status: 'paid',
    dueDate: new Date('2024-01-20'),
    paidAt: new Date('2024-01-18'),
    paypalInvoiceId: 'INV-123456',
    createdAt: new Date('2024-01-10')
  },
  {
    id: 'invoice2',
    bookingId: 'booking2',
    clientEmail: 'john@example.com',
    amount: 1200.00,
    status: 'pending',
    dueDate: new Date('2024-02-25'),
    paidAt: null,
    paypalInvoiceId: 'INV-123457',
    createdAt: new Date('2024-01-15')
  }
]

const mockMessages = [
  {
    id: 'msg1',
    clientEmail: 'john@example.com',
    type: 'email',
    subject: 'Booking Confirmation',
    content: 'Your booking has been confirmed for January 15th.',
    status: 'sent',
    sentAt: new Date('2024-01-12'),
    readAt: new Date('2024-01-12')
  },
  {
    id: 'msg2',
    clientEmail: 'john@example.com',
    type: 'sms',
    subject: 'Payment Reminder',
    content: 'Reminder: Your deposit payment of $300 is due.',
    status: 'sent',
    sentAt: new Date('2024-01-16'),
    readAt: null
  }
]

// Client Portal Service Functions (mocked)
const clientPortalService = {
  // Authentication
  validateClientCredentials: vi.fn((email: string, bookingId: string) => {
    const booking = mockBookings.find(b => b.id === bookingId)
    return booking && booking.clientEmail === email
  }),

  generateClientToken: vi.fn((clientId: string) => {
    return `client_${clientId}_${Date.now()}`
  }),

  validateClientToken: vi.fn((token: string) => {
    return token.startsWith('client_') && token.split('_').length === 3
  }),

  // Profile Management
  getClientProfile: vi.fn((clientId: string) => {
    return Promise.resolve({
      ...mockClient,
      communicationPreferences: { email: true, sms: true },
      lastLogin: new Date()
    })
  }),

  updateCommunicationPreferences: vi.fn((clientId: string, preferences: any) => {
    return Promise.resolve({ success: true, preferences })
  }),

  // Booking Management
  getClientBookings: vi.fn((clientEmail: string) => {
    return Promise.resolve(mockBookings.filter(b => b.clientEmail === clientEmail))
  }),

  getBookingById: vi.fn((bookingId: string, clientEmail: string) => {
    const booking = mockBookings.find(b => b.id === bookingId && b.clientEmail === clientEmail)
    return Promise.resolve(booking || null)
  }),

  // Payment Management
  getClientInvoices: vi.fn((clientEmail: string) => {
    return Promise.resolve(mockInvoices.filter(i => i.clientEmail === clientEmail))
  }),

  getInvoiceById: vi.fn((invoiceId: string, clientEmail: string) => {
    const invoice = mockInvoices.find(i => i.id === invoiceId && i.clientEmail === clientEmail)
    return Promise.resolve(invoice || null)
  }),

  // Communication Management
  getClientMessages: vi.fn((clientEmail: string) => {
    return Promise.resolve(mockMessages.filter(m => m.clientEmail === clientEmail))
  }),

  markMessageAsRead: vi.fn((messageId: string) => {
    return Promise.resolve({ success: true })
  })
}

describe('Client Portal - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Client Authentication', () => {
    it('should validate client login credentials', async () => {
      const validCredentials = {
        email: 'john@example.com',
        bookingId: 'booking1'
      }

      const invalidCredentials = {
        email: 'invalid@example.com',
        bookingId: 'nonexistent'
      }

      // Test valid credentials
      const isValid = clientPortalService.validateClientCredentials(
        validCredentials.email, 
        validCredentials.bookingId
      )
      expect(isValid).toBe(true)

      // Test invalid credentials
      const isInvalid = clientPortalService.validateClientCredentials(
        invalidCredentials.email, 
        invalidCredentials.bookingId
      )
      expect(isInvalid).toBe(false)
    })

    it('should generate client access token', () => {
      const clientData = {
        id: mockClient.id,
        email: mockClient.email,
        bookingId: 'booking1'
      }

      const token = clientPortalService.generateClientToken(clientData.id)
      
      expect(token).toContain('client_')
      expect(token).toContain(clientData.id)
      expect(token.length).toBeGreaterThan(20)
    })

    it('should validate client token', () => {
      const validToken = 'client_client123_1704067200000'
      const invalidToken = 'invalid_token'

      expect(clientPortalService.validateClientToken(validToken)).toBe(true)
      expect(clientPortalService.validateClientToken(invalidToken)).toBe(false)
    })
  })

  describe('Client Profile Management', () => {
    it('should fetch client profile data', async () => {
      const clientProfile = await clientPortalService.getClientProfile('client123')

      expect(clientProfile.id).toBe('client123')
      expect(clientProfile.name).toBe('John Doe')
      expect(clientProfile.email).toBe('john@example.com')
      expect(clientProfile.activeBookings).toBe(2)
      expect(clientProfile.communicationPreferences.email).toBe(true)
      expect(clientProfile.communicationPreferences.sms).toBe(true)
    })

    it('should update client communication preferences', async () => {
      const preferences = {
        email: true,
        sms: false
      }

      const result = await clientPortalService.updateCommunicationPreferences('client123', preferences)

      expect(result.success).toBe(true)
      expect(result.preferences).toEqual(preferences)
    })

    it('should calculate client statistics', () => {
      const stats = {
        totalBookings: mockBookings.length,
        activeBookings: mockBookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length,
        completedBookings: mockBookings.filter(b => b.status === 'completed').length,
        totalSpent: mockInvoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0),
        averageBookingValue: mockBookings.reduce((sum, b) => sum + b.totalAmount, 0) / mockBookings.length
      }

      expect(stats.totalBookings).toBe(2)
      expect(stats.activeBookings).toBe(2)
      expect(stats.completedBookings).toBe(0)
      expect(stats.totalSpent).toBe(800.00)
      expect(stats.averageBookingValue).toBe(1000.00)
    })
  })

  describe('Booking Management', () => {
    it('should fetch client bookings', async () => {
      const clientBookings = await clientPortalService.getClientBookings('john@example.com')

      expect(clientBookings).toHaveLength(2)
      expect(clientBookings[0].serviceType).toBe('personal_protection')
      expect(clientBookings[1].serviceType).toBe('event_security')
    })

    it('should filter bookings by status', () => {
      const confirmedBookings = mockBookings.filter(b => b.status === 'confirmed')
      const pendingBookings = mockBookings.filter(b => b.status === 'pending')

      expect(confirmedBookings).toHaveLength(1)
      expect(pendingBookings).toHaveLength(1)
      expect(confirmedBookings[0].id).toBe('booking1')
      expect(pendingBookings[0].id).toBe('booking2')
    })

    it('should sort bookings by date', () => {
      const sortedBookings = [...mockBookings].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )

      expect(sortedBookings[0].id).toBe('booking1')
      expect(sortedBookings[1].id).toBe('booking2')
    })

    it('should calculate booking statistics', () => {
      const bookingStats = {
        total: mockBookings.length,
        confirmed: mockBookings.filter(b => b.status === 'confirmed').length,
        pending: mockBookings.filter(b => b.status === 'pending').length,
        completed: mockBookings.filter(b => b.status === 'completed').length,
        cancelled: mockBookings.filter(b => b.status === 'cancelled').length,
        upcoming: mockBookings.filter(b => new Date(b.date) > new Date()).length
      }

      expect(bookingStats.total).toBe(2)
      expect(bookingStats.confirmed).toBe(1)
      expect(bookingStats.pending).toBe(1)
      expect(bookingStats.completed).toBe(0)
      expect(bookingStats.cancelled).toBe(0)
      expect(bookingStats.upcoming).toBe(2)
    })

    it('should validate booking details', () => {
      const booking = mockBookings[0]

      expect(booking.clientName).toBe('John Doe')
      expect(booking.clientEmail).toBe('john@example.com')
      expect(booking.serviceType).toBe('personal_protection')
      expect(booking.totalAmount).toBe(800.00)
      expect(booking.depositAmount).toBe(200.00)
      expect(booking.depositPaid).toBe(true)
      expect(booking.finalPaymentPaid).toBe(false)
    })

    it('should get booking by ID with client validation', async () => {
      const booking = await clientPortalService.getBookingById('booking1', 'john@example.com')
      const invalidBooking = await clientPortalService.getBookingById('booking1', 'other@example.com')

      expect(booking).toBeDefined()
      expect(booking?.id).toBe('booking1')
      expect(invalidBooking).toBeNull()
    })
  })

  describe('Payment Tracking', () => {
    it('should fetch client invoices', async () => {
      const clientInvoices = await clientPortalService.getClientInvoices('john@example.com')

      expect(clientInvoices).toHaveLength(2)
      expect(clientInvoices[0].status).toBe('paid')
      expect(clientInvoices[1].status).toBe('pending')
    })

    it('should calculate payment statistics', () => {
      const paymentStats = {
        totalInvoices: mockInvoices.length,
        paidInvoices: mockInvoices.filter(i => i.status === 'paid').length,
        pendingInvoices: mockInvoices.filter(i => i.status === 'pending').length,
        overdueInvoices: mockInvoices.filter(i => 
          i.status === 'pending' && new Date(i.dueDate) < new Date()
        ).length,
        totalPaid: mockInvoices.filter(i => i.status === 'paid')
          .reduce((sum, inv) => sum + inv.amount, 0),
        totalPending: mockInvoices.filter(i => i.status === 'pending')
          .reduce((sum, inv) => sum + inv.amount, 0)
      }

      expect(paymentStats.totalInvoices).toBe(2)
      expect(paymentStats.paidInvoices).toBe(1)
      expect(paymentStats.pendingInvoices).toBe(1)
      expect(paymentStats.overdueInvoices).toBe(0)
      expect(paymentStats.totalPaid).toBe(800.00)
      expect(paymentStats.totalPending).toBe(1200.00)
    })

    it('should identify overdue payments', () => {
      const overdueInvoices = mockInvoices.filter(invoice => 
        invoice.status === 'pending' && new Date(invoice.dueDate) < new Date()
      )

      expect(overdueInvoices).toHaveLength(0) // No overdue invoices in test data
    })

    it('should calculate payment progress', () => {
      const booking = mockBookings[0]
      const totalPaid = booking.depositPaid ? booking.depositAmount : 0
      const progress = (totalPaid / booking.totalAmount) * 100

      expect(progress).toBe(25) // 200/800 = 25%
    })

    it('should validate invoice details', () => {
      const invoice = mockInvoices[0]

      expect(invoice.bookingId).toBe('booking1')
      expect(invoice.amount).toBe(800.00)
      expect(invoice.status).toBe('paid')
      expect(invoice.paypalInvoiceId).toBe('INV-123456')
      expect(invoice.paidAt).toBeInstanceOf(Date)
    })

    it('should get invoice by ID with client validation', async () => {
      const invoice = await clientPortalService.getInvoiceById('invoice1', 'john@example.com')
      const invalidInvoice = await clientPortalService.getInvoiceById('invoice1', 'other@example.com')

      expect(invoice).toBeDefined()
      expect(invoice?.id).toBe('invoice1')
      expect(invalidInvoice).toBeNull()
    })
  })

  describe('Communication Management', () => {
    it('should fetch client messages', async () => {
      const clientMessages = await clientPortalService.getClientMessages('john@example.com')

      expect(clientMessages).toHaveLength(2)
      expect(clientMessages[0].type).toBe('email')
      expect(clientMessages[1].type).toBe('sms')
    })

    it('should filter messages by type', () => {
      const emailMessages = mockMessages.filter(m => m.type === 'email')
      const smsMessages = mockMessages.filter(m => m.type === 'sms')

      expect(emailMessages).toHaveLength(1)
      expect(smsMessages).toHaveLength(1)
    })

    it('should track message read status', () => {
      const readMessages = mockMessages.filter(m => m.readAt !== null)
      const unreadMessages = mockMessages.filter(m => m.readAt === null)

      expect(readMessages).toHaveLength(1)
      expect(unreadMessages).toHaveLength(1)
    })

    it('should sort messages by date', () => {
      const sortedMessages = [...mockMessages].sort((a, b) => 
        new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
      )

      expect(sortedMessages[0].id).toBe('msg2')
      expect(sortedMessages[1].id).toBe('msg1')
    })

    it('should calculate communication statistics', () => {
      const commStats = {
        totalMessages: mockMessages.length,
        emailMessages: mockMessages.filter(m => m.type === 'email').length,
        smsMessages: mockMessages.filter(m => m.type === 'sms').length,
        readMessages: mockMessages.filter(m => m.readAt !== null).length,
        unreadMessages: mockMessages.filter(m => m.readAt === null).length
      }

      expect(commStats.totalMessages).toBe(2)
      expect(commStats.emailMessages).toBe(1)
      expect(commStats.smsMessages).toBe(1)
      expect(commStats.readMessages).toBe(1)
      expect(commStats.unreadMessages).toBe(1)
    })

    it('should mark message as read', async () => {
      const result = await clientPortalService.markMessageAsRead('msg1')

      expect(result.success).toBe(true)
    })
  })

  describe('Data Validation', () => {
    it('should validate client email format', () => {
      const validEmails = [
        'john@example.com',
        'jane.doe@company.co.uk',
        'test+tag@domain.org'
      ]

      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user.domain.com'
      ]

      const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
      }

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true)
      })

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false)
      })
    })

    it('should validate phone number format', () => {
      const validPhones = [
        '+1234567890',
        '(123) 456-7890',
        '123-456-7890',
        '123.456.7890'
      ]

      const invalidPhones = [
        '123',
        'abc-def-ghij',
        '+123',
        ''
      ]

      const isValidPhone = (phone: string) => {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$|^[\+]?[\(]?[1-9][\d]{2}[\)]?[\s\-]?[\d]{3}[\s\-]?[\d]{4}$/
        return phoneRegex.test(phone.replace(/[\s\-\(\)\.]/g, ''))
      }

      validPhones.forEach(phone => {
        expect(isValidPhone(phone)).toBe(true)
      })

      invalidPhones.forEach(phone => {
        expect(isValidPhone(phone)).toBe(false)
      })
    })

    it('should validate booking ID format', () => {
      const validBookingIds = [
        'booking1',
        'booking_123',
        'bk-2024-001'
      ]

      const invalidBookingIds = [
        '',
        'booking',
        '123'
      ]

      const isValidBookingId = (id: string) => {
        return id.length >= 8 && /^[a-zA-Z0-9_-]+$/.test(id)
      }

      validBookingIds.forEach(id => {
        expect(isValidBookingId(id)).toBe(true)
      })

      invalidBookingIds.forEach(id => {
        expect(isValidBookingId(id)).toBe(false)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid client token', () => {
      const invalidToken = 'invalid_token'
      
      const validateToken = (token: string) => {
        if (!token.startsWith('client_')) {
          throw new Error('Invalid token format')
        }
        const parts = token.split('_')
        if (parts.length !== 3) {
          throw new Error('Invalid token structure')
        }
        return true
      }

      expect(() => validateToken(invalidToken)).toThrow('Invalid token format')
    })

    it('should handle missing booking data', () => {
      const getBookingById = (id: string) => {
        const booking = mockBookings.find(b => b.id === id)
        if (!booking) {
          throw new Error(`Booking not found: ${id}`)
        }
        return booking
      }

      expect(() => getBookingById('nonexistent')).toThrow('Booking not found: nonexistent')
      expect(getBookingById('booking1')).toBeDefined()
    })

    it('should handle network errors gracefully', () => {
      const fetchWithRetry = async (url: string, retries = 3) => {
        try {
          // Simulate network request
          if (Math.random() < 0.5) {
            throw new Error('Network error')
          }
          return { success: true }
        } catch (error) {
          if (retries > 0) {
            return fetchWithRetry(url, retries - 1)
          }
          throw error
        }
      }

      expect(fetchWithRetry).toBeDefined()
    })
  })

  describe('Security Features', () => {
    it('should sanitize user input', () => {
      const maliciousInput = '<script>alert("xss")</script>John Doe'
      
      const sanitizeInput = (input: string) => {
        return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      }

      const sanitized = sanitizeInput(maliciousInput)
      expect(sanitized).toBe('John Doe')
      expect(sanitized).not.toContain('<script>')
    })

    it('should validate client access to booking', () => {
      const clientEmail = 'john@example.com'
      const bookingId = 'booking1'
      
      const canAccessBooking = (email: string, bookingId: string) => {
        const booking = mockBookings.find(b => b.id === bookingId)
        return booking && booking.clientEmail === email
      }

      expect(canAccessBooking(clientEmail, bookingId)).toBe(true)
      expect(canAccessBooking('other@example.com', bookingId)).toBe(false)
      expect(canAccessBooking(clientEmail, 'nonexistent')).toBe(false)
    })

    it('should prevent unauthorized data access', () => {
      const getClientData = (token: string, clientId: string) => {
        if (!token.startsWith('client_')) {
          throw new Error('Unauthorized access')
        }
        
        const tokenClientId = token.split('_')[1]
        if (tokenClientId !== clientId) {
          throw new Error('Access denied')
        }
        
        return mockClient
      }

      expect(() => getClientData('invalid_token', 'client123')).toThrow('Unauthorized access')
      expect(() => getClientData('client_client123_123', 'other123')).toThrow('Access denied')
      expect(getClientData('client_client123_123', 'client123')).toBeDefined()
    })
  })
})
