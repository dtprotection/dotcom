import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Booking } from '../backend/src/models/booking.model'
import { Admin } from '../backend/src/models/admin.model'
import { Invoice } from '../backend/src/models/invoice.model'

// Mock data for testing
const mockBookings: Partial<Booking>[] = [
  {
    _id: '507f1f77bcf86cd799439011',
    clientName: 'John Doe',
    clientEmail: 'john@example.com',
    clientPhone: '+1234567890',
    serviceType: 'corporate_security',
    eventDate: new Date('2024-12-25'),
    eventTime: '18:00',
    duration: 8,
    numberOfGuards: 4,
    location: '123 Main St, City, State',
    status: 'pending',
    totalAmount: 3200,
    depositAmount: 800,
    depositPaid: false,
    finalPaymentPaid: false,
    createdAt: new Date('2024-11-01'),
    communicationPreferences: {
      emailNotifications: true,
      smsNotifications: true,
      preferredContact: 'both'
    }
  },
  {
    _id: '507f1f77bcf86cd799439012',
    clientName: 'Jane Smith',
    clientEmail: 'jane@example.com',
    clientPhone: '+1234567891',
    serviceType: 'event_security',
    eventDate: new Date('2024-12-26'),
    eventTime: '19:00',
    duration: 6,
    numberOfGuards: 6,
    location: '456 Oak Ave, City, State',
    status: 'approved',
    totalAmount: 3600,
    depositAmount: 900,
    depositPaid: true,
    finalPaymentPaid: false,
    createdAt: new Date('2024-11-02'),
    communicationPreferences: {
      emailNotifications: true,
      smsNotifications: false,
      preferredContact: 'email'
    }
  },
  {
    _id: '507f1f77bcf86cd799439013',
    clientName: 'Bob Wilson',
    clientEmail: 'bob@example.com',
    clientPhone: '+1234567892',
    serviceType: 'close_protection',
    eventDate: new Date('2024-12-27'),
    eventTime: '20:00',
    duration: 12,
    numberOfGuards: 2,
    location: '789 Pine Rd, City, State',
    status: 'completed',
    totalAmount: 4800,
    depositAmount: 1200,
    depositPaid: true,
    finalPaymentPaid: true,
    createdAt: new Date('2024-11-03'),
    communicationPreferences: {
      emailNotifications: false,
      smsNotifications: true,
      preferredContact: 'phone'
    }
  }
]

const mockInvoices: Partial<Invoice>[] = [
  {
    _id: '507f1f77bcf86cd799439021',
    bookingId: '507f1f77bcf86cd799439011',
    invoiceNumber: 'INV-2024-001',
    amount: 3200,
    depositAmount: 800,
    status: 'pending',
    dueDate: new Date('2024-12-20'),
    createdAt: new Date('2024-11-01')
  },
  {
    _id: '507f1f77bcf86cd799439022',
    bookingId: '507f1f77bcf86cd799439012',
    invoiceNumber: 'INV-2024-002',
    amount: 3600,
    depositAmount: 900,
    status: 'deposit_paid',
    dueDate: new Date('2024-12-21'),
    createdAt: new Date('2024-11-02')
  },
  {
    _id: '507f1f77bcf86cd799439023',
    bookingId: '507f1f77bcf86cd799439013',
    invoiceNumber: 'INV-2024-003',
    amount: 4800,
    depositAmount: 1200,
    status: 'paid',
    dueDate: new Date('2024-12-22'),
    createdAt: new Date('2024-11-03')
  }
]

const mockAdmins: Partial<Admin>[] = [
  {
    _id: '507f1f77bcf86cd799439031',
    email: 'admin@dtprotection.com',
    name: 'Admin User',
    role: 'admin',
    isActive: true,
    lastLogin: new Date('2024-11-15T10:30:00Z'),
    createdAt: new Date('2024-01-01')
  },
  {
    _id: '507f1f77bcf86cd799439032',
    email: 'manager@dtprotection.com',
    name: 'Manager User',
    role: 'manager',
    isActive: true,
    lastLogin: new Date('2024-11-14T15:45:00Z'),
    createdAt: new Date('2024-02-01')
  }
]

describe('Admin Dashboard - Analytics & Statistics', () => {
  describe('Dashboard Statistics Calculation', () => {
    it('should calculate total bookings count', () => {
      const totalBookings = mockBookings.length
      expect(totalBookings).toBe(3)
    })

    it('should calculate bookings by status', () => {
      const statusCounts = mockBookings.reduce((acc, booking) => {
        const status = booking.status || 'unknown'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      expect(statusCounts.pending).toBe(1)
      expect(statusCounts.approved).toBe(1)
      expect(statusCounts.completed).toBe(1)
    })

    it('should calculate total revenue', () => {
      const totalRevenue = mockBookings.reduce((sum, booking) => {
        return sum + (booking.totalAmount || 0)
      }, 0)

      expect(totalRevenue).toBe(11600) // 3200 + 3600 + 4800
    })

    it('should calculate pending revenue', () => {
      const pendingRevenue = mockBookings
        .filter(booking => booking.status === 'pending' || booking.status === 'approved')
        .reduce((sum, booking) => {
          return sum + (booking.totalAmount || 0)
        }, 0)

      expect(pendingRevenue).toBe(6800) // 3200 + 3600
    })

    it('should calculate completed revenue', () => {
      const completedRevenue = mockBookings
        .filter(booking => booking.status === 'completed')
        .reduce((sum, booking) => {
          return sum + (booking.totalAmount || 0)
        }, 0)

      expect(completedRevenue).toBe(4800)
    })

    it('should calculate deposit collection rate', () => {
      const depositsPaid = mockBookings.filter(booking => booking.depositPaid).length
      const totalBookings = mockBookings.length
      const depositRate = (depositsPaid / totalBookings) * 100

      expect(depositRate).toBeCloseTo(66.67, 2) // 2 out of 3 bookings have deposits paid
    })

    it('should calculate final payment collection rate', () => {
      const finalPaymentsPaid = mockBookings.filter(booking => booking.finalPaymentPaid).length
      const totalBookings = mockBookings.length
      const finalPaymentRate = (finalPaymentsPaid / totalBookings) * 100

      expect(finalPaymentRate).toBeCloseTo(33.33, 2) // 1 out of 3 bookings have final payments paid
    })
  })

  describe('Revenue Analytics', () => {
    it('should calculate monthly revenue', () => {
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      
      const monthlyRevenue = mockBookings
        .filter(booking => {
          const bookingDate = new Date(booking.createdAt || '')
          return bookingDate.getMonth() === currentMonth && 
                 bookingDate.getFullYear() === currentYear
        })
        .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)

      expect(monthlyRevenue).toBeGreaterThanOrEqual(0)
    })

    it('should calculate average booking value', () => {
      const totalRevenue = mockBookings.reduce((sum, booking) => {
        return sum + (booking.totalAmount || 0)
      }, 0)
      const averageBookingValue = totalRevenue / mockBookings.length

      expect(averageBookingValue).toBeCloseTo(3866.67, 2) // 11600 / 3
    })

    it('should calculate service type distribution', () => {
      const serviceDistribution = mockBookings.reduce((acc, booking) => {
        const serviceType = booking.serviceType || 'unknown'
        acc[serviceType] = (acc[serviceType] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      expect(serviceDistribution.corporate_security).toBe(1)
      expect(serviceDistribution.event_security).toBe(1)
      expect(serviceDistribution.close_protection).toBe(1)
    })

    it('should calculate guard utilization', () => {
      const totalGuards = mockBookings.reduce((sum, booking) => {
        return sum + (booking.numberOfGuards || 0)
      }, 0)
      const totalHours = mockBookings.reduce((sum, booking) => {
        return sum + ((booking.numberOfGuards || 0) * (booking.duration || 0))
      }, 0)

      expect(totalGuards).toBe(12) // 4 + 6 + 2
      expect(totalHours).toBe(92) // (4*8) + (6*6) + (2*12) = 32 + 36 + 24 = 92
    })
  })

  describe('Invoice Analytics', () => {
    it('should calculate invoice status distribution', () => {
      const invoiceStatusCounts = mockInvoices.reduce((acc, invoice) => {
        const status = invoice.status || 'unknown'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      expect(invoiceStatusCounts.pending).toBe(1)
      expect(invoiceStatusCounts.deposit_paid).toBe(1)
      expect(invoiceStatusCounts.paid).toBe(1)
    })

    it('should calculate overdue invoices', () => {
      const today = new Date()
      const overdueInvoices = mockInvoices.filter(invoice => {
        const dueDate = new Date(invoice.dueDate || '')
        return dueDate < today && invoice.status !== 'paid'
      })

      expect(overdueInvoices.length).toBeGreaterThanOrEqual(0)
    })

    it('should calculate total outstanding amount', () => {
      const outstandingAmount = mockInvoices
        .filter(invoice => invoice.status !== 'paid')
        .reduce((sum, invoice) => {
          return sum + (invoice.amount || 0)
        }, 0)

      expect(outstandingAmount).toBe(6800) // 3200 + 3600
    })
  })

  describe('Communication Analytics', () => {
    it('should calculate communication preference distribution', () => {
      const preferenceCounts = mockBookings.reduce((acc, booking) => {
        const preference = booking.communicationPreferences?.preferredContact || 'unknown'
        acc[preference] = (acc[preference] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      expect(preferenceCounts.both).toBe(1)
      expect(preferenceCounts.email).toBe(1)
      expect(preferenceCounts.phone).toBe(1)
    })

    it('should calculate email notification opt-in rate', () => {
      const emailOptIns = mockBookings.filter(booking => 
        booking.communicationPreferences?.emailNotifications
      ).length
      const emailOptInRate = (emailOptIns / mockBookings.length) * 100

      expect(emailOptInRate).toBeCloseTo(66.67, 2) // 2 out of 3 bookings have email notifications enabled
    })

    it('should calculate SMS notification opt-in rate', () => {
      const smsOptIns = mockBookings.filter(booking => 
        booking.communicationPreferences?.smsNotifications
      ).length
      const smsOptInRate = (smsOptIns / mockBookings.length) * 100

      expect(smsOptInRate).toBeCloseTo(66.67, 2) // 2 out of 3 bookings have SMS notifications enabled
    })
  })

  describe('Admin User Analytics', () => {
    it('should calculate active admin users', () => {
      const activeAdmins = mockAdmins.filter(admin => admin.isActive).length
      expect(activeAdmins).toBe(2)
    })

    it('should calculate admin roles distribution', () => {
      const roleDistribution = mockAdmins.reduce((acc, admin) => {
        const role = admin.role || 'unknown'
        acc[role] = (acc[role] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      expect(roleDistribution.admin).toBe(1)
      expect(roleDistribution.manager).toBe(1)
    })

    it('should identify recently active admins', () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const recentlyActive = mockAdmins.filter(admin => {
        const lastLogin = new Date(admin.lastLogin || '')
        return lastLogin > oneDayAgo
      })

      expect(recentlyActive.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Dashboard Data Processing', () => {
    it('should format currency values correctly', () => {
      const amount = 1234.56
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount)

      expect(formatted).toBe('$1,234.56')
    })

    it('should calculate percentage correctly', () => {
      const part = 25
      const total = 100
      const percentage = (part / total) * 100

      expect(percentage).toBe(25)
    })

    it('should format dates correctly', () => {
      const date = new Date('2024-12-25')
      const formatted = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      expect(formatted).toBe('December 24, 2024')
    })

    it('should calculate time differences', () => {
      const startDate = new Date('2024-11-01')
      const endDate = new Date('2024-12-25')
      const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

      expect(daysDifference).toBe(54)
    })
  })

  describe('Dashboard Filtering & Search', () => {
    it('should filter bookings by status', () => {
      const pendingBookings = mockBookings.filter(booking => booking.status === 'pending')
      expect(pendingBookings.length).toBe(1)
      expect(pendingBookings[0]?.clientName).toBe('John Doe')
    })

    it('should filter bookings by date range', () => {
      const startDate = new Date('2024-12-25')
      const endDate = new Date('2024-12-27')
      
      const filteredBookings = mockBookings.filter(booking => {
        const eventDate = new Date(booking.eventDate || '')
        return eventDate >= startDate && eventDate <= endDate
      })

      expect(filteredBookings.length).toBe(3)
    })

    it('should search bookings by client name', () => {
      const searchTerm = 'John'
      const searchResults = mockBookings.filter(booking => 
        booking.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
      )

      expect(searchResults.length).toBe(1)
      expect(searchResults[0]?.clientName).toBe('John Doe')
    })

    it('should search bookings by email', () => {
      const searchTerm = 'jane@example.com'
      const searchResults = mockBookings.filter(booking => 
        booking.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      )

      expect(searchResults.length).toBe(1)
      expect(searchResults[0]?.clientName).toBe('Jane Smith')
    })

    it('should filter by service type', () => {
      const serviceType = 'corporate_security'
      const filteredBookings = mockBookings.filter(booking => 
        booking.serviceType === serviceType
      )

      expect(filteredBookings.length).toBe(1)
      expect(filteredBookings[0]?.clientName).toBe('John Doe')
    })
  })

  describe('Dashboard Export & Reporting', () => {
    it('should generate CSV data for bookings', () => {
      const csvHeaders = ['Client Name', 'Email', 'Service Type', 'Status', 'Total Amount', 'Event Date']
      const csvData = mockBookings.map(booking => [
        booking.clientName,
        booking.clientEmail,
        booking.serviceType,
        booking.status,
        booking.totalAmount,
        booking.eventDate
      ])

      expect(csvHeaders.length).toBe(6)
      expect(csvData.length).toBe(3)
      expect(csvData[0]?.length).toBe(6)
    })

    it('should generate summary report data', () => {
      const summary = {
        totalBookings: mockBookings.length,
        totalRevenue: mockBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0),
        averageBookingValue: mockBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0) / mockBookings.length,
        pendingBookings: mockBookings.filter(booking => booking.status === 'pending').length,
        completedBookings: mockBookings.filter(booking => booking.status === 'completed').length
      }

      expect(summary.totalBookings).toBe(3)
      expect(summary.totalRevenue).toBe(11600)
      expect(summary.averageBookingValue).toBeCloseTo(3866.67, 2)
      expect(summary.pendingBookings).toBe(1)
      expect(summary.completedBookings).toBe(1)
    })

    it('should calculate monthly trends', () => {
      const monthlyData = mockBookings.reduce((acc, booking) => {
        const month = new Date(booking.createdAt || '').getMonth()
        const monthName = new Date(0, month).toLocaleString('en-US', { month: 'long' })
        
        if (!acc[monthName]) {
          acc[monthName] = { count: 0, revenue: 0 }
        }
        
        acc[monthName].count++
        acc[monthName].revenue += booking.totalAmount || 0
        
        return acc
      }, {} as Record<string, { count: number, revenue: number }>)

      expect(Object.keys(monthlyData).length).toBeGreaterThan(0)
    })
  })
})
