import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import AdminLogin from '../frontend/app/admin/login/page'
import AdminDashboard from '../frontend/app/admin/page'
import AdminRequests from '../frontend/app/admin/requests/page'

// Mock fetch globally
global.fetch = vi.fn()

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock Next.js router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
}

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

// Wrapper component for testing
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('Admin Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('should render login form', () => {
    render(
      <TestWrapper>
        <AdminLogin />
      </TestWrapper>
    )

    expect(screen.getByText('Admin Login')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('should handle form submission with valid credentials', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        message: 'Login successful',
        token: 'test-token',
        admin: { username: 'admin', role: 'admin' }
      })
    }
    ;(fetch as any).mockResolvedValue(mockResponse)

    render(
      <TestWrapper>
        <AdminLogin />
      </TestWrapper>
    )

    const usernameInput = screen.getByPlaceholderText('Enter username')
    const passwordInput = screen.getByPlaceholderText('Enter password')
    const submitButton = screen.getByRole('button', { name: 'Sign in' })

    fireEvent.change(usernameInput, { target: { value: 'admin' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'password123'
        })
      })
    })

    expect(localStorageMock.setItem).toHaveBeenCalledWith('adminToken', 'test-token')
    expect(mockRouter.push).toHaveBeenCalledWith('/admin')
  })

  it('should handle login error', async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({
        message: 'Invalid credentials'
      })
    }
    ;(fetch as any).mockResolvedValue(mockResponse)

    render(
      <TestWrapper>
        <AdminLogin />
      </TestWrapper>
    )

    const usernameInput = screen.getByPlaceholderText('Enter username')
    const passwordInput = screen.getByPlaceholderText('Enter password')
    const submitButton = screen.getByRole('button', { name: 'Sign in' })

    fireEvent.change(usernameInput, { target: { value: 'admin' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('should toggle password visibility', () => {
    render(
      <TestWrapper>
        <AdminLogin />
      </TestWrapper>
    )

    const passwordInput = screen.getByPlaceholderText('Enter password')
    const toggleButton = screen.getByRole('button', { name: '' }) // Eye icon button

    expect(passwordInput).toHaveAttribute('type', 'password')
    
    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')
    
    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('should redirect if already logged in', () => {
    localStorageMock.getItem.mockReturnValue('existing-token')

    render(
      <TestWrapper>
        <AdminLogin />
      </TestWrapper>
    )

    expect(mockRouter.push).toHaveBeenCalledWith('/admin')
  })
})

describe('Admin Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue('test-token')
  })

  it('should render dashboard with loading state', () => {
    ;(fetch as any).mockImplementation(() => new Promise(() => {})) // Never resolves

    render(
      <TestWrapper>
        <AdminDashboard />
      </TestWrapper>
    )

    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument()
  })

  it('should render dashboard with data', async () => {
    const mockDashboardData = {
      totalRequests: 10,
      pendingRequests: 3,
      approvedRequests: 5,
      totalRevenue: 1500,
      recentRequests: [
        {
          id: '1',
          clientName: 'Test Client',
          eventDate: '2024-12-25',
          status: 'pending',
          amount: 300
        }
      ]
    }

    const mockResponse = {
      ok: true,
      json: () => Promise.resolve(mockDashboardData)
    }
    ;(fetch as any).mockResolvedValue(mockResponse)

    render(
      <TestWrapper>
        <AdminDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument() // Total requests
      expect(screen.getByText('3')).toBeInTheDocument() // Pending requests
      expect(screen.getByText('5')).toBeInTheDocument() // Approved requests
      expect(screen.getByText('$1,500.00')).toBeInTheDocument() // Total revenue
    })
  })

  it('should handle dashboard fetch error', async () => {
    ;(fetch as any).mockRejectedValue(new Error('Network error'))

    render(
      <TestWrapper>
        <AdminDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      // Should not show loading state anymore
      expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument()
    })
  })
})

describe('Admin Requests Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue('test-token')
  })

  it('should render requests table with data', async () => {
    const mockBookings = [
      {
        _id: '1',
        clientName: 'Test Client',
        email: 'test@example.com',
        phone: '123-456-7890',
        eventDate: '2024-12-25',
        eventType: 'Wedding',
        venueAddress: '123 Test St',
        numberOfGuards: 2,
        status: 'pending',
        depositPaid: false,
        fullPaymentPaid: false
      }
    ]

    const mockResponse = {
      ok: true,
      json: () => Promise.resolve(mockBookings)
    }
    ;(fetch as any).mockResolvedValue(mockResponse)

    render(
      <TestWrapper>
        <AdminRequests />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Client')).toBeInTheDocument()
      expect(screen.getByText('Wedding')).toBeInTheDocument()
      expect(screen.getByText('pending')).toBeInTheDocument()
    })
  })

  it('should filter requests by search term', async () => {
    const mockBookings = [
      {
        _id: '1',
        clientName: 'Test Client',
        email: 'test@example.com',
        phone: '123-456-7890',
        eventDate: '2024-12-25',
        eventType: 'Wedding',
        venueAddress: '123 Test St',
        numberOfGuards: 2,
        status: 'pending',
        depositPaid: false,
        fullPaymentPaid: false
      },
      {
        _id: '2',
        clientName: 'Another Client',
        email: 'another@example.com',
        phone: '123-456-7891',
        eventDate: '2024-12-26',
        eventType: 'Corporate Event',
        venueAddress: '456 Test Ave',
        numberOfGuards: 3,
        status: 'approved',
        depositPaid: true,
        fullPaymentPaid: false
      }
    ]

    const mockResponse = {
      ok: true,
      json: () => Promise.resolve(mockBookings)
    }
    ;(fetch as any).mockResolvedValue(mockResponse)

    render(
      <TestWrapper>
        <AdminRequests />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Client')).toBeInTheDocument()
      expect(screen.getByText('Another Client')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search by client name, email, or event type...')
    fireEvent.change(searchInput, { target: { value: 'Test Client' } })

    await waitFor(() => {
      expect(screen.getByText('Test Client')).toBeInTheDocument()
      expect(screen.queryByText('Another Client')).not.toBeInTheDocument()
    })
  })

  it('should update booking status', async () => {
    const mockBookings = [
      {
        _id: '1',
        clientName: 'Test Client',
        email: 'test@example.com',
        phone: '123-456-7890',
        eventDate: '2024-12-25',
        eventType: 'Wedding',
        venueAddress: '123 Test St',
        numberOfGuards: 2,
        status: 'pending',
        depositPaid: false,
        fullPaymentPaid: false
      }
    ]

    const mockBookingsResponse = {
      ok: true,
      json: () => Promise.resolve(mockBookings)
    }

    const mockUpdateResponse = {
      ok: true,
      json: () => Promise.resolve({ status: 'approved' })
    }

    ;(fetch as any)
      .mockResolvedValueOnce(mockBookingsResponse) // First call for fetching bookings
      .mockResolvedValueOnce(mockUpdateResponse) // Second call for updating status

    render(
      <TestWrapper>
        <AdminRequests />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Client')).toBeInTheDocument()
    })

    const approveButton = screen.getByRole('button', { name: '' }) // CheckCircle icon
    fireEvent.click(approveButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/bookings/1/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({ status: 'approved' })
      })
    })
  })
})
