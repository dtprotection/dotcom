# DT Protection Admin Interface Test Suite

This directory contains comprehensive tests for the admin authentication system and dashboard functionality.

## 🧪 Test Coverage

### Backend Tests (`admin-auth.test.ts`)
- **Admin Model Tests**
  - Password hashing and validation
  - JWT token generation
  - JSON serialization (password exclusion)
  - Role-based access control

- **Authentication Endpoints**
  - Login with username/email
  - Invalid credential handling
  - Inactive admin rejection
  - Token verification
  - Field validation

- **Dashboard Endpoints**
  - Statistics calculation
  - Recent requests retrieval
  - Authentication requirements
  - Error handling

- **Admin Management**
  - Admin creation (super admin only)
  - Duplicate prevention
  - Status updates
  - Password changes
  - Field validation

- **Booking Integration**
  - Admin access to bookings
  - Status updates
  - Authentication requirements

### Frontend Tests (`frontend-admin.test.ts`)
- **Admin Login Component**
  - Form rendering
  - Valid credential submission
  - Error handling
  - Password visibility toggle
  - Redirect logic

- **Admin Dashboard Component**
  - Loading states
  - Data display
  - Error handling
  - Statistics rendering

- **Admin Requests Component**
  - Table rendering
  - Search functionality
  - Status updates
  - Filtering
  - Modal interactions

## 🚀 Running Tests

### Quick Start
```bash
# Run all tests
./run-tests.sh

# Or run individually
cd tests
npm run test:run
```

### Individual Test Files
```bash
# Backend tests only
npm run test:run -- admin-auth.test.ts

# Frontend tests only
npm run test:run -- frontend-admin.test.ts

# Watch mode
npm run test

# UI mode (visual test runner)
npm run test:ui
```

### Test Coverage
```bash
# Generate coverage report
npm run test:coverage
```

## 📋 Test Environment Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Environment Variables
Create `.env.test` file:
```env
NODE_ENV=test
JWT_SECRET=test-secret-key
JWT_EXPIRES_IN=1h
TEST_MONGODB_URI=mongodb://localhost:27017/dtprotection-test
```

### Database Setup
Tests use a separate test database to avoid affecting production data:
- Database: `dtprotection-test`
- Collections are cleared before each test
- Isolated test environment

## 🧩 Test Structure

### Backend Test Pattern
```typescript
describe('Feature', () => {
  let adminToken: string
  let testAdmin: any

  beforeEach(async () => {
    // Setup test data
    testAdmin = new Admin({...})
    await testAdmin.save()
    
    // Login and get token
    const loginResponse = await request(app)
      .post('/api/admin/login')
      .send({...})
    
    adminToken = loginResponse.body.token
  })

  it('should perform action', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({...})
  })
})
```

### Frontend Test Pattern
```typescript
describe('Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue('test-token')
  })

  it('should render correctly', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({...})
    }
    ;(fetch as any).mockResolvedValue(mockResponse)

    render(<Component />)

    await waitFor(() => {
      expect(screen.getByText('Expected Text')).toBeInTheDocument()
    })
  })
})
```

## 🔧 Adding New Tests

### Backend API Tests
1. Create test file: `tests/new-feature.test.ts`
2. Import required models and app
3. Set up test data in `beforeEach`
4. Test all endpoints with various scenarios
5. Include error cases and edge cases

### Frontend Component Tests
1. Create test file: `tests/frontend-new-component.test.ts`
2. Mock required dependencies
3. Test component rendering
4. Test user interactions
5. Test API integration

### Test Best Practices
- **Isolation**: Each test should be independent
- **Cleanup**: Clear data between tests
- **Mocking**: Mock external dependencies
- **Coverage**: Test happy path and error cases
- **Descriptive**: Use clear test descriptions

## 📊 Test Metrics

### Coverage Goals
- **Backend**: 90%+ line coverage
- **Frontend**: 80%+ line coverage
- **Critical Paths**: 100% coverage

### Performance Targets
- **Test Runtime**: < 30 seconds for full suite
- **Individual Tests**: < 2 seconds each
- **Database Operations**: < 100ms per operation

## 🐛 Debugging Tests

### Common Issues
1. **MongoDB Connection**: Ensure MongoDB is running
2. **Port Conflicts**: Check for port 3001 availability
3. **Environment Variables**: Verify `.env.test` exists
4. **Dependencies**: Run `npm install` in tests directory

### Debug Commands
```bash
# Run single test with verbose output
npm run test:run -- admin-auth.test.ts --reporter=verbose

# Run with debug logging
DEBUG=* npm run test:run

# Run specific test case
npm run test:run -- -t "should login with valid credentials"
```

## 🔄 Continuous Integration

### GitHub Actions (Recommended)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:5.0
        ports:
          - 27017:27017
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd tests && npm install
      - run: ./run-tests.sh
```

## 📝 Test Documentation

### Test Reports
- **Coverage**: Generated in `tests/coverage/`
- **Results**: Console output with pass/fail summary
- **Screenshots**: Available in UI mode for frontend tests

### Maintenance
- **Weekly**: Review test coverage
- **Monthly**: Update test dependencies
- **Quarterly**: Refactor test structure if needed

---

## 🎯 Next Steps

1. **Phase 2 Tests**: Add PayPal integration tests
2. **Phase 3 Tests**: Add email/SMS service tests
3. **E2E Tests**: Add Playwright/Cypress tests
4. **Performance Tests**: Add load testing
5. **Security Tests**: Add penetration testing

For questions or issues with tests, refer to the main development plan or create an issue in the repository.
