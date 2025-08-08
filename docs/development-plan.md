# Development Plan: Enhanced Booking & Payment System

## Overview
This document outlines the implementation strategy for transforming the current booking system into a comprehensive business management platform with admin authentication, payment processing, and automated communications.

## Current System Analysis
- **Frontend**: Next.js with booking form and basic pages
- **Backend**: Express.js with basic booking and payment routes
- **Database**: MongoDB with simple booking model
- **Email**: Basic email service implemented

## New Features Summary
1. Admin authentication and dashboard
2. Enhanced request management with detailed status tracking
3. PayPal payment processing with invoice generation
4. Email and SMS notification system
5. Communication preference tracking

## Implementation Phases

### Phase 1: Database Schema Enhancement & Admin Authentication
**Priority**: High (Foundation for all other features)
**Timeline**: 1-2 weeks

#### Database Changes
- Extend `Booking` model with new fields:
  - `communicationPreferences`: { email: boolean, sms: boolean }
  - `status`: Enhanced enum with detailed states
  - `invoiceSent`: boolean
  - `depositAmount`: number
  - `totalAmount`: number
  - `depositPaid`: boolean
  - `finalPaymentPaid`: boolean
  - `adminNotes`: string

#### Admin Authentication
- JWT-based authentication system
- Admin user model with secure password hashing
- Protected routes for admin functionality
- Session management

#### New Models Needed
- `Admin` model for authentication
- `Invoice` model for payment tracking
- `Notification` model for communication logs

### Phase 2: PayPal Payment Integration
**Priority**: High (Client-approved payment processor)
**Timeline**: 2-3 weeks

#### PayPal Integration
- PayPal REST API integration
- Invoice generation through PayPal
- Payment webhook handling
- Deposit tracking (25% minimum requirement)
- Support for multiple payment methods:
  - PayPal direct payments
  - Credit/debit cards via PayPal
  - Venmo (through PayPal)
  - Apple Pay/Google Pay (through PayPal)

#### Required PayPal API Keys
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID` (for payment notifications)

#### PayPal Features to Implement
- Create PayPal invoices automatically
- Track payment status via webhooks
- Handle partial payments (deposits)
- Generate payment reminders
- Support refunds if needed

### Phase 3: Enhanced Communication System
**Priority**: Medium (Depends on email service decision)
**Timeline**: 1-2 weeks

#### Email Service (Pending Client Decision)
**Options**:
1. **SendGrid** (Recommended)
   - Free tier: 100 emails/day
   - Paid: $14.95/month for 50k emails
   - API Key: `SENDGRID_API_KEY`

2. **Resend** (Alternative)
   - Free tier: 3k emails/month
   - Paid: $20/month for 50k emails
   - API Key: `RESEND_API_KEY`

#### SMS Service (Recommended)
**Twilio** (Industry standard)
- Cost: ~$0.0075 per SMS
- API Keys: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
- Features: Reliable delivery, webhook support

#### Notification Triggers
- Booking request submitted
- Request accepted/declined
- Invoice sent
- Deposit received
- Final payment due reminder
- Payment received

### Phase 4: Admin Dashboard Development
**Priority**: Medium (Depends on Phase 1 completion)
**Timeline**: 2-3 weeks

#### Admin Dashboard Features
- Secure login page
- Request management interface
- Payment tracking dashboard
- Status update controls
- Communication management
- Reporting and analytics

#### Frontend Components Needed
- Admin login form
- Dashboard layout
- Request management table
- Payment status cards
- Communication logs
- Settings panel

### Phase 5: Enhanced Client Experience
**Priority**: Low (Nice-to-have features)
**Timeline**: 1-2 weeks

#### Client Portal Features
- Request status tracking
- Payment history
- Communication preferences
- Document downloads (invoices, contracts)

### Phase 6: Documentation & Deployment
**Priority**: Medium (Essential for maintenance and team onboarding)
**Timeline**: 1 week

#### Documentation Files to Create
- `docs/deployment-guide.md` - Step-by-step deployment instructions
- `docs/api-documentation.md` - API endpoints and usage examples
- `docs/troubleshooting.md` - Common issues and solutions
- `docs/development-setup.md` - Local development environment setup
- `docs/admin-user-guide.md` - Admin dashboard usage guide
- `docs/client-user-guide.md` - Client portal usage guide

#### Deployment Documentation
- Heroku deployment checklist
- Environment variable setup guide
- PayPal webhook configuration
- Email/SMS service setup
- Database migration procedures
- SSL and domain configuration

#### GitHub Repository Documentation
- Updated README.md with deployment instructions
- Contributing guidelines
- Issue templates
- Pull request templates
- Code of conduct

## Technical Architecture

### Backend Enhancements
```
backend/
├── src/
│   ├── models/
│   │   ├── admin.model.ts (NEW)
│   │   ├── booking.model.ts (ENHANCED)
│   │   ├── invoice.model.ts (NEW)
│   │   └── notification.model.ts (NEW)
│   ├── routes/
│   │   ├── admin.routes.ts (NEW)
│   │   ├── auth.routes.ts (NEW)
│   │   ├── booking.routes.ts (ENHANCED)
│   │   ├── payment.routes.ts (ENHANCED)
│   │   └── notification.routes.ts (NEW)
│   ├── services/
│   │   ├── paypal.service.ts (NEW)
│   │   ├── email.service.ts (ENHANCED)
│   │   ├── sms.service.ts (NEW)
│   │   └── auth.service.ts (NEW)
│   └── middleware/
│       ├── auth.middleware.ts (NEW)
│       └── admin.middleware.ts (NEW)
```

### Frontend Enhancements
```
frontend/
├── app/
│   ├── admin/
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── requests/
│   │   └── payments/
│   └── client/
│       └── tracking/ (NEW)
├── components/
│   ├── admin/
│   │   ├── login-form.tsx (NEW)
│   │   ├── dashboard.tsx (NEW)
│   │   └── request-table.tsx (NEW)
│   └── client/
│       └── status-tracker.tsx (NEW)
```

## Environment Variables Required

### PayPal Configuration
```env
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox  # or 'live' for production
PAYPAL_WEBHOOK_ID=your_webhook_id
```

### Email Service (TBD)
```env
# SendGrid (if chosen)
SENDGRID_API_KEY=your_sendgrid_api_key

# OR Resend (if chosen)
RESEND_API_KEY=your_resend_api_key
```

### SMS Service
```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### JWT Authentication
```env
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
```

## Cost Estimates

### Monthly Operational Costs
- **PayPal**: Transaction fees only (2.9% + $0.30 per transaction)
- **Email Service**: $15-20/month (after free tier)
- **SMS Service**: $30-100/month (depending on volume)
- **Total Estimated**: $45-120/month

### Development Costs
- **One-time**: Significant development time required
- **Maintenance**: Minimal ongoing costs

## Security Considerations

### Authentication & Authorization
- JWT tokens with secure storage
- Password hashing with bcrypt
- Role-based access control
- Session management

### Payment Security
- PayPal handles PCI compliance
- Webhook signature verification
- Secure API key storage
- HTTPS enforcement

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration

## Testing Strategy

### Unit Tests
- Model validation tests
- Service function tests
- Payment webhook tests

### Integration Tests
- PayPal API integration
- Email/SMS delivery
- Admin authentication flow

### End-to-End Tests
- Complete booking flow
- Payment processing
- Admin dashboard functionality

## Deployment Considerations

### Heroku Deployment Setup

#### Environment Variables Management
All environment variables must be configured in Heroku's config vars:

```bash
# Set environment variables via Heroku CLI
heroku config:set PAYPAL_CLIENT_ID=your_paypal_client_id
heroku config:set PAYPAL_CLIENT_SECRET=your_paypal_client_secret
heroku config:set PAYPAL_MODE=live
heroku config:set PAYPAL_WEBHOOK_ID=your_webhook_id

# Email service (choose one)
heroku config:set SENDGRID_API_KEY=your_sendgrid_api_key
# OR
heroku config:set RESEND_API_KEY=your_resend_api_key

# SMS service
heroku config:set TWILIO_ACCOUNT_SID=your_twilio_account_sid
heroku config:set TWILIO_AUTH_TOKEN=your_twilio_auth_token
heroku config:set TWILIO_PHONE_NUMBER=your_twilio_phone_number

# JWT Authentication
heroku config:set JWT_SECRET=your_jwt_secret_key
heroku config:set JWT_EXPIRES_IN=24h

# Database (if using MongoDB Atlas)
heroku config:set MONGODB_URI=your_mongodb_atlas_connection_string

# Node environment
heroku config:set NODE_ENV=production
```

#### Heroku App Configuration
```bash
# Create Heroku app
heroku create dt-protection-app

# Add buildpacks for Node.js
heroku buildpacks:set heroku/nodejs

# Set up automatic deployments from GitHub
heroku pipelines:create dt-protection-pipeline
heroku pipelines:add dt-protection-pipeline --app dt-protection-app --stage production
```

#### Database Setup
- **MongoDB Atlas**: Recommended for production
  - Create MongoDB Atlas cluster
  - Configure network access for Heroku IPs
  - Set `MONGODB_URI` environment variable
- **MongoDB Add-on**: Alternative option
  ```bash
  heroku addons:create mongolab:sandbox
  ```

#### SSL & Domain Configuration
```bash
# Enable SSL (automatic with Heroku)
heroku certs:auto:enable

# Add custom domain (if needed)
heroku domains:add yourdomain.com
```

#### PayPal Webhook Configuration
1. **Sandbox Testing**:
   - Use PayPal webhook simulator
   - Test with Heroku tunnel: `heroku local web`
   
2. **Production Setup**:
   - Configure webhook URL in PayPal dashboard
   - URL format: `https://your-app.herokuapp.com/api/payments/webhook`
   - Verify webhook signature in production

### Environment Setup
- Production database configuration
- PayPal live mode setup
- SSL certificate installation (automatic with Heroku)
- Environment variable management (via Heroku config vars)

### Monitoring & Logs
```bash
# View application logs
heroku logs --tail

# Monitor dyno usage
heroku ps

# Check config vars
heroku config

# Monitor add-ons
heroku addons
```

### Performance Optimization
- **Dyno Configuration**: Start with `hobby` dyno, scale as needed
- **Database Indexing**: Ensure proper MongoDB indexes for queries
- **Caching**: Consider Redis add-on for session storage
- **CDN**: Use Cloudflare for static assets

### Backup & Recovery
```bash
# Database backup (if using MongoDB Atlas)
# Configure automated backups in Atlas dashboard

# App backup
heroku pg:backups:capture  # (if using PostgreSQL)
```

### Deployment Pipeline
1. **Development**: Local testing with Heroku local
2. **Staging**: Deploy to staging app for testing
3. **Production**: Deploy to production app
4. **Monitoring**: Set up alerts for errors and performance

### Heroku-Specific Best Practices

#### Procfile Configuration
Create a `Procfile` in the backend directory:
```
web: npm start
```

#### Package.json Scripts
Ensure these scripts are in `backend/package.json`:
```json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc",
    "dev": "ts-node src/index.ts",
    "postinstall": "npm run build"
  }
}
```

#### Port Configuration
Update backend to use Heroku's PORT:
```typescript
const port = process.env.PORT || 3001;
```

#### CORS Configuration for Heroku
Update CORS settings to allow Heroku domain:
```typescript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-app.herokuapp.com', 'https://yourdomain.com']
    : ['http://localhost:3000'],
  // ... other options
};
```

#### Frontend Deployment
For the Next.js frontend, consider:
- **Vercel**: Recommended for Next.js apps
- **Heroku**: Alternative with custom buildpack
- **Netlify**: Another option for static deployment

#### Environment Variable Security
- Never commit `.env` files to repository
- Use Heroku config vars for all sensitive data
- Rotate API keys regularly
- Use different keys for staging/production

#### Add-ons Recommendations
```bash
# Monitoring
heroku addons:create papertrail:choklad

# Logging
heroku addons:create logentries:le_tryit

# Performance monitoring
heroku addons:create newrelic:wayne
```

## Risk Mitigation

### Payment Processing
- PayPal sandbox testing
- Webhook failure handling
- Payment reconciliation processes
- Refund handling procedures

### Communication Reliability
- Email delivery monitoring
- SMS delivery tracking
- Fallback communication methods
- Retry mechanisms

## Success Metrics

### Business Metrics
- Booking conversion rate
- Payment completion rate
- Customer satisfaction scores
- Admin efficiency improvements

### Technical Metrics
- System uptime
- Payment processing success rate
- Email/SMS delivery rates
- Response times

## Next Steps

1. **Client Approval**: Awaiting email service decision
2. **Development Start**: Begin with Phase 1 (Database & Authentication)
3. **PayPal Setup**: Configure PayPal developer account
4. **Environment Setup**: Prepare development environment
5. **Testing Strategy**: Implement comprehensive testing plan

---

*This document will be updated as development progresses and requirements evolve.*
