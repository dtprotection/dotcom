"use client"

import { useState, useEffect } from "react"
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  Calendar,
  DollarSign,
  User,
  Phone,
  Mail
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Booking {
  _id: string
  clientName: string
  email: string
  phone: string
  eventDate: string
  eventType: string
  venueAddress: string
  numberOfGuards: number
  specialRequirements?: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  depositPaid: boolean
  fullPaymentPaid: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminRequests() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    filterBookings()
  }, [bookings, searchTerm, statusFilter])

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterBookings = () => {
    let filtered = bookings

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.eventType.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    setFilteredBookings(filtered)
  }

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        // Update local state
        setBookings(bookings.map(booking =>
          booking._id === bookingId ? { ...booking, status: status as any } : booking
        ))
      }
    } catch (error) {
      console.error('Failed to update booking status:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const calculateAmount = (booking: Booking) => {
    return booking.numberOfGuards * 150 // Placeholder calculation
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Request Management</h1>
        <p className="text-gray-600">Manage and review security service requests</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by client name, email, or event type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Requests ({filteredBookings.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{booking.clientName}</div>
                      <div className="text-sm text-gray-500">{booking.email}</div>
                      <div className="text-sm text-gray-500">{booking.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{booking.eventType}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(booking.eventDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">{booking.numberOfGuards} guards</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(calculateAmount(booking))}</div>
                    <div className="text-xs text-gray-500">
                      {booking.depositPaid ? 'Deposit paid' : 'Deposit pending'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {booking.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => updateBookingStatus(booking._id, 'approved')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateBookingStatus(booking._id, 'rejected')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredBookings.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p>No requests found</p>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Request Details</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBooking(null)}
                >
                  ×
                </Button>
              </div>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Client Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm">{selectedBooking.clientName}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm">{selectedBooking.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm">{selectedBooking.phone}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Event Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm">
                        {new Date(selectedBooking.eventDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Type:</span> {selectedBooking.eventType}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Guards:</span> {selectedBooking.numberOfGuards}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Amount:</span> {formatCurrency(calculateAmount(selectedBooking))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Venue Address</h4>
                <p className="text-sm text-gray-600">{selectedBooking.venueAddress}</p>
              </div>
              
              {selectedBooking.specialRequirements && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Special Requirements</h4>
                  <p className="text-sm text-gray-600">{selectedBooking.specialRequirements}</p>
                </div>
              )}
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Payment Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Deposit:</span>
                    <span className={`text-sm ${selectedBooking.depositPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                      {selectedBooking.depositPaid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Final Payment:</span>
                    <span className={`text-sm ${selectedBooking.fullPaymentPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                      {selectedBooking.fullPaymentPaid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2 pt-4">
                {selectedBooking.status === 'pending' && (
                  <>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        updateBookingStatus(selectedBooking._id, 'approved')
                        setSelectedBooking(null)
                      }}
                    >
                      Approve Request
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        updateBookingStatus(selectedBooking._id, 'rejected')
                        setSelectedBooking(null)
                      }}
                    >
                      Reject Request
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedBooking(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
