/**
 * Utility functions to check if services are available for testing
 * Allows tests to skip when services aren't configured
 */

export function isPayPalConfigured(): boolean {
  return !!(
    process.env.PAYPAL_CLIENT_ID &&
    process.env.PAYPAL_CLIENT_SECRET &&
    process.env.PAYPAL_CLIENT_ID !== '' &&
    process.env.PAYPAL_CLIENT_SECRET !== ''
  )
}

export function isEmailConfigured(): boolean {
  const provider = process.env.EMAIL_PROVIDER
  if (!provider) return false

  if (provider === 'mailgun') {
    return !!(
      process.env.MAILGUN_API_KEY ||
      process.env.MAILGUN_SMTP_LOGIN
    )
  }

  if (provider === 'sendgrid') {
    return !!process.env.EMAIL_API_KEY
  }

  // SMTP configuration
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  )
}

export function isSMSConfigured(): boolean {
  return !!(
    process.env.SMS_PROVIDER &&
    (process.env.TWILIO_ACCOUNT_SID || process.env.SMS_API_KEY)
  )
}

export function shouldSkipOptionalServiceTests(): boolean {
  // In CI, we can skip optional service tests if services aren't configured
  return process.env.SKIP_OPTIONAL_SERVICE_TESTS === 'true'
}

/**
 * Conditionally skip tests if service is not configured
 * Use this in test files to skip tests when services aren't available
 */
export function skipIfServiceNotAvailable(
  serviceCheck: () => boolean,
  serviceName: string
): { skip: boolean; reason?: string } {
  if (shouldSkipOptionalServiceTests() && !serviceCheck()) {
    return {
      skip: true,
      reason: `${serviceName} is not configured. Skipping test.`
    }
  }
  return { skip: false }
}

