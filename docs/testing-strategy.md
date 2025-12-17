# Testing Strategy for DT Protection Application

## Overview

This document outlines the comprehensive testing strategy for the DT Protection booking system, including unit tests, integration tests, and end-to-end tests.

**Important**: This strategy supports **progressive testing** - tests gracefully skip when optional services (PayPal, Email, SMS) aren't configured, allowing CI/CD to succeed with partial configuration. See [Progressive Testing Strategy](./progressive-testing-strategy.md) for details.

## Test Execution Strategy

### Progressive Test Coverage

Tests are organized into three categories:

1. **Always Run** - Core functionality tests that don't require external services
2. **Conditional** - Service-dependent tests that skip when services aren't configured
3. **Progressive** - Tests added as services become available

This allows CI/CD to succeed even when some services (like PayPal) aren't fully configured yet.

### Service Availability Checks

Use the `service-check.ts` utility to conditionally run tests:

```typescript
import { isPayPalConfigured, skipIfServiceNotAvailable } from '../utils/service-check'

// Skip entire suite
const skipCheck = skipIfServiceNotAvailable(isPayPalConfigured, 'PayPal')
describe.skipIf(skipCheck.skip)('PayPalService', () => {
  // Tests
})

// Skip individual test
it.skipIf(!isPayPalConfigured())('should create invoice', async () => {
  // Test code
})
```

## Test Categories

### 1. Unit Tests

#### Backend Services
- **Email Service** (`backend/src/services/email.service.ts`)
  - Template rendering
  - Email validation
  - Attachment handling
  - Error handling for failed sends

- **SMS Service** (`backend/src/services/sms.service.ts`)
  - Template rendering
  - Phone number validation
  - Message formatting
  - Connection verification

- **PayPal Service** (`backend/src/services/paypal.service.ts`)
  - Invoice creation logic
  - Payment validation
  - Webhook processing
  - Error handling

#### Models
- **Admin Model** (`backend/src/models/admin.model.ts`)
  - Password hashing
  - JWT token generation
  - Field validation
  - JSON serialization (password exclusion)

- **Booking Model** (`backend/src/models/booking.model.ts`)
  - Status transitions
  - Payment calculations
  - Date validations
  - Service type validation

- **Invoice Model** (`backend/src/models/invoice.model.ts`)
  - Invoice number generation
  - Amount calculations
  - Status tracking

#### Middleware
- **Auth Middleware** (`backend/src/middleware/auth.middleware.ts`)
  - Token validation
  - Role-based access control
  - Error responses

- **Error Middleware** (`backend/src/middleware/error.middleware.ts`)
  - Error formatting
  - Status code handling
  - Logging

### 2. Integration Tests

#### API Routes
- **Admin Routes** (`/api/admin`)
  - Login endpoint
  - Admin CRUD operations
  - Password updates
  - Account deactivation

- **Booking Routes** (`/api/bookings`)
  - Create booking
  - Update booking status
  - Get bookings with filters
  - Delete booking

- **Payment Routes** (`/api/payments`)
  - Create invoice
  - Send invoice
  - Process webhook
  - Update payment method
  - Get payment status

- **Client Routes** (`/api/client`)
  - Client registration
  - Client login
  - Get client bookings
  - Update client profile

- **Dashboard Routes** (`/api/dashboard`)
  - Statistics calculation
  - Analytics data
  - Export functionality
  - Admin management

- **Communication Routes** (`/api/communication`)
  - Send email
  - Send SMS
  - Get communication history

### 3. End-to-End Tests

#### Critical User Flows
1. **Client Booking Flow**
   - Browse services
   - Submit booking form
   - Receive confirmation
   - Make payment
   - Receive updates

2. **Admin Management Flow**
   - Admin login
   - View dashboard
   - Manage bookings
   - Update booking status
   - Generate invoices
   - Send communications

3. **Payment Processing Flow**
   - Create invoice
   - Send to client
   - Process payment
   - Update booking status
   - Send confirmation

4. **Communication Flow**
   - Send email notification
   - Send SMS reminder
   - Track communication history

### 4. Frontend Component Tests

#### Pages
- **Home Page** (`app/page.tsx`)
  - Hero section rendering
  - Service cards display
  - Navigation functionality

- **Services Page** (`app/services/page.tsx`)
  - Service listing
  - Filter functionality
  - Booking form integration

- **Client Portal** (`app/client/*`)
  - Login form
  - Booking list
  - Payment history
  - Settings page

- **Admin Portal** (`app/admin/*`)
  - Dashboard statistics
  - Booking management
  - Payment tracking
  - Communication tools

#### Components
- **Booking Form** (`components/booking-form.tsx`)
  - Form validation
  - Date selection
  - Service type selection
  - Submission handling

- **Navbar** (`components/navbar.tsx`)
  - Navigation links
  - Authentication state
  - Mobile menu

- **UI Components** (`components/ui/*`)
  - Button interactions
  - Form inputs
  - Modal dialogs
  - Data tables

## Test Implementation Priorities

### Phase 1: Critical Path Tests (High Priority)
1. ✅ Authentication (Admin & Client)
2. ✅ Booking creation and management
3. ✅ Payment processing
4. ✅ Dashboard statistics

### Phase 2: Service Tests (Medium Priority)
1. Email service unit tests
2. SMS service unit tests
3. PayPal service unit tests
4. Error handling tests

### Phase 3: Integration Tests (Medium Priority)
1. Full booking flow
2. Payment flow
3. Communication flow
4. Admin management flow

### Phase 4: Frontend Tests (Lower Priority)
1. Component rendering tests
2. User interaction tests
3. Form validation tests
4. Navigation tests

## Test Coverage Goals

- **Unit Tests**: 80%+ coverage for services and models
- **Integration Tests**: 70%+ coverage for API routes
- **E2E Tests**: All critical user flows covered
- **Frontend Tests**: 60%+ coverage for components

## Test Data Management

### Test Fixtures
- Create reusable test data factories
- Use database seeding for integration tests
- Mock external services (PayPal, Email, SMS)

### Test Isolation
- Each test should be independent
- Clean up test data after each test
- Use transactions where possible
- Reset database state between test suites

## Continuous Integration

### Pre-commit Hooks
- Run linting
- Run type checking
- Run unit tests

### CI Pipeline (GitHub Actions)
1. **Lint & Type Check**: Verify code quality
2. **Unit Tests**: Run all unit tests
3. **Integration Tests**: Run API integration tests
4. **Build**: Verify application builds successfully
5. **Deploy**: Deploy to Heroku if all checks pass

## Test Commands

```bash
# Run all tests
cd tests && npm run test:run

# Run tests in watch mode
cd tests && npm run test

# Run tests with coverage
cd tests && npm run test:coverage

# Run specific test file
cd tests && npm run test:run -- booking-routes.test.ts

# Run linting
npm run lint

# Type check
npx tsc -p tsconfig.backend.json --noEmit
cd frontend && npx tsc --noEmit
```

## Mocking Strategy

### External Services
- **PayPal**: Mock API responses
- **Email Service**: Mock email sending
- **SMS Service**: Mock SMS sending
- **MongoDB**: Use test database or in-memory database

### Authentication
- Mock JWT tokens for testing
- Use test admin credentials
- Mock authentication middleware when needed

## Performance Testing

### Load Testing
- Test API endpoints under load
- Verify database query performance
- Test concurrent booking submissions

### Stress Testing
- Test system limits
- Verify error handling under stress
- Test resource cleanup

## Security Testing

### Authentication & Authorization
- Test unauthorized access attempts
- Test token expiration
- Test role-based access control
- Test password security

### Input Validation
- Test SQL injection prevention
- Test XSS prevention
- Test input sanitization
- Test file upload security

## Test Maintenance

### Regular Updates
- Update tests when features change
- Remove obsolete tests
- Refactor tests for clarity
- Add tests for bug fixes

### Documentation
- Document test scenarios
- Keep test data up to date
- Document mocking strategies
- Update this document as needed

