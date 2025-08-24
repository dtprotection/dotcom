"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  Home,
  Calendar,
  CreditCard,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Bell
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ClientLayoutProps {
  children: React.ReactNode
}

interface ClientData {
  id: string
  name: string
  email: string
  activeBookings: number
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const token = localStorage.getItem("clientToken")
    if (!token) {
      router.push("/client/login")
      return
    }

    // Skip authentication check for login page
    if (pathname === "/client/login") {
      setIsLoading(false)
      return
    }

    fetchClientData(token)
  }, [router, pathname])

  const fetchClientData = async (token: string) => {
    try {
      const response = await fetch("/api/client/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setClientData(data)
      } else {
        localStorage.removeItem("clientToken")
        router.push("/client/login")
      }
    } catch (error) {
      console.error("Error fetching client data:", error)
      router.push("/client/login")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("clientToken")
    localStorage.removeItem("clientData")
    router.push("/client/login")
  }

  const navigation = [
    { name: "Dashboard", href: "/client", icon: Home },
    { name: "My Bookings", href: "/client/bookings", icon: Calendar },
    { name: "Payments", href: "/client/payments", icon: CreditCard },
    { name: "Messages", href: "/client/messages", icon: MessageSquare },
    { name: "Settings", href: "/client/settings", icon: Settings },
  ]

  // Don't render layout for login page
  if (pathname === "/client/login") {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DT</span>
              </div>
              <span className="ml-3 text-lg font-semibold">Client Portal</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Client Info */}
          {clientData && (
            <div className="px-6 py-4 border-b bg-gray-50">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-amber-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {clientData.name}
                  </p>
                  <p className="text-xs text-gray-500">{clientData.email}</p>
                </div>
              </div>
              <div className="mt-3">
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  {clientData.activeBookings || 0} Active Bookings
                </Badge>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "bg-amber-50 text-amber-700 border-r-2 border-amber-500"
                      : "text-gray-700 hover:bg-amber-50 hover:text-amber-700"
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="border-t p-4">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start text-gray-700 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="ml-4 lg:ml-0">
                <h1 className="text-xl font-semibold text-gray-900">
                  {navigation.find(item => item.href === pathname)?.name || "Client Portal"}
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {clientData && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  {clientData.activeBookings || 0} Active Bookings
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
