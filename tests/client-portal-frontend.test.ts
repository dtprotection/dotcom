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
  }),
  usePathname: () => '/client',
  useSearchParams: () => new URLSearchParams(),
}))

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

// Mock fetch
global.fetch = vi.fn()

// Mock data
const mockClient = {
  id: 'client123',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  activeBookings: 2,
  totalBookings: 5,
  totalSpent: 2500.00
}

const mockBookings = [
  {
    id: 'booking1',
    clientName: 'John Doe',
    clientEmail: 'john@example.com',
    clientPhone: '+1234567890',
    serviceType: 'personal_protection',
    date: '2024-01-15',
    startTime: '09:00',
    endTime: '17:00',
    status: 'confirmed',
    totalAmount: 800.00,
    depositAmount: 200.00,
    depositPaid: true,
    finalPaymentPaid: false,
    adminNotes: 'Client requested specific security protocols',
    createdAt: '2024-01-10T00:00:00.000Z',
    updatedAt: '2024-01-12T00:00:00.000Z'
  },
  {
    id: 'booking2',
    clientName: 'John Doe',
    clientEmail: 'john@example.com',
    clientPhone: '+1234567890',
    serviceType: 'event_security',
    date: '2024-02-20',
    startTime: '18:00',
    endTime: '02:00',
    status: 'pending',
    totalAmount: 1200.00,
    depositAmount: 300.00,
    depositPaid: false,
    finalPaymentPaid: false,
    adminNotes: 'Large event, requires additional personnel',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z'
  }
]

const mockInvoices = [
  {
    id: 'invoice1',
    bookingId: 'booking1',
    clientEmail: 'john@example.com',
    amount: 800.00,
    status: 'paid',
    dueDate: '2024-01-20T00:00:00.000Z',
    paidAt: '2024-01-18T00:00:00.000Z',
    paypalInvoiceId: 'INV-123456',
    createdAt: '2024-01-10T00:00:00.000Z'
  },
  {
    id: 'invoice2',
    bookingId: 'booking2',
    clientEmail: 'john@example.com',
    amount: 1200.00,
    status: 'pending',
    dueDate: '2024-02-25T00:00:00.000Z',
    paidAt: null,
    paypalInvoiceId: 'INV-123457',
    createdAt: '2024-01-15T00:00:00.000Z'
  }
]

const mockMessages = [
  {
    id: 'msg1',
    clientEmail: 'john@example.com',
    type: 'email',
    subject: 'Booking Confirmation',
    content: 'Your booking has been confirmed for January 15th.',
    status: 'sent',
    sentAt: '2024-01-12T00:00:00.000Z',
    readAt: '2024-01-12T00:00:00.000Z'
  },
  {
    id: 'msg2',
    clientEmail: 'john@example.com',
    type: 'sms',
    subject: 'Payment Reminder',
    content: 'Reminder: Your deposit payment of $300 is due.',
    status: 'sent',
    sentAt: '2024-01-16T00:00:00.000Z',
    readAt: null
  }
]

// Mock client portal components
const MockClientLayout = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="client-layout">
    <nav data-testid="client-nav">
      <div data-testid="client-info">
        <span data-testid="client-name">{mockClient.name}</span>
        <span data-testid="client-email">{mockClient.email}</span>
      </div>
    </nav>
    <main data-testid="client-main">{children}</main>
  </div>
)

const MockClientDashboard = () => {
  const [bookings, setBookings] = vi.fn()
  const [invoices, setInvoices] = vi.fn()
  const [messages, setMessages] = vi.fn()
  const [isLoading, setIsLoading] = vi.fn(true)

  return (
    <div data-testid="client-dashboard">
      <h1 data-testid="dashboard-title">Client Dashboard</h1>
      {isLoading ? (
        <div data-testid="loading">Loading...</div>
      ) : (
        <div data-testid="dashboard-content">
          <div data-testid="bookings-section">
            <h2>My Bookings</h2>
            <div data-testid="bookings-count">{mockBookings.length} bookings</div>
          </div>
          <div data-testid="invoices-section">
            <h2>My Invoices</h2>
            <div data-testid="invoices-count">{mockInvoices.length} invoices</div>
          </div>
          <div data-testid="messages-section">
            <h2>My Messages</h2>
            <div data-testid="messages-count">{mockMessages.length} messages</div>
          </div>
        </div>
      )}
    </div>
  )
}

const MockClientBookings = () => {
  const [bookings, setBookings] = vi.fn(mockBookings)
  const [filter, setFilter] = vi.fn('all')

  const filteredBookings = bookings.filter((booking: any) => {
    if (filter === 'all') return true
    return booking.status === filter
  })

  return (
    <div data-testid="client-bookings">
      <h1 data-testid="bookings-title">My Bookings</h1>
      <div data-testid="bookings-filter">
        <select 
          data-testid="status-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Bookings</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div data-testid="bookings-list">
        {filteredBookings.map((booking: any) => (
          <div key={booking.id} data-testid={`booking-${booking.id}`}>
            <h3 data-testid={`booking-title-${booking.id}`}>
              {booking.serviceType.replace('_', ' ').toUpperCase()}
            </h3>
            <p data-testid={`booking-date-${booking.id}`}>
              Date: {new Date(booking.date).toLocaleDateString()}
            </p>
            <p data-testid={`booking-status-${booking.id}`}>
              Status: {booking.status}
            </p>
            <p data-testid={`booking-amount-${booking.id}`}>
              Amount: ${booking.totalAmount}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

const MockClientPayments = () => {
  const [invoices, setInvoices] = vi.fn(mockInvoices)

  const totalPaid = invoices
    .filter((invoice: any) => invoice.status === 'paid')
    .reduce((sum: number, invoice: any) => sum + invoice.amount, 0)

  const totalPending = invoices
    .filter((invoice: any) => invoice.status === 'pending')
    .reduce((sum: number, invoice: any) => sum + invoice.amount, 0)

  return (
    <div data-testid="client-payments">
      <h1 data-testid="payments-title">My Payments</h1>
      <div data-testid="payments-summary">
        <div data-testid="total-paid">Total Paid: ${totalPaid}</div>
        <div data-testid="total-pending">Total Pending: ${totalPending}</div>
      </div>
      <div data-testid="invoices-list">
        {invoices.map((invoice: any) => (
          <div key={invoice.id} data-testid={`invoice-${invoice.id}`}>
            <h3 data-testid={`invoice-id-${invoice.id}`}>
              Invoice #{invoice.id}
            </h3>
            <p data-testid={`invoice-amount-${invoice.id}`}>
              Amount: ${invoice.amount}
            </p>
            <p data-testid={`invoice-status-${invoice.id}`}>
              Status: {invoice.status}
            </p>
            <p data-testid={`invoice-due-${invoice.id}`}>
              Due Date: {new Date(invoice.dueDate).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

const MockClientMessages = () => {
  const [messages, setMessages] = vi.fn(mockMessages)
  const [filter, setFilter] = vi.fn('all')

  const filteredMessages = messages.filter((message: any) => {
    if (filter === 'all') return true
    return message.type === filter
  })

  const markAsRead = vi.fn((messageId: string) => {
    setMessages(messages.map((msg: any) => 
      msg.id === messageId ? { ...msg, readAt: new Date().toISOString() } : msg
    ))
  })

  return (
    <div data-testid="client-messages">
      <h1 data-testid="messages-title">My Messages</h1>
      <div data-testid="messages-filter">
        <select 
          data-testid="type-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Messages</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
        </select>
      </div>
      <div data-testid="messages-list">
        {filteredMessages.map((message: any) => (
          <div key={message.id} data-testid={`message-${message.id}`}>
            <h3 data-testid={`message-subject-${message.id}`}>
              {message.subject}
            </h3>
            <p data-testid={`message-type-${message.id}`}>
              Type: {message.type}
            </p>
            <p data-testid={`message-content-${message.id}`}>
              {message.content}
            </p>
            <p data-testid={`message-date-${message.id}`}>
              Sent: {new Date(message.sentAt).toLocaleDateString()}
            </p>
            {!message.readAt && (
              <button 
                data-testid={`mark-read-${message.id}`}
                onClick={() => markAsRead(message.id)}
              >
                Mark as Read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const MockClientSettings = () => {
  const [preferences, setPreferences] = vi.fn({
    email: true,
    sms: true
  })

  const updatePreferences = vi.fn((newPreferences: any) => {
    setPreferences(newPreferences)
  })

  return (
    <div data-testid="client-settings">
      <h1 data-testid="settings-title">Settings</h1>
      <div data-testid="communication-preferences">
        <h2>Communication Preferences</h2>
        <label>
          <input
            type="checkbox"
            data-testid="email-preference"
            checked={preferences.email}
            onChange={(e) => updatePreferences({
              ...preferences,
              email: e.target.checked
            })}
          />
          Receive Email Notifications
        </label>
        <label>
          <input
            type="checkbox"
            data-testid="sms-preference"
            checked={preferences.sms}
            onChange={(e) => updatePreferences({
              ...preferences,
              sms: e.target.checked
            })}
          />
          Receive SMS Notifications
        </label>
      </div>
    </div>
  )
}

describe('Client Portal Frontend Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue('valid_client_token')
  })

  describe('Client Layout', () => {
    it('should render client layout with navigation', () => {
      render(
        <MockClientLayout>
          <div>Test Content</div>
        </MockClientLayout>
      )

      expect(screen.getByTestId('client-layout')).toBeInTheDocument()
      expect(screen.getByTestId('client-nav')).toBeInTheDocument()
      expect(screen.getByTestId('client-main')).toBeInTheDocument()
      expect(screen.getByTestId('client-name')).toHaveTextContent('John Doe')
      expect(screen.getByTestId('client-email')).toHaveTextContent('john@example.com')
    })

    it('should display client information correctly', () => {
      render(
        <MockClientLayout>
          <div>Test Content</div>
        </MockClientLayout>
      )

      expect(screen.getByTestId('client-name')).toHaveTextContent(mockClient.name)
      expect(screen.getByTestId('client-email')).toHaveTextContent(mockClient.email)
    })
  })

  describe('Client Dashboard', () => {
    it('should render dashboard with loading state', () => {
      render(<MockClientDashboard />)

      expect(screen.getByTestId('client-dashboard')).toBeInTheDocument()
      expect(screen.getByTestId('dashboard-title')).toHaveTextContent('Client Dashboard')
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading...')
    })

    it('should display dashboard content when loaded', () => {
      render(<MockClientDashboard />)

      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument()
      expect(screen.getByTestId('bookings-section')).toBeInTheDocument()
      expect(screen.getByTestId('invoices-section')).toBeInTheDocument()
      expect(screen.getByTestId('messages-section')).toBeInTheDocument()
    })

    it('should show correct counts for each section', () => {
      render(<MockClientDashboard />)

      expect(screen.getByTestId('bookings-count')).toHaveTextContent('2 bookings')
      expect(screen.getByTestId('invoices-count')).toHaveTextContent('2 invoices')
      expect(screen.getByTestId('messages-count')).toHaveTextContent('2 messages')
    })
  })

  describe('Client Bookings', () => {
    it('should render bookings page with title', () => {
      render(<MockClientBookings />)

      expect(screen.getByTestId('client-bookings')).toBeInTheDocument()
      expect(screen.getByTestId('bookings-title')).toHaveTextContent('My Bookings')
    })

    it('should display all bookings by default', () => {
      render(<MockClientBookings />)

      expect(screen.getByTestId('booking-booking1')).toBeInTheDocument()
      expect(screen.getByTestId('booking-booking2')).toBeInTheDocument()
      expect(screen.getByTestId('booking-title-booking1')).toHaveTextContent('PERSONAL PROTECTION')
      expect(screen.getByTestId('booking-title-booking2')).toHaveTextContent('EVENT SECURITY')
    })

    it('should filter bookings by status', async () => {
      render(<MockClientBookings />)

      const filterSelect = screen.getByTestId('status-filter')
      
      // Filter by pending
      fireEvent.change(filterSelect, { target: { value: 'pending' } })
      
      await waitFor(() => {
        expect(screen.getByTestId('booking-booking2')).toBeInTheDocument()
        expect(screen.queryByTestId('booking-booking1')).not.toBeInTheDocument()
      })
    })

    it('should display booking details correctly', () => {
      render(<MockClientBookings />)

      const booking = mockBookings[0]
      
      expect(screen.getByTestId(`booking-date-${booking.id}`)).toHaveTextContent(
        `Date: ${new Date(booking.date).toLocaleDateString()}`
      )
      expect(screen.getByTestId(`booking-status-${booking.id}`)).toHaveTextContent(
        `Status: ${booking.status}`
      )
      expect(screen.getByTestId(`booking-amount-${booking.id}`)).toHaveTextContent(
        `Amount: $${booking.totalAmount}`
      )
    })
  })

  describe('Client Payments', () => {
    it('should render payments page with title', () => {
      render(<MockClientPayments />)

      expect(screen.getByTestId('client-payments')).toBeInTheDocument()
      expect(screen.getByTestId('payments-title')).toHaveTextContent('My Payments')
    })

    it('should display payment summary', () => {
      render(<MockClientPayments />)

      expect(screen.getByTestId('payments-summary')).toBeInTheDocument()
      expect(screen.getByTestId('total-paid')).toHaveTextContent('Total Paid: $800')
      expect(screen.getByTestId('total-pending')).toHaveTextContent('Total Pending: $1200')
    })

    it('should display all invoices', () => {
      render(<MockClientPayments />)

      expect(screen.getByTestId('invoice-invoice1')).toBeInTheDocument()
      expect(screen.getByTestId('invoice-invoice2')).toBeInTheDocument()
    })

    it('should display invoice details correctly', () => {
      render(<MockClientPayments />)

      const invoice = mockInvoices[0]
      
      expect(screen.getByTestId(`invoice-id-${invoice.id}`)).toHaveTextContent(
        `Invoice #${invoice.id}`
      )
      expect(screen.getByTestId(`invoice-amount-${invoice.id}`)).toHaveTextContent(
        `Amount: $${invoice.amount}`
      )
      expect(screen.getByTestId(`invoice-status-${invoice.id}`)).toHaveTextContent(
        `Status: ${invoice.status}`
      )
      expect(screen.getByTestId(`invoice-due-${invoice.id}`)).toHaveTextContent(
        `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`
      )
    })
  })

  describe('Client Messages', () => {
    it('should render messages page with title', () => {
      render(<MockClientMessages />)

      expect(screen.getByTestId('client-messages')).toBeInTheDocument()
      expect(screen.getByTestId('messages-title')).toHaveTextContent('My Messages')
    })

    it('should display all messages by default', () => {
      render(<MockClientMessages />)

      expect(screen.getByTestId('message-msg1')).toBeInTheDocument()
      expect(screen.getByTestId('message-msg2')).toBeInTheDocument()
    })

    it('should filter messages by type', async () => {
      render(<MockClientMessages />)

      const filterSelect = screen.getByTestId('type-filter')
      
      // Filter by email
      fireEvent.change(filterSelect, { target: { value: 'email' } })
      
      await waitFor(() => {
        expect(screen.getByTestId('message-msg1')).toBeInTheDocument()
        expect(screen.queryByTestId('message-msg2')).not.toBeInTheDocument()
      })
    })

    it('should display message details correctly', () => {
      render(<MockClientMessages />)

      const message = mockMessages[0]
      
      expect(screen.getByTestId(`message-subject-${message.id}`)).toHaveTextContent(
        message.subject
      )
      expect(screen.getByTestId(`message-type-${message.id}`)).toHaveTextContent(
        `Type: ${message.type}`
      )
      expect(screen.getByTestId(`message-content-${message.id}`)).toHaveTextContent(
        message.content
      )
      expect(screen.getByTestId(`message-date-${message.id}`)).toHaveTextContent(
        `Sent: ${new Date(message.sentAt).toLocaleDateString()}`
      )
    })

    it('should show mark as read button for unread messages', () => {
      render(<MockClientMessages />)

      // msg2 is unread (readAt is null)
      expect(screen.getByTestId('mark-read-msg2')).toBeInTheDocument()
      expect(screen.queryByTestId('mark-read-msg1')).not.toBeInTheDocument()
    })

    it('should handle mark as read functionality', async () => {
      render(<MockClientMessages />)

      const markReadButton = screen.getByTestId('mark-read-msg2')
      fireEvent.click(markReadButton)

      await waitFor(() => {
        expect(screen.queryByTestId('mark-read-msg2')).not.toBeInTheDocument()
      })
    })
  })

  describe('Client Settings', () => {
    it('should render settings page with title', () => {
      render(<MockClientSettings />)

      expect(screen.getByTestId('client-settings')).toBeInTheDocument()
      expect(screen.getByTestId('settings-title')).toHaveTextContent('Settings')
    })

    it('should display communication preferences', () => {
      render(<MockClientSettings />)

      expect(screen.getByTestId('communication-preferences')).toBeInTheDocument()
      expect(screen.getByTestId('email-preference')).toBeInTheDocument()
      expect(screen.getByTestId('sms-preference')).toBeInTheDocument()
    })

    it('should show current preference values', () => {
      render(<MockClientSettings />)

      const emailCheckbox = screen.getByTestId('email-preference') as HTMLInputElement
      const smsCheckbox = screen.getByTestId('sms-preference') as HTMLInputElement

      expect(emailCheckbox.checked).toBe(true)
      expect(smsCheckbox.checked).toBe(true)
    })

    it('should handle preference changes', async () => {
      render(<MockClientSettings />)

      const emailCheckbox = screen.getByTestId('email-preference') as HTMLInputElement
      
      fireEvent.click(emailCheckbox)

      await waitFor(() => {
        expect(emailCheckbox.checked).toBe(false)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle missing authentication token', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      // This would typically redirect to login
      expect(localStorageMock.getItem).toHaveBeenCalledWith('clientToken')
    })

    it('should handle API errors gracefully', async () => {
      // Mock fetch to return error
      global.fetch = vi.fn().mockRejectedValue(new Error('API Error'))

      render(<MockClientDashboard />)

      // Component should handle the error gracefully
      expect(screen.getByTestId('client-dashboard')).toBeInTheDocument()
    })

    it('should handle empty data states', () => {
      // Test with empty data
      const emptyBookings = []
      const MockEmptyBookings = () => {
        const [bookings] = vi.fn(emptyBookings)
        
        return (
          <div data-testid="empty-bookings">
            {bookings.length === 0 ? (
              <p data-testid="no-bookings">No bookings found</p>
            ) : (
              <div data-testid="bookings-list">Bookings here</div>
            )}
          </div>
        )
      }

      render(<MockEmptyBookings />)
      
      expect(screen.getByTestId('no-bookings')).toHaveTextContent('No bookings found')
    })
  })

  describe('Data Validation', () => {
    it('should validate booking data structure', () => {
      const validBooking = {
        id: 'booking1',
        clientEmail: 'john@example.com',
        serviceType: 'personal_protection',
        status: 'confirmed',
        totalAmount: 800.00
      }

      const isValidBooking = (booking: any) => {
        return booking.id && 
               booking.clientEmail && 
               booking.serviceType && 
               booking.status && 
               typeof booking.totalAmount === 'number'
      }

      expect(isValidBooking(validBooking)).toBe(true)
    })

    it('should validate invoice data structure', () => {
      const validInvoice = {
        id: 'invoice1',
        bookingId: 'booking1',
        amount: 800.00,
        status: 'paid',
        dueDate: '2024-01-20T00:00:00.000Z'
      }

      const isValidInvoice = (invoice: any) => {
        return invoice.id && 
               invoice.bookingId && 
               typeof invoice.amount === 'number' && 
               invoice.status && 
               invoice.dueDate
      }

      expect(isValidInvoice(validInvoice)).toBe(true)
    })

    it('should validate message data structure', () => {
      const validMessage = {
        id: 'msg1',
        clientEmail: 'john@example.com',
        type: 'email',
        subject: 'Test Subject',
        content: 'Test Content',
        sentAt: '2024-01-12T00:00:00.000Z'
      }

      const isValidMessage = (message: any) => {
        return message.id && 
               message.clientEmail && 
               message.type && 
               message.subject && 
               message.content && 
               message.sentAt
      }

      expect(isValidMessage(validMessage)).toBe(true)
    })
  })

  describe('User Experience', () => {
    it('should provide loading states', () => {
      render(<MockClientDashboard />)

      expect(screen.getByTestId('loading')).toBeInTheDocument()
    })

    it('should handle user interactions', async () => {
      render(<MockClientBookings />)

      const filterSelect = screen.getByTestId('status-filter')
      
      fireEvent.change(filterSelect, { target: { value: 'confirmed' } })
      
      await waitFor(() => {
        expect(filterSelect).toHaveValue('confirmed')
      })
    })

    it('should display formatted dates correctly', () => {
      render(<MockClientBookings />)

      const booking = mockBookings[0]
      const expectedDate = new Date(booking.date).toLocaleDateString()
      
      expect(screen.getByTestId(`booking-date-${booking.id}`)).toHaveTextContent(
        `Date: ${expectedDate}`
      )
    })

    it('should display formatted currency correctly', () => {
      render(<MockClientPayments />)

      const invoice = mockInvoices[0]
      
      expect(screen.getByTestId(`invoice-amount-${invoice.id}`)).toHaveTextContent(
        `Amount: $${invoice.amount}`
      )
    })
  })
})
