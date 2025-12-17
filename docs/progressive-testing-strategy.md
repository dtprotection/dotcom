# Progressive Testing Strategy

## Overview

This document outlines how to implement tests that work with partial service configuration, allowing the CI/CD pipeline to succeed even when some services (like PayPal) aren't fully configured yet.

## Current Situation

Based on the [Heroku config status](https://gist.github.com/msands/d68023d6db20a371a83e4df0489b5bca), your app is deployed with:
- ✅ MongoDB Atlas - Configured
- ✅ Mailgun - Configured (via add-on)
- ⚠️ Email Provider Config - Needs `EMAIL_PROVIDER` and `EMAIL_FROM` set
- ❌ PayPal - Not configured (missing credentials)
- ❌ SMS - Optional, not configured

## Strategy: Progressive Test Coverage

### Phase 1: Core Functionality Tests (Always Run)
These tests should **always pass** regardless of service configuration:

1. **Authentication Tests**
   - Admin login/logout
   - JWT token generation/validation
   - Password hashing
   - Role-based access control

2. **Database Model Tests**
   - Booking model validation
   - Admin model validation
   - Invoice model validation
   - Data relationships

3. **API Route Structure Tests**
   - Route registration
   - Middleware application
   - Error handling
   - Input validation

4. **Business Logic Tests**
   - Booking calculations
   - Date validations
   - Status transitions
   - Amount calculations

### Phase 2: Service-Dependent Tests (Conditional)
These tests **skip gracefully** when services aren't configured:

1. **PayPal Service Tests**
   - Skip if `PAYPAL_CLIENT_ID` or `PAYPAL_CLIENT_SECRET` not set
   - Test invoice creation logic (without actual API calls)
   - Test payment validation logic
   - Test webhook processing structure

2. **Email Service Tests**
   - Skip if `EMAIL_PROVIDER` not set
   - Test template rendering (always works)
   - Test email validation (always works)
   - Skip actual email sending tests if not configured

3. **SMS Service Tests**
   - Skip if `SMS_PROVIDER` not set
   - Test template rendering (always works)
   - Skip actual SMS sending tests if not configured

### Phase 3: Integration Tests (Progressive)
These tests run with available services:

1. **Booking Flow** - Always runs (core functionality)
2. **Payment Flow** - Skips if PayPal not configured
3. **Email Notifications** - Skips if email not configured
4. **SMS Notifications** - Skips if SMS not configured

## Implementation Pattern

### Using Service Check Utilities

```typescript
import { isPayPalConfigured, skipIfServiceNotAvailable } from '../utils/service-check'

// Skip entire test suite
const skipCheck = skipIfServiceNotAvailable(isPayPalConfigured, 'PayPal')
describe.skipIf(skipCheck.skip)('PayPalService', () => {
  // Tests here
})

// Skip individual test
it.skipIf(!isPayPalConfigured())('should create invoice', async () => {
  // Test code
})
```

### Using Environment Variables

```typescript
// In CI, set SKIP_OPTIONAL_SERVICE_TESTS=true
if (process.env.SKIP_OPTIONAL_SERVICE_TESTS === 'true' && !isPayPalConfigured()) {
  // Skip test
}
```

## CI/CD Configuration

### Current Setup
The workflow is configured to:
1. ✅ Always run core tests (authentication, models, routes)
2. ✅ Skip optional service tests if services aren't configured
3. ✅ Allow deployment even if some service tests are skipped
4. ✅ Build and deploy successfully with partial configuration

### Test Execution Flow

```
┌─────────────────────────────────────┐
│  CI/CD Pipeline Starts              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Lint & Type Check                  │
│  ✅ Must pass                        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Run Tests                          │
│  ✅ Core tests (always run)          │
│  ⏭️  Service tests (skip if missing) │
│  ✅ Tests pass or skip gracefully   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Build Application                  │
│  ✅ Must succeed                     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Deploy to Heroku                   │
│  ✅ Deploys if all required pass    │
└─────────────────────────────────────┘
```

## Test Categories

### ✅ Always Run (Required)
- Authentication & Authorization
- Database Models
- API Route Structure
- Input Validation
- Business Logic Calculations

### ⏭️ Skip If Not Configured (Optional)
- PayPal API Integration
- Email Sending
- SMS Sending
- External Service Webhooks

### 🔄 Progressive (Add Later)
- Full E2E flows with all services
- Performance tests
- Load tests
- Security penetration tests

## Adding Tests as Services Are Configured

### When PayPal Credentials Are Added

1. Remove `.skipIf()` from PayPal tests
2. Add integration tests for payment flow
3. Add webhook processing tests
4. Update CI to run PayPal tests

### When Email Is Fully Configured

1. Remove `.skipIf()` from email tests
2. Add email sending integration tests
3. Add email template tests
4. Test email delivery

### When SMS Is Added (Optional)

1. Add SMS service tests
2. Add SMS notification tests
3. Test SMS delivery

## Example: Current Test Status

Based on your current configuration:

```typescript
// ✅ These always run
describe('Authentication', () => { /* runs */ })
describe('Booking Model', () => { /* runs */ })
describe('API Routes', () => { /* runs */ })

// ⏭️ These skip gracefully
describe.skipIf(!isPayPalConfigured())('PayPal Service', () => { 
  // Skips - PayPal not configured
})

describe.skipIf(!isEmailConfigured())('Email Service', () => { 
  // May skip - EMAIL_PROVIDER not set
})

// ✅ These run (core functionality)
describe('Booking Flow', () => { 
  // Runs - doesn't require external services
})
```

## Benefits of This Approach

1. **CI/CD Works Now** - Pipeline succeeds with current configuration
2. **Progressive Enhancement** - Add tests as services are configured
3. **Clear Visibility** - See which tests are skipped and why
4. **No False Failures** - Tests don't fail due to missing config
5. **Easy Migration** - Remove skip conditions when services are ready

## Next Steps

1. ✅ **Current**: Tests skip PayPal/Email when not configured
2. ⏳ **Next**: Add `EMAIL_PROVIDER` and `EMAIL_FROM` to Heroku
3. ⏳ **Future**: Add PayPal credentials when available
4. ⏳ **Future**: Remove skip conditions and enable full test suite

## Monitoring Test Coverage

As you add services, track:
- Total test count
- Tests running (not skipped)
- Tests skipped (service not configured)
- Coverage percentage

Goal: Increase running tests as services are configured.

