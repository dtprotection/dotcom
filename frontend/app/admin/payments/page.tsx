"use client"
import { useState, useEffect } from "react"
import { 
  CreditCard, DollarSign, Calendar, User, Mail, Phone, CheckCircle, Clock, AlertCircle,
  Plus, Send, Eye, Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Payment {
  id: string
  bookingId: string
  clientName: string
  email: string
  totalAmount: number
  depositAmount: number
  paidAmount: number
  status: string
  method: string
  dueDate: string
  createdAt: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  bookingId: string
  amount: number
  depositAmount: number
  status: string
  dueDate: string
  paidDate?: string
  paymentMethod: string
  paypalInvoiceId?: string
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showCreateInvoice, setShowCreateInvoice] = useState(false)
  const [createInvoiceData, setCreateInvoiceData] = useState({
    bookingId: '', totalAmount: '', depositAmount: '', serviceType: '', date: ''
  })

  useEffect(() => {
    fetchPayments()
    fetchInvoices()
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/admin/payments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments)
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error)
    }
  }

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/admin/invoices', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices)
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const createInvoice = async () => {
    try {
      const response = await fetch('/api/payments/create-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(createInvoiceData)
      })
      
      if (response.ok) {
        setShowCreateInvoice(false)
        setCreateInvoiceData({ bookingId: '', totalAmount: '', depositAmount: '', serviceType: '', date: '' })
        fetchInvoices()
      }
    } catch (error) {
      console.error('Failed to create invoice:', error)
    }
  }

  const sendInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/payments/send-invoice/${invoiceId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      
      if (response.ok) {
        fetchInvoices()
      }
    } catch (error) {
      console.error('Failed to send invoice:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'overdue': return 'text-red-600 bg-red-100'
      case 'partial': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'overdue': return <AlertCircle className="w-4 h-4" />
      case 'partial': return <DollarSign className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const calculateRemaining = (total: number, paid: number) => {
    return total - paid
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const totalRevenue = payments.reduce((sum, payment) => sum + payment.paidAmount, 0)
  const pendingPayments = payments.filter(p => p.status === 'pending').length
  const overduePayments = payments.filter(p => p.status === 'overdue').length
  const activeInvoices = invoices.filter(i => i.status === 'sent').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600">Manage payments, invoices, and payment tracking</p>
        </div>
        <Button onClick={() => setShowCreateInvoice(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">All time collected payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overduePayments}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Invoices</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeInvoices}</div>
            <p className="text-xs text-muted-foreground">Sent to clients</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Invoice Modal */}
      {showCreateInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Invoice</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bookingId">Booking ID</Label>
                <Input
                  id="bookingId"
                  value={createInvoiceData.bookingId}
                  onChange={(e) => setCreateInvoiceData({...createInvoiceData, bookingId: e.target.value})}
                  placeholder="Enter booking ID"
                />
              </div>
              <div>
                <Label htmlFor="totalAmount">Total Amount</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  value={createInvoiceData.totalAmount}
                  onChange={(e) => setCreateInvoiceData({...createInvoiceData, totalAmount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="depositAmount">Deposit Amount</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  value={createInvoiceData.depositAmount}
                  onChange={(e) => setCreateInvoiceData({...createInvoiceData, depositAmount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="serviceType">Service Type</Label>
                <Input
                  id="serviceType"
                  value={createInvoiceData.serviceType}
                  onChange={(e) => setCreateInvoiceData({...createInvoiceData, serviceType: e.target.value})}
                  placeholder="Security service"
                />
              </div>
              <div>
                <Label htmlFor="date">Due Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={createInvoiceData.date}
                  onChange={(e) => setCreateInvoiceData({...createInvoiceData, date: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={createInvoice} className="flex-1">Create Invoice</Button>
              <Button variant="outline" onClick={() => setShowCreateInvoice(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>Manage and track all invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Invoice #</th>
                  <th className="text-left p-2">Client</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Due Date</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 10).map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-mono">{invoice.invoiceNumber}</td>
                    <td className="p-2">{invoice.bookingId}</td>
                    <td className="p-2">{formatCurrency(invoice.amount)}</td>
                    <td className="p-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        {invoice.status}
                      </span>
                    </td>
                    <td className="p-2">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => sendInvoice(invoice.id)}>
                          <Send className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline">
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

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Tracking</CardTitle>
          <CardDescription>Monitor payment status and collections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Client</th>
                  <th className="text-left p-2">Total Amount</th>
                  <th className="text-left p-2">Paid Amount</th>
                  <th className="text-left p-2">Remaining</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Method</th>
                  <th className="text-left p-2">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 10).map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{payment.clientName}</div>
                        <div className="text-sm text-gray-500">{payment.email}</div>
                      </div>
                    </td>
                    <td className="p-2">{formatCurrency(payment.totalAmount)}</td>
                    <td className="p-2">{formatCurrency(payment.paidAmount)}</td>
                    <td className="p-2">{formatCurrency(calculateRemaining(payment.totalAmount, payment.paidAmount))}</td>
                    <td className="p-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </span>
                    </td>
                    <td className="p-2 capitalize">{payment.method}</td>
                    <td className="p-2">{new Date(payment.dueDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
