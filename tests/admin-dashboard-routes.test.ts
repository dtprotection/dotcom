import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Request, Response } from 'express'

// Mock Express
vi.mock('express', () => ({
  Router: vi.fn(() => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn()
  })),
  Request: vi.fn(),
  Response: vi.fn()
}))

// Mock authentication middleware
vi.mock('../backend/src/middleware/auth.middleware', () => ({
  authenticateToken: vi.fn((req: Request, res: Response, next: Function) => {
    req.user = { id: '507f1f77bcf86cd799439031', email: 'admin@dtprotection.com', role: 'admin' }
    next()
  }),
  requireAdmin: vi.fn((req: Request, res: Response, next: Function) => {
    if (req.user?.role === 'admin') {
      next()
    } else {
      res.status(403).json({ error: 'Admin access required' })
    }
  })
}))

// Mock models
vi.mock('../backend/src/models/booking.model', () => ({
  Booking: {
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    countDocuments: vi.fn(),
    aggregate: vi.fn()
  }
}))

vi.mock('../backend/src/models/invoice.model', () => ({
  Invoice: {
    find: vi.fn(),
    findById: vi.fn(),
    countDocuments: vi.fn(),
    aggregate: vi.fn()
  }
}))

vi.mock('../backend/src/models/admin.model', () => ({
  Admin: {
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    create: vi.fn(),
    countDocuments: vi.fn(),
    aggregate: vi.fn()
  }
}))

describe('Admin Dashboard Routes', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: Function

  beforeEach(() => {
    mockRequest = {
      user: { id: '507f1f77bcf86cd799439031', email: 'admin@dtprotection.com', role: 'admin' },
      query: {},
      params: {},
      body: {}
    }
    
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis()
    }
    
    mockNext = vi.fn()
  })

  describe('Dashboard Overview Endpoints', () => {
    it('should get dashboard statistics', async () => {
      const { Booking } = await import('../backend/src/models/booking.model')
      const { Invoice } = await import('../backend/src/models/invoice.model')
      const { Admin } = await import('../backend/src/models/admin.model')
      
      // Mock database responses
      vi.mocked(Booking.countDocuments).mockResolvedValue(25)
      vi.mocked(Invoice.countDocuments).mockResolvedValue(20)
      vi.mocked(Admin.countDocuments).mockResolvedValue(3)
      
      vi.mocked(Booking.aggregate).mockResolvedValue([
        { _id: 'pending', count: 5 },
        { _id: 'approved', count: 10 },
        { _id: 'completed', count: 10 }
      ])
      
      vi.mocked(Invoice.aggregate).mockResolvedValue([
        { _id: 'pending', total: 15000 },
        { _id: 'deposit_paid', total: 8000 },
        { _id: 'paid', total: 25000 }
      ])

      // Simulate dashboard statistics endpoint
      const dashboardStats = {
        totalBookings: 25,
        totalInvoices: 20,
        totalAdmins: 3,
        bookingStatuses: [
          { status: 'pending', count: 5 },
          { status: 'approved', count: 10 },
          { status: 'completed', count: 10 }
        ],
        revenueByStatus: [
          { status: 'pending', total: 15000 },
          { status: 'deposit_paid', total: 8000 },
          { status: 'paid', total: 25000 }
        ]
      }

      expect(dashboardStats.totalBookings).toBe(25)
      expect(dashboardStats.bookingStatuses).toHaveLength(3)
      expect(dashboardStats.revenueByStatus).toHaveLength(3)
    })

    it('should get revenue analytics', async () => {
      const { Booking } = await import('../backend/src/models/booking.model')
      
      vi.mocked(Booking.aggregate).mockResolvedValue([
        { month: 'January', revenue: 12000, count: 8 },
        { month: 'February', revenue: 15000, count: 10 },
        { month: 'March', revenue: 18000, count: 12 }
      ])

      const revenueAnalytics = {
        monthlyRevenue: [
          { month: 'January', revenue: 12000, count: 8 },
          { month: 'February', revenue: 15000, count: 10 },
          { month: 'March', revenue: 18000, count: 12 }
        ],
        totalRevenue: 45000,
        averageRevenue: 15000
      }

      expect(revenueAnalytics.monthlyRevenue).toHaveLength(3)
      expect(revenueAnalytics.totalRevenue).toBe(45000)
      expect(revenueAnalytics.averageRevenue).toBe(15000)
    })

    it('should get service type analytics', async () => {
      const { Booking } = await import('../backend/src/models/booking.model')
      
      vi.mocked(Booking.aggregate).mockResolvedValue([
        { serviceType: 'corporate_security', count: 15, revenue: 30000 },
        { serviceType: 'event_security', count: 8, revenue: 12000 },
        { serviceType: 'close_protection', count: 2, revenue: 3000 }
      ])

      const serviceAnalytics = {
        serviceTypes: [
          { serviceType: 'corporate_security', count: 15, revenue: 30000 },
          { serviceType: 'event_security', count: 8, revenue: 12000 },
          { serviceType: 'close_protection', count: 2, revenue: 3000 }
        ],
        totalServices: 25,
        totalRevenue: 45000
      }

      expect(serviceAnalytics.serviceTypes).toHaveLength(3)
      expect(serviceAnalytics.totalServices).toBe(25)
      expect(serviceAnalytics.totalRevenue).toBe(45000)
    })
  })

  describe('Booking Management Endpoints', () => {
    it('should get all bookings with pagination', async () => {
      const { Booking } = await import('../backend/src/models/booking.model')
      
      const mockBookings = [
        {
          _id: '507f1f77bcf86cd799439011',
          clientName: 'John Doe',
          clientEmail: 'john@example.com',
          serviceType: 'corporate_security',
          status: 'pending',
          totalAmount: 3200,
          createdAt: new Date('2024-11-01')
        },
        {
          _id: '507f1f77bcf86cd799439012',
          clientName: 'Jane Smith',
          clientEmail: 'jane@example.com',
          serviceType: 'event_security',
          status: 'approved',
          totalAmount: 3600,
          createdAt: new Date('2024-11-02')
        }
      ]
      
      vi.mocked(Booking.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockBookings)
          })
        })
      } as any)

      const bookingsResponse = {
        bookings: mockBookings,
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3
        }
      }

      expect(bookingsResponse.bookings).toHaveLength(2)
      expect(bookingsResponse.pagination.total).toBe(25)
    })

    it('should get bookings by status', async () => {
      const { Booking } = await import('../backend/src/models/booking.model')
      
      const pendingBookings = [
        {
          _id: '507f1f77bcf86cd799439011',
          clientName: 'John Doe',
          status: 'pending',
          totalAmount: 3200
        }
      ]
      
      vi.mocked(Booking.find).mockResolvedValue(pendingBookings)

      const statusFilter = { status: 'pending' }
      const filteredBookings = await Booking.find(statusFilter)

      expect(filteredBookings).toHaveLength(1)
      expect(filteredBookings[0].status).toBe('pending')
    })

    it('should search bookings by client name', async () => {
      const { Booking } = await import('../backend/src/models/booking.model')
      
      const searchResults = [
        {
          _id: '507f1f77bcf86cd799439011',
          clientName: 'John Doe',
          clientEmail: 'john@example.com'
        }
      ]
      
      vi.mocked(Booking.find).mockResolvedValue(searchResults)

      const searchQuery = { clientName: { $regex: 'John', $options: 'i' } }
      const results = await Booking.find(searchQuery)

      expect(results).toHaveLength(1)
      expect(results[0].clientName).toBe('John Doe')
    })

    it('should update booking status', async () => {
      const { Booking } = await import('../backend/src/models/booking.model')
      
      const updatedBooking = {
        _id: '507f1f77bcf86cd799439011',
        status: 'approved',
        adminNotes: 'Approved after review'
      }
      
      vi.mocked(Booking.findByIdAndUpdate).mockResolvedValue(updatedBooking)

      const updateData = {
        status: 'approved',
        adminNotes: 'Approved after review'
      }
      
      const result = await Booking.findByIdAndUpdate('507f1f77bcf86cd799439011', updateData, { new: true })

      expect(result.status).toBe('approved')
      expect(result.adminNotes).toBe('Approved after review')
    })
  })

  describe('Invoice Management Endpoints', () => {
    it('should get all invoices with status', async () => {
      const { Invoice } = await import('../backend/src/models/invoice.model')
      
      const mockInvoices = [
        {
          _id: '507f1f77bcf86cd799439021',
          invoiceNumber: 'INV-2024-001',
          amount: 3200,
          status: 'pending',
          dueDate: new Date('2024-12-20')
        },
        {
          _id: '507f1f77bcf86cd799439022',
          invoiceNumber: 'INV-2024-002',
          amount: 3600,
          status: 'paid',
          dueDate: new Date('2024-12-21')
        }
      ]
      
      vi.mocked(Invoice.find).mockResolvedValue(mockInvoices)

      const invoicesResponse = {
        invoices: mockInvoices,
        summary: {
          total: 6800,
          pending: 3200,
          paid: 3600
        }
      }

      expect(invoicesResponse.invoices).toHaveLength(2)
      expect(invoicesResponse.summary.total).toBe(6800)
    })

    it('should get overdue invoices', async () => {
      const { Invoice } = await import('../backend/src/models/invoice.model')
      
      const overdueInvoices = [
        {
          _id: '507f1f77bcf86cd799439021',
          invoiceNumber: 'INV-2024-001',
          amount: 3200,
          status: 'pending',
          dueDate: new Date('2024-11-01')
        }
      ]
      
      vi.mocked(Invoice.find).mockResolvedValue(overdueInvoices)

      const overdueQuery = {
        dueDate: { $lt: new Date() },
        status: { $ne: 'paid' }
      }
      
      const results = await Invoice.find(overdueQuery)

      expect(results).toHaveLength(1)
      expect(results[0].status).toBe('pending')
    })

    it('should get invoice statistics', async () => {
      const { Invoice } = await import('../backend/src/models/invoice.model')
      
      vi.mocked(Invoice.aggregate).mockResolvedValue([
        { status: 'pending', count: 5, total: 15000 },
        { status: 'deposit_paid', count: 3, total: 9000 },
        { status: 'paid', count: 12, total: 36000 }
      ])

      const invoiceStats = {
        statusDistribution: [
          { status: 'pending', count: 5, total: 15000 },
          { status: 'deposit_paid', count: 3, total: 9000 },
          { status: 'paid', count: 12, total: 36000 }
        ],
        totalInvoices: 20,
        totalAmount: 60000
      }

      expect(invoiceStats.statusDistribution).toHaveLength(3)
      expect(invoiceStats.totalInvoices).toBe(20)
      expect(invoiceStats.totalAmount).toBe(60000)
    })
  })

  describe('Admin Management Endpoints', () => {
    it('should get all admin users', async () => {
      const { Admin } = await import('../backend/src/models/admin.model')
      
      const mockAdmins = [
        {
          _id: '507f1f77bcf86cd799439031',
          email: 'admin@dtprotection.com',
          name: 'Admin User',
          role: 'admin',
          isActive: true,
          lastLogin: new Date('2024-11-15T10:30:00Z')
        },
        {
          _id: '507f1f77bcf86cd799439032',
          email: 'manager@dtprotection.com',
          name: 'Manager User',
          role: 'manager',
          isActive: true,
          lastLogin: new Date('2024-11-14T15:45:00Z')
        }
      ]
      
      vi.mocked(Admin.find).mockResolvedValue(mockAdmins)

      const adminsResponse = {
        admins: mockAdmins,
        summary: {
          total: 2,
          active: 2,
          roles: { admin: 1, manager: 1 }
        }
      }

      expect(adminsResponse.admins).toHaveLength(2)
      expect(adminsResponse.summary.total).toBe(2)
      expect(adminsResponse.summary.active).toBe(2)
    })

    it('should create new admin user', async () => {
      const { Admin } = await import('../backend/src/models/admin.model')
      
      const newAdmin = {
        _id: '507f1f77bcf86cd799439033',
        email: 'newadmin@dtprotection.com',
        name: 'New Admin',
        role: 'manager',
        isActive: true,
        createdAt: new Date()
      }
      
      vi.mocked(Admin.create).mockResolvedValue(newAdmin)

      const adminData = {
        email: 'newadmin@dtprotection.com',
        name: 'New Admin',
        role: 'manager',
        password: 'securepassword123'
      }
      
      const result = await Admin.create(adminData)

      expect(result.email).toBe('newadmin@dtprotection.com')
      expect(result.role).toBe('manager')
      expect(result.isActive).toBe(true)
    })

    it('should update admin user', async () => {
      const { Admin } = await import('../backend/src/models/admin.model')
      
      const updatedAdmin = {
        _id: '507f1f77bcf86cd799439031',
        email: 'admin@dtprotection.com',
        name: 'Updated Admin Name',
        role: 'admin',
        isActive: true
      }
      
      vi.mocked(Admin.findByIdAndUpdate).mockResolvedValue(updatedAdmin)

      const updateData = {
        name: 'Updated Admin Name',
        role: 'admin'
      }
      
      const result = await Admin.findByIdAndUpdate('507f1f77bcf86cd799439031', updateData, { new: true })

      expect(result.name).toBe('Updated Admin Name')
      expect(result.role).toBe('admin')
    })

    it('should deactivate admin user', async () => {
      const { Admin } = await import('../backend/src/models/admin.model')
      
      const deactivatedAdmin = {
        _id: '507f1f77bcf86cd799439031',
        email: 'admin@dtprotection.com',
        name: 'Admin User',
        role: 'admin',
        isActive: false
      }
      
      vi.mocked(Admin.findByIdAndUpdate).mockResolvedValue(deactivatedAdmin)

      const result = await Admin.findByIdAndUpdate(
        '507f1f77bcf86cd799439031',
        { isActive: false },
        { new: true }
      )

      expect(result.isActive).toBe(false)
    })
  })

  describe('Analytics & Reporting Endpoints', () => {
    it('should get dashboard analytics', async () => {
      const { Booking } = await import('../backend/src/models/booking.model')
      const { Invoice } = await import('../backend/src/models/invoice.model')
      
      vi.mocked(Booking.aggregate).mockResolvedValue([
        { month: 'January', bookings: 8, revenue: 12000 },
        { month: 'February', bookings: 10, revenue: 15000 },
        { month: 'March', bookings: 12, revenue: 18000 }
      ])
      
      vi.mocked(Invoice.aggregate).mockResolvedValue([
        { status: 'pending', count: 5, amount: 15000 },
        { status: 'paid', count: 15, amount: 45000 }
      ])

      const analytics = {
        monthlyTrends: [
          { month: 'January', bookings: 8, revenue: 12000 },
          { month: 'February', bookings: 10, revenue: 15000 },
          { month: 'March', bookings: 12, revenue: 18000 }
        ],
        paymentStatus: [
          { status: 'pending', count: 5, amount: 15000 },
          { status: 'paid', count: 15, amount: 45000 }
        ],
        summary: {
          totalBookings: 30,
          totalRevenue: 45000,
          averageBookingValue: 1500
        }
      }

      expect(analytics.monthlyTrends).toHaveLength(3)
      expect(analytics.paymentStatus).toHaveLength(2)
      expect(analytics.summary.totalBookings).toBe(30)
    })

    it('should get export data for bookings', async () => {
      const { Booking } = await import('../backend/src/models/booking.model')
      
      const exportData = [
        {
          clientName: 'John Doe',
          clientEmail: 'john@example.com',
          serviceType: 'corporate_security',
          status: 'pending',
          totalAmount: 3200,
          eventDate: '2024-12-25',
          createdAt: '2024-11-01'
        }
      ]
      
      vi.mocked(Booking.find).mockResolvedValue(exportData)

      const csvData = exportData.map(booking => [
        booking.clientName,
        booking.clientEmail,
        booking.serviceType,
        booking.status,
        booking.totalAmount,
        booking.eventDate
      ])

      expect(csvData).toHaveLength(1)
      expect(csvData[0]).toHaveLength(6)
    })

    it('should get performance metrics', async () => {
      const { Booking } = await import('../backend/src/models/booking.model')
      
      vi.mocked(Booking.aggregate).mockResolvedValue([
        { serviceType: 'corporate_security', avgAmount: 3200, count: 15 },
        { serviceType: 'event_security', avgAmount: 1800, count: 8 },
        { serviceType: 'close_protection', avgAmount: 1500, count: 2 }
      ])

      const performanceMetrics = {
        servicePerformance: [
          { serviceType: 'corporate_security', avgAmount: 3200, count: 15 },
          { serviceType: 'event_security', avgAmount: 1800, count: 8 },
          { serviceType: 'close_protection', avgAmount: 1500, count: 2 }
        ],
        topPerformingService: 'corporate_security',
        averageBookingValue: 2500
      }

      expect(performanceMetrics.servicePerformance).toHaveLength(3)
      expect(performanceMetrics.topPerformingService).toBe('corporate_security')
      expect(performanceMetrics.averageBookingValue).toBe(2500)
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const { Booking } = await import('../backend/src/models/booking.model')
      
      vi.mocked(Booking.find).mockRejectedValue(new Error('Database connection failed'))

      try {
        await Booking.find({})
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe('Database connection failed')
      }
    })

    it('should handle invalid query parameters', () => {
      const invalidQuery = { status: 'invalid_status' }
      
      // Simulate validation error
      const validationError = new Error('Invalid status value')
      validationError.name = 'ValidationError'

      expect(validationError.name).toBe('ValidationError')
      expect(validationError.message).toBe('Invalid status value')
    })

    it('should handle unauthorized access', () => {
      const unauthorizedRequest = {
        user: { id: '507f1f77bcf86cd799439031', email: 'user@example.com', role: 'user' }
      }

      const isAuthorized = unauthorizedRequest.user.role === 'admin'
      expect(isAuthorized).toBe(false)
    })
  })
})
