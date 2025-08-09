import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Admin } from '../models/admin.model';
import { Booking } from '../models/booking.model';
import { Invoice } from '../models/invoice.model';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Validation middleware
const validateLogin = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const validateCreateAdmin = [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['admin', 'super_admin']).withMessage('Invalid role')
];

// Admin login
router.post('/login', validateLogin, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Find admin by username or email
    const admin = await Admin.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    await admin.updateLastLogin();

    // Generate token
    const token = admin.generateAuthToken();

    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Verify token
router.get('/verify', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({
    message: 'Token valid',
    admin: req.admin
  });
});

// Get dashboard data
router.get('/dashboard', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    // Get booking statistics
    const totalRequests = await Booking.countDocuments();
    const pendingRequests = await Booking.countDocuments({ status: 'pending' });
    const approvedRequests = await Booking.countDocuments({ status: 'approved' });
    
    // Calculate total revenue from payment data
    const approvedBookings = await Booking.find({ status: 'approved' });
    const totalRevenue = approvedBookings.reduce((sum, booking) => {
      return sum + (booking.payment?.paidAmount || 0);
    }, 0);

    // Get recent requests
    const recentRequests = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('clientName date status payment');

    // Format recent requests for dashboard
    const formattedRequests = recentRequests.map(booking => ({
      id: booking._id,
      clientName: booking.clientName,
      date: booking.date,
      status: booking.status,
      amount: booking.payment?.totalAmount || 0,
      paidAmount: booking.payment?.paidAmount || 0
    }));

    res.json({
      totalRequests,
      pendingRequests,
      approvedRequests,
      totalRevenue,
      recentRequests: formattedRequests
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

// Get all admins (super admin only)
router.get('/admins', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const admins = await Admin.find().select('-password');
    res.json(admins);
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ message: 'Failed to fetch admins' });
  }
});

// Create new admin (super admin only)
router.post('/admins', authenticateToken, requireAdmin, validateCreateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ username }, { email }]
    });

    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this username or email already exists' });
    }

    // Create new admin
    const admin = new Admin({
      username,
      email,
      password,
      role: role || 'admin'
    });

    await admin.save();

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Failed to create admin' });
  }
});

// Update admin status
router.patch('/admins/:id/status', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { isActive } = req.body;
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json({
      message: 'Admin status updated successfully',
      admin
    });
  } catch (error) {
    console.error('Update admin status error:', error);
    res.status(500).json({ message: 'Failed to update admin status' });
  }
});

// Change admin password
router.patch('/change-password', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// Get all bookings with payment info
router.get('/bookings', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .select('clientName email serviceType date status payment communicationPreferences');
    res.json({ bookings });
  } catch (error) {
    console.error('Bookings fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get payments data
router.get('/payments', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .select('clientName email payment date');
    const payments = bookings.map(booking => ({
      id: booking._id,
      bookingId: booking._id,
      clientName: booking.clientName,
      email: booking.email,
      totalAmount: booking.payment?.totalAmount || 0,
      depositAmount: booking.payment?.depositAmount || 0,
      paidAmount: booking.payment?.paidAmount || 0,
      status: booking.payment?.status || 'pending',
      method: booking.payment?.method || 'paypal',
      dueDate: booking.date,
      createdAt: booking.createdAt
    }));
    res.json({ payments });
  } catch (error) {
    console.error('Payments fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get invoices data
router.get('/invoices', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const invoices = await Invoice.find()
      .sort({ createdAt: -1 })
      .populate('bookingId', 'clientName email');
    const formattedInvoices = invoices.map(invoice => ({
      id: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      bookingId: invoice.bookingId,
      amount: invoice.amount,
      depositAmount: invoice.depositAmount,
      status: invoice.status,
      dueDate: invoice.dueDate,
      paidDate: invoice.paidDate,
      paymentMethod: invoice.paymentMethod,
      paypalInvoiceId: invoice.paypalInvoiceId
    }));
    res.json({ invoices: formattedInvoices });
  } catch (error) {
    console.error('Invoices fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ message: 'Logout successful' });
});

export const adminRoutes = router;
