# Monolith Deployment Guide - Heroku Only

This guide covers deploying the DT Protection application as a single monolithic application to Heroku.

## 🏗️ Architecture

The application is now structured as a monolith:
- **Frontend**: Next.js application (in `frontend/` directory)
- **Backend**: Express API routes (in `backend/src/` directory)
- **Server**: Custom Next.js server (`server.ts`) that integrates both

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- Heroku CLI installed
- MongoDB Atlas account (or local MongoDB for development)
- PayPal Business account credentials

## 🚀 Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
HOSTNAME=localhost

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dtprotection?retryWrites=true&w=majority

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_minimum_32_characters
JWT_EXPIRES_IN=24h

# Email Configuration
EMAIL_PROVIDER=mailgun
EMAIL_FROM=noreply@your-mailgun-domain.com
EMAIL_FROM_NAME=DT Protection Services

# Mailgun (if using Mailgun add-on on Heroku, these are auto-set)
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

- Frontend: `http://localhost:3000`
- API: `http://localhost:3000/api/*`

## 🏗️ Building for Production

### Build the Application

```bash
npm run build
```

This will:
1. Build the Next.js frontend (`frontend/.next/`)
2. Compile TypeScript backend code (`dist/`)

### Start Production Server

```bash
npm start
```

## 📦 Heroku Deployment

### 1. Create Heroku App

```bash
heroku create dt-protection-app
```

### 2. Set Up MongoDB Atlas

**Important**: MongoDB is NOT available as a Heroku add-on. You need to use MongoDB Atlas (external cloud service), which is the standard way to use MongoDB with Heroku.

**MongoDB Atlas Setup**:
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster (M0 Free tier is fine for development)
4. Create a database user with read/write permissions
5. Configure network access: Add `0.0.0.0/0` to allow connections from Heroku
6. Get your connection string from "Connect" → "Connect your application"
7. Replace `<password>` and `<dbname>` in the connection string

**Example connection string**:
```
mongodb+srv://username:password@cluster.mongodb.net/dtprotection?retryWrites=true&w=majority
```

This is an external service but works perfectly with Heroku - just set the connection string as an environment variable.

### 3. Set Up Email Service

**Option A: Mailgun (Recommended - Has Heroku Add-on)**

Mailgun has a Heroku add-on, which makes it the easiest option:

```bash
heroku addons:create mailgun:starter
```

This automatically sets all `MAILGUN_*` environment variables. Then set:

```bash
heroku config:set EMAIL_PROVIDER="mailgun"
heroku config:set EMAIL_FROM="noreply@your-mailgun-domain.com"
heroku config:set EMAIL_FROM_NAME="DT Protection Services"
```

**Option B: SendGrid (External API)**

If you prefer SendGrid (no Heroku add-on, but works fine):

1. Create account at https://sendgrid.com
2. Get API key
3. Set environment variables:

```bash
heroku config:set EMAIL_PROVIDER="sendgrid"
heroku config:set EMAIL_API_KEY="your_sendgrid_api_key"
heroku config:set EMAIL_FROM="admin@dtprotection.com"
heroku config:set EMAIL_FROM_NAME="DT Protection Services"
```

**Option C: SMTP (Gmail/Outlook)**

For simple SMTP setup:

```bash
heroku config:set EMAIL_PROVIDER="smtp"
heroku config:set SMTP_HOST="smtp.gmail.com"
heroku config:set SMTP_PORT="587"
heroku config:set SMTP_SECURE="false"
heroku config:set SMTP_USER="your_email@gmail.com"
heroku config:set SMTP_PASS="your_app_password"
heroku config:set EMAIL_FROM="your_email@gmail.com"
heroku config:set EMAIL_FROM_NAME="DT Protection Services"
```

**Note**: SMS service (Twilio) is optional and can be configured later if needed.

### 4. Set Environment Variables

**Required Variables**:

```bash
# MongoDB (External service - MongoDB Atlas)
heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/dtprotection?retryWrites=true&w=majority"

# PayPal (External API - works with Heroku)
heroku config:set PAYPAL_CLIENT_ID="your_paypal_client_id"
heroku config:set PAYPAL_CLIENT_SECRET="your_paypal_client_secret"
heroku config:set PAYPAL_MODE="live"  # or "sandbox" for testing

# JWT (Built-in - no external service needed)
heroku config:set JWT_SECRET="$(openssl rand -base64 48)"
heroku config:set JWT_EXPIRES_IN="24h"

# Application
heroku config:set NODE_ENV="production"
```

**Email Variables** (choose one provider from step 3):

If using Mailgun add-on (recommended):
```bash
heroku config:set EMAIL_PROVIDER="mailgun"
heroku config:set EMAIL_FROM="noreply@your-mailgun-domain.com"
heroku config:set EMAIL_FROM_NAME="DT Protection Services"
# MAILGUN_* variables are auto-set by the add-on
```

If using SendGrid:
```bash
heroku config:set EMAIL_PROVIDER="sendgrid"
heroku config:set EMAIL_API_KEY="your_sendgrid_api_key"
heroku config:set EMAIL_FROM="admin@dtprotection.com"
heroku config:set EMAIL_FROM_NAME="DT Protection Services"
```

**Optional: SMS Service** (can be added later):
```bash
heroku config:set SMS_PROVIDER="twilio"
heroku config:set SMS_API_KEY="your_twilio_account_sid"
heroku config:set SMS_API_SECRET="your_twilio_auth_token"
heroku config:set SMS_FROM_NUMBER="+1234567890"
heroku config:set TWILIO_ACCOUNT_SID="your_twilio_account_sid"
```

### 5. Deploy to Heroku

```bash
git add .
git commit -m "Deploy monolith to Heroku"
git push heroku main
```

### 6. Create Initial Admin User

```bash
heroku run npm run create-admin
```

This creates an admin user with:
- Username: `admin`
- Password: `admin123456`

**⚠️ Change the password immediately after first login!**

### 7. Open Your App

```bash
heroku open
```

## 📁 Project Structure

```
.
├── backend/              # Backend API code
│   └── src/
│       ├── api.ts       # Express app factory
│       ├── routes/      # API routes
│       ├── models/       # Mongoose models
│       ├── services/     # Business logic
│       └── middleware/   # Express middleware
├── frontend/             # Next.js application
│   ├── app/             # Next.js app directory
│   ├── components/      # React components
│   └── lib/             # Utilities
├── server.ts            # Custom Next.js server
├── package.json         # Unified dependencies
├── tsconfig.json        # TypeScript config (frontend)
├── tsconfig.backend.json # TypeScript config (backend)
└── Procfile             # Heroku process file
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run build:frontend` - Build Next.js frontend only
- `npm run build:backend` - Compile TypeScript backend only
- `npm start` - Start production server
- `npm run lint` - Lint frontend code
- `npm run create-admin` - Create initial admin user

## 🌐 API Endpoints

All API endpoints are prefixed with `/api`:

- `/api/bookings` - Booking management
- `/api/payments` - Payment processing
- `/api/admin` - Admin authentication and management
- `/api/client` - Client portal endpoints
- `/api/dashboard` - Dashboard data
- `/api/communication` - Communication features

## 🔍 Troubleshooting

### MongoDB Connection Issues

- Verify `MONGODB_URI` is set correctly
- Check MongoDB Atlas network access (allow `0.0.0.0/0` for Heroku)
- Ensure database user has correct permissions

### Build Failures

- Check Node.js version (requires 18+)
- Verify all dependencies are installed: `npm install`
- Check TypeScript compilation errors: `npm run build:backend`

### Port Issues

- Heroku sets `PORT` automatically - don't hardcode it
- Development uses port 3000 by default

### Next.js Build Issues

- Ensure `frontend/` directory structure is correct
- Check `next.config.ts` for any custom configurations
- Verify all frontend dependencies are in root `package.json`

## 📝 Notes

- The application runs on a single Heroku dyno
- Both frontend and backend share the same process
- API routes are handled by Express, all other routes by Next.js
- CORS is configured to allow same-origin requests (no CORS issues)
- Environment variables are managed through Heroku config vars

## 🔄 Updating the Application

1. Make your changes
2. Test locally: `npm run dev`
3. Build: `npm run build`
4. Commit and push to Heroku:
   ```bash
   git add .
   git commit -m "Your changes"
   git push heroku main
   ```

## 💰 Cost Estimate

### Required Services (Minimum)
- **Heroku Hobby Dyno**: $7/month
- **MongoDB Atlas M0**: Free tier available (or $9/month for production)
- **Total Minimum**: ~$7/month

### Optional Services
- **Mailgun Starter** (via Heroku add-on): Free tier available
- **PayPal**: Transaction fees only (2.9% + $0.30 per transaction)
- **Twilio SMS**: Pay-as-you-go (~$0.0079 per SMS)

### Service Compatibility with Heroku

✅ **Works with Heroku** (External APIs - no add-on needed):
- MongoDB Atlas (external cloud database)
- PayPal (external payment API)
- Twilio (external SMS API)
- SendGrid (external email API)

✅ **Has Heroku Add-on** (Recommended):
- Mailgun (email service)

❌ **Not Available on Heroku**:
- None - all required services work with Heroku!

---

For more details on individual services, see:
- [Heroku Deployment Guide](docs/heroku-deployment-guide.md)
- [Development Setup](docs/development-setup.md)

