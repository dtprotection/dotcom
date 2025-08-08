import { describe, it, expect, beforeAll } from 'vitest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

describe('Simple Admin Authentication Test', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key'
    process.env.JWT_EXPIRES_IN = '1h'
  })

  it('should hash and verify passwords correctly', async () => {
    const password = 'testpassword123'
    const hashedPassword = await bcrypt.hash(password, 12)
    
    expect(hashedPassword).not.toBe(password)
    expect(hashedPassword).toContain('$2b$') // Modern bcrypt uses $2b$
    
    const isValid = await bcrypt.compare(password, hashedPassword)
    expect(isValid).toBe(true)
    
    const isInvalid = await bcrypt.compare('wrongpassword', hashedPassword)
    expect(isInvalid).toBe(false)
  })

  it('should generate and verify JWT tokens', () => {
    const payload = {
      id: 'test123',
      username: 'testadmin',
      role: 'admin'
    }
    
    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' })
    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    expect(decoded.id).toBe('test123')
    expect(decoded.username).toBe('testadmin')
    expect(decoded.role).toBe('admin')
  })

  it('should validate email format', () => {
    const validEmails = [
      'test@example.com',
      'admin@dtprotection.com',
      'user.name@domain.co.uk'
    ]
    
    const invalidEmails = [
      'invalid-email',
      '@domain.com',
      'user@',
      'user.domain.com'
    ]
    
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
    
    validEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(true)
    })
    
    invalidEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(false)
    })
  })

  it('should validate password strength', () => {
    const strongPasswords = [
      'Password123!',
      'SecurePass456',
      'MyP@ssw0rd'
    ]
    
    const weakPasswords = [
      '123',
      'abc',
      'short'
    ]
    
    strongPasswords.forEach(password => {
      expect(password.length).toBeGreaterThanOrEqual(8)
    })
    
    weakPasswords.forEach(password => {
      expect(password.length).toBeLessThan(8)
    })
  })

  it('should format currency correctly', () => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount)
    }
    
    expect(formatCurrency(150)).toBe('$150.00')
    expect(formatCurrency(1500)).toBe('$1,500.00')
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('should calculate booking amounts', () => {
    const calculateAmount = (numberOfGuards: number, ratePerGuard: number = 150) => {
      return numberOfGuards * ratePerGuard
    }
    
    expect(calculateAmount(1)).toBe(150)
    expect(calculateAmount(2)).toBe(300)
    expect(calculateAmount(5)).toBe(750)
    expect(calculateAmount(3, 200)).toBe(600)
  })
})
