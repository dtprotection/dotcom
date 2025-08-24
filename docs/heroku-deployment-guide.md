# Production Deployment Guide: DT Protection Booking System

This document outlines all third-party services and API keys required to deploy the DT Protection booking system to production on Heroku.

## 🚀 Heroku Deployment Overview

The application consists of:
- **Backend**: Node.js/Express API (deployed to Heroku)
- **Frontend**: Next.js application (deployed to Vercel/Netlify)
- **Database**: MongoDB Atlas (cloud-hosted)
- **Payment Processing**: PayPal Business
- **Communication**: Email & SMS services

## 📋 Required Third-Party Services

### 1. **Database Service**
**Service**: MongoDB Atlas
**Purpose**: Primary database for storing bookings, invoices, admin users, and client data
**Cost**: Free tier available, $9/month for production

**Required Environment Variables**:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dtprotection?retryWrites=true&w=majority
```

**Setup Instructions**:
1. Create MongoDB Atlas account
2. Create new cluster (M0 Free tier recommended)
3. Create database user with read/write permissions
4. Configure network access (allow all IPs: 0.0.0.0/0)
5. Get connection string from cluster

---

### 2. **Payment Processing**
**Service**: PayPal Business
**Purpose**: Process deposits, final payments, and generate invoices
**Cost**: 2.9% + $0.30 per transaction

**Required Environment Variables**:
```bash
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_ENVIRONMENT=live  # or 'sandbox' for testing
```

**Setup Instructions**:
1. Create PayPal Business account
2. Navigate to PayPal Developer Dashboard
3. Create new app for production
4. Get Client ID and Client Secret
5. Configure webhook URL: `https://your-app.herokuapp.com/api/payments/webhook`
6. Set environment to 'live' for production

**Webhook Events to Configure**:
- `INVOICE.PAID`
- `INVOICE.CANCELLED`
- `INVOICE.REFUNDED`

---

### 3. **Email Service (Choose One)**

#### Option A: SendGrid
**Service**: SendGrid
**Purpose**: Send booking confirmations, payment reminders, and admin notifications
**Cost**: Free tier (100 emails/day), $14.95/month for 50k emails

**Required Environment Variables**:
```bash
EMAIL_PROVIDER=sendgrid
EMAIL_API_KEY=your_sendgrid_api_key
EMAIL_FROM=admin@dtprotection.com
EMAIL_FROM_NAME=DT Protection Services
```

**Setup Instructions**:
1. Create SendGrid account
2. Verify sender domain (dtprotection.com)
3. Create API key with "Mail Send" permissions
4. Configure sender authentication

#### Option B: Resend
**Service**: Resend
**Purpose**: Modern email API with excellent deliverability
**Cost**: Free tier (3k emails/month), $20/month for 50k emails

**Required Environment Variables**:
```bash
EMAIL_PROVIDER=resend
EMAIL_API_KEY=your_resend_api_key
EMAIL_FROM=admin@dtprotection.com
EMAIL_FROM_NAME=DT Protection Services
```

**Setup Instructions**:
1. Create Resend account
2. Verify domain ownership
3. Create API key
4. Configure DNS records

#### Option C: SMTP (Gmail/Outlook)
**Service**: SMTP through Gmail or Outlook
**Purpose**: Email delivery using existing email provider
**Cost**: Free (with provider limits)

**Required Environment Variables**:
```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com
EMAIL_FROM_NAME=DT Protection Services
```

**Setup Instructions**:
1. Enable 2-factor authentication on Gmail/Outlook
2. Generate app-specific password
3. Use app password in SMTP_PASS

---

### 4. **SMS Service (Choose One)**

#### Option A: Twilio
**Service**: Twilio
**Purpose**: Send SMS notifications for urgent updates and payment reminders
**Cost**: $0.0079 per SMS (US), $20/month minimum

**Required Environment Variables**:
```bash
SMS_PROVIDER=twilio
SMS_API_KEY=your_twilio_account_sid
SMS_API_SECRET=your_twilio_auth_token
SMS_FROM_NUMBER=+1234567890
TWILIO_ACCOUNT_SID=your_twilio_account_sid
```

**Setup Instructions**:
1. Create Twilio account
2. Purchase phone number ($1/month)
3. Get Account SID and Auth Token
4. Configure webhook for delivery status

#### Option B: Vonage (Nexmo)
**Service**: Vonage
**Purpose**: Alternative SMS provider with competitive pricing
**Cost**: $0.006 per SMS (US), $15/month minimum

**Required Environment Variables**:
```bash
SMS_PROVIDER=vonage
SMS_API_KEY=your_vonage_api_key
SMS_API_SECRET=your_vonage_api_secret
SMS_FROM_NUMBER=DTProtect
```

**Setup Instructions**:
1. Create Vonage account
2. Get API Key and Secret
3. Configure sender ID

---

### 5. **Authentication & Security**
**Service**: JWT (built-in)
**Purpose**: Secure authentication for admin and client portals
**Cost**: Free

**Required Environment Variables**:
```bash
JWT_SECRET=your_super_secure_jwt_secret_key_minimum_32_characters
JWT_EXPIRES_IN=24h
```

**Setup Instructions**:
1. Generate secure random string (32+ characters)
2. Use different secrets for staging/production
3. Store securely in environment variables

---

### 6. **Application Configuration**
**Service**: Heroku Environment Variables
**Purpose**: Application settings and environment configuration
**Cost**: Free

**Required Environment Variables**:
```bash
NODE_ENV=production
PORT=3001  # Heroku sets this automatically
```

---

## 🔧 Heroku Deployment Setup

### 1. **Create Heroku App**
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create app
heroku create dt-protection-app

# Add Node.js buildpack
heroku buildpacks:set heroku/nodejs
```

### 2. **Set Environment Variables**
```bash
# Database
heroku config:set MONGODB_URI="your_mongodb_atlas_connection_string"

# PayPal
heroku config:set PAYPAL_CLIENT_ID="your_paypal_client_id"
heroku config:set PAYPAL_CLIENT_SECRET="your_paypal_client_secret"
heroku config:set PAYPAL_ENVIRONMENT="live"

# Email (choose one provider)
heroku config:set EMAIL_PROVIDER="sendgrid"
heroku config:set EMAIL_API_KEY="your_sendgrid_api_key"
heroku config:set EMAIL_FROM="admin@dtprotection.com"
heroku config:set EMAIL_FROM_NAME="DT Protection Services"

# SMS (choose one provider)
heroku config:set SMS_PROVIDER="twilio"
heroku config:set SMS_API_KEY="your_twilio_account_sid"
heroku config:set SMS_API_SECRET="your_twilio_auth_token"
heroku config:set SMS_FROM_NUMBER="+1234567890"
heroku config:set TWILIO_ACCOUNT_SID="your_twilio_account_sid"

# Authentication
heroku config:set JWT_SECRET="your_super_secure_jwt_secret_key_minimum_32_characters"
heroku config:set JWT_EXPIRES_IN="24h"

# Application
heroku config:set NODE_ENV="production"
```

### 3. **Deploy Application**
```bash
# Add remote
git remote add heroku https://git.heroku.com/dt-protection-app.git

# Deploy
git push heroku main

# Open app
heroku open
```

### 4. **Configure Add-ons (Optional)**
```bash
# Logging
heroku addons:create papertrail:choklad

# Monitoring
heroku addons:create newrelic:wayne

# SSL (automatic with Heroku)
heroku certs:auto:enable
```

---

## 💰 Cost Breakdown

### **Monthly Operational Costs**

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| **MongoDB Atlas** | M0 Free | $0 |
| **PayPal** | Transaction fees only | 2.9% + $0.30 per transaction |
| **SendGrid** | Free tier | $0 (100 emails/day) |
| **Twilio** | Pay-as-you-go | ~$20-50 (depending on SMS volume) |
| **Heroku** | Hobby dyno | $7 |
| **Domain** | Custom domain | $12/year |
| **Total Estimated** | | **$27-57/month** |

### **One-time Setup Costs**
- **Domain registration**: $12/year
- **SSL certificate**: Free (Let's Encrypt)
- **Development time**: Already completed

---

## 🔐 Security Checklist

### **Environment Variables**
- [ ] All API keys stored in Heroku config vars
- [ ] No secrets committed to Git repository
- [ ] Different keys for staging/production
- [ ] Regular key rotation schedule

### **Database Security**
- [ ] MongoDB Atlas network access configured
- [ ] Database user with minimal required permissions
- [ ] Connection string uses SSL
- [ ] Regular backups enabled

### **Payment Security**
- [ ] PayPal webhook signature verification
- [ ] HTTPS enforced for all payment endpoints
- [ ] PCI compliance (handled by PayPal)
- [ ] Payment data not stored locally

### **Application Security**
- [ ] Helmet.js security headers enabled
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] Rate limiting implemented
- [ ] JWT tokens with expiration

---

## 📊 Monitoring & Maintenance

### **Essential Monitoring**
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

### **Health Checks**
- [ ] Database connectivity
- [ ] PayPal API connectivity
- [ ] Email service connectivity
- [ ] SMS service connectivity
- [ ] Application response times

### **Backup Strategy**
- [ ] MongoDB Atlas automated backups
- [ ] Environment variable documentation
- [ ] Code repository backups
- [ ] Configuration backups

---

## 🚨 Troubleshooting

### **Common Issues**

1. **Database Connection Failed**
   - Check MongoDB Atlas network access
   - Verify connection string format
   - Ensure database user has correct permissions

2. **PayPal Webhook Not Working**
   - Verify webhook URL is correct
   - Check webhook signature verification
   - Ensure PayPal app is in 'live' mode

3. **Email Not Sending**
   - Verify API key is correct
   - Check sender domain verification
   - Review email service logs

4. **SMS Not Sending**
   - Verify phone number format
   - Check account balance
   - Review SMS service logs

### **Support Resources**
- **Heroku**: [Heroku Support](https://help.heroku.com/)
- **MongoDB Atlas**: [Atlas Documentation](https://docs.atlas.mongodb.com/)
- **PayPal**: [PayPal Developer Support](https://developer.paypal.com/support/)
- **SendGrid**: [SendGrid Support](https://support.sendgrid.com/)
- **Twilio**: [Twilio Support](https://www.twilio.com/help)

---

## 📝 Deployment Checklist

### **Pre-Deployment**
- [ ] All environment variables documented
- [ ] Third-party service accounts created
- [ ] API keys generated and secured
- [ ] Database schema tested
- [ ] Payment flow tested in sandbox

### **Deployment**
- [ ] Heroku app created
- [ ] Environment variables set
- [ ] Application deployed successfully
- [ ] Database connected
- [ ] All services responding

### **Post-Deployment**
- [ ] PayPal webhook configured
- [ ] Email templates tested
- [ ] SMS notifications tested
- [ ] Admin portal accessible
- [ ] Client portal functional
- [ ] Payment processing working
- [ ] Monitoring configured

---

## 🔄 Updates & Maintenance

### **Regular Tasks**
- [ ] Monitor application logs weekly
- [ ] Review payment processing monthly
- [ ] Update dependencies quarterly
- [ ] Rotate API keys annually
- [ ] Review security settings monthly

### **Scaling Considerations**
- [ ] Upgrade Heroku dyno as needed
- [ ] Scale MongoDB Atlas cluster
- [ ] Monitor email/SMS usage
- [ ] Optimize database queries
- [ ] Implement caching if needed

---

*This document should be updated whenever new services are added or configurations change.*
