"use client"
import { useState, useEffect } from "react"
import { 
  Mail, MessageSquare, Send, Users, Calendar, DollarSign, 
  CheckCircle, AlertCircle, Clock, Phone, Eye, Settings,
  Plus, Search, Filter, Download, RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

interface Booking {
  _id: string
  clientName: string
  email: string
  phone: string
  serviceType: string
  date: string
  status: string
  payment: {
    totalAmount: number
    depositAmount: number
    paidAmount: number
    status: string
  }
  communicationPreferences: {
    emailNotifications: boolean
    smsNotifications: boolean
    preferredContact: string
  }
}

interface CommunicationStats {
  totalBookings: number
  emailEnabled: number
  smsEnabled: number
  bothEnabled: number
  recentCommunications: number
}

export default function AdminCommunication() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<CommunicationStats>({
    totalBookings: 0,
    emailEnabled: 0,
    smsEnabled: 0,
    bothEnabled: 0,
    recentCommunications: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showSendModal, setShowSendModal] = useState(false)
  const [sendType, setSendType] = useState<'email' | 'sms'>('email')
  const [customMessage, setCustomMessage] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchBookings()
    fetchStats()
  }, [])

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings)
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        // Calculate communication stats from bookings
        const emailEnabled = bookings.filter(b => b.communicationPreferences.emailNotifications).length
        const smsEnabled = bookings.filter(b => b.communicationPreferences.smsNotifications).length
        const bothEnabled = bookings.filter(b => 
          b.communicationPreferences.emailNotifications && b.communicationPreferences.smsNotifications
        ).length
        
        setStats({
          totalBookings: bookings.length,
          emailEnabled,
          smsEnabled,
          bothEnabled,
          recentCommunications: 0 // This would come from a separate endpoint
        })
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const sendCommunication = async (type: 'email' | 'sms', template: string, bookingId: string) => {
    try {
      const token = localStorage.getItem('adminToken')
      const endpoint = type === 'email' 
        ? `/api/communication/email/${template}`
        : `/api/communication/sms/${template}`
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bookingId })
      })

      if (response.ok) {
        alert(`${type.toUpperCase()} sent successfully!`)
        setShowSendModal(false)
      } else {
        const error = await response.json()
        alert(`Failed to send ${type}: ${error.error}`)
      }
    } catch (error) {
      console.error(`Failed to send ${type}:`, error)
      alert(`Failed to send ${type}`)
    }
  }

  const sendCustomCommunication = async () => {
    if (!selectedBooking) return

    try {
      const token = localStorage.getItem('adminToken')
      const endpoint = sendType === 'email' 
        ? '/api/communication/email/custom'
        : '/api/communication/sms/custom'
      
      const payload = sendType === 'email' 
        ? {
            to: selectedBooking.email,
            subject: customSubject,
            message: customMessage
          }
        : {
            to: selectedBooking.phone,
            message: customMessage
          }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        alert(`Custom ${sendType.toUpperCase()} sent successfully!`)
        setShowSendModal(false)
        setCustomMessage('')
        setCustomSubject('')
      } else {
        const error = await response.json()
        alert(`Failed to send custom ${sendType}: ${error.error}`)
      }
    } catch (error) {
      console.error(`Failed to send custom ${sendType}:`, error)
      alert(`Failed to send custom ${sendType}`)
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'partial': return 'bg-yellow-100 text-yellow-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Communication Management</h1>
          <p className="text-gray-600">Manage email and SMS notifications for bookings</p>
        </div>
        <Button onClick={() => setShowSendModal(true)}>
          <Send className="w-4 h-4 mr-2" />
          Send Communication
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Enabled</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emailEnabled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS Enabled</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.smsEnabled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Both Enabled</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bothEnabled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Communications</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentCommunications}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name, email, or service type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
          <CardDescription>
            Manage communications for all bookings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Client</th>
                  <th className="text-left p-2">Service</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Payment</th>
                  <th className="text-left p-2">Preferences</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking._id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{booking.clientName}</div>
                        <div className="text-sm text-gray-500">{booking.email}</div>
                        <div className="text-sm text-gray-500">{booking.phone}</div>
                      </div>
                    </td>
                    <td className="p-2">{booking.serviceType}</td>
                    <td className="p-2">
                      {new Date(booking.date).toLocaleDateString()}
                    </td>
                    <td className="p-2">
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div>
                        <div className="text-sm">
                          ${booking.payment.totalAmount}
                        </div>
                        <Badge className={getPaymentStatusColor(booking.payment.status)}>
                          {booking.payment.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex flex-col gap-1">
                        {booking.communicationPreferences.emailNotifications && (
                          <Badge variant="outline" className="text-xs">
                            <Mail className="w-3 h-3 mr-1" />
                            Email
                          </Badge>
                        )}
                        {booking.communicationPreferences.smsNotifications && (
                          <Badge variant="outline" className="text-xs">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            SMS
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBooking(booking)
                            setShowSendModal(true)
                          }}
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Send
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Send Communication Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Send Communication</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSendModal(false)}
              >
                ×
              </Button>
            </div>

            {selectedBooking && (
              <div className="mb-4 p-4 bg-gray-50 rounded">
                <h3 className="font-medium">Selected Booking</h3>
                <p className="text-sm text-gray-600">
                  {selectedBooking.clientName} - {selectedBooking.serviceType}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedBooking.email} | {selectedBooking.phone}
                </p>
              </div>
            )}

            <Tabs value={sendType} onValueChange={(value) => setSendType(value as 'email' | 'sms')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="sms">SMS</TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4">
                <div>
                  <Label>Email Templates</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    <Button
                      variant="outline"
                      onClick={() => selectedBooking && sendCommunication('email', 'booking-confirmation', selectedBooking._id)}
                    >
                      Booking Confirmation
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => selectedBooking && sendCommunication('email', 'payment-reminder', selectedBooking._id)}
                    >
                      Payment Reminder
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => selectedBooking && sendCommunication('email', 'status-update', selectedBooking._id)}
                    >
                      Status Update
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Custom Email</Label>
                  <Input
                    placeholder="Subject"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="mt-2"
                  />
                  <Textarea
                    placeholder="Message content..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                  <Button
                    onClick={sendCustomCommunication}
                    disabled={!customSubject || !customMessage}
                    className="mt-2"
                  >
                    Send Custom Email
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="sms" className="space-y-4">
                <div>
                  <Label>SMS Templates</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    <Button
                      variant="outline"
                      onClick={() => selectedBooking && sendCommunication('sms', 'booking-confirmation', selectedBooking._id)}
                    >
                      Booking Confirmation
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => selectedBooking && sendCommunication('sms', 'payment-reminder', selectedBooking._id)}
                    >
                      Payment Reminder
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => selectedBooking && sendCommunication('sms', 'urgent-reminder', selectedBooking._id)}
                    >
                      Urgent Reminder
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Custom SMS</Label>
                  <Textarea
                    placeholder="SMS message (max 160 characters)..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="mt-2"
                    rows={3}
                    maxLength={160}
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    {customMessage.length}/160 characters
                  </div>
                  <Button
                    onClick={sendCustomCommunication}
                    disabled={!customMessage}
                    className="mt-2"
                  >
                    Send Custom SMS
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  )
}
