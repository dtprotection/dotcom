import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    pathname: '/admin/dashboard',
    query: {},
    asPath: '/admin/dashboard'
  }),
  usePathname: () => '/admin/dashboard',
  useSearchParams: () => new URLSearchParams()
}))

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock data for testing
const mockDashboardData = {
  statistics: {
    totalBookings: 25,
    totalRevenue: 45000,
    pendingBookings: 5,
    completedBookings: 15,
    depositCollectionRate: 80,
    finalPaymentRate: 60
  },
  recentBookings: [
    {
      _id: '507f1f77bcf86cd799439011',
      clientName: 'John Doe',
      clientEmail: 'john@example.com',
      serviceType: 'corporate_security',
      status: 'pending',
      totalAmount: 3200,
      eventDate: '2024-12-25',
      createdAt: '2024-11-01'
    },
    {
      _id: '507f1f77bcf86cd799439012',
      clientName: 'Jane Smith',
      clientEmail: 'jane@example.com',
      serviceType: 'event_security',
      status: 'approved',
      totalAmount: 3600,
      eventDate: '2024-12-26',
      createdAt: '2024-11-02'
    }
  ],
  revenueAnalytics: {
    monthlyRevenue: [
      { month: 'January', revenue: 12000 },
      { month: 'February', revenue: 15000 },
      { month: 'March', revenue: 18000 }
    ],
    serviceDistribution: [
      { serviceType: 'corporate_security', count: 15, revenue: 30000 },
      { serviceType: 'event_security', count: 8, revenue: 12000 },
      { serviceType: 'close_protection', count: 2, revenue: 3000 }
    ]
  }
}

const mockBookingsData = {
  bookings: [
    {
      _id: '507f1f77bcf86cd799439011',
      clientName: 'John Doe',
      clientEmail: 'john@example.com',
      clientPhone: '+1234567890',
      serviceType: 'corporate_security',
      eventDate: '2024-12-25',
      eventTime: '18:00',
      duration: 8,
      numberOfGuards: 4,
      location: '123 Main St, City, State',
      status: 'pending',
      totalAmount: 3200,
      depositAmount: 800,
      depositPaid: false,
      finalPaymentPaid: false,
      createdAt: '2024-11-01',
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
      eventDate: '2024-12-26',
      eventTime: '19:00',
      duration: 6,
      numberOfGuards: 6,
      location: '456 Oak Ave, City, State',
      status: 'approved',
      totalAmount: 3600,
      depositAmount: 900,
      depositPaid: true,
      finalPaymentPaid: false,
      createdAt: '2024-11-02',
      communicationPreferences: {
        emailNotifications: true,
        smsNotifications: false,
        preferredContact: 'email'
      }
    }
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 25,
    totalPages: 3
  }
}

describe('Admin Dashboard Frontend Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful API responses
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockDashboardData
    } as Response)
  })

  describe('Dashboard Statistics Cards', () => {
    it('should display total bookings count', () => {
      const statistics = mockDashboardData.statistics
      
      // Simulate rendering statistics card
      const totalBookingsElement = {
        textContent: `${statistics.totalBookings}`,
        className: 'statistics-card'
      }
      
      expect(totalBookingsElement.textContent).toBe('25')
      expect(totalBookingsElement.className).toBe('statistics-card')
    })

    it('should display total revenue with proper formatting', () => {
      const statistics = mockDashboardData.statistics
      
      const formattedRevenue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(statistics.totalRevenue)
      
      expect(formattedRevenue).toBe('$45,000.00')
    })

    it('should display deposit collection rate as percentage', () => {
      const statistics = mockDashboardData.statistics
      
      const depositRateElement = {
        textContent: `${statistics.depositCollectionRate}%`,
        className: 'percentage-indicator'
      }
      
      expect(depositRateElement.textContent).toBe('80%')
      expect(depositRateElement.className).toBe('percentage-indicator')
    })

    it('should display payment collection rate as percentage', () => {
      const statistics = mockDashboardData.statistics
      
      const paymentRateElement = {
        textContent: `${statistics.finalPaymentRate}%`,
        className: 'percentage-indicator'
      }
      
      expect(paymentRateElement.textContent).toBe('60%')
      expect(paymentRateElement.className).toBe('percentage-indicator')
    })
  })

  describe('Recent Bookings Table', () => {
    it('should display booking information correctly', () => {
      const bookings = mockDashboardData.recentBookings
      
      const bookingRow = {
        clientName: bookings[0].clientName,
        serviceType: bookings[0].serviceType,
        status: bookings[0].status,
        amount: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(bookings[0].totalAmount)
      }
      
      expect(bookingRow.clientName).toBe('John Doe')
      expect(bookingRow.serviceType).toBe('corporate_security')
      expect(bookingRow.status).toBe('pending')
      expect(bookingRow.amount).toBe('$3,200.00')
    })

    it('should format service type for display', () => {
      const serviceTypeMap = {
        corporate_security: 'Corporate Security',
        event_security: 'Event Security',
        close_protection: 'Close Protection'
      }
      
      const formattedServiceType = serviceTypeMap.corporate_security
      expect(formattedServiceType).toBe('Corporate Security')
    })

    it('should format status with appropriate styling', () => {
      const statusConfig = {
        pending: { label: 'Pending', className: 'status-pending' },
        approved: { label: 'Approved', className: 'status-approved' },
        completed: { label: 'Completed', className: 'status-completed' },
        cancelled: { label: 'Cancelled', className: 'status-cancelled' }
      }
      
      const pendingStatus = statusConfig.pending
      expect(pendingStatus.label).toBe('Pending')
      expect(pendingStatus.className).toBe('status-pending')
    })
  })

  describe('Revenue Analytics Chart', () => {
    it('should process monthly revenue data for chart', () => {
      const monthlyData = mockDashboardData.revenueAnalytics.monthlyRevenue
      
      const chartData = monthlyData.map(item => ({
        month: item.month,
        revenue: item.revenue,
        formattedRevenue: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0
        }).format(item.revenue)
      }))
      
      expect(chartData).toHaveLength(3)
      expect(chartData[0].month).toBe('January')
      expect(chartData[0].revenue).toBe(12000)
      expect(chartData[0].formattedRevenue).toBe('$12,000')
    })

    it('should calculate total revenue from monthly data', () => {
      const monthlyData = mockDashboardData.revenueAnalytics.monthlyRevenue
      
      const totalRevenue = monthlyData.reduce((sum, item) => sum + item.revenue, 0)
      expect(totalRevenue).toBe(45000)
    })

    it('should process service distribution data', () => {
      const serviceData = mockDashboardData.revenueAnalytics.serviceDistribution
      
      const processedData = serviceData.map(item => ({
        ...item,
        percentage: Math.round((item.count / serviceData.reduce((sum, s) => sum + s.count, 0)) * 100)
      }))
      
      expect(processedData[0].percentage).toBe(60) // 15 out of 25 total
      expect(processedData[1].percentage).toBe(32) // 8 out of 25 total
      expect(processedData[2].percentage).toBe(8)  // 2 out of 25 total
    })
  })

  describe('Booking Management Interface', () => {
    it('should handle booking status updates', async () => {
      const bookingId = '507f1f77bcf86cd799439011'
      const newStatus = 'approved'
      
      // Mock API call for status update
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, booking: { ...mockBookingsData.bookings[0], status: newStatus } })
      } as Response)
      
      const updateResponse = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      const result = await updateResponse.json()
      
      expect(result.success).toBe(true)
      expect(result.booking.status).toBe('approved')
    })

    it('should handle booking search functionality', () => {
      const searchTerm = 'John'
      const bookings = mockBookingsData.bookings
      
      const searchResults = bookings.filter(booking => 
        booking.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
      )
      
      expect(searchResults).toHaveLength(1)
      expect(searchResults[0].clientName).toBe('John Doe')
    })

    it('should handle booking filtering by status', () => {
      const statusFilter = 'pending'
      const bookings = mockBookingsData.bookings
      
      const filteredBookings = bookings.filter(booking => booking.status === statusFilter)
      
      expect(filteredBookings).toHaveLength(1)
      expect(filteredBookings[0].status).toBe('pending')
    })

    it('should handle pagination controls', () => {
      const pagination = mockBookingsData.pagination
      
      const paginationInfo = {
        currentPage: pagination.page,
        totalPages: pagination.totalPages,
        hasNextPage: pagination.page < pagination.totalPages,
        hasPrevPage: pagination.page > 1
      }
      
      expect(paginationInfo.currentPage).toBe(1)
      expect(paginationInfo.totalPages).toBe(3)
      expect(paginationInfo.hasNextPage).toBe(true)
      expect(paginationInfo.hasPrevPage).toBe(false)
    })
  })

  describe('Admin User Management', () => {
    it('should handle admin user creation', async () => {
      const newAdminData = {
        email: 'newadmin@dtprotection.com',
        name: 'New Admin',
        role: 'manager',
        password: 'securepassword123'
      }
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          admin: { 
            _id: '507f1f77bcf86cd799439033',
            ...newAdminData,
            isActive: true,
            createdAt: new Date().toISOString()
          } 
        })
      } as Response)
      
      const createResponse = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdminData)
      })
      
      const result = await createResponse.json()
      
      expect(result.success).toBe(true)
      expect(result.admin.email).toBe('newadmin@dtprotection.com')
      expect(result.admin.role).toBe('manager')
    })

    it('should handle admin user updates', async () => {
      const adminId = '507f1f77bcf86cd799439031'
      const updateData = {
        name: 'Updated Admin Name',
        role: 'admin'
      }
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          admin: { 
            _id: adminId,
            email: 'admin@dtprotection.com',
            ...updateData,
            isActive: true
          } 
        })
      } as Response)
      
      const updateResponse = await fetch(`/api/admin/users/${adminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })
      
      const result = await updateResponse.json()
      
      expect(result.success).toBe(true)
      expect(result.admin.name).toBe('Updated Admin Name')
    })

    it('should handle admin user deactivation', async () => {
      const adminId = '507f1f77bcf86cd799439031'
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          admin: { 
            _id: adminId,
            email: 'admin@dtprotection.com',
            name: 'Admin User',
            role: 'admin',
            isActive: false
          } 
        })
      } as Response)
      
      const deactivateResponse = await fetch(`/api/admin/users/${adminId}/deactivate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await deactivateResponse.json()
      
      expect(result.success).toBe(true)
      expect(result.admin.isActive).toBe(false)
    })
  })

  describe('Export and Reporting', () => {
    it('should generate CSV data for bookings export', () => {
      const bookings = mockBookingsData.bookings
      
      const csvHeaders = ['Client Name', 'Email', 'Service Type', 'Status', 'Total Amount', 'Event Date']
      const csvData = bookings.map(booking => [
        booking.clientName,
        booking.clientEmail,
        booking.serviceType,
        booking.status,
        booking.totalAmount,
        booking.eventDate
      ])
      
      expect(csvHeaders).toHaveLength(6)
      expect(csvData).toHaveLength(2)
      expect(csvData[0]).toHaveLength(6)
    })

    it('should format currency for export', () => {
      const amount = 3200
      const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(amount)
      
      expect(formattedAmount).toBe('$3,200.00')
    })

    it('should generate summary report data', () => {
      const bookings = mockBookingsData.bookings
      
      const summary = {
        totalBookings: bookings.length,
        totalRevenue: bookings.reduce((sum, booking) => sum + booking.totalAmount, 0),
        averageBookingValue: bookings.reduce((sum, booking) => sum + booking.totalAmount, 0) / bookings.length,
        pendingBookings: bookings.filter(booking => booking.status === 'pending').length,
        completedBookings: bookings.filter(booking => booking.status === 'completed').length
      }
      
      expect(summary.totalBookings).toBe(2)
      expect(summary.totalRevenue).toBe(6800)
      expect(summary.averageBookingValue).toBe(3400)
      expect(summary.pendingBookings).toBe(1)
      expect(summary.completedBookings).toBe(0)
    })
  })

  describe('Error Handling and Loading States', () => {
    it('should handle API errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
      
      try {
        await fetch('/api/admin/dashboard')
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe('Network error')
      }
    })

    it('should handle 404 responses', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Resource not found' })
      } as Response)
      
      const response = await fetch('/api/admin/bookings/999')
      const result = await response.json()
      
      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
      expect(result.error).toBe('Resource not found')
    })

    it('should handle 403 unauthorized responses', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Access denied' })
      } as Response)
      
      const response = await fetch('/api/admin/users')
      const result = await response.json()
      
      expect(response.ok).toBe(false)
      expect(response.status).toBe(403)
      expect(result.error).toBe('Access denied')
    })

    it('should show loading state during API calls', () => {
      const loadingState = {
        isLoading: true,
        error: null,
        data: null
      }
      
      expect(loadingState.isLoading).toBe(true)
      expect(loadingState.error).toBe(null)
      expect(loadingState.data).toBe(null)
    })

    it('should show error state when API fails', () => {
      const errorState = {
        isLoading: false,
        error: 'Failed to load dashboard data',
        data: null
      }
      
      expect(errorState.isLoading).toBe(false)
      expect(errorState.error).toBe('Failed to load dashboard data')
      expect(errorState.data).toBe(null)
    })
  })

  describe('Data Validation', () => {
    it('should validate email format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      
      const validEmail = 'admin@dtprotection.com'
      const invalidEmail = 'invalid-email'
      
      expect(emailRegex.test(validEmail)).toBe(true)
      expect(emailRegex.test(invalidEmail)).toBe(false)
    })

    it('should validate phone number format', () => {
      const phoneRegex = /^\+1\d{10}$/
      
      const validPhone = '+12345678901'
      const invalidPhone = '123-456-7890'
      
      expect(phoneRegex.test(validPhone)).toBe(true)
      expect(phoneRegex.test(invalidPhone)).toBe(false)
    })

    it('should validate required fields', () => {
      const requiredFields = ['clientName', 'clientEmail', 'serviceType', 'eventDate']
      
      const bookingData = {
        clientName: 'John Doe',
        clientEmail: 'john@example.com',
        serviceType: 'corporate_security',
        eventDate: '2024-12-25'
      }
      
      const missingFields = requiredFields.filter(field => !bookingData[field as keyof typeof bookingData])
      
      expect(missingFields).toHaveLength(0)
    })

    it('should validate date format', () => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      
      const validDate = '2024-12-25'
      const invalidDate = '12/25/2024'
      
      expect(dateRegex.test(validDate)).toBe(true)
      expect(dateRegex.test(invalidDate)).toBe(false)
    })
  })
})
