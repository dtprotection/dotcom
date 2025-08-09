import { Router, Request, Response } from 'express'
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware'
import { Booking } from '../models/booking.model'
import { Invoice } from '../models/invoice.model'
import { Admin } from '../models/admin.model'

const router = Router()

// Apply authentication middleware to all dashboard routes
router.use(authenticateToken)
router.use(requireAdmin)

// Dashboard Overview - Get main statistics
router.get('/overview', async (req: Request, res: Response) => {
  try {
    // Get basic counts
    const totalBookings = await Booking.countDocuments()
    const totalInvoices = await Invoice.countDocuments()
    const totalAdmins = await Admin.countDocuments()

    // Get booking status distribution
    const bookingStatuses = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0
        }
      }
    ])

    // Get revenue by invoice status
    const revenueByStatus = await Invoice.aggregate([
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: '$_id',
          total: 1,
          count: 1,
          _id: 0
        }
      }
    ])

    // Calculate deposit and payment collection rates
    const depositStats = await Booking.aggregate([
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          depositsPaid: { $sum: { $cond: ['$depositPaid', 1, 0] } },
          finalPaymentsPaid: { $sum: { $cond: ['$finalPaymentPaid', 1, 0] } }
        }
      }
    ])

    const depositCollectionRate = depositStats[0] 
      ? Math.round((depositStats[0].depositsPaid / depositStats[0].totalBookings) * 100)
      : 0

    const finalPaymentRate = depositStats[0]
      ? Math.round((depositStats[0].finalPaymentsPaid / depositStats[0].totalBookings) * 100)
      : 0

    res.json({
      success: true,
      data: {
        totalBookings,
        totalInvoices,
        totalAdmins,
        bookingStatuses,
        revenueByStatus,
        depositCollectionRate,
        finalPaymentRate
      }
    })
  } catch (error) {
    console.error('Dashboard overview error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to load dashboard overview'
    })
  }
})

// Revenue Analytics
router.get('/analytics/revenue', async (req: Request, res: Response) => {
  try {
    const { period = 'monthly' } = req.query

    let groupBy: any = {}
    if (period === 'monthly') {
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      }
    } else if (period === 'weekly') {
      groupBy = {
        year: { $year: '$createdAt' },
        week: { $week: '$createdAt' }
      }
    }

    const monthlyRevenue = await Booking.aggregate([
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          period: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $toString: '$_id.month' }
            ]
          },
          revenue: 1,
          count: 1,
          _id: 0
        }
      }
    ])

    // Service type distribution
    const serviceDistribution = await Booking.aggregate([
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      {
        $project: {
          serviceType: '$_id',
          count: 1,
          revenue: 1,
          _id: 0
        }
      }
    ])

    res.json({
      success: true,
      data: {
        monthlyRevenue,
        serviceDistribution
      }
    })
  } catch (error) {
    console.error('Revenue analytics error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to load revenue analytics'
    })
  }
})

// Booking Management
router.get('/bookings', async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const skip = (Number(page) - 1) * Number(limit)
    const sort: any = { [sortBy as string]: sortOrder === 'desc' ? -1 : 1 }

    // Build query
    const query: any = {}
    if (status) query.status = status
    if (search) {
      query.$or = [
        { clientName: { $regex: search, $options: 'i' } },
        { clientEmail: { $regex: search, $options: 'i' } },
        { clientPhone: { $regex: search, $options: 'i' } }
      ]
    }

    const bookings = await Booking.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .select('-__v')

    const total = await Booking.countDocuments(query)
    const totalPages = Math.ceil(total / Number(limit))

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages
        }
      }
    })
  } catch (error) {
    console.error('Bookings list error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to load bookings'
    })
  }
})

// Update booking status
router.patch('/bookings/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status, adminNotes } = req.body

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      })
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      })
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      {
        status,
        ...(adminNotes && { adminNotes }),
        updatedAt: new Date()
      },
      { new: true }
    ).select('-__v')

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      })
    }

    res.json({
      success: true,
      data: { booking }
    })
  } catch (error) {
    console.error('Update booking status error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update booking status'
    })
  }
})

// Invoice Management
router.get('/invoices', async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      overdue = false
    } = req.query

    const skip = (Number(page) - 1) * Number(limit)

    // Build query
    const query: any = {}
    if (status) query.status = status
    if (overdue === 'true') {
      query.dueDate = { $lt: new Date() }
      query.status = { $ne: 'paid' }
    }

    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('bookingId', 'clientName clientEmail serviceType')
      .select('-__v')

    const total = await Invoice.countDocuments(query)
    const totalPages = Math.ceil(total / Number(limit))

    // Calculate summary
    const summary = await Invoice.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0]
            }
          },
          paid: {
            $sum: {
              $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0]
            }
          }
        }
      }
    ])

    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages
        },
        summary: summary[0] || { total: 0, pending: 0, paid: 0 }
      }
    })
  } catch (error) {
    console.error('Invoices list error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to load invoices'
    })
  }
})

// Admin User Management
router.get('/admins', async (req: Request, res: Response) => {
  try {
    const admins = await Admin.find({})
      .select('-password -__v')
      .sort({ createdAt: -1 })

    const summary = {
      total: admins.length,
      active: admins.filter(admin => admin.isActive).length,
      roles: admins.reduce((acc: any, admin) => {
        acc[admin.role] = (acc[admin.role] || 0) + 1
        return acc
      }, {})
    }

    res.json({
      success: true,
      data: {
        admins,
        summary
      }
    })
  } catch (error) {
    console.error('Admins list error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to load admin users'
    })
  }
})

// Create new admin user
router.post('/admins', async (req: Request, res: Response) => {
  try {
    const { email, name, role, password } = req.body

    // Validate required fields
    if (!email || !name || !role || !password) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      })
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email })
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: 'Admin with this email already exists'
      })
    }

    // Create new admin
    const admin = new Admin({
      email,
      name,
      role,
      password,
      isActive: true
    })

    await admin.save()

    // Return admin without password
    const adminResponse = admin.toObject()
    delete adminResponse.password

    res.status(201).json({
      success: true,
      data: { admin: adminResponse }
    })
  } catch (error) {
    console.error('Create admin error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create admin user'
    })
  }
})

// Update admin user
router.put('/admins/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, role, isActive } = req.body

    const updateData: any = {}
    if (name) updateData.name = name
    if (role) updateData.role = role
    if (typeof isActive === 'boolean') updateData.isActive = isActive

    const admin = await Admin.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select('-password -__v')

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      })
    }

    res.json({
      success: true,
      data: { admin }
    })
  } catch (error) {
    console.error('Update admin error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update admin user'
    })
  }
})

// Deactivate admin user
router.patch('/admins/:id/deactivate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const admin = await Admin.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).select('-password -__v')

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      })
    }

    res.json({
      success: true,
      data: { admin }
    })
  } catch (error) {
    console.error('Deactivate admin error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate admin user'
    })
  }
})

// Export bookings data
router.get('/export/bookings', async (req: Request, res: Response) => {
  try {
    const { format = 'csv', status, startDate, endDate } = req.query

    // Build query
    const query: any = {}
    if (status) query.status = status
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate as string)
      if (endDate) query.createdAt.$lte = new Date(endDate as string)
    }

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .select('-__v')

    if (format === 'csv') {
      // Generate CSV data
      const csvHeaders = [
        'Client Name',
        'Email',
        'Phone',
        'Service Type',
        'Event Date',
        'Duration',
        'Number of Guards',
        'Location',
        'Status',
        'Total Amount',
        'Deposit Amount',
        'Deposit Paid',
        'Final Payment Paid',
        'Created At'
      ]

      const csvData = bookings.map(booking => [
        booking.clientName,
        booking.clientEmail,
        booking.clientPhone,
        booking.serviceType,
        booking.eventDate,
        booking.duration,
        booking.numberOfGuards,
        booking.location,
        booking.status,
        booking.totalAmount,
        booking.depositAmount,
        booking.depositPaid,
        booking.finalPaymentPaid,
        booking.createdAt
      ])

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=bookings-export.csv')
      
      // Write CSV
      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')

      res.send(csvContent)
    } else {
      res.json({
        success: true,
        data: { bookings }
      })
    }
  } catch (error) {
    console.error('Export bookings error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to export bookings data'
    })
  }
})

// Performance metrics
router.get('/analytics/performance', async (req: Request, res: Response) => {
  try {
    // Service performance
    const servicePerformance = await Booking.aggregate([
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 },
          avgAmount: { $avg: '$totalAmount' },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      {
        $project: {
          serviceType: '$_id',
          count: 1,
          avgAmount: { $round: ['$avgAmount', 2] },
          totalRevenue: 1,
          _id: 0
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ])

    // Monthly trends
    const monthlyTrends = await Booking.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $limit: 12
      }
    ])

    // Payment performance
    const paymentPerformance = await Booking.aggregate([
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          depositsPaid: { $sum: { $cond: ['$depositPaid', 1, 0] } },
          finalPaymentsPaid: { $sum: { $cond: ['$finalPaymentPaid', 1, 0] } },
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ])

    const performance = paymentPerformance[0] || {
      totalBookings: 0,
      depositsPaid: 0,
      finalPaymentsPaid: 0,
      totalRevenue: 0
    }

    res.json({
      success: true,
      data: {
        servicePerformance,
        monthlyTrends,
        performance: {
          ...performance,
          depositRate: performance.totalBookings > 0 
            ? Math.round((performance.depositsPaid / performance.totalBookings) * 100)
            : 0,
          finalPaymentRate: performance.totalBookings > 0
            ? Math.round((performance.finalPaymentsPaid / performance.totalBookings) * 100)
            : 0,
          averageBookingValue: performance.totalBookings > 0
            ? Math.round(performance.totalRevenue / performance.totalBookings)
            : 0
        }
      }
    })
  } catch (error) {
    console.error('Performance analytics error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to load performance analytics'
    })
  }
})

export default router
