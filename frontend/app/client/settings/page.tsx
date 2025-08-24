"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Settings, 
  Bell, 
  Mail, 
  MessageSquare, 
  User, 
  Shield, 
  Save,
  CheckCircle,
  AlertCircle
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ClientData {
  id: string
  name: string
  email: string
  phone: string
  communicationPreferences: {
    email: boolean
    sms: boolean
  }
}

export default function ClientSettings() {
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [preferences, setPreferences] = useState({
    email: true,
    sms: true
  })
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
      const response = await fetch("/api/client/profile", {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setClientData(data)
        setPreferences(data.communicationPreferences || { email: true, sms: true })
      } else {
        setError("Failed to load client data")
      }
    } catch (error) {
      setError("Network error")
    } finally {
      setIsLoading(false)
    }
  }

  const savePreferences = async () => {
    const token = localStorage.getItem("clientToken")
    if (!token) {
      router.push("/client/login")
      return
    }

    setIsSaving(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/client/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ communicationPreferences: preferences })
      })

      if (response.ok) {
        setSuccess("Communication preferences updated successfully!")
        // Update local client data
        if (clientData) {
          setClientData({
            ...clientData,
            communicationPreferences: preferences
          })
        }
      } else {
        const data = await response.json()
        setError(data.error || "Failed to update preferences")
      }
    } catch (error) {
      setError("Network error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("clientToken")
    localStorage.removeItem("clientData")
    router.push("/client/login")
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">
              Manage your account preferences and communication settings
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
                    <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error && !clientData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Settings</h3>
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
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">
            Manage your account preferences and communication settings
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your basic account details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Full Name
              </Label>
              <Input
                id="name"
                value={clientData?.name || ""}
                disabled
                className="mt-1 bg-gray-50"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={clientData?.email || ""}
                disabled
                className="mt-1 bg-gray-50"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Phone Number
              </Label>
              <Input
                id="phone"
                value={clientData?.phone || ""}
                disabled
                className="mt-1 bg-gray-50"
              />
            </div>

            <div className="pt-4">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> To update your contact information, please contact our support team.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Communication Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Communication Preferences
            </CardTitle>
            <CardDescription>
              Choose how you'd like to receive notifications and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <div>
                    <Label htmlFor="email-notifications" className="text-sm font-medium text-gray-700">
                      Email Notifications
                    </Label>
                    <p className="text-xs text-gray-500">
                      Receive booking updates, payment reminders, and important notices via email
                    </p>
                  </div>
                </div>
                <Switch
                  id="email-notifications"
                  checked={preferences.email}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, email: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                  <div>
                    <Label htmlFor="sms-notifications" className="text-sm font-medium text-gray-700">
                      SMS Notifications
                    </Label>
                    <p className="text-xs text-gray-500">
                      Get urgent updates and payment reminders via text message
                    </p>
                  </div>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={preferences.sms}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, sms: checked }))
                  }
                />
              </div>
            </div>

            <div className="pt-4">
              <Button 
                onClick={savePreferences} 
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
          <CardDescription>
            Information about how we protect your data and privacy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Data Protection</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• All data is encrypted in transit and at rest</li>
                <li>• We never share your personal information with third parties</li>
                <li>• Your payment information is processed securely via PayPal</li>
                <li>• Regular security audits and updates</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Privacy Controls</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• You control your communication preferences</li>
                <li>• Access to view and download your data</li>
                <li>• Right to request data deletion</li>
                <li>• Transparent data usage policies</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card>
        <CardHeader>
          <CardTitle>Help & Support</CardTitle>
          <CardDescription>
            Get help with your account or contact our support team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Need Help?</h4>
              <p className="text-sm text-gray-600 mb-3">
                Contact our support team for assistance
              </p>
              <Button variant="outline" size="sm">
                Contact Support
              </Button>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">FAQ</h4>
              <p className="text-sm text-gray-600 mb-3">
                Find answers to common questions
              </p>
              <Button variant="outline" size="sm">
                View FAQ
              </Button>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Feedback</h4>
              <p className="text-sm text-gray-600 mb-3">
                Share your experience with us
              </p>
              <Button variant="outline" size="sm">
                Send Feedback
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
