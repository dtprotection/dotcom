import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { createApiApp } from '../../backend/src/api'
import mongoose from 'mongoose'
import { Admin } from '../../backend/src/models/admin.model'
import { Booking } from '../../backend/src/models/booking.model'

describe('Booking Flow Integration Tests', () => {
  let app: any
  let adminToken: string
  let testAdminId: string

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dtprotection-test'
    await mongoose.connect(mongoUri)
    
    // Create API app
    app = createApiApp()
  })

  afterAll(async () => {
    // Clean up
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
  })

  beforeEach(async () => {
    // Clean collections before each test
    await Admin.deleteMany({})
    await Booking.deleteMany({})

    // Create test admin
    const admin = new Admin({
      username: 'testadmin',
      email: 'admin@test.com',
      password: 'Test123456!',
      isActive: true
    })
    await admin.save()
    testAdminId = admin._id.toString()

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/admin/login')
      .send({
        username: 'testadmin',
        password: 'Test123456!'
      })
    
    adminToken = loginResponse.body.token
  })

  describe('Complete Booking Flow', () => {
    it('should create a booking, update status, and generate invoice', async () => {
      // Step 1: Create booking
      const createBookingResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientName: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          serviceType: 'Executive Protection',
          date: '2024-12-25',
          location: 'New York, NY',
          numberOfGuards: 2,
          duration: 8,
          specialRequirements: 'High-profile client'
        })

      expect(createBookingResponse.status).toBe(201)
      expect(createBookingResponse.body.booking).toBeDefined()
      const bookingId = createBookingResponse.body.booking._id

      // Step 2: Verify booking was created
      const getBookingResponse = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(getBookingResponse.status).toBe(200)
      expect(getBookingResponse.body.booking.clientName).toBe('John Doe')
      expect(getBookingResponse.body.booking.status).toBe('pending')

      // Step 3: Update booking status
      const updateStatusResponse = await request(app)
        .patch(`/api/dashboard/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'confirmed'
        })

      expect(updateStatusResponse.status).toBe(200)
      expect(updateStatusResponse.body.booking.status).toBe('confirmed')

      // Step 4: Create invoice (skip if PayPal not configured)
      const isPayPalAvailable = !!(
        process.env.PAYPAL_CLIENT_ID &&
        process.env.PAYPAL_CLIENT_SECRET
      )

      if (isPayPalAvailable) {
        const createInvoiceResponse = await request(app)
          .post('/api/payments/create-invoice')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            bookingId: bookingId,
            amount: 2400, // 2 guards * 8 hours * $150
            depositAmount: 600 // 25% deposit
          })

        expect(createInvoiceResponse.status).toBe(201)
        expect(createInvoiceResponse.body.invoice).toBeDefined()
      } else {
        console.log('Skipping invoice creation test - PayPal not configured')
      }
    })

    it.skipIf(!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET)(
      'should handle booking with payment processing',
      async () => {
        // Create booking
        const bookingResponse = await request(app)
          .post('/api/bookings')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            clientName: 'Jane Smith',
            email: 'jane@example.com',
            phone: '555-5678',
            serviceType: 'Event Security',
            date: '2024-12-30',
            location: 'Los Angeles, CA',
            numberOfGuards: 3,
            duration: 6
          })

        const bookingId = bookingResponse.body.booking._id

        // Create invoice
        const invoiceResponse = await request(app)
          .post('/api/payments/create-invoice')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            bookingId: bookingId,
            amount: 2700, // 3 guards * 6 hours * $150
            depositAmount: 675
          })

        const invoiceId = invoiceResponse.body.invoice._id

        // Process payment webhook (simulated)
        const webhookResponse = await request(app)
          .post('/api/payments/webhook')
          .send({
            event_type: 'PAYMENT.CAPTURE.COMPLETED',
            resource: {
              id: 'PAY-123',
              amount: {
                value: '675.00',
                currency_code: 'USD'
              },
              invoice_id: invoiceId
            }
          })

        expect(webhookResponse.status).toBe(200)

        // Verify booking payment status updated
        const updatedBooking = await request(app)
          .get(`/api/bookings/${bookingId}`)
          .set('Authorization', `Bearer ${adminToken}`)

        expect(updatedBooking.body.booking.paymentStatus).toBe('partial')
      }
    )
  })

  describe('Booking Validation', () => {
    it('should reject booking with invalid data', async () => {
      const invalidBookingResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientName: '', // Invalid: empty name
          email: 'invalid-email', // Invalid email
          serviceType: 'Invalid Service',
          date: '2023-01-01', // Invalid: past date
          numberOfGuards: 0 // Invalid: zero guards
        })

      expect(invalidBookingResponse.status).toBe(400)
    })

    it('should require authentication for booking creation', async () => {
      const unauthorizedResponse = await request(app)
        .post('/api/bookings')
        .send({
          clientName: 'Test Client',
          email: 'test@example.com',
          serviceType: 'Executive Protection',
          date: '2024-12-25',
          numberOfGuards: 1
        })

      expect(unauthorizedResponse.status).toBe(401)
    })
  })

  describe('Booking Status Transitions', () => {
    it('should allow valid status transitions', async () => {
      // Create booking
      const bookingResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientName: 'Status Test',
          email: 'status@test.com',
          phone: '555-9999',
          serviceType: 'Corporate Security',
          date: '2024-12-25',
          location: 'Test Location',
          numberOfGuards: 1,
          duration: 4
        })

      const bookingId = bookingResponse.body.booking._id

      // Valid transitions: pending -> confirmed -> completed
      const statuses = ['confirmed', 'in-progress', 'completed']
      
      for (const status of statuses) {
        const updateResponse = await request(app)
          .patch(`/api/dashboard/bookings/${bookingId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status })

        expect(updateResponse.status).toBe(200)
        expect(updateResponse.body.booking.status).toBe(status)
      }
    })

    it('should reject invalid status transitions', async () => {
      // Create completed booking
      const bookingResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientName: 'Invalid Transition',
          email: 'invalid@test.com',
          phone: '555-0000',
          serviceType: 'Event Security',
          date: '2024-12-25',
          location: 'Test',
          numberOfGuards: 1,
          duration: 4
        })

      const bookingId = bookingResponse.body.booking._id

      // Set to completed
      await request(app)
        .patch(`/api/dashboard/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'completed' })

      // Try to go back to pending (invalid transition)
      const invalidTransition = await request(app)
        .patch(`/api/dashboard/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'pending' })

      // Should reject or handle gracefully
      expect([400, 422]).toContain(invalidTransition.status)
    })
  })
})

