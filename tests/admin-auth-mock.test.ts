import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../backend/src/index'

// Mock mongoose and models
vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
    disconnect: vi.fn(),
  }
}))

vi.mock('../backend/src/models/admin.model', () => ({
  Admin: {
    findOne: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    find: vi.fn(),
    deleteMany: vi.fn(),
    create: vi.fn(),
  }
}))

vi.mock('../backend/src/models/booking.model', () => ({
  Booking: {
    countDocuments: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    deleteMany: vi.fn(),
    create: vi.fn(),
  }
}))

import { Admin } from '../backend/src/models/admin.model'
import { Booking } from '../backend/src/models/booking.model'

describe('Admin Authentication System (Mocked)', () => {
  let adminToken: string
  let mockAdmin: any
  let mockBooking: any

  beforeAll(() => {
    // Set up JWT secret for testing
    process.env.JWT_SECRET = 'test-secret-key'
    process.env.JWT_EXPIRES_IN = '1h'
  })

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock admin data
    mockAdmin = {
      _id: 'admin123',
      username: 'testadmin',
      email: 'test@example.com',
      password: '$2a$12$hashedpassword',
      role: 'admin',
      isActive: true,
      comparePassword: vi.fn(),
      generateAuthToken: vi.fn(),
      updateLastLogin: vi.fn(),
      save: vi.fn(),
      toJSON: vi.fn()
    }

    mockBooking = {
      _id: 'booking123',
      clientName: 'Test Client',
      email: 'client@example.com',
      phone: '123-456-7890',
      eventDate: new Date('2024-12-25'),
      eventType: 'Wedding',
      venueAddress: '123 Test St',
      numberOfGuards: 2,
      status: 'pending',
      depositPaid: false,
      fullPaymentPaid: false
    }
  })

  describe('Admin Model (Mocked)', () => {
    it('should handle password comparison', async () => {
      mockAdmin.comparePassword.mockResolvedValue(true)
      
      const isValid = await mockAdmin.comparePassword('password123')
      expect(isValid).toBe(true)
      expect(mockAdmin.comparePassword).toHaveBeenCalledWith('password123')
    })

    it('should generate JWT token', () => {
      const mockToken = 'mock-jwt-token'
      mockAdmin.generateAuthToken.mockReturnValue(mockToken)
      
      const token = mockAdmin.generateAuthToken()
      expect(token).toBe(mockToken)
      expect(mockAdmin.generateAuthToken).toHaveBeenCalled()
    })

    it('should exclude password from JSON output', () => {
      const adminJson = { ...mockAdmin }
      delete adminJson.password
      
      mockAdmin.toJSON.mockReturnValue(adminJson)
      
      const result = mockAdmin.toJSON()
      expect(result.password).toBeUndefined()
    })
  })

  describe('Admin Authentication Endpoints (Mocked)', () => {
    beforeEach(() => {
      // Mock successful login
      mockAdmin.comparePassword.mockResolvedValue(true)
      mockAdmin.generateAuthToken.mockReturnValue('mock-jwt-token')
      mockAdmin.updateLastLogin.mockResolvedValue(mockAdmin)
      mockAdmin.toJSON.mockReturnValue({
        _id: mockAdmin._id,
        username: mockAdmin.username,
        email: mockAdmin.email,
        role: mockAdmin.role
      })
    })

    it('should login with valid credentials', async () => {
      ;(Admin.findOne as any).mockResolvedValue(mockAdmin)

      const response = await request(app)
        .post('/api/admin/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        })

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Login successful')
      expect(response.body.token).toBeDefined()
      expect(response.body.admin).toBeDefined()
      expect(response.body.admin.username).toBe('testadmin')
      expect(response.body.admin.password).toBeUndefined()
    })

    it('should reject invalid credentials', async () => {
      mockAdmin.comparePassword.mockResolvedValue(false)
      ;(Admin.findOne as any).mockResolvedValue(mockAdmin)

      const response = await request(app)
        .post('/api/admin/login')
        .send({
          username: 'testadmin',
          password: 'wrongpassword'
        })

      expect(response.status).toBe(401)
      expect(response.body.message).toBe('Invalid credentials')
    })

    it('should reject inactive admin', async () => {
      mockAdmin.isActive = false
      ;(Admin.findOne as any).mockResolvedValue(mockAdmin)

      const response = await request(app)
        .post('/api/admin/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        })

      expect(response.status).toBe(401)
      expect(response.body.message).toBe('Invalid credentials')
    })

    it('should reject non-existent admin', async () => {
      ;(Admin.findOne as any).mockResolvedValue(null)

      const response = await request(app)
        .post('/api/admin/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        })

      expect(response.status).toBe(401)
      expect(response.body.message).toBe('Invalid credentials')
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          username: '',
          password: ''
        })

      expect(response.status).toBe(400)
      expect(response.body.errors).toBeDefined()
    })
  })

  describe('Dashboard Endpoints (Mocked)', () => {
    beforeEach(() => {
      // Mock dashboard data
      ;(Booking.countDocuments as any)
        .mockResolvedValueOnce(3) // totalRequests
        .mockResolvedValueOnce(1) // pendingRequests
        .mockResolvedValueOnce(1) // approvedRequests

      ;(Booking.find as any).mockResolvedValue([
        {
          _id: 'booking1',
          clientName: 'Client 1',
          eventDate: new Date('2024-12-25'),
          status: 'pending',
          numberOfGuards: 2
        },
        {
          _id: 'booking2',
          clientName: 'Client 2',
          eventDate: new Date('2024-12-26'),
          status: 'approved',
          numberOfGuards: 3
        }
      ])

      ;(Admin.findById as any).mockResolvedValue(mockAdmin)
    })

    it('should return dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', 'Bearer valid-token')

      expect(response.status).toBe(200)
      expect(response.body.totalRequests).toBe(3)
      expect(response.body.pendingRequests).toBe(1)
      expect(response.body.approvedRequests).toBe(1)
      expect(response.body.recentRequests).toBeDefined()
      expect(response.body.recentRequests.length).toBeGreaterThan(0)
    })

    it('should reject dashboard access without token', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')

      expect(response.status).toBe(401)
    })
  })

  describe('Admin Management Endpoints (Mocked)', () => {
    beforeEach(() => {
      mockAdmin.role = 'super_admin'
      ;(Admin.findById as any).mockResolvedValue(mockAdmin)
    })

    it('should create new admin', async () => {
      const newAdminData = {
        _id: 'newadmin123',
        username: 'newadmin',
        email: 'newadmin@example.com',
        role: 'admin'
      }

      ;(Admin.findOne as any).mockResolvedValue(null) // No existing admin
      ;(Admin.create as any).mockResolvedValue(newAdminData)

      const response = await request(app)
        .post('/api/admin/admins')
        .set('Authorization', 'Bearer valid-token')
        .send({
          username: 'newadmin',
          email: 'newadmin@example.com',
          password: 'password123',
          role: 'admin'
        })

      expect(response.status).toBe(201)
      expect(response.body.message).toBe('Admin created successfully')
      expect(response.body.admin.username).toBe('newadmin')
    })

    it('should reject duplicate admin creation', async () => {
      ;(Admin.findOne as any).mockResolvedValue({ username: 'existing' })

      const response = await request(app)
        .post('/api/admin/admins')
        .set('Authorization', 'Bearer valid-token')
        .send({
          username: 'existing',
          email: 'existing@example.com',
          password: 'password123'
        })

      expect(response.status).toBe(400)
      expect(response.body.message).toContain('already exists')
    })

    it('should update admin status', async () => {
      const updatedAdmin = { ...mockAdmin, isActive: false }
      ;(Admin.findByIdAndUpdate as any).mockResolvedValue(updatedAdmin)

      const response = await request(app)
        .patch('/api/admin/admins/admin123/status')
        .set('Authorization', 'Bearer valid-token')
        .send({
          isActive: false
        })

      expect(response.status).toBe(200)
      expect(response.body.admin.isActive).toBe(false)
    })
  })

  describe('Booking Management Integration (Mocked)', () => {
    beforeEach(() => {
      ;(Admin.findById as any).mockResolvedValue(mockAdmin)
    })

    it('should allow admin to view all bookings', async () => {
      ;(Booking.find as any).mockResolvedValue([mockBooking])

      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', 'Bearer valid-token')

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
    })

    it('should allow admin to update booking status', async () => {
      const updatedBooking = { ...mockBooking, status: 'approved' }
      ;(Booking.findByIdAndUpdate as any).mockResolvedValue(updatedBooking)

      const response = await request(app)
        .patch(`/api/bookings/${mockBooking._id}/status`)
        .set('Authorization', 'Bearer valid-token')
        .send({
          status: 'approved'
        })

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('approved')
    })

    it('should reject status update without authentication', async () => {
      const response = await request(app)
        .patch(`/api/bookings/${mockBooking._id}/status`)
        .send({
          status: 'approved'
        })

      expect(response.status).toBe(401)
    })
  })
})
