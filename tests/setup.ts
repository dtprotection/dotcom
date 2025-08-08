import dotenv from 'dotenv'

// Load test environment variables
dotenv.config({ path: '.env.test' })

// Set test environment
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-key'
process.env.JWT_EXPIRES_IN = '1h'

// Global test timeout
// Vitest handles timeouts differently, no need to set global timeout
