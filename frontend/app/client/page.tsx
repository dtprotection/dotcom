"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Calendar, 
  CreditCard, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  DollarSign,
  User,
  Settings
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface ClientData {
  id: string
  name: string
  email: string
  phone: string
  activeBookings: number
  totalBookings: number
  totalSpent: number
  communicationPreferences: {
    email: boolean
    sms: boolean
  }
  lastLogin: string
}

interface Booking {
  id: string
  serviceType: string
  date: string
  status: string
  totalAmount: number
  depositPaid: boolean
  finalPaymentPaid: boolean
}

interface Invoice {
  id: string
  amount: number
  status: string
  dueDate: string
}

export default function ClientDashboard() {
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("clientToken")
    if (!token) {
      router.push("/client/login")
      return
    }

    fetchClientData(token)
  }, [router])

  const fetchClientData = async (token: string) => {
    try {
      const [profileRes, bookingsRes, invoicesRes] = await Promise.all([
        fetch("/api/client/profile", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/client/bookings?limit=5", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/client/invoices?limit=5", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (profileRes.ok) {
        const profile = await profileRes.json()
        setClientData(profile)
      }

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json()
        setRecentBookings(bookingsData.bookings || [])
      }

      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json()
        setRecentInvoices(invoicesData.invoices || [])
      }
    } catch (error) {
      setError("Failed to load client data")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, text: "Pending" },
      confirmed: { variant: "default" as const, text: "Confirmed" },
      completed: { variant: "default" as const, text: "Completed" },
      cancelled: { variant: "destructive" as const, text: "Cancelled" }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.text}</Badge>
  }

  const getPaymentStatus = (depositPaid: boolean, finalPaymentPaid: boolean) => {
    if (finalPaymentPaid) return { status: "Paid", color: "text-green-600" }
    if (depositPaid) return { status: "Deposit Paid", color: "text-yellow-600" }
    return { status: "Pending", color: "text-red-600" }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {clientData?.name || 'Client'}
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your bookings and payments
          </p>
        </div>
        <Link href="/client/settings">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientData?.activeBookings || 0}</div>
            <p className="text-xs text-muted-foreground">
              {clientData?.totalBookings || 0} total bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(clientData?.totalSpent || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all completed bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentInvoices.filter(inv => inv.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Invoices awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Communication</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientData?.communicationPreferences?.email && clientData?.communicationPreferences?.sms ? 'Both' : 
               clientData?.communicationPreferences?.email ? 'Email' : 
               clientData?.communicationPreferences?.sms ? 'SMS' : 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              Notification preferences
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Recent Bookings
            </CardTitle>
            <CardDescription>
              Your latest service bookings and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No bookings found</p>
                <Link href="/services">
                  <Button variant="outline" size="sm" className="mt-2">
                    Book a Service
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentBookings.map((booking) => {
                  const paymentStatus = getPaymentStatus(booking.depositPaid, booking.finalPaymentPaid)
                  return (
                    <div key={booking.id} className="flex items-center space-x-4 p-3 rounded-lg border">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-amber-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {booking.serviceType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(booking.date)} • {paymentStatus.status}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(booking.status)}
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(booking.totalAmount)}
                        </span>
                      </div>
                    </div>
                  )
                })}
                <div className="pt-2">
                  <Link href="/client/bookings">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Bookings
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Recent Invoices
            </CardTitle>
            <CardDescription>
              Your latest invoices and payment status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No invoices found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center space-x-4 p-3 rounded-lg border">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        Invoice #{invoice.id.slice(-8)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Due: {formatDate(invoice.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                        {invoice.status === 'paid' ? 'Paid' : 'Pending'}
                      </Badge>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.amount)}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <Link href="/client/payments">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Payments
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/client/bookings">
              <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2">
                <Calendar className="h-6 w-6" />
                <span>View Bookings</span>
              </Button>
            </Link>
            <Link href="/client/payments">
              <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2">
                <CreditCard className="h-6 w-6" />
                <span>Payment History</span>
              </Button>
            </Link>
            <Link href="/client/settings">
              <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2">
                <Settings className="h-6 w-6" />
                <span>Settings</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
