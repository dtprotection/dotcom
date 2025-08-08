import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { app } from '../backend/src/index'
import { Admin } from '../backend/src/models/admin.model'
import { Booking } from '../backend/src/models/booking.model'

// Test database connection
const TEST_MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/dtprotection-test'

describe('Admin Authentication System', () => {
  let adminToken: string
  let testAdmin: any
  let testBooking: any

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(TEST_MONGODB_URI)
    
    // Clear test collections
    await Admin.deleteMany({})
    await Booking.deleteMany({})
  })

  afterAll(async () => {
    // Clean up and disconnect
    await Admin.deleteMany({})
    await Booking.deleteMany({})
    await mongoose.disconnect()
  })

  beforeEach(async () => {
    // Clear data before each test
    await Admin.deleteMany({})
    await Booking.deleteMany({})
  })

  describe('Admin Model', () => {
    it('should create an admin with hashed password', async () => {
      const adminData = {
        username: 'testadmin',
        email: 'test@example.com',
        password: 'password123',
        role: 'admin'
      }

      const admin = new Admin(adminData)
      await admin.save()

      expect(admin.username).toBe('testadmin')
      expect(admin.email).toBe('test@example.com')
      expect(admin.password).not.toBe('password123') // Should be hashed
      expect(admin.role).toBe('admin')
      expect(admin.isActive).toBe(true)
    })

    it('should validate password correctly', async () => {
      const admin = new Admin({
        username: 'testadmin',
        email: 'test@example.com',
        password: 'password123'
      })
      await admin.save()

      const isValid = await admin.comparePassword('password123')
      const isInvalid = await admin.comparePassword('wrongpassword')

      expect(isValid).toBe(true)
      expect(isInvalid).toBe(false)
    })

    it('should generate valid JWT token', async () => {
      const admin = new Admin({
        username: 'testadmin',
        email: 'test@example.com',
        password: 'password123'
      })
      await admin.save()

      const token = admin.generateAuthToken()
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')

      // Verify token can be decoded
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key') as any
      expect(decoded.id).toBe(admin._id.toString())
      expect(decoded.username).toBe('testadmin')
    })

    it('should not include password in JSON output', async () => {
      const admin = new Admin({
        username: 'testadmin',
        email: 'test@example.com',
        password: 'password123'
      })
      await admin.save()

      const adminJson = admin.toJSON()
      expect(adminJson.password).toBeUndefined()
    })
  })

  describe('Admin Authentication Endpoints', () => {
    beforeEach(async () => {
      // Create test admin
      testAdmin = new Admin({
        username: 'testadmin',
        email: 'test@example.com',
        password: 'password123',
        role: 'admin'
      })
      await testAdmin.save()
    })

    it('should login with valid credentials', async () => {
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

      adminToken = response.body.token
    })

    it('should login with email as username', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          username: 'test@example.com',
          password: 'password123'
        })

      expect(response.status).toBe(200)
      expect(response.body.token).toBeDefined()
    })

    it('should reject invalid credentials', async () => {
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
      testAdmin.isActive = false
      await testAdmin.save()

      const response = await request(app)
        .post('/api/admin/login')
        .send({
          username: 'testadmin',
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

    it('should verify valid token', async () => {
      // First login to get token
      const loginResponse = await request(app)
        .post('/api/admin/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        })

      const token = loginResponse.body.token

      const response = await request(app)
        .get('/api/admin/verify')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Token valid')
      expect(response.body.admin).toBeDefined()
    })

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/admin/verify')
        .set('Authorization', 'Bearer invalid-token')

      expect(response.status).toBe(401)
      expect(response.body.message).toBe('Invalid token')
    })

    it('should reject missing token', async () => {
      const response = await request(app)
        .get('/api/admin/verify')

      expect(response.status).toBe(401)
      expect(response.body.message).toBe('Access token required')
    })
  })

  describe('Dashboard Endpoints', () => {
    beforeEach(async () => {
      // Create test admin and login
      testAdmin = new Admin({
        username: 'testadmin',
        email: 'test@example.com',
        password: 'password123',
        role: 'admin'
      })
      await testAdmin.save()

      const loginResponse = await request(app)
        .post('/api/admin/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        })

      adminToken = loginResponse.body.token

      // Create test bookings
      testBooking = new Booking({
        clientName: 'Test Client',
        email: 'client@example.com',
        phone: '123-456-7890',
        eventDate: new Date('2024-12-25'),
        eventType: 'Wedding',
        venueAddress: '123 Test St',
        numberOfGuards: 2,
        status: 'pending'
      })
      await testBooking.save()

      // Create additional bookings for testing
      await Booking.create([
        {
          clientName: 'Client 2',
          email: 'client2@example.com',
          phone: '123-456-7891',
          eventDate: new Date('2024-12-26'),
          eventType: 'Corporate Event',
          venueAddress: '456 Test Ave',
          numberOfGuards: 3,
          status: 'approved'
        },
        {
          clientName: 'Client 3',
          email: 'client3@example.com',
          phone: '123-456-7892',
          eventDate: new Date('2024-12-27'),
          eventType: 'Birthday Party',
          venueAddress: '789 Test Blvd',
          numberOfGuards: 1,
          status: 'rejected'
        }
      ])
    })

    it('should return dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.totalRequests).toBe(3)
      expect(response.body.pendingRequests).toBe(1)
      expect(response.body.approvedRequests).toBe(1)
      expect(response.body.totalRevenue).toBe(900) // 3 approved bookings * 300 (2+3+1 guards * 150)
      expect(response.body.recentRequests).toBeDefined()
      expect(response.body.recentRequests.length).toBeGreaterThan(0)
    })

    it('should reject dashboard access without token', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')

      expect(response.status).toBe(401)
    })

    it('should reject dashboard access with invalid token', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', 'Bearer invalid-token')

      expect(response.status).toBe(401)
    })
  })

  describe('Admin Management Endpoints', () => {
    beforeEach(async () => {
      // Create super admin
      testAdmin = new Admin({
        username: 'superadmin',
        email: 'super@example.com',
        password: 'password123',
        role: 'super_admin'
      })
      await testAdmin.save()

      const loginResponse = await request(app)
        .post('/api/admin/login')
        .send({
          username: 'superadmin',
          password: 'password123'
        })

      adminToken = loginResponse.body.token
    })

    it('should create new admin', async () => {
      const response = await request(app)
        .post('/api/admin/admins')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'newadmin',
          email: 'newadmin@example.com',
          password: 'password123',
          role: 'admin'
        })

      expect(response.status).toBe(201)
      expect(response.body.message).toBe('Admin created successfully')
      expect(response.body.admin.username).toBe('newadmin')
      expect(response.body.admin.password).toBeUndefined()

      // Verify admin was created in database
      const newAdmin = await Admin.findOne({ username: 'newadmin' })
      expect(newAdmin).toBeDefined()
      expect(newAdmin?.role).toBe('admin')
    })

    it('should reject duplicate admin creation', async () => {
      // Create admin first
      await request(app)
        .post('/api/admin/admins')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'newadmin',
          email: 'newadmin@example.com',
          password: 'password123'
        })

      // Try to create duplicate
      const response = await request(app)
        .post('/api/admin/admins')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'newadmin',
          email: 'newadmin@example.com',
          password: 'password123'
        })

      expect(response.status).toBe(400)
      expect(response.body.message).toContain('already exists')
    })

    it('should validate admin creation fields', async () => {
      const response = await request(app)
        .post('/api/admin/admins')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'a', // Too short
          email: 'invalid-email',
          password: '123' // Too short
        })

      expect(response.status).toBe(400)
      expect(response.body.errors).toBeDefined()
    })

    it('should update admin status', async () => {
      // Create admin first
      const createResponse = await request(app)
        .post('/api/admin/admins')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'statusadmin',
          email: 'status@example.com',
          password: 'password123'
        })

      const adminId = createResponse.body.admin.id

      // Update status
      const response = await request(app)
        .patch(`/api/admin/admins/${adminId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isActive: false
        })

      expect(response.status).toBe(200)
      expect(response.body.admin.isActive).toBe(false)
    })

    it('should change admin password', async () => {
      const response = await request(app)
        .patch('/api/admin/change-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        })

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Password updated successfully')

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/admin/login')
        .send({
          username: 'superadmin',
          password: 'newpassword123'
        })

      expect(loginResponse.status).toBe(200)
    })

    it('should reject password change with wrong current password', async () => {
      const response = await request(app)
        .patch('/api/admin/change-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        })

      expect(response.status).toBe(401)
      expect(response.body.message).toBe('Current password is incorrect')
    })
  })

  describe('Booking Management Integration', () => {
    beforeEach(async () => {
      // Create admin and login
      testAdmin = new Admin({
        username: 'testadmin',
        email: 'test@example.com',
        password: 'password123',
        role: 'admin'
      })
      await testAdmin.save()

      const loginResponse = await request(app)
        .post('/api/admin/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        })

      adminToken = loginResponse.body.token

      // Create test booking
      testBooking = new Booking({
        clientName: 'Test Client',
        email: 'client@example.com',
        phone: '123-456-7890',
        eventDate: new Date('2024-12-25'),
        eventType: 'Wedding',
        venueAddress: '123 Test St',
        numberOfGuards: 2,
        status: 'pending'
      })
      await testBooking.save()
    })

    it('should allow admin to view all bookings', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
    })

    it('should allow admin to update booking status', async () => {
      const response = await request(app)
        .patch(`/api/bookings/${testBooking._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'approved'
        })

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('approved')

      // Verify in database
      const updatedBooking = await Booking.findById(testBooking._id)
      expect(updatedBooking?.status).toBe('approved')
    })

    it('should reject status update without authentication', async () => {
      const response = await request(app)
        .patch(`/api/bookings/${testBooking._id}/status`)
        .send({
          status: 'approved'
        })

      expect(response.status).toBe(401)
    })
  })
})
