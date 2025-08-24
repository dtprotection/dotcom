import express from 'express'
import jwt from 'jsonwebtoken'
import { Booking } from '../models/booking.model'
import { Invoice } from '../models/invoice.model'
import { Admin } from '../models/admin.model'

const router = express.Router()

// Client authentication middleware
const authenticateClient = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    if (!decoded.clientId || !decoded.email) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    req.client = {
      id: decoded.clientId,
      email: decoded.email
    }
    
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Client login with email and booking ID
router.post('/login', async (req, res) => {
  try {
    const { email, bookingId } = req.body

    if (!email || !bookingId) {
      return res.status(400).json({ error: 'Email and booking ID are required' })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Find booking and verify client email
    const booking = await Booking.findById(bookingId)
    
    if (!booking) {
      return res.status(401).json({ error: 'Invalid booking ID' })
    }

    if (booking.clientEmail !== email) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate client token
    const token = jwt.sign(
      { 
        clientId: booking._id.toString(),
        email: booking.clientEmail,
        type: 'client'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      token,
      client: {
        id: booking._id.toString(),
        name: booking.clientName,
        email: booking.clientEmail
      }
    })
  } catch (error) {
    console.error('Client login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get client profile
router.get('/profile', authenticateClient, async (req, res) => {
  try {
    const { email } = req.client

    // Get client's bookings
    const bookings = await Booking.find({ clientEmail: email })
    
    // Calculate statistics
    const activeBookings = bookings.filter(b => 
      ['pending', 'confirmed'].includes(b.status)
    ).length

    const totalBookings = bookings.length

    // Get total spent from completed bookings
    const totalSpent = bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0)

    // Get communication preferences from most recent booking
    const latestBooking = bookings.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]

    const profile = {
      id: req.client.id,
      name: latestBooking?.clientName || 'Unknown',
      email: email,
      phone: latestBooking?.clientPhone || '',
      activeBookings,
      totalBookings,
      totalSpent,
      communicationPreferences: latestBooking?.communicationPreferences || {
        email: true,
        sms: true
      },
      lastLogin: new Date()
    }

    res.json(profile)
  } catch (error) {
    console.error('Get client profile error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update communication preferences
router.put('/preferences', authenticateClient, async (req, res) => {
  try {
    const { communicationPreferences } = req.body
    const { email } = req.client

    if (!communicationPreferences) {
      return res.status(400).json({ error: 'Communication preferences are required' })
    }

    // Validate preferences structure
    if (typeof communicationPreferences.email !== 'boolean' || 
        typeof communicationPreferences.sms !== 'boolean') {
      return res.status(400).json({ error: 'Invalid preferences format' })
    }

    // Update all client's bookings with new preferences
    await Booking.updateMany(
      { clientEmail: email },
      { communicationPreferences }
    )

    res.json({
      success: true,
      communicationPreferences
    })
  } catch (error) {
    console.error('Update preferences error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get client bookings
router.get('/bookings', authenticateClient, async (req, res) => {
  try {
    const { email } = req.client
    const { status, page = 1, limit = 10 } = req.query

    const query: any = { clientEmail: email }
    
    if (status && status !== 'all') {
      query.status = status
    }

    const skip = (Number(page) - 1) * Number(limit)

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))

    const total = await Booking.countDocuments(query)

    res.json({
      bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Get client bookings error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get specific booking by ID
router.get('/bookings/:id', authenticateClient, async (req, res) => {
  try {
    const { id } = req.params
    const { email } = req.client

    const booking = await Booking.findOne({
      _id: id,
      clientEmail: email
    })

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    res.json(booking)
  } catch (error) {
    console.error('Get booking error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get client invoices
router.get('/invoices', authenticateClient, async (req, res) => {
  try {
    const { email } = req.client
    const { status, page = 1, limit = 10 } = req.query

    // Get client's booking IDs
    const bookings = await Booking.find({ clientEmail: email })
    const bookingIds = bookings.map(b => b._id)

    const query: any = { bookingId: { $in: bookingIds } }
    
    if (status && status !== 'all') {
      query.status = status
    }

    const skip = (Number(page) - 1) * Number(limit)

    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))

    const total = await Invoice.countDocuments(query)

    res.json({
      invoices,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Get client invoices error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get specific invoice by ID
router.get('/invoices/:id', authenticateClient, async (req, res) => {
  try {
    const { id } = req.params
    const { email } = req.client

    // Get client's booking IDs
    const bookings = await Booking.find({ clientEmail: email })
    const bookingIds = bookings.map(b => b._id)

    const invoice = await Invoice.findOne({
      _id: id,
      bookingId: { $in: bookingIds }
    })

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    res.json(invoice)
  } catch (error) {
    console.error('Get invoice error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get client messages (placeholder for future implementation)
router.get('/messages', authenticateClient, async (req, res) => {
  try {
    const { email } = req.client
    const { type, page = 1, limit = 10 } = req.query

    // This would typically query a messages collection
    // For now, return empty array as placeholder
    const messages: any[] = []

    res.json({
      messages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: 0,
        pages: 0
      }
    })
  } catch (error) {
    console.error('Get client messages error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Mark message as read (placeholder for future implementation)
router.patch('/messages/:id/read', authenticateClient, async (req, res) => {
  try {
    const { id } = req.params
    const { email } = req.client

    // This would typically update a message in the database
    // For now, return success as placeholder
    res.json({ 
      success: true,
      message: { id, readAt: new Date() }
    })
  } catch (error) {
    console.error('Mark message read error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get client statistics
router.get('/statistics', authenticateClient, async (req, res) => {
  try {
    const { email } = req.client

    // Get all client bookings
    const bookings = await Booking.find({ clientEmail: email })
    
    // Get all client invoices
    const bookingIds = bookings.map(b => b._id)
    const invoices = await Invoice.find({ bookingId: { $in: bookingIds } })

    // Calculate booking statistics
    const bookingStats = {
      total: bookings.length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      pending: bookings.filter(b => b.status === 'pending').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      upcoming: bookings.filter(b => new Date(b.date) > new Date()).length
    }

    // Calculate payment statistics
    const paymentStats = {
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter(i => i.status === 'paid').length,
      pendingInvoices: invoices.filter(i => i.status === 'pending').length,
      overdueInvoices: invoices.filter(i => 
        i.status === 'pending' && new Date(i.dueDate) < new Date()
      ).length,
      totalPaid: invoices.filter(i => i.status === 'paid')
        .reduce((sum, inv) => sum + (inv.amount || 0), 0),
      totalPending: invoices.filter(i => i.status === 'pending')
        .reduce((sum, inv) => sum + (inv.amount || 0), 0)
    }

    res.json({
      bookingStats,
      paymentStats
    })
  } catch (error) {
    console.error('Get client statistics error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
