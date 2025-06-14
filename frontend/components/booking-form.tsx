"use client"

import type React from "react"

import { useState } from "react"
import { CalendarIcon, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export default function BookingForm() {
  const [date, setDate] = useState<Date>()
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real application, you would handle the form submission here
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-900/50 dark:bg-amber-900/20">
        <CheckCircle className="h-12 w-12 text-amber-500" />
        <h3 className="mt-4 text-2xl font-bold">Booking Received</h3>
        <p className="mt-2 text-muted-foreground">
          Thank you for your booking request. We'll contact you shortly to confirm your appointment.
        </p>
        <Button onClick={() => setIsSubmitted(false)} className="mt-6 bg-amber-500 hover:bg-amber-600 text-black">
          Book Another Appointment
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" placeholder="John Doe" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="john@example.com" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" type="tel" placeholder="(123) 456-7890" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="service">Service</Label>
          <Select required>
            <SelectTrigger id="service">
              <SelectValue placeholder="Select a service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal_protection">Personal Protection</SelectItem>
              <SelectItem value="event_security">Event Security</SelectItem>
              <SelectItem value="risk_assessment">Risk Assessment & Mitigation</SelectItem>
              <SelectItem value="corporate_security">Corporate Security</SelectItem>
              <SelectItem value="bar_club_venue_security">Bar, Club, And Venue Security</SelectItem>
              <SelectItem value="asset_protection">Asset Protection</SelectItem>
              <SelectItem value="transportation_security">Transportation Security</SelectItem>
              <SelectItem value="on_site_protection">On-Site Protection</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Preferred Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? date.toDateString() : "Select a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="start_time">Start Time</Label>
            <Input id="start_time" type="time" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_time">End Time</Label>
            <Input id="end_time" type="time" required />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Additional Information</Label>
        <Textarea
          id="message"
          placeholder="Please share any specific requirements or questions you have."
          className="min-h-[120px]"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Please note that events running over the requested end time may incur additional charges.
      </p>
      <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-black">
        Submit Booking Request
      </Button>
    </form>
  )
}
