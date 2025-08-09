import { describe, it, expect } from 'vitest'

describe('Communication System Business Logic', () => {
  describe('Email Template Generation', () => {
    const mockBooking = {
      clientName: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      serviceType: 'Event Security',
      date: new Date('2024-12-25'),
      venueAddress: '123 Main St',
      numberOfGuards: 4,
      payment: {
        totalAmount: 2000,
        depositAmount: 500,
        paidAmount: 0,
        status: 'pending' as const,
        method: 'paypal' as const
      },
      communicationPreferences: {
        emailNotifications: true,
        smsNotifications: false,
        preferredContact: 'email' as const
      }
    }

    const mockInvoice = {
      invoiceNumber: 'INV-000001',
      amount: 2000,
      depositAmount: 500,
      status: 'sent' as const,
      dueDate: new Date('2024-12-20'),
      paymentMethod: 'paypal' as const
    }

    describe('Booking Confirmation Template', () => {
      const generateBookingConfirmationTemplate = (booking: any) => {
        const subject = `Booking Confirmation - ${booking.serviceType}`;
        
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Booking Confirmation</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
              .content { padding: 20px; }
              .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Booking Confirmation</h1>
                <p>DT Protection Services</p>
              </div>
              <div class="content">
                <h2>Hello ${booking.clientName},</h2>
                <p>Thank you for choosing DT Protection Services. Your booking has been confirmed.</p>
                
                <h3>Booking Details:</h3>
                <ul>
                  <li><strong>Service Type:</strong> ${booking.serviceType}</li>
                  <li><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</li>
                  <li><strong>Venue:</strong> ${booking.venueAddress || 'To be confirmed'}</li>
                  <li><strong>Number of Guards:</strong> ${booking.numberOfGuards || 'To be confirmed'}</li>
                </ul>
                
                <h3>Payment Information:</h3>
                <ul>
                  <li><strong>Total Amount:</strong> $${booking.payment?.totalAmount || 0}</li>
                  <li><strong>Deposit Required:</strong> $${booking.payment?.depositAmount || 0}</li>
                  <li><strong>Payment Status:</strong> ${booking.payment?.status || 'pending'}</li>
                </ul>
                
                <p>We will contact you shortly with further details and payment instructions.</p>
                
                <p>If you have any questions, please don't hesitate to contact us.</p>
              </div>
              <div class="footer">
                <p>DT Protection Services<br>
                Email: admin@dtprotection.com<br>
                Phone: (555) 123-4567</p>
              </div>
            </div>
          </body>
          </html>
        `;

        const text = `
          Booking Confirmation - ${booking.serviceType}
          
          Hello ${booking.clientName},
          
          Thank you for choosing DT Protection Services. Your booking has been confirmed.
          
          Booking Details:
          - Service Type: ${booking.serviceType}
          - Date: ${new Date(booking.date).toLocaleDateString()}
          - Venue: ${booking.venueAddress || 'To be confirmed'}
          - Number of Guards: ${booking.numberOfGuards || 'To be confirmed'}
          
          Payment Information:
          - Total Amount: $${booking.payment?.totalAmount || 0}
          - Deposit Required: $${booking.payment?.depositAmount || 0}
          - Payment Status: ${booking.payment?.status || 'pending'}
          
          We will contact you shortly with further details and payment instructions.
          
          If you have any questions, please don't hesitate to contact us.
          
          DT Protection Services
          Email: admin@dtprotection.com
          Phone: (555) 123-4567
        `;

        return { subject, html, text };
      }

      it('should generate booking confirmation template with correct data', () => {
        const template = generateBookingConfirmationTemplate(mockBooking)
        
        expect(template.subject).toBe('Booking Confirmation - Event Security')
        expect(template.html).toContain('Hello John Doe')
        expect(template.html).toContain('Event Security')
        expect(template.html).toContain('$2000')
        expect(template.html).toContain('$500')
        expect(template.text).toContain('John Doe')
        expect(template.text).toContain('Event Security')
      })

      it('should handle missing optional fields gracefully', () => {
        const bookingWithoutOptional = {
          ...mockBooking,
          venueAddress: undefined,
          numberOfGuards: undefined
        }
        
        const template = generateBookingConfirmationTemplate(bookingWithoutOptional)
        
        expect(template.html).toContain('To be confirmed')
        expect(template.text).toContain('To be confirmed')
      })

      it('should format dates correctly', () => {
        const template = generateBookingConfirmationTemplate(mockBooking)
        
        // Check that the date is formatted (the exact format may vary by locale)
        expect(template.html).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/)
        expect(template.text).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/)
      })
    })

    describe('Payment Reminder Template', () => {
      const generatePaymentReminderTemplate = (booking: any, invoice?: any) => {
        const daysUntilEvent = Math.ceil((new Date(booking.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const urgency = daysUntilEvent <= 7 ? 'URGENT' : daysUntilEvent <= 14 ? 'Important' : 'Reminder';
        
        const subject = `${urgency}: Payment Reminder - ${booking.serviceType}`;
        
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Payment Reminder</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: ${daysUntilEvent <= 7 ? '#dc3545' : '#ffc107'}; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; }
              .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; }
              .urgent { color: #dc3545; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Payment Reminder</h1>
                <p>DT Protection Services</p>
              </div>
              <div class="content">
                <h2>Hello ${booking.clientName},</h2>
                <p>This is a reminder that your payment for <strong>${booking.serviceType}</strong> is due.</p>
                
                <div class="urgent">
                  <h3>Event Date: ${new Date(booking.date).toLocaleDateString()}</h3>
                  <p>Days until event: <strong>${daysUntilEvent}</strong></p>
                </div>
                
                <h3>Payment Details:</h3>
                <ul>
                  <li><strong>Total Amount:</strong> $${booking.payment?.totalAmount || 0}</li>
                  <li><strong>Amount Paid:</strong> $${booking.payment?.paidAmount || 0}</li>
                  <li><strong>Remaining Balance:</strong> $${(booking.payment?.totalAmount || 0) - (booking.payment?.paidAmount || 0)}</li>
                </ul>
                
                ${invoice ? `
                <h3>Invoice Information:</h3>
                <ul>
                  <li><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</li>
                  <li><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</li>
                </ul>
                ` : ''}
                
                <p>Please complete your payment to confirm your booking. You can pay online through the provided payment link or contact us for alternative payment methods.</p>
                
                <p>If you have already made a payment, please disregard this reminder.</p>
              </div>
              <div class="footer">
                <p>DT Protection Services<br>
                Email: admin@dtprotection.com<br>
                Phone: (555) 123-4567</p>
              </div>
            </div>
          </body>
          </html>
        `;

        const text = `
          ${urgency}: Payment Reminder - ${booking.serviceType}
          
          Hello ${booking.clientName},
          
          This is a reminder that your payment for ${booking.serviceType} is due.
          
          Event Date: ${new Date(booking.date).toLocaleDateString()}
          Days until event: ${daysUntilEvent}
          
          Payment Details:
          - Total Amount: $${booking.payment?.totalAmount || 0}
          - Amount Paid: $${booking.payment?.paidAmount || 0}
          - Remaining Balance: $${(booking.payment?.totalAmount || 0) - (booking.payment?.paidAmount || 0)}
          
          ${invoice ? `
          Invoice Information:
          - Invoice Number: ${invoice.invoiceNumber}
          - Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
          ` : ''}
          
          Please complete your payment to confirm your booking. You can pay online through the provided payment link or contact us for alternative payment methods.
          
          If you have already made a payment, please disregard this reminder.
          
          DT Protection Services
          Email: admin@dtprotection.com
          Phone: (555) 123-4567
        `;

        return { subject, html, text };
      }

      it('should generate payment reminder template with correct urgency', () => {
        const template = generatePaymentReminderTemplate(mockBooking)
        
        expect(template.subject).toContain('Payment Reminder')
        expect(template.html).toContain('Hello John Doe')
        expect(template.html).toContain('$2000')
        expect(template.html).toContain('$0')
        expect(template.html).toContain('$2000') // Remaining balance
      })

      it('should include invoice information when provided', () => {
        const template = generatePaymentReminderTemplate(mockBooking, mockInvoice)
        
        expect(template.html).toContain('INV-000001')
        expect(template.html).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/) // Date format
        expect(template.text).toContain('INV-000001')
      })

      it('should calculate remaining balance correctly', () => {
        const bookingWithPartialPayment = {
          ...mockBooking,
          payment: {
            ...mockBooking.payment,
            paidAmount: 500
          }
        }
        
        const template = generatePaymentReminderTemplate(bookingWithPartialPayment)
        
        expect(template.html).toContain('$1500') // 2000 - 500
        expect(template.text).toContain('$1500')
      })
    })

    describe('Status Update Template', () => {
      const generateStatusUpdateTemplate = (booking: any, status: string) => {
        const statusMessages = {
          'approved': 'Your booking has been approved!',
          'rejected': 'Your booking has been rejected.',
          'completed': 'Your service has been completed.',
          'cancelled': 'Your booking has been cancelled.'
        };

        const subject = `Booking Status Update - ${status.charAt(0).toUpperCase() + status.slice(1)}`;
        
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Status Update</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: ${status === 'approved' ? '#28a745' : status === 'rejected' ? '#dc3545' : '#6c757d'}; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; }
              .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Booking Status Update</h1>
                <p>DT Protection Services</p>
              </div>
              <div class="content">
                <h2>Hello ${booking.clientName},</h2>
                <p>${statusMessages[status as keyof typeof statusMessages] || 'Your booking status has been updated.'}</p>
                
                <h3>Booking Details:</h3>
                <ul>
                  <li><strong>Service Type:</strong> ${booking.serviceType}</li>
                  <li><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</li>
                  <li><strong>Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</li>
                </ul>
                
                ${status === 'approved' ? `
                <p>Your booking is now confirmed. We will contact you shortly with further details and payment instructions.</p>
                ` : status === 'rejected' ? `
                <p>If you have any questions about this decision, please contact us.</p>
                ` : status === 'completed' ? `
                <p>Thank you for choosing DT Protection Services. We hope you were satisfied with our service.</p>
                ` : `
                <p>If you have any questions, please don't hesitate to contact us.</p>
                `}
              </div>
              <div class="footer">
                <p>DT Protection Services<br>
                Email: admin@dtprotection.com<br>
                Phone: (555) 123-4567</p>
              </div>
            </div>
          </body>
          </html>
        `;

        const text = `
          Booking Status Update - ${status.charAt(0).toUpperCase() + status.slice(1)}
          
          Hello ${booking.clientName},
          
          ${statusMessages[status as keyof typeof statusMessages] || 'Your booking status has been updated.'}
          
          Booking Details:
          - Service Type: ${booking.serviceType}
          - Date: ${new Date(booking.date).toLocaleDateString()}
          - Status: ${status.charAt(0).toUpperCase() + status.slice(1)}
          
          ${status === 'approved' ? `
          Your booking is now confirmed. We will contact you shortly with further details and payment instructions.
          ` : status === 'rejected' ? `
          If you have any questions about this decision, please contact us.
          ` : status === 'completed' ? `
          Thank you for choosing DT Protection Services. We hope you were satisfied with our service.
          ` : `
          If you have any questions, please don't hesitate to contact us.
          `}
          
          DT Protection Services
          Email: admin@dtprotection.com
          Phone: (555) 123-4567
        `;

        return { subject, html, text };
      }

      it('should generate approved status template with correct styling', () => {
        const template = generateStatusUpdateTemplate(mockBooking, 'approved')
        
        expect(template.subject).toBe('Booking Status Update - Approved')
        expect(template.html).toContain('#28a745') // Green color
        expect(template.html).toContain('Your booking has been approved!')
        expect(template.html).toContain('Your booking is now confirmed')
      })

      it('should generate rejected status template with correct styling', () => {
        const template = generateStatusUpdateTemplate(mockBooking, 'rejected')
        
        expect(template.subject).toBe('Booking Status Update - Rejected')
        expect(template.html).toContain('#dc3545') // Red color
        expect(template.html).toContain('Your booking has been rejected.')
        expect(template.html).toContain('questions about this decision')
      })

      it('should handle unknown status gracefully', () => {
        const template = generateStatusUpdateTemplate(mockBooking, 'unknown')
        
        expect(template.subject).toBe('Booking Status Update - Unknown')
        expect(template.html).toContain('#6c757d') // Gray color
        expect(template.html).toContain('Your booking status has been updated.')
      })
    })
  })

  describe('SMS Template Generation', () => {
    const mockBooking = {
      clientName: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      serviceType: 'Event Security',
      date: new Date('2024-12-25'),
      payment: {
        totalAmount: 2000,
        depositAmount: 500,
        paidAmount: 0,
        status: 'pending' as const
      }
    }

    describe('SMS Template Processing', () => {
      const processSMSTemplate = (template: string, booking: any, invoice?: any) => {
        const daysUntilEvent = Math.ceil((new Date(booking.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const remaining = (booking.payment?.totalAmount || 0) - (booking.payment?.paidAmount || 0);
        
        return template
          .replace('{name}', booking.clientName)
          .replace('{service}', booking.serviceType)
          .replace('{date}', new Date(booking.date).toLocaleDateString())
          .replace('{total}', (booking.payment?.totalAmount || 0).toString())
          .replace('{deposit}', (booking.payment?.depositAmount || 0).toString())
          .replace('{remaining}', remaining.toString())
          .replace('{days}', daysUntilEvent.toString())
          .replace('{status}', booking.payment?.status || 'pending');
      }

      it('should process booking confirmation template correctly', () => {
        const template = 'Hi {name}, your {service} booking for {date} has been confirmed. Total: ${total}, Deposit: ${deposit}. Reply STOP to unsubscribe.';
        const result = processSMSTemplate(template, mockBooking)
        
        expect(result).toContain('Hi John Doe')
        expect(result).toContain('Event Security')
        expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/) // Date format
        expect(result).toContain('$2000')
        expect(result).toContain('$500')
      })

      it('should process payment reminder template correctly', () => {
        const template = 'Hi {name}, payment reminder for {service} on {date}. Remaining: ${remaining}. Days until event: {days}. Reply STOP to unsubscribe.';
        const result = processSMSTemplate(template, mockBooking)
        
        expect(result).toContain('Hi John Doe')
        expect(result).toContain('Event Security')
        expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/) // Date format
        expect(result).toContain('$2000') // Remaining amount
        expect(result).toContain('Reply STOP to unsubscribe')
      })

      it('should calculate days until event correctly', () => {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 10)
        
        const bookingWithFutureDate = {
          ...mockBooking,
          date: futureDate
        }
        
        const template = 'Days until event: {days}';
        const result = processSMSTemplate(template, bookingWithFutureDate)
        
        expect(result).toContain('Days until event: 10')
      })
    })

    describe('Phone Number Validation', () => {
      const validatePhoneNumber = (phone: string): boolean => {
        // More strict US phone number validation
        const phoneRegex = /^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
        const cleaned = phone.replace(/\D/g, '');
        return phoneRegex.test(phone) && (cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1')));
      }

      it('should validate US phone numbers correctly', () => {
        expect(validatePhoneNumber('1234567890')).toBe(true)
        expect(validatePhoneNumber('(123) 456-7890')).toBe(true)
        expect(validatePhoneNumber('123-456-7890')).toBe(true)
        expect(validatePhoneNumber('123.456.7890')).toBe(true)
        expect(validatePhoneNumber('+1 123 456 7890')).toBe(true)
        expect(validatePhoneNumber('+11234567890')).toBe(true)
      })

      it('should reject invalid phone numbers', () => {
        expect(validatePhoneNumber('123456789')).toBe(false) // Too short
        expect(validatePhoneNumber('123456789012')).toBe(false) // Too long
        expect(validatePhoneNumber('abc-def-ghij')).toBe(false) // Letters
        expect(validatePhoneNumber('')).toBe(false) // Empty
      })
    })

    describe('Phone Number Formatting', () => {
      const formatPhoneNumber = (phone: string): string => {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
          return `+1${cleaned}`;
        } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
          return `+${cleaned}`;
        }
        return phone;
      }

      it('should format 10-digit numbers to E.164', () => {
        expect(formatPhoneNumber('1234567890')).toBe('+11234567890')
        expect(formatPhoneNumber('(123) 456-7890')).toBe('+11234567890')
        expect(formatPhoneNumber('123-456-7890')).toBe('+11234567890')
      })

      it('should format 11-digit numbers with country code', () => {
        expect(formatPhoneNumber('11234567890')).toBe('+11234567890')
        expect(formatPhoneNumber('+11234567890')).toBe('+11234567890')
      })

      it('should return original for invalid formats', () => {
        expect(formatPhoneNumber('123456789')).toBe('123456789')
        expect(formatPhoneNumber('abc123def')).toBe('abc123def')
      })
    })
  })

  describe('Communication Preferences', () => {
    describe('Preference Validation', () => {
      const validatePreferences = (preferences: any) => {
        const errors: string[] = []
        
        if (typeof preferences.emailNotifications !== 'boolean') {
          errors.push('emailNotifications must be a boolean')
        }
        
        if (typeof preferences.smsNotifications !== 'boolean') {
          errors.push('smsNotifications must be a boolean')
        }
        
        if (!['email', 'phone', 'both'].includes(preferences.preferredContact)) {
          errors.push('preferredContact must be email, phone, or both')
        }
        
        return errors
      }

      it('should validate correct preferences', () => {
        const preferences = {
          emailNotifications: true,
          smsNotifications: false,
          preferredContact: 'email'
        }
        
        const errors = validatePreferences(preferences)
        expect(errors).toHaveLength(0)
      })

      it('should catch invalid email notifications type', () => {
        const preferences = {
          emailNotifications: 'yes',
          smsNotifications: false,
          preferredContact: 'email'
        }
        
        const errors = validatePreferences(preferences)
        expect(errors).toContain('emailNotifications must be a boolean')
      })

      it('should catch invalid preferred contact', () => {
        const preferences = {
          emailNotifications: true,
          smsNotifications: false,
          preferredContact: 'fax'
        }
        
        const errors = validatePreferences(preferences)
        expect(errors).toContain('preferredContact must be email, phone, or both')
      })
    })

    describe('Notification Logic', () => {
      const shouldSendEmail = (preferences: any, type: 'email' | 'sms' | 'both') => {
        if (type === 'email' || type === 'both') {
          return preferences.emailNotifications === true
        }
        return false
      }

      const shouldSendSMS = (preferences: any, type: 'email' | 'sms' | 'both') => {
        if (type === 'sms' || type === 'both') {
          return preferences.smsNotifications === true
        }
        return false
      }

      it('should send email when email notifications enabled', () => {
        const preferences = {
          emailNotifications: true,
          smsNotifications: false,
          preferredContact: 'email'
        }
        
        expect(shouldSendEmail(preferences, 'email')).toBe(true)
        expect(shouldSendEmail(preferences, 'both')).toBe(true)
        expect(shouldSendEmail(preferences, 'sms')).toBe(false)
      })

      it('should send SMS when SMS notifications enabled', () => {
        const preferences = {
          emailNotifications: false,
          smsNotifications: true,
          preferredContact: 'phone'
        }
        
        expect(shouldSendSMS(preferences, 'sms')).toBe(true)
        expect(shouldSendSMS(preferences, 'both')).toBe(true)
        expect(shouldSendSMS(preferences, 'email')).toBe(false)
      })

      it('should send both when both enabled and type is both', () => {
        const preferences = {
          emailNotifications: true,
          smsNotifications: true,
          preferredContact: 'both'
        }
        
        expect(shouldSendEmail(preferences, 'both')).toBe(true)
        expect(shouldSendSMS(preferences, 'both')).toBe(true)
      })
    })
  })

  describe('Error Handling', () => {
    describe('Email Service Errors', () => {
      const handleEmailError = (error: any) => {
        if (error.code === 'EAUTH') {
          return 'Authentication failed - check email credentials'
        } else if (error.code === 'ECONNECTION') {
          return 'Connection failed - check network and email server'
        } else if (error.code === 'EMESSAGE') {
          return 'Message rejected - check recipient email address'
        } else {
          return 'Email sending failed - please try again later'
        }
      }

      it('should handle authentication errors', () => {
        const error = { code: 'EAUTH', message: 'Invalid credentials' }
        const result = handleEmailError(error)
        expect(result).toBe('Authentication failed - check email credentials')
      })

      it('should handle connection errors', () => {
        const error = { code: 'ECONNECTION', message: 'Connection timeout' }
        const result = handleEmailError(error)
        expect(result).toBe('Connection failed - check network and email server')
      })

      it('should handle message errors', () => {
        const error = { code: 'EMESSAGE', message: 'Invalid recipient' }
        const result = handleEmailError(error)
        expect(result).toBe('Message rejected - check recipient email address')
      })

      it('should handle unknown errors', () => {
        const error = { code: 'UNKNOWN', message: 'Something went wrong' }
        const result = handleEmailError(error)
        expect(result).toBe('Email sending failed - please try again later')
      })
    })

    describe('SMS Service Errors', () => {
      const handleSMSError = (error: any) => {
        if (error.code === 'AUTH_FAILED') {
          return 'SMS authentication failed - check API credentials'
        } else if (error.code === 'INVALID_NUMBER') {
          return 'Invalid phone number format'
        } else if (error.code === 'QUOTA_EXCEEDED') {
          return 'SMS quota exceeded - please try again later'
        } else {
          return 'SMS sending failed - please try again later'
        }
      }

      it('should handle authentication errors', () => {
        const error = { code: 'AUTH_FAILED', message: 'Invalid API key' }
        const result = handleSMSError(error)
        expect(result).toBe('SMS authentication failed - check API credentials')
      })

      it('should handle invalid number errors', () => {
        const error = { code: 'INVALID_NUMBER', message: 'Invalid phone number' }
        const result = handleSMSError(error)
        expect(result).toBe('Invalid phone number format')
      })

      it('should handle quota errors', () => {
        const error = { code: 'QUOTA_EXCEEDED', message: 'Monthly quota exceeded' }
        const result = handleSMSError(error)
        expect(result).toBe('SMS quota exceeded - please try again later')
      })
    })
  })
})
